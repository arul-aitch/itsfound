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