# Rencana Hari 1 — ITSFOUND

Target akhir hari: struktur monorepo siap, dependency backend &
frontend terpasang, database lokal ter-migrasi dan ter-seed, koneksi
Go → PostgreSQL terverifikasi, dan commit pertama sudah masuk ke Git.

Semua command dijalankan di **PowerShell**, dari folder root repo
`itsfound`, kecuali disebutkan lain.

---

## Langkah 1 — Inisialisasi Repo & Struktur Folder

```powershell
mkdir itsfound
cd itsfound
git init
mkdir backend, frontend, db\migrations, db\seeds, docs
```

**Expected output:** tidak ada error; folder `backend`, `frontend`,
`db\migrations`, `db\seeds`, `docs` muncul di root.

**Troubleshooting:**

- Jika `mkdir` gagal karena folder sudah ada: tambahkan `-Force`,
  mis. `mkdir backend -Force`.

---

## Langkah 2 — Setup Modul Go & Install Dependency Backend

```powershell
cd backend
go mod init github.com/<username>/itsfound/backend
go get github.com/go-chi/chi/v5
go get github.com/jackc/pgx/v5
go get github.com/golang-migrate/migrate/v4
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
go get github.com/joho/godotenv
cd ..
```

**Expected output:** setiap `go get` menambah baris baru di
`backend/go.mod` dan `backend/go.sum` tanpa error.

**Troubleshooting:**

- Error `go: cannot find main module` → pastikan `go mod init` sudah
  dijalankan lebih dulu di dalam folder `backend`.
- Timeout koneksi ke proxy Go → cek/atur
  `$env:GOPROXY = "https://proxy.golang.org,direct"`.

---

## Langkah 3 — Install CLI golang-migrate

```powershell
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -version
```

**Expected output:** versi migrate tercetak, mis. `v4.x.x`.

**Troubleshooting:**

- `migrate: command not found` → tambahkan `%USERPROFILE%\go\bin` ke
  PATH: `$env:Path += ";$env:USERPROFILE\go\bin"`, lalu buka ulang
  PowerShell.

---

## Langkah 4 — Buat Database Lokal

```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -h localhost -c "CREATE DATABASE itsfound;"
```

**Expected output:** `CREATE DATABASE`.

**Troubleshooting:**

- `database "itsfound" already exists` → aman diabaikan, lanjut.
- `psql: command not found` → tambahkan folder bin PostgreSQL (mis.
  `C:\Program Files\PostgreSQL\18\bin`) ke PATH.
- `password authentication failed` → sesuaikan `$env:PGPASSWORD`
  dengan password superuser `postgres` yang dibuat saat instalasi.

---

## Langkah 5 — Jalankan Migrasi 001

```powershell
migrate -path db/migrations -database "postgres://postgres:postgres@localhost:5432/itsfound?sslmode=disable" up
```

**Expected output:** `1/u init (x.xxxxxxxs)`.

**Troubleshooting:**

- `Dirty database version` → jalankan
  `migrate -path db/migrations -database "..." force 1`, perbaiki SQL
  bermasalah, lalu jalankan `up` lagi.
- Connection refused → cek service `postgresql-x64-18` berstatus
  Running (`Get-Service postgresql-x64-18`).

---

## Langkah 6 — Jalankan Seed

```powershell
psql -U postgres -h localhost -d itsfound -f db/seeds/001_seed_categories_locations.sql
psql -U postgres -h localhost -d itsfound -f db/seeds/002_seed_admin.sql
```

**Expected output:** baris `INSERT 0 <n>` per statement, tanpa error.

**Troubleshooting:**

- Dijalankan dua kali dan muncul `INSERT 0 0` → normal, itu tandanya
  `ON CONFLICT DO NOTHING` bekerja (idempotent), bukan error.

---

## Langkah 7 — Verifikasi Koneksi Go → PostgreSQL

Buat file sementara `backend/cmd/dbcheck/main.go` (boleh dihapus
setelah verifikasi berhasil):

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	pool, err := pgxpool.New(context.Background(),
		"postgres://postgres:postgres@localhost:5432/itsfound?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	var result int
	err = pool.QueryRow(context.Background(), "SELECT 1").Scan(&result)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("DB OK, query result:", result)
}
```

```powershell
cd backend
go run ./cmd/dbcheck
cd ..
```

**Expected output:** `DB OK, query result: 1`.

**Troubleshooting:**

- `connection refused` → cek service PostgreSQL aktif & port 5432
  tidak diblokir firewall.
- `password authentication failed` → cocokkan user/password di
  connection string dengan superuser lokal.

---

## Langkah 8 — Setup Next.js 15 & Dependency Frontend

Karena folder `frontend` sudah dibuat kosong di Langkah 1, hapus dulu
sebelum create-next-app:

````powershell
Remove-Item frontend -Recurse -Force
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --import-alias "@/*"

## Langkah 9 — Commit Pertama

```powershell
cd itsfound
git add .
git commit -m "chore: initial project scaffold, db migration & seed"
````

**Expected output:** ringkasan commit dengan daftar file yang
berubah, tanpa error.

**Troubleshooting:**

- `Please tell me who you are` → set identitas Git dulu:
  `git config user.email "you@example.com"` dan
  `git config user.name "Nama Kamu"`.
- `node_modules` atau `.env` ikut ter-stage → pastikan `.gitignore`
  sudah ada di root **sebelum** menjalankan `git add .`.

---

Akhir Hari 1: repo ter-inisialisasi, dependency backend & frontend
terpasang, database ter-migrasi & ter-seed, koneksi Go → PostgreSQL
terverifikasi, dan commit pertama sudah masuk ke Git.
