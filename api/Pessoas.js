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
    if (req.method === "GET" && action === "getAll") {
      console.log(`📥 Buscando pessoas - Página: ${page}, Limite: ${limit}`);

      const { data, error, count } = await supabase
        .from("pessoas")
        .select("*", { count: "exact" }) // Conta o total de registros
        .range(offset, offset + parseInt(limit) - 1); // Paginação

      if (error) {
        console.error("❌ Erro ao buscar dados do Supabase:", error);
        return res.status(500).json({ error: "Erro ao buscar dados do Supabase." });
      }

      console.log("✅ Dados recuperados:", data);
      return res.status(200).json({ data, total: count });
    }

    else if (req.method === "GET" && action === "checkCPF") {
      const { cpf } = req.query;
    
      if (!cpf) {
        return res.status(400).json({ error: "CPF é obrigatório para verificação." });
      }
    
      console.log(`🔎 Verificando se o CPF ${cpf} já existe...`);
    
      const { data, error } = await supabase
        .from("pessoas")
        .select("id")
        .eq("cpf", cpf)
        .single();
    
      if (error && error.code !== "PGRST116") { // "PGRST116" significa que nenhum registro foi encontrado
        console.error("❌ Erro ao buscar CPF:", error);
        return res.status(500).json({ error: "Erro ao verificar CPF no Supabase." });
      }
    
      if (data) {
        console.log("🚨 CPF já cadastrado:", cpf);
        return res.status(200).json({ exists: true });
      }
    
      console.log("✅ CPF disponível para cadastro.");
      return res.status(200).json({ exists: false });
    }
    

    // 🔹 Criar Pessoa (POST)
    else if (req.method === "POST" && action === "createPessoa") {
      const { nome, telefone, cpf, rg, nascimento } = req.body;
    
      if (!nome || !telefone || !cpf || !rg || !nascimento) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios para criar uma pessoa." });
      }

      const capitalizeName = (nome) => {
        return nome
          .split(' ')
          .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
          .join(' ');
      };
      
      // Função para remover o prefixo '31' do telefone, se existir
      const formatTelefone = (telefone) => {
        return telefone.startsWith('31') ? telefone.slice(2) : telefone;
      };
    
      // 🔥 Verificar se o CPF já está cadastrado antes de criar a pessoa
      const { data: existingPerson, error: checkError } = await supabase
        .from("pessoas")
        .select("id")
        .eq("cpf", cpf)
        .single();
    
      if (existingPerson) {
        console.log("🚨 Tentativa de cadastrar CPF já existente:", cpf);
        return res.status(400).json({ error: "Este CPF já está cadastrado." });
      }
    
        // Aplicando as alterações:
      const nomeFormatado = capitalizeName(nome);
      const telefoneFormatado = formatTelefone(telefone);
      console.log(`➕ Criando nova pessoa: ${nome}...`);
    
      const { data, error } = await supabase
      .from("pessoas")
      .insert([{ nome: nomeFormatado, telefone: telefoneFormatado, cpf, rg, nascimento }])
      .select();
  
    if (error) {
      console.error("❌ Erro ao criar pessoa:", error);
      return res.status(500).json({ error: "Erro ao criar pessoa no Supabase." });
    }
  
    console.log("✅ Pessoa criada com sucesso:", data);
    return res.status(201).json({ message: "Pessoa criada com sucesso", data });
  }
    
    // 🔹 Atualizar Pessoa (PUT)
    else if (req.method === "PUT" && action === "updatePessoa") {
      const { id, nome, telefone, cpf, rg, nascimento } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID da pessoa é obrigatório para atualização." });
      }

      console.log(`✏️ Atualizando pessoa com ID: ${id}...`);

      const { data, error } = await supabase
        .from("pessoas")
        .update({ nome, telefone, cpf, rg, nascimento })
        .eq("id", id)
        .select();

      if (error) {
        console.error("❌ Erro ao atualizar pessoa:", error);
        return res.status(500).json({ error: "Erro ao atualizar pessoa no Supabase." });
      }

      console.log("✅ Pessoa atualizada com sucesso:", data);
      return res.status(200).json({ message: "Pessoa atualizada com sucesso", data });
    }

    // 🔹 Deletar Pessoa (DELETE)
    else if (req.method === "DELETE" && action === "deletePessoa") {
      if (!id) {
        return res.status(400).json({ error: "ID da pessoa é obrigatório para exclusão." });
      }

      console.log(`🗑️ Excluindo pessoa com ID: ${id}...`);

      const { error } = await supabase
        .from("pessoas")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao excluir pessoa:", error);
        return res.status(500).json({ error: "Erro ao excluir pessoa no Supabase." });
      }

      console.log("✅ Pessoa excluída com sucesso!");
      return res.status(200).json({ message: "Pessoa excluída com sucesso!" });
    }

    // 🔹 Pesquisa por Nome (GET)
    else if (req.method === "GET" && action === "getSearch") {
      if (!query) {
        return res.status(400).json({ error: "Parâmetro de pesquisa ausente." });
      }

      console.log(`🔎 Buscando pessoas com nome semelhante a: ${query} - Página: ${page}, Limite: ${limit}`);

      const { data, error, count } = await supabase
        .from("pessoas")
        .select("*", { count: "exact" })
        .ilike("nome", `%${query}%`) // Busca insensível a maiúsculas e minúsculas
        .range(offset, offset + parseInt(limit) - 1);

      if (error) {
        console.error("❌ Erro ao buscar pessoas:", error);
        return res.status(500).json({ error: "Erro ao buscar pessoas no Supabase." });
      }

      console.log("✅ Pessoas encontradas:", data);
      return res.status(200).json({ data, total: count });
    }

    // 🔹 Ação Inválida
    else {
      console.warn("⚠️ Ação desconhecida ou método inválido:", action);
      return res.status(400).json({ error: "Ação inválida ou método HTTP não suportado." });
    }
  } catch (error) {
    console.error("🚨 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
