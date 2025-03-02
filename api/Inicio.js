import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY; // Sua chave de acesso Unsplash
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  console.log("🛠️ Conectando ao Supabase...");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não estão definidas!");
    return res.status(500).json({ error: "Configuração do Supabase ausente." });
  }

  try {
    if (req.method === "GET" && req.query.action === "getInicio") {
      // Obter a próxima viagem (data_ida >= hoje)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { data: viagemData, error: viagemError } = await supabase
        .from("viagens")
        .select("*")
        .gte("data_ida", today)
        .order("data_ida", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (viagemError) {
        console.error("❌ Erro ao buscar próxima viagem:", viagemError);
        return res.status(500).json({ error: "Erro ao buscar próxima viagem." });
      }
      if (!viagemData) {
        return res.status(404).json({ error: "Nenhuma viagem futura encontrada." });
      }

      // Buscar os passageiros dessa viagem
      const { data: passageirosData, count: passageirosCount, error: passageirosError } = await supabase
        .from("pessoas_viagens")
        .select("id, parcelas_pagas", { count: 'exact' })
        .eq("idViagem", viagemData.id);

      if (passageirosError) {
        console.error("❌ Erro ao buscar passageiros:", passageirosError);
        return res.status(500).json({ error: "Erro ao buscar passageiros." });
      }

      // Calcular valores
      const limiteParcelas = viagemData.limite_parcelas || 1;
      const precoDefinido = viagemData.preco_definido || 0;
      const valorPorParcela = precoDefinido / limiteParcelas;

      let totalParcelasPagas = 0;
      if (passageirosData) {
        totalParcelasPagas = passageirosData.reduce((acc, item) => acc + (item.parcelas_pagas || 0), 0);
      }
      const valorArrecadado = valorPorParcela * totalParcelasPagas;
      const faltaReceber = precoDefinido - valorArrecadado;

      // Monta a resposta base
      const resposta = {
        proximaViagem: {
          destino: viagemData.viagem,
          data_ida: viagemData.data_ida,
          data_volta: viagemData.data_volta,
          passageiros: `${passageirosCount}/${viagemData.quantidade_pessoas || 'N/A'}`,
          preco_definido: precoDefinido,
          valor_arrecadado: valorArrecadado,
          falta_receber: faltaReceber
        }
      };

      // Se houver chave de acesso do Unsplash, buscar uma imagem
      if (unsplashAccessKey) {
        const searchQuery = `viagem ${viagemData.viagem}`;
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&page=1`;
        try {
          const unsplashRes = await fetch(unsplashUrl, {
            headers: {
              Authorization: `Client-ID ${unsplashAccessKey}`
            }
          });
          const unsplashData = await unsplashRes.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            // Utilizamos a URL "regular" da imagem
            resposta.proximaViagem.imageUrl = unsplashData.results[0].urls.regular;
          }
        } catch (err) {
          console.error("Erro ao buscar imagem no Unsplash:", err);
          // Se ocorrer erro na busca da imagem, pode continuar sem ela
        }
      }

      console.log("✅ Dados de início obtidos:", resposta);
      return res.status(200).json(resposta);
    } else {
      return res.status(400).json({ error: "Ação inválida ou método HTTP não suportado." });
    }
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
