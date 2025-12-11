#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

async function testCorrectStructure() {
  console.log(
    "🧪 Testando estrutura correta: schema dev, tabelas sem prefixo...\n",
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    console.log("🔍 Testando dev.produtos...");
    const { data, error } = await supabaseAdmin
      .schema("dev")
      .from("produtos")
      .select("*")
      .limit(3);

    if (error) {
      console.log("❌ Erro:", error.message);
      console.log("Código:", error.code);
      console.log("Detalhes:", error.details);

      // Tentar verificar se o schema dev existe
      console.log("\n🔍 Verificando se schema dev tem permissões...");
    } else {
      console.log("✅ SUCESSO! Produtos encontrados:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("\n📦 Produtos na tabela dev.produtos:");
        data.forEach((produto, index) => {
          console.log(
            `${index + 1}. ${produto.nome} (${produto.sku}) - R$ ${produto.preco || "N/A"}`,
          );
          console.log(`   Categoria: ${produto.categoria || "N/A"}`);
          console.log(`   Ativo: ${produto.ativo}`);
        });
      }
    }

    // Testar contagem
    console.log("\n📊 Testando contagem...");
    const { count, error: countError } = await supabaseAdmin
      .schema("dev")
      .from("produtos")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.log("❌ Erro na contagem:", countError.message);
    } else {
      console.log(`✅ Total de produtos: ${count}`);
    }
  } catch (error) {
    console.error("💥 Erro inesperado:", error.message);
  }
}

testCorrectStructure();
