#!/usr/bin/env node

// Teste simples de conexão Supabase
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

async function testSimple() {
  console.log("🔍 Teste simples Supabase...\n");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("");

  try {
    // Teste 1: Tentar schema().from()
    console.log('🧪 Teste 1: schema("dev").from("produtos")');
    const { data: test1, error: error1 } = await supabase
      .schema("dev")
      .from("produtos")
      .select("*")
      .limit(1);

    if (error1) {
      console.log("❌ Erro:", error1.message);
      console.log("Código:", error1.code);
      console.log("Detalhes:", error1.details);
    } else {
      console.log("✅ Sucesso! Produtos encontrados:", test1?.length || 0);
      if (test1 && test1.length > 0) {
        console.log("Primeiro produto:", test1[0]);
      }
    }

    console.log("");

    // Teste 2: Usar service role
    console.log("🧪 Teste 2: Usando service role key");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: test2, error: error2 } = await supabaseAdmin
      .schema("dev")
      .from("produtos")
      .select("*")
      .limit(1);

    if (error2) {
      console.log("❌ Erro com service role:", error2.message);
      console.log("Código:", error2.code);
    } else {
      console.log("✅ Service role funcionou! Produtos:", test2?.length || 0);
    }

    console.log("");

    // Teste 3: Verificar se tabela existe usando SQL function
    console.log("🧪 Teste 3: Verificando se tabela existe");

    const { data: test3, error: error3 } = await supabaseAdmin.rpc(
      "get_table_info",
      {
        schema_name: "dev",
        table_name: "produtos",
      },
    );

    if (error3) {
      console.log("❌ Função RPC não existe:", error3.message);

      // Tentar query mais simples
      const { data: simple, error: simpleError } = await supabaseAdmin
        .from("pg_tables")
        .select("*")
        .eq("schemaname", "dev")
        .eq("tablename", "produtos");

      if (simpleError) {
        console.log(
          "❌ Também não conseguiu acessar pg_tables:",
          simpleError.message,
        );
      } else {
        console.log("✅ pg_tables funcionou:", simple);
      }
    }
  } catch (error) {
    console.error("💥 Erro inesperado:", error.message);
  }
}

testSimple();
