// /api/data.js
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Accept', 'application/json');

  console.log("🛠️ API foi chamada!");

  try {
    const { name } = req.query;

    if (!name) {
      console.error("❌ Erro: Nome não foi fornecido.");
      return res.status(400).json({ error: "Nome é obrigatório!" });
    }

    console.log(`✅ Nome recebido: ${name}`);
    return res.status(200).json({ message: `Olá, ${name}! Bem-vindo ao Quovadis.` });
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}