#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDevProdutos() {
  console.log('🧪 Testando tabelas dev_produtos no schema public...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Teste: Acessar dev_produtos no schema public
    console.log('🔍 Tentando acessar dev_produtos...');
    const { data, error } = await supabase
      .from('dev_produtos')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Erro:', error.message);
      console.log('Código:', error.code);
      console.log('Detalhes:', error.details);
    } else {
      console.log('✅ Sucesso! Produtos encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('\n📦 Produtos encontrados:');
        data.forEach((produto, index) => {
          console.log(`${index + 1}. ${produto.nome} (${produto.sku}) - R$ ${produto.preco || 'N/A'}`);
        });
      }
    }
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

testDevProdutos();