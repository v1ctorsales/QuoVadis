import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  console.log("🛠️ Conectando ao Supabase...");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_KEY não estão definidas!");
    return res.status(500).json({ error: "Configuração do Supabase ausente." });
  }

  const { action, id, page = 1, limit = 10, query } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // 🔹 Listar todas as viagens (com paginação)
    if (req.method === "GET" && action === "getAll") {
      console.log(`📥 Buscando viagens - Página: ${page}, Limite: ${limit}`);
    
      const { data, error, count } = await supabase
        .from("viagens")
        .select("id, viagem, data_ida, data_volta, transporte, hotel, preco_definido", { count: "exact" })
        .order("data_ida", { ascending: true })
        .range(offset, offset + parseInt(limit) - 1);
    
      if (error) {
        console.error("❌ Erro ao buscar viagens:", error);
        return res.status(500).json({ error: "Erro ao buscar viagens no Supabase." });
      }
    
      console.log("✅ Viagens recuperadas:", data);
      return res.status(200).json({ data, total: count });
    }    

    // 🔹 Obter Viagem por ID (GET – getFromId ou getById)
    else if (req.method === "GET" && (action === "getFromId" || action === "getById")) {
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório." });
      }

      console.log(`📥 Buscando viagem com ID: ${id}...`);

      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("❌ Erro ao buscar viagem:", error);
        return res.status(500).json({ error: "Erro ao buscar a viagem no Supabase." });
      }

      if (!data) {
        console.warn("🚨 Viagem não encontrada para o ID:", id);
        return res.status(404).json({ error: "Viagem não encontrada." });
      }

      console.log("✅ Viagem recuperada:", data);
      return res.status(200).json({ data: [data] });
    }

    // 🔹 Criar Viagem (POST)
    // ...
    // Dentro do bloco de criação de viagem (action === "createViagem")
else if (req.method === "POST" && action === "createViagem") {
  const {
    destino,
    dataIda,
    dataVolta,
    transporte,
    valorTransporte,
    transportePorPessoa,
    hospedagem,
    valorHospedagem,
    hospedagemPorPessoa,
    gastoPasseiosPorPessoa,
    valorGastoPasseios,
    gastoAlimentacaoPorPessoa,
    valorGastoAlimentacao,
    outrosGastosPorPessoa,
    valorOutrosGastos,
    quantidade_pessoas,       // novo campo
    preco_sugerido,           // novo campo (preço por pessoa)
    limite_parcelas           // novo campo
  } = req.body;

  // Validação dos campos obrigatórios
  if (!destino || !dataIda || !dataVolta) {
    return res.status(400).json({ error: "Destino, data de ida e data de volta são obrigatórios." });
  }
  if (!transporte || !valorTransporte || !hospedagem || !valorHospedagem) {
    return res.status(400).json({ error: "Transporte, valor de transporte, hospedagem e valor da hospedagem são obrigatórios." });
  }

  // Converter os valores numéricos
  const valorTransporteNum = valorTransporte ? parseFloat(valorTransporte) : 0;
  const valorHospedagemNum = valorHospedagem ? parseFloat(valorHospedagem) : 0;
  const valorGastoPasseiosNum = valorGastoPasseios ? parseFloat(valorGastoPasseios) : 0;
  const valorGastoAlimentacaoNum = valorGastoAlimentacao ? parseFloat(valorGastoAlimentacao) : 0;
  const valorOutrosGastosNum = valorOutrosGastos ? parseFloat(valorOutrosGastos) : 0;
  const quantidadePessoasNum = quantidade_pessoas ? parseInt(quantidade_pessoas) : 1;
  const precoSugeridoNum = preco_sugerido ? parseFloat(preco_sugerido) : 0;
  const limiteParcelasNum = limite_parcelas ? parseInt(limite_parcelas) : 1;

  // Calcular custo_por_pessoa usando os valores enviados
  // Se a flag for falsa, divide o valor total pelo número de pessoas
  let hotelIndividual = valorHospedagemNum;
  if (!hospedagemPorPessoa && quantidadePessoasNum > 0) {
    hotelIndividual = valorHospedagemNum / quantidadePessoasNum;
  }
  let transporteIndividual = valorTransporteNum;
  if (!transportePorPessoa && quantidadePessoasNum > 0) {
    transporteIndividual = valorTransporteNum / quantidadePessoasNum;
  }
  let passeiosIndividual = valorGastoPasseiosNum;
  if (!gastoPasseiosPorPessoa && quantidadePessoasNum > 0) {
    passeiosIndividual = valorGastoPasseiosNum / quantidadePessoasNum;
  }
  let alimentacaoIndividual = valorGastoAlimentacaoNum;
  if (!gastoAlimentacaoPorPessoa && quantidadePessoasNum > 0) {
    alimentacaoIndividual = valorGastoAlimentacaoNum / quantidadePessoasNum;
  }
  let outrosIndividual = valorOutrosGastosNum;
  if (!outrosGastosPorPessoa && quantidadePessoasNum > 0) {
    outrosIndividual = valorOutrosGastosNum / quantidadePessoasNum;
  }
  const custo_por_pessoa = hotelIndividual + transporteIndividual + passeiosIndividual + alimentacaoIndividual + outrosIndividual;

  // Verifica se já existe uma viagem com os mesmos dados
  const { data: existing, error: existingError } = await supabase
    .from("viagens")
    .select("id")
    .eq("viagem", destino)
    .eq("data_ida", dataIda)
    .eq("data_volta", dataVolta)
    .maybeSingle();

  if (existing) {
    console.warn("🚨 Viagem duplicada detectada:", existing);
    return res.status(200).json({ message: "Viagem já existe", data: [existing] });
  }

  console.log(`➕ Criando nova viagem: ${destino}...`);

  // Inserir a nova viagem com o custo_por_pessoa recalculado
  const { data, error } = await supabase
    .from("viagens")
    .insert([{
      viagem: destino,
      data_ida: dataIda,
      data_volta: dataVolta,
      transporte: transporte,
      valor_transporte: valorTransporteNum,
      calculo_valor_transporte_por_pessoa: transportePorPessoa,
      hotel: hospedagem,
      valor_hotel: valorHospedagemNum,
      calculo_valor_hotel_por_pessoa: hospedagemPorPessoa,
      gastos_passeios: valorGastoPasseiosNum,
      gastos_passeios_por_pessoa: gastoPasseiosPorPessoa,
      gastos_alimentacao: valorGastoAlimentacaoNum,
      gastos_alimentacao_por_pessoa: gastoAlimentacaoPorPessoa,
      outros_gastos: valorOutrosGastosNum,
      outros_gastos_por_pessoa: outrosGastosPorPessoa,
      quantidade_pessoas: quantidadePessoasNum,
      preco_definido: precoSugeridoNum,
      limite_parcelas: limiteParcelasNum,
      custo_por_pessoa // Campo recalculado
    }])
    .select();

  if (error) {
    console.error("❌ Erro ao criar viagem:", error);
    return res.status(500).json({ error: "Erro ao criar viagem no Supabase." });
  }

  console.log("✅ Viagem criada com sucesso:", data);
  return res.status(201).json({ message: "Viagem criada com sucesso", data });
}

    

    
    // 🔹 Atualizar Viagem (PUT)
    else if (req.method === "PUT" && action === "updateViagem") {
      const {
        id,
        destino,
        dataIda,
        dataVolta,
        quantidade_pessoas,
        transporte,
        valorTransporte,
        transportePorPessoa,
        hospedagem,
        valorHospedagem,
        hospedagemPorPessoa,
        gastoPasseiosPorPessoa,
        valorGastoPasseios,
        gastoAlimentacaoPorPessoa,
        valorGastoAlimentacao,
        outrosGastosPorPessoa,
        valorOutrosGastos,
        limite_parcelas,
        preco_definido,
        custo_por_pessoa
      } = req.body;
    
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório para atualização." });
      }
    
      console.log(`✏️ Atualizando viagem com ID: ${id}...`);
    
      const { data, error } = await supabase
        .from("viagens")
        .update({
          viagem: destino,
          data_ida: dataIda,
          data_volta: dataVolta,
          quantidade_pessoas: quantidade_pessoas,
          transporte: transporte,
          valor_transporte: valorTransporte,
          calculo_valor_transporte_por_pessoa: transportePorPessoa,
          hotel: hospedagem,
          valor_hotel: valorHospedagem,
          calculo_valor_hotel_por_pessoa: hospedagemPorPessoa,
          gastos_passeios: valorGastoPasseios,
          gastos_passeios_por_pessoa: gastoPasseiosPorPessoa,
          gastos_alimentacao: valorGastoAlimentacao,
          gastos_alimentacao_por_pessoa: gastoAlimentacaoPorPessoa,
          outros_gastos: valorOutrosGastos,
          outros_gastos_por_pessoa: outrosGastosPorPessoa,
          limite_parcelas: limite_parcelas,
          preco_definido: preco_definido,
          custo_por_pessoa: custo_por_pessoa
        })
        .eq("id", parseInt(id))  // Convertendo id para número
        .select();
    
      if (error) {
        console.error("❌ Erro ao atualizar viagem:", error);
        return res.status(500).json({ error: "Erro ao atualizar viagem no Supabase." });
      }
    
      console.log("✅ Viagem atualizada com sucesso:", data);
      return res.status(200).json({ message: "Viagem atualizada com sucesso", data });
    }
    

    
    

    // 🔹 Deletar Viagem (DELETE)
    else if (req.method === "DELETE" && action === "deleteViagem") {
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório para exclusão." });
      }

      console.log(`🗑️ Excluindo viagem com ID: ${id}...`);

      const { error } = await supabase
        .from("viagens")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao excluir viagem:", error);
        return res.status(500).json({ error: "Erro ao excluir viagem no Supabase." });
      }

      console.log("✅ Viagem excluída com sucesso!");
      return res.status(200).json({ message: "Viagem excluída com sucesso!" });
    }

    // Ação inválida ou método não suportado
    else {
      console.warn("⚠️ Ação desconhecida ou método inválido:", action);
      return res.status(400).json({ error: "Ação inválida ou método HTTP não suportado." });
    }
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
