import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azpwydsythatsozjmmmo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cHd5ZHN5dGhhdHNvemptbW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NzA0OTUsImV4cCI6MjA1NDU0NjQ5NX0.53Ul0uKYW9cK1CQZgNcvLdpMVzUopns9J_wcK3Sfg24'
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
