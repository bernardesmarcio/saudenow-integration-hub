-- Clean permissions script for dev schema
-- Execute this in Supabase SQL Editor

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA dev TO service_role, anon, authenticated;

-- Grant table privileges
GRANT ALL ON ALL TABLES IN SCHEMA dev TO service_role, anon, authenticated;

-- Grant sequence privileges  
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO service_role, anon, authenticated;

-- Grant function privileges
GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO service_role, anon, authenticated;

-- Set default privileges for new objects
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON FUNCTIONS TO service_role, anon, authenticated;

-- Add comment
COMMENT ON SCHEMA dev IS 'Development schema for SaúdeNow Integration Hub - Full permissions granted';