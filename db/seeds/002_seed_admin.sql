-- 002_seed_admin.sql
-- Seeds a single default admin account for development and initial
-- moderation access.
--
-- IMPORTANT: the password_hash below is a REAL, VALID bcrypt hash
-- (cost factor 12) of the plaintext password "admin1234". It is a
-- development-only placeholder credential. It MUST be rotated (and
-- ideally this account disabled or its password changed) before the
-- application is used in a production environment.
--
-- TODO: hash di bawah perlu diverifikasi/di-generate ulang di Hari 1
-- dengan bcrypt.GenerateFromPassword("admin1234", 12) dari Go.

INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@itsfound.local',
    '$2b$12$EiytdxHmEZpmo5eJATZcE.NmUpdzVgnm19FRT1RO9s3oz.yEuu4kq',
    'Admin ITSFOUND',
    'admin'
)
ON CONFLICT (email) DO NOTHING;