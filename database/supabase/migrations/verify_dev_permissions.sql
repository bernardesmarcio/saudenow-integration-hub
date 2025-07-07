-- Verification script for dev schema permissions
-- Run this script to verify that permissions are working correctly

-- 1. Check schema permissions
SELECT 
  nspname AS schema_name,
  nspacl AS schema_permissions
FROM pg_namespace 
WHERE nspname = 'dev';

-- 2. Check table permissions for dev schema
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'dev'
ORDER BY tablename;

-- 3. Check if we can select from dev.produtos table
SELECT 
  id,
  nome,
  categoria,
  ativo,
  created_at
FROM dev.produtos 
LIMIT 5;

-- 4. Check all available tables in dev schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'dev'
ORDER BY table_name;

-- 5. Check functions in dev schema
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'dev'
ORDER BY routine_name;