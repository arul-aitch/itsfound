# ITSFOUND

**Barang hilang? Cek ITSFOUND dulu.**

Platform lost & found terpusat untuk kampus ITS, dengan alur klaim
terverifikasi dan moderasi admin.

## Prasyarat

- Windows 11
- [Node.js](https://nodejs.org/) v24 atau lebih baru
- [Go](https://go.dev/dl/) v1.27 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/download/windows/) v18 atau lebih baru
- [Git](https://git-scm.com/download/win)
- Akun [Supabase](https://supabase.com/) (untuk Storage, free tier cukup)

Semua command di bawah dijalankan di **PowerShell**.

## 1. Install & Jalankan PostgreSQL

1. Unduh installer PostgreSQL 18 dari situs resmi, lalu jalankan.
2. Saat instalasi, catat password superuser `postgres` yang kamu buat.
3. Pastikan service `postgresql-x64-18` berstatus Running:

```powershell
Get-Service -Name "postgresql-x64-18"
```

## 2. Buat Database

```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -h localhost -c "CREATE DATABASE itsfound;"
```

Berhasil jika muncul output `CREATE DATABASE`.

## 3. Clone Repo & Siapkan Environment Variable

```powershell
git clone <url-repo-kamu> itsfound
cd itsfound
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Edit `backend\.env`: sesuaikan `DATABASE_URL`, `JWT_SECRET`,
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`.

Edit `frontend\.env`: sesuaikan `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET` (harus sama dengan
punya backend).

## 4. Install CLI Migrasi & Jalankan Migrasi

```powershell
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate -path db/migrations -database "postgres://postgres:postgres@localhost:5432/itsfound?sslmode=disable" up
```

Berhasil jika muncul output `1/u init (x.xxxxxxxs)`.

## 5. Jalankan Seed

```powershell
psql -U postgres -h localhost -d itsfound -f db/seeds/001_seed_categories_locations.sql
psql -U postgres -h localhost -d itsfound -f db/seeds/002_seed_admin.sql
```

Login admin default: `admin@itsfound.local` / `admin1234`
(**WAJIB diganti sebelum production**).

## 6. Jalankan Backend

```powershell
cd backend
go mod download
go run ./cmd/api
```

Backend berjalan di `http://localhost:8080`.

## 7. Jalankan Frontend

Di terminal PowerShell baru:

```powershell
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

## Dokumentasi Lain

- `docs/PRD.md` — ringkasan kebutuhan produk.
- `docs/FOLDER_STRUCTURE.md` — struktur folder monorepo.
- `docs/DAY1_PLAN.md` — rencana eksekusi hari pertama (langkah demi langkah).
  --- END FILE ---
  --- FILE: docs/PRD.md ---

# PRD — ITSFOUND (Ringkasan)

## Masalah

Barang hilang di lingkungan kampus ITS sulit dilacak karena informasi
tersebar di grup WhatsApp/media sosial yang tidak terpusat, rawan
klaim palsu, dan tidak ada proses verifikasi kepemilikan sebelum
barang diserahkan kembali.

## Solusi

Platform lost & found terpusat dengan alur klaim terverifikasi
(bukti teks dari pengklaim) dan moderasi admin, sehingga proses
pelaporan dan pengembalian barang lebih aman dan tercatat.

## Target Pengguna

Mahasiswa & warga ITS (dosen, tenaga kependidikan).

## Role

- **Guest** — lihat daftar & detail laporan (read-only).
- **User** — register/login, CRUD laporan miliknya sendiri, ajukan
  klaim atas laporan orang lain, lihat status klaim.
- **Admin** — moderasi laporan, verifikasi/approve/reject klaim,
  lihat statistik.

## Fitur MVP

1. Auth register/login (email + password, JWT).
2. CRUD laporan (hilang/temuan) dengan 1 foto.
3. Upload foto ke Supabase Storage.
4. Daftar & detail laporan dengan pagination.
5. Search & filter (tipe, kategori, lokasi, status).
6. User hanya bisa edit/hapus laporan miliknya sendiri.
7. Ajukan klaim dengan bukti teks.
8. Dashboard user: laporan milikku + klaim milikku.
9. Dashboard admin: queue moderasi laporan & klaim.
10. Admin approve/reject klaim & moderasi laporan.

## Skema Data (ringkas)

| Tabel      | Kolom kunci                                         | Relasi                                     |
| ---------- | --------------------------------------------------- | ------------------------------------------ |
| users      | id, email, password_hash, role                      | 1–N reports, 1–N claims                    |
| categories | id, name                                            | 1–N reports                                |
| locations  | id, name                                            | 1–N reports                                |
| reports    | id, user_id, type, status, category_id, location_id | N–1 users/categories/locations, 1–N claims |
| claims     | id, report_id, claimant_id, status                  | N–1 reports, N–1 users                     |

## Roadmap 7 Hari (Solo Developer)

| Hari | Fokus                                                                      |
| ---- | -------------------------------------------------------------------------- |
| 1    | Setup project, migrasi & seed database, verifikasi koneksi, commit pertama |
| 2    | Auth backend (register/login/JWT) + skeleton frontend (layout, routing)    |
| 3    | CRUD laporan backend + integrasi upload foto ke Supabase                   |
| 4    | Frontend CRUD laporan + daftar/detail + search & filter                    |
| 5    | Fitur klaim (backend + frontend) + dashboard user                          |
| 6    | Dashboard admin (moderasi laporan & klaim)                                 |
| 7    | QA, bugfix, polish UI, deploy (Vercel + Railway + Neon)                    |

## Di Luar Cakupan MVP

- Notifikasi realtime (WA/email).
- Chat antar user.
- Multi-foto per laporan.
- Statistik lanjutan (grafik tren, export laporan).

## Setup Supabase Storage

1. Daftar di https://supabase.com, buat project baru (free tier cukup).
2. Di dashboard project, buka menu **Storage** → klik **New Bucket**.
3. Nama bucket: `itsfound-photos`. Centang **Public bucket**. Klik Create.
4. Buka **Project Settings → API**. Catat tiga nilai:
    - **Project URL** → isi ke `SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public** key → isi ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role** key → isi ke `SUPABASE_SERVICE_KEY` (RAHASIA — jangan commit)
5. Bucket siap dipakai di Hari 3.
