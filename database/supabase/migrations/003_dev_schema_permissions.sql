-- Migration: 003_dev_schema_permissions.sql
-- Description: Grant comprehensive permissions to dev schema for service_role, anon, and authenticated roles
-- Date: 2025-07-06

-- Step 1: Grant schema usage permissions
GRANT USAGE ON SCHEMA dev TO service_role, anon, authenticated;

-- Step 2: Grant table privileges
GRANT ALL ON ALL TABLES IN SCHEMA dev TO service_role, anon, authenticated;

-- Step 3: Grant sequence privileges  
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO service_role, anon, authenticated;

-- Step 4: Grant function privileges
GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO service_role, anon, authenticated;

-- Step 5: Set default privileges for new objects
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON FUNCTIONS TO service_role, anon, authenticated;

-- Step 6: Verification query (commented out - run manually if needed)
-- SELECT 
--   schemaname,
--   tablename,
--   tableowner,
--   rowsecurity,
--   hasindexes,
--   hasrules,
--   hastriggers
-- FROM pg_tables 
-- WHERE schemaname = 'dev';

-- Step 7: Sample verification query for dev.produtos table
-- SELECT id, nome, categoria, ativo 
-- FROM dev.produtos 
-- LIMIT 5;

-- Comments for documentation
COMMENT ON SCHEMA dev IS 'Development schema for SaúdeNow Integration Hub - Full permissions granted to service_role, anon, and authenticated roles';