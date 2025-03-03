import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET; // Chave secreta do JWT

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  console.log("🔍 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("🔍 Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "❌ NÃO DEFINIDO");
console.log("🔍 JWT Secret:", process.env.JWT_SECRET ? "OK" : "❌ NÃO DEFINIDO");


  if (!supabaseUrl || !supabaseKey || !jwtSecret) {
    console.error("❌ Configuração do Supabase ou JWT ausente!");
    return res.status(500).json({ error: "Erro interno no servidor. Verifique a configuração." });
  }

  const { action } = req.query;

  if (req.method === "POST" && action === "login") {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    // Buscar usuário no banco
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, usuario, senha") // Ajuste os campos conforme sua tabela
      .eq("usuario", usuario)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    // Validação simples (idealmente use bcrypt para senhas hash)
    if (data.senha !== senha) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    // Criar token JWT
    const token = jwt.sign(
      { id: data.id, usuario: data.usuario },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ message: "Autenticado com sucesso!", token });
  }

  return res.status(400).json({ error: "Ação inválida ou método HTTP não suportado." });
}
