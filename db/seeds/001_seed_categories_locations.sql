-- 001_seed_categories_locations.sql
-- Idempotent seed for lookup tables. Safe to run multiple times.
-- Entries are listed in alphabetical order.

INSERT INTO categories (name) VALUES
    ('Aksesoris'),
    ('Buku & Alat Tulis'),
    ('Dompet & Tas'),
    ('Elektronik'),
    ('Kartu Identitas'),
    ('Kunci'),
    ('Lainnya'),
    ('Pakaian')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name) VALUES
    ('Asrama Mahasiswa'),
    ('Fakultas Desain Kreatif dan Bisnis Digital (FDKBD)'),
    ('Fakultas Sains dan Analitika Data (FSAD)'),
    ('Fakultas Teknik Sipil Perencanaan dan Kebumian (FTSPK)'),
    ('Fakultas Teknologi Elektro dan Informatika Cerdas (FTEIC)'),
    ('Fakultas Teknologi Industri (FTI)'),
    ('Fakultas Vokasi'),
    ('Gedung A'),
    ('Gedung B'),
    ('Kantin FTE'),
    ('Kantin FTK'),
    ('Kantin Pusat'),
    ('Lapangan Football'),
    ('Masjid Manarul Ilmi'),
    ('Parkiran FTEIC'),
    ('Perpustakaan Pusat'),
    ('Rektorat'),
    ('RS Polri Bhayangkara'),
    ('Student Center')
ON CONFLICT (name) DO NOTHING;
