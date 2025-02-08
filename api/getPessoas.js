import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey)

console.log(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  console.log("🛠️ Conectando ao Supabase...");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não estão definidas!");
    return res.status(500).json({ error: "Configuração do Supabase ausente." });
  }

  try {
    const { data, error } = await supabase.from("pessoas").select("*");

    if (error) {
      console.error("❌ Erro ao buscar dados do Supabase:", error);
      return res.status(500).json({ error: "Erro ao buscar dados do Supabase." });
    }

    console.log("✅ Dados recuperados:", data);
    return res.status(200).json(data);
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
