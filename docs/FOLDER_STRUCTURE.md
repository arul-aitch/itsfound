# Struktur Folder — ITSFOUND

Monorepo dengan tiga bagian utama: `frontend/` (Next.js), `backend/`
(Go), dan `db/` (skema & seed) — didukung `docs/` untuk dokumentasi.

```
itsfound/
├── frontend/                     # Aplikasi Next.js 15 (App Router)
│   ├── app/                      # Routing berbasis file: page, layout, route handler
│   │   ├── (auth)/               # Route group: halaman login & register
│   │   ├── (public)/             # Route group: daftar & detail laporan (akses guest)
│   │   ├── dashboard/            # Route group: dashboard user & dashboard admin
│   │   ├── api/                  # Route handler Next.js (mis. set/verifikasi cookie JWT)
│   │   ├── layout.tsx            # Root layout aplikasi
│   │   └── globals.css           # Global styles (Tailwind base layer)
│   ├── components/               # Komponen UI yang bisa dipakai ulang
│   │   ├── ui/                   # Komponen dasar hasil generate shadcn/ui
│   │   └── shared/                # Komponen komposit spesifik domain (mis. ReportCard)
│   ├── lib/                      # API client, helper, konstanta, skema validasi Zod
│   ├── hooks/                    # Custom hook React (query/mutation TanStack Query)
│   ├── public/                   # Aset statis (favicon, gambar placeholder)
│   ├── .env.example               # Contoh environment variable frontend
│   ├── next.config.ts             # Konfigurasi Next.js
│   ├── tailwind.config.ts         # Konfigurasi Tailwind CSS
│   └── package.json
│
├── backend/                       # Aplikasi Go (Chi router)
│   ├── cmd/
│   │   └── api/                  # Entry point aplikasi (main.go)
│   ├── internal/
│   │   ├── handler/               # Layer HTTP: decode request, panggil service, format response
│   │   ├── service/                # Layer business logic: validasi & aturan domain
│   │   ├── repository/             # Layer akses data: query PostgreSQL lewat pgx
│   │   ├── middleware/              # Middleware: auth JWT, role guard, logging, CORS
│   │   ├── model/                   # Struct domain & DTO request/response
│   │   └── config/                  # Load & validasi environment variable (godotenv)
│   ├── pkg/                        # Kode pendukung yang berpotensi dipakai lintas layer (jwt util, hashing, dll.)
│   ├── migrations/                 # Pointer dokumentasi ke db/migrations (satu sumber kebenaran skema)
│   ├── .env.example                # Contoh environment variable backend
│   └── go.mod
│
├── db/
│   ├── migrations/                 # File migrasi SQL naik/turun — sumber kebenaran skema database
│   └── seeds/                      # Script SQL data awal (kategori, lokasi, akun admin)
│
├── docs/
│   ├── PRD.md                      # Ringkasan kebutuhan produk
│   ├── FOLDER_STRUCTURE.md         # Dokumen ini
│   └── DAY1_PLAN.md                # Rencana eksekusi hari pertama
│
├── .gitignore
└── README.md
```

## Alur Layer Backend: handler → service → repository

- **handler** — menerima HTTP request, melakukan decode & validasi
  payload dasar, memanggil service yang sesuai, lalu memformat HTTP
  response (termasuk memetakan error jadi status code yang tepat).
  Handler tidak boleh memanggil repository secara langsung.
- **service** — berisi business logic murni, misalnya aturan "user
  hanya boleh mengedit laporan miliknya sendiri" atau "klaim yang
  di-approve mengubah status laporan menjadi resolved". Layer ini
  tidak tahu apa-apa soal HTTP maupun detail SQL.
- **repository** — satu-satunya layer yang boleh menyentuh database.
  Menerima parameter dari service, menjalankan query lewat pgx, dan
  mengembalikan struct model murni tanpa detail SQL bocor ke atas.

Aliran panggilan selalu satu arah: `handler → service → repository`,
tidak pernah melompati layer atau berjalan sebaliknya.
