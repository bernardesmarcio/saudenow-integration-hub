-- SQL para dar permissões ao schema dev
-- Execute este SQL no Supabase SQL Editor

-- Dar permissões ao service_role para acessar schema dev
GRANT USAGE ON SCHEMA dev TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA dev TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO service_role;

-- Dar permissões ao anon e authenticated também (para anon key)
GRANT USAGE ON SCHEMA dev TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA dev TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO anon, authenticated;

-- Definir privilégios padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON FUNCTIONS TO service_role, anon, authenticated;

-- Verificar se as permissões foram aplicadas
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE schemaname = 'dev';

-- Verificar permissões do schema
SELECT 
    schema_name,
    schema_owner,
    default_character_set_name
FROM information_schema.schemata 
WHERE schema_name = 'dev';