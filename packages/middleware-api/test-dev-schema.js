#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

async function testDevSchema() {
  console.log("🧪 Testando acesso ao schema dev...\n");

  // Testar com service role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    console.log("🔍 Testando com SERVICE ROLE...");
    const { data, error } = await supabaseAdmin
      .schema("dev")
      .from("produtos")
      .select("*")
      .limit(3);

    if (error) {
      console.log("❌ Erro com service role:", error.message);
      console.log("Código:", error.code);
    } else {
      console.log("✅ SERVICE ROLE FUNCIONOU!");
      console.log(`📦 ${data?.length || 0} produtos encontrados`);
      if (data && data.length > 0) {
        data.forEach((produto, index) => {
          console.log(`${index + 1}. ${produto.nome} (${produto.sku})`);
        });
      }
    }
  } catch (error) {
    console.error("💥 Erro:", error.message);
  }
}

testDevSchema();
