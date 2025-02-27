import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não estão definidas!");
    return res.status(500).json({ error: "Configuração do Supabase ausente." });
  }

  const { action, id } = req.query;

  try {
    // Ação GET: Buscar passageiros da viagem e o preco_definido
    if (req.method === "GET" && action === "getByViagemId") {
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório." });
      }

      console.log(`📥 Buscando passageiros relacionados à viagem ID: ${id}...`);

      const { data, error } = await supabase
        .from("pessoas_viagens")
        .select(`
          id,
          parcelas,
          parcelas_pagas,
          mes_inicio_pagamento,
          idPessoa,
          idViagem,
          pessoa: idPessoa (id, nome, cpf, rg, telefone, nascimento)
        `)
        .eq("idViagem", id);

      if (error) {
        console.error("❌ Erro ao buscar passageiros:", error);
        return res.status(500).json({ error: "Erro ao buscar passageiros no Supabase." });
      }

      // Busca os detalhes da viagem para retornar o preco_definido
      const { data: viagemData, error: viagemError } = await supabase
        .from("viagens")
        .select("preco_definido")
        .eq("id", id)
        .maybeSingle();

      if (viagemError) {
        console.error("❌ Erro ao buscar dados da viagem:", viagemError);
        return res.status(500).json({ error: "Erro ao buscar dados da viagem no Supabase." });
      }

      console.log("✅ Passageiros encontrados:", data);
      return res.status(200).json({ 
        data,
        preco_definido: viagemData ? viagemData.preco_definido : null 
      });
    }
    
    // Ação PUT: Atualizar o número de parcelas pagas para um registro em pessoas_viagens
    else if (req.method === "PUT" && action === "updatePagamento") {
      const { id: registroId, parcelasPagas } = req.body;
      if (!registroId) {
        return res.status(400).json({ error: "ID do registro é obrigatório para atualização." });
      }
      console.log(`✏️ Atualizando pagamento para registro ID: ${registroId}...`);
      const { data, error } = await supabase
        .from("pessoas_viagens")
        .update({ parcelas_pagas: parcelasPagas })
        .eq("id", registroId)
        .select();
      
      if (error) {
        console.error("❌ Erro ao atualizar pagamento:", error);
        return res.status(500).json({ error: "Erro ao atualizar pagamento no Supabase." });
      }
      console.log("✅ Pagamento atualizado com sucesso:", data);
      return res.status(200).json({ message: "Pagamento atualizado com sucesso", data });
    }
    
    // Ação ou método não suportado
    else {
      console.warn("⚠️ Ação desconhecida ou método inválido:", action);
      return res.status(400).json({ error: "Ação inválida ou método HTTP não suportado." });
    }
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
