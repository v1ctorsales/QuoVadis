import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

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

  const { action, id, page = 1, limit = 10, query, viagemId } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // 🔹 Listar passageiros da viagem com paginação (getByViagemId)
    if (req.method === "GET" && action === "getByViagemId") {
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório." });
      }
      console.log(`📥 Buscando passageiros relacionados à viagem ID: ${id} - Página: ${page}, Limite: ${limit}...`);

      const { data, error, count } = await supabase
        .from("pessoas_viagens")
        .select(`
          id,
          parcelas,
          parcelas_pagas,
          mes_inicio_pagamento,
          idPessoa,
          idViagem,
          pessoa: idPessoa (id, nome, cpf, rg, telefone, nascimento, nao_paga)
        `, { count: "exact" })
        .eq("idViagem", id)
        .range(offset, offset + parseInt(limit) - 1);

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
        total: count, 
        preco_definido: viagemData ? viagemData.preco_definido : null 
      });
    }

    // 🔹 Buscar passageiros por nome (getSearch) com paginação
    else if (req.method === "GET" && action === "getSearch") {
      if (!viagemId) {
        return res.status(400).json({ error: "ID da viagem é obrigatório para busca." });
      }
    
      console.log(`📥 Buscando passageiros da viagem ID: ${viagemId} com busca "${query}" - Página: ${page}, Limite: ${limit}...`);
    
      const { data, error, count } = await supabase
        .from("pessoas_viagens")
        .select(`
          id,
          parcelas,
          parcelas_pagas,
          mes_inicio_pagamento,
          idPessoa,
          idViagem,
          pessoa: pessoas!inner (
            id,
            nome,
            cpf,
            rg,
            telefone,
            nascimento
          )
        `, { count: "exact" })
        .eq("idViagem", viagemId)
        .ilike("pessoas.nome", `%${query}%`)
        .range(offset, offset + parseInt(limit) - 1);
    
      if (error) {
        console.error("❌ Erro ao buscar passageiros com busca:", error);
        return res.status(500).json({ error: "Erro ao buscar passageiros no Supabase." });
      }
    
      console.log("✅ Passageiros encontrados:", data);
      return res.status(200).json({ data, total: count });
    }
    

    // 🔹 Criar Passageiro (POST)
    else if (req.method === "POST" && action === "createPassageiro") {
      const { idPessoa, idViagem, parcelas, parcelas_pagas, mes_inicio_pagamento } = req.body;
      if (!idPessoa || !idViagem || !parcelas || !mes_inicio_pagamento) {
        return res.status(400).json({ error: "Parâmetros obrigatórios ausentes: idPessoa, idViagem, parcelas e mes_inicio_pagamento." });
      }
      console.log(`➕ Inserindo passageiro na viagem ID: ${idViagem} para a pessoa ID: ${idPessoa}...`);

      // Verificar duplicidade
      const { data: existing, error: existingError } = await supabase
        .from("pessoas_viagens")
        .select("id")
        .eq("idPessoa", idPessoa)
        .eq("idViagem", idViagem)
        .maybeSingle();
      if (existing) {
        console.warn("🚨 Passageiro duplicado detectado:", existing);
        return res.status(409).json({ error: "Passageiro já cadastrado para esta viagem." });
      }
      if (existingError) {
        console.error("❌ Erro ao verificar duplicidade:", existingError);
        return res.status(500).json({ error: "Erro ao verificar duplicidade no Supabase." });
      }

      const { data, error } = await supabase
        .from("pessoas_viagens")
        .insert([{
          idPessoa,
          idViagem,
          parcelas,
          parcelas_pagas: parcelas_pagas || 0,
          mes_inicio_pagamento
        }])
        .select();
      if (error) {
        console.error("❌ Erro ao inserir passageiro:", error);
        return res.status(500).json({ error: "Erro ao inserir passageiro no Supabase." });
      }
      console.log("✅ Passageiro inserido com sucesso:", data);
      return res.status(201).json({ message: "Passageiro inserido com sucesso", data });
    }

    // 🔹 Atualizar Pagamento (PUT)
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

    // 🔹 Deletar Viagem (DELETE) - (para viagens)
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

    // 🔹 Deletar Passageiro (DELETE) na tabela pessoas_viagens
    else if (req.method === "DELETE" && action === "deletePassageiro") {
      const registroId = req.query.id || req.body.id;
      if (!registroId) {
        return res.status(400).json({ error: "ID do passageiro é obrigatório para exclusão." });
      }
      console.log(`🗑️ Excluindo passageiro com registro ID: ${registroId}...`);
      const { error } = await supabase
        .from("pessoas_viagens")
        .delete()
        .eq("id", registroId);
      if (error) {
        console.error("❌ Erro ao excluir passageiro:", error);
        return res.status(500).json({ error: "Erro ao excluir passageiro no Supabase." });
      }
      console.log("✅ Passageiro excluído com sucesso!");
      return res.status(200).json({ message: "Passageiro excluído com sucesso!" });
    }

    // 🔹 Imprimir Lista de Passageiros (PDF)
    else if (req.method === "GET" && action === "PrintListaPassageiros") {
      if (!id) {
        return res.status(400).json({ error: "ID da viagem é obrigatório para impressão." });
      }
      console.log(`🖨️ Gerando PDF para viagem ID: ${id}...`);

      // 1. Buscar os passageiros dessa viagem
      const { data: passengers, error: passengersError } = await supabase
        .from("pessoas_viagens")
        .select(`
          id,
          parcelas,
          parcelas_pagas,
          mes_inicio_pagamento,
          idPessoa,
          pessoa: idPessoa (nome, cpf, rg, telefone, nascimento)
        `)
        .eq("idViagem", id);

      if (passengersError) {
        console.error("❌ Erro ao buscar passageiros:", passengersError);
        return res.status(500).json({ error: "Erro ao buscar passageiros." });
      }

      // 2. Buscar os detalhes da viagem para exibir informações
      const { data: viagemData, error: viagemError } = await supabase
        .from("viagens")
        .select("viagem, data_ida, data_volta")
        .eq("id", id)
        .maybeSingle();

      if (viagemError) {
        console.error("❌ Erro ao buscar dados da viagem:", viagemError);
        return res.status(500).json({ error: "Erro ao buscar dados da viagem." });
      }

      // 3. Configurar o PDF (headers)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="lista_passageiros.pdf"');

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // 4. Cabeçalho do PDF
      doc.fontSize(14).text(`Viagem: ${viagemData ? viagemData.viagem : "N/A"}`, { align: 'center' });
      doc.fontSize(12).text(
        `Data de Ida: ${viagemData ? viagemData.data_ida : "N/A"} - ` +
        `Data de Volta: ${viagemData ? viagemData.data_volta : "N/A"}`,
        { align: 'center' }
      );
      doc.moveDown(2);
      doc.fontSize(14).text("Lista de Passageiros:", { underline: true });
      doc.moveDown();

      // 5. Definir colunas e largura
      const colWidths = [190, 90, 80, 80, 70]; 
      // Nome, CPF, RG, Telefone, Nascimento
      const colTitles = ["Nome", "CPF", "RG", "Telefone", "Nascimento"];

      // 6. Função auxiliar para desenhar uma linha retangular
      const drawCell = (x, y, w, h) => {
        doc.rect(x, y, w, h).stroke();
      };

      // 7. Posição inicial da tabela
      let tableTop = doc.y;
      const rowHeight = 20;
      const startX = 50; // Margem esquerda
      // Largura total = soma das colWidths
      const totalTableWidth = colWidths.reduce((acc, cw) => acc + cw, 0);

      // 8. Desenhar o cabeçalho
      let currentX = startX;
      drawCell(startX, tableTop, totalTableWidth, rowHeight);
      colTitles.forEach((title, i) => {
        drawCell(currentX, tableTop, colWidths[i], rowHeight);
        doc.fontSize(10)
          .text(title, currentX + 5, tableTop + 5, {
            width: colWidths[i] - 10,
            align: 'left'
          });
        currentX += colWidths[i];
      });
      tableTop += rowHeight;

      // 9. Preencher as linhas da tabela
      passengers.forEach((item) => {
        const pessoa = item.pessoa || {};
        const rowData = [
          pessoa.nome || "N/A",
          pessoa.cpf || "N/A",
          pessoa.rg || "N/A",
          pessoa.telefone || "N/A",
          pessoa.nascimento
            ? new Date(pessoa.nascimento).toLocaleDateString('pt-BR')
            : "N/A"
        ];

        drawCell(startX, tableTop, totalTableWidth, rowHeight);
        let colX = startX;
        rowData.forEach((cellText, idx) => {
          drawCell(colX, tableTop, colWidths[idx], rowHeight);
          doc.fontSize(10)
            .text(cellText, colX + 5, tableTop + 5, {
              width: colWidths[idx] - 10,
              align: 'left'
            });
          colX += colWidths[idx];
        });
        tableTop += rowHeight;
      });

      doc.end();
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
