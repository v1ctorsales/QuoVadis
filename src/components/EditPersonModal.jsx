import React from 'react';
import { Modal, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import usePessoasStore from '../store/usePessoasStore';

const EditPersonModal = ({ open, handleClose, person, isNew }) => {
  const [formData, setFormData] = React.useState({
    id: "",
    nome: "",
    telefone: "",
    cpf: "",
    rg: "",
    nascimento: "",
  });
  const [loading, setLoading] = React.useState(false);
  const { addPessoa, updatePessoa } = usePessoasStore();

  React.useEffect(() => {
    if (person) {
      setFormData({
        id: person.id || "",
        nome: person.nome || "",
        telefone: person.telefone || "",
        cpf: person.cpf || "",
        rg: person.rg || "",
        nascimento: person.nascimento || "",
      });
    } else {
      setFormData({ id: "", nome: "", telefone: "", cpf: "", rg: "", nascimento: "" }); // 🔥 Reset no estado inicial
    }
  }, [person, isNew]);

  const handleChange = (e) => {
    let { name, value } = e.target;
  
    if (name === "cpf") {
      value = formatCPF(value);
    }
  
    if (name === "rg") {
      value = formatRG(value);
    }
  
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!validateCPF(formData.cpf)) {
      toast.error("CPF inválido! Use o formato 999.999.999-99.");
      return;
    }
  
    if (!validateRG(formData.rg)) {
      toast.error("RG inválido! Use o formato MG-00.000.000 ou 00.000.000.");
      return;
    }
  
    setLoading(true);
    try {
      // 🔥 Primeiro, verificar se o CPF já existe no banco de dados
      if (isNew) {
        const checkResponse = await fetch(`/api/Pessoas.js?action=checkCPF&cpf=${formData.cpf}`);
        const checkResult = await checkResponse.json();
        if (checkResult.exists) {
          toast.error("Este CPF já está cadastrado.");
          setLoading(false);
          return;
        }
      }
  
      // 🔥 Se não existir, prosseguir com o envio
      const endpoint = isNew ? '/api/Pessoas.js?action=createPessoa' : '/api/Pessoas.js?action=updatePessoa';
      const method = isNew ? 'POST' : 'PUT';
  
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      console.log("📤 Enviando dados:", formData);
  
      const result = await response.json();
      if (response.ok) {
        if (isNew) {
          addPessoa(result.data[0]);
          toast.success("Pessoa adicionada com sucesso!");
        } else {
          updatePessoa(formData);
          toast.success("Pessoa atualizada com sucesso!");
        }
        handleClose();
      } else {
        toast.error("Erro ao salvar pessoa: " + result.error);
        console.error("❌ Erro ao salvar pessoa:", result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
      console.error("🚨 Erro na requisição:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  const validateCPF = (cpf) => {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return cpfRegex.test(cpf);
  };
  
  const validateRG = (rg) => {
    const rgRegex = /^[-A-Za-z0-9.]{6,15}$/;
    return rgRegex.test(rg);
  };  

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não for número
      .slice(0, 11) // Limita a 11 dígitos numéricos
      .replace(/(\d{3})(\d)/, '$1.$2') // Primeiro ponto
      .replace(/(\d{3})(\d)/, '$1.$2') // Segundo ponto
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Traço final
  };

  const formatRG = (value) => {
    value = value.toUpperCase(); // Converte para maiúsculas
    value = value.replace(/[^A-Z0-9]/g, ''); // Remove caracteres especiais
    value = value.slice(0, 14); // Limita o tamanho do campo
    return value;
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: 400, 
        bgcolor: 'background.paper', 
        boxShadow: 24, 
        p: 4, 
        borderRadius: 2 
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {isNew ? 'Adicionar Pessoa' : 'Editar Pessoa'}
        </Typography>
        
        <TextField 
          fullWidth 
          label="Nome" 
          name="nome" 
          value={formData.nome || ''} 
          onChange={handleChange} 
          sx={{ mb: 2 }}
        />
        <TextField 
          fullWidth 
          label="Telefone" 
          name="telefone" 
          value={formData.telefone || ''} 
          onChange={handleChange} 
          sx={{ mb: 2 }}
        />
        <TextField 
          fullWidth 
          label="CPF" 
          name="cpf" 
          value={formData.cpf || ''} 
          onChange={handleChange} 
          sx={{ mb: 2 }}
        />
        <TextField 
          fullWidth 
          label="RG" 
          name="rg" 
          value={formData.rg || ''} 
          onChange={handleChange} 
          sx={{ mb: 2 }}
        />
        <TextField 
          fullWidth 
          label="Data de Nascimento" 
          name="nascimento" 
          type="date" 
          value={formData.nascimento || ''} 
          onChange={handleChange} 
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#f0f0f0' } }}
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#505050', color: 'white', '&:hover': { bgcolor: '#333' } }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (isNew ? "Adicionar" : "Salvar")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditPersonModal;
