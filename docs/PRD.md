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
