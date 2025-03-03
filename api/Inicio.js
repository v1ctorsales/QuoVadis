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
      // Data atual no formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      // Obter a próxima viagem (data_ida >= hoje)
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

      // Buscar os passageiros dessa viagem (todos)
      const { data: passageirosData, count: passageirosCount, error: passageirosError } = await supabase
        .from("pessoas_viagens")
        .select("id", { count: 'exact' })
        .eq("idViagem", viagemData.id);

      if (passageirosError) {
        console.error("❌ Erro ao buscar passageiros:", passageirosError);
        return res.status(500).json({ error: "Erro ao buscar passageiros." });
      }

      // Buscar os passageiros que NÃO vão pagar (nao_paga = true)
      const { data: passageirosNaoPagantes, count: naoPagantesCount, error: naoPagantesError } = await supabase
        .from("pessoas_viagens")
        .select("id, pessoa: idPessoa(nao_paga)", { count: 'exact' })
        .eq("idViagem", viagemData.id)
        .eq("pessoa.nao_paga", true);

      if (naoPagantesError) {
        console.error("❌ Erro ao buscar passageiros não pagantes:", naoPagantesError);
        return res.status(500).json({ error: "Erro ao buscar passageiros não pagantes." });
      }

      // Total de passageiros conforme registro (por exemplo, "0/10" → 10)
      const totalPassengers = passageirosCount || 0;
      // Número de passageiros que pagarão = total - não pagantes
      const pagantesCount = totalPassengers - (naoPagantesCount || 0);

      // Calcular valores para a próxima viagem
      const limiteParcelas = viagemData.limite_parcelas || 1;
      const precoDefinido = viagemData.preco_definido || 0;
      const custoPorPessoa = viagemData.custo_por_pessoa;
      
      // Arrecadação: preço por pessoa * (total de pagantes)
      const arrecadacaoTotal = precoDefinido * pagantesCount;
      // Custo total: custo por pessoa * total de passageiros (mesmo os que não pagam)
      const custoTotal = custoPorPessoa * totalPassengers;
      const lucroTotal = arrecadacaoTotal - custoTotal;

      // Buscar as próximas 3 viagens (excluindo a próxima)
      const { data: proximasViagensData, error: proximasViagensError } = await supabase
        .from("viagens")
        .select("*")
        .gt("data_ida", viagemData.data_ida)
        .order("data_ida", { ascending: true })
        .limit(3);
      
      if (proximasViagensError) {
        console.error("❌ Erro ao buscar próximas viagens:", proximasViagensError);
      }

      // Buscar as 3 últimas viagens (que já ocorreram)
      const { data: ultimasViagensData, error: ultimasViagensError } = await supabase
        .from("viagens")
        .select("*")
        .lt("data_ida", today)
        .order("data_ida", { ascending: false })
        .limit(3);
      
      if (ultimasViagensError) {
        console.error("❌ Erro ao buscar últimas viagens:", ultimasViagensError);
      }

      // Monta a resposta base
      const resposta = {
        proximaViagem: {
          destino: viagemData.viagem,
          data_ida: viagemData.data_ida,
          data_volta: viagemData.data_volta,
          passageiros: `${totalPassengers}/${viagemData.quantidade_pessoas || 'N/A'}`,
          preco_definido: precoDefinido,
          valor_arrecadado: arrecadacaoTotal,
          custoPorPessoa: custoPorPessoa,
          nao_paga: naoPagantesCount || 0,  // Número de passageiros que não pagam
          id: viagemData.id
        },
        proximasViagens: proximasViagensData || [],
        ultimasViagens: ultimasViagensData || []
      };

      // Verifica se existe imagem local para o destino da próxima viagem
      const destinoLower = viagemData.viagem.toLowerCase();
      if (destinoLower.includes("aparecida do norte")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/aparecida.jpg";
      } else if (destinoLower.includes("caldas novas")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/caldas.jpeg";
      } else if (destinoLower.includes("campos do jord")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/camposdojordao.jpg";
      } else if (destinoLower.includes("rio de nazar")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/cirio.jpg";
      } else if (destinoLower.includes("gramado")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/gramado.jpg";
      } else if (destinoLower.includes("resende costa")) {
        resposta.proximaViagem.imageUrl = "/imgs/destinos/resende.jpg";
      }

      // Se não foi definida imagem local e houver chave do Unsplash, buscar imagem
      if (!resposta.proximaViagem.imageUrl && unsplashAccessKey) {
        const searchQuery = `viajar ${viagemData.viagem}`;
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&page=1`;
        try {
          const unsplashRes = await fetch(unsplashUrl, {
            headers: {
              Authorization: `Client-ID ${unsplashAccessKey}`
            }
          });
          const unsplashData = await unsplashRes.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            resposta.proximaViagem.imageUrl = unsplashData.results[0].urls.regular;
          }
        } catch (err) {
          console.error("Erro ao buscar imagem no Unsplash:", err);
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
