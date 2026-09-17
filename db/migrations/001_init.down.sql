-- 001_init.down.sql
-- Reverts 001_init.up.sql. Tables are dropped in dependency order
-- (children before parents); dropping a table also drops its triggers.
-- Enum types are dropped last, after every column that used them is gone.

DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS claim_status;
DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS report_type;
DROP TYPE IF EXISTS user_role;
--- END FILE ---
--- FILE: db/seeds/001_seed_categories_locations.sql ---
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
--- END FILE ---
--- FILE: db/seeds/002_seed_admin.sql ---
-- 002_seed_admin.sql
-- Seeds a single default admin account for development and initial
-- moderation access.
--
-- IMPORTANT: the password_hash below is a REAL, VALID bcrypt hash
-- (cost factor 12) of the plaintext password "admin1234". It is a
-- development-only placeholder credential. It MUST be rotated (and
-- ideally this account disabled or its password changed) before the
-- application is used in a production environment.

INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@itsfound.local',
    '$2b$12$EiytdxHmEZpmo5eJATZcE.NmUpdzVgnm19FRT1RO9s3oz.yEuu4kq',
    'Admin ITSFOUND',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
--- END FILE ---
--- FILE: backend/.env.example ---
# ==========================
# App
# ==========================
APP_ENV=development
PORT=8080

# ==========================
# Database — local PostgreSQL (active for local development)
# ==========================
DATABASE_URL=postgres://postgres:postgres@localhost:5432/itsfound?sslmode=disable

# Database — Neon (for production deploy, uncomment when needed)
# DATABASE_URL=postgres://<user>:<password>@<neon-host>/itsfound?sslmode=require

# ==========================
# JWT
# ==========================
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=24h

# ==========================
# Supabase Storage
# ==========================
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<supabase-service-role-key>
SUPABASE_BUCKET=itsfound-photos
--- END FILE ---
--- FILE: frontend/.env.example ---
# Backend API base URL (Go/Chi)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Supabase (used client-side for public photo URLs, etc.)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>

# Used by the Next.js Route Handler that issues/verifies the JWT
# stored in the httpOnly cookie. MUST match backend/.env JWT_SECRET.
JWT_SECRET=change-this-to-a-long-random-string

# This frontend's own base URL (used for redirects/callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000