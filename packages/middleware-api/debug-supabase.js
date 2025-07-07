#!/usr/bin/env node

// Script para debugar conexão Supabase
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Debugando conexão Supabase...\n');

  // Verificar variáveis de ambiente
  console.log('📋 Variáveis de ambiente:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
  console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
  console.log('ENVIRONMENT:', process.env.ENVIRONMENT);
  console.log('SCHEMA_PREFIX:', process.env.SCHEMA_PREFIX);
  console.log('');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    return;
  }

  // Criar cliente Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔗 Testando conexão básica...');
    
    // Teste 1: Verificar se consegue conectar
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(1);

    if (schemaError) {
      console.error('❌ Erro de conexão:', schemaError.message);
      return;
    }

    console.log('✅ Conexão estabelecida com sucesso');

    // Teste 2: Verificar se schema dev existe
    console.log('\n📊 Verificando schema dev...');
    
    const { data: devSchema, error: devError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'dev');

    if (devError) {
      console.error('❌ Erro ao verificar schema dev:', devError.message);
    } else if (devSchema && devSchema.length > 0) {
      console.log('✅ Schema "dev" encontrado');
    } else {
      console.log('❌ Schema "dev" não encontrado');
    }

    // Teste 3: Listar tabelas do schema dev
    console.log('\n📋 Verificando tabelas do schema dev...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'dev');

    if (tablesError) {
      console.error('❌ Erro ao listar tabelas:', tablesError.message);
    } else {
      console.log('📋 Tabelas encontradas no schema dev:');
      if (tables && tables.length > 0) {
        tables.forEach(table => console.log(`  - ${table.table_name}`));
      } else {
        console.log('  Nenhuma tabela encontrada');
      }
    }

    // Teste 4: Tentar acessar tabela dev.produtos diretamente
    console.log('\n🏷️  Testando acesso à tabela dev.produtos...');
    
    try {
      // Método 1: schema().from()
      const { data: produtos1, error: error1 } = await supabase
        .schema('dev')
        .from('produtos')
        .select('*')
        .limit(1);

      if (error1) {
        console.log('❌ Erro com schema().from():', error1.message);
      } else {
        console.log('✅ schema().from() funcionou, produtos encontrados:', produtos1?.length || 0);
      }
    } catch (err) {
      console.log('❌ Exceção com schema().from():', err.message);
    }

    try {
      // Método 2: from() direto (tentando dev_produtos)
      const { data: produtos2, error: error2 } = await supabase
        .from('dev_produtos')
        .select('*')
        .limit(1);

      if (error2) {
        console.log('❌ Erro com from("dev_produtos"):', error2.message);
      } else {
        console.log('✅ from("dev_produtos") funcionou, produtos encontrados:', produtos2?.length || 0);
      }
    } catch (err) {
      console.log('❌ Exceção com from("dev_produtos"):', err.message);
    }

    // Teste 5: Query SQL direta
    console.log('\n💾 Testando query SQL direta...');
    
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', { sql: 'SELECT COUNT(*) as count FROM dev.produtos' });

    if (sqlError) {
      console.log('❌ Erro com SQL direto:', sqlError.message);
    } else {
      console.log('✅ SQL direto funcionou:', sqlResult);
    }

    // Teste 6: RLS (Row Level Security)
    console.log('\n🔒 Verificando RLS...');
    
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'dev')
      .eq('tablename', 'produtos');

    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError.message);
    } else {
      console.log('📊 Informações da tabela produtos:', rlsCheck);
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar
testSupabaseConnection().then(() => {
  console.log('\n🏁 Debug concluído');
}).catch(error => {
  console.error('\n💥 Erro fatal:', error.message);
});