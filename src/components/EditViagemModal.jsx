import React from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Switch, 
  FormControlLabel, 
  Stepper, 
  Step, 
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import { toast } from 'react-toastify';
import useViagensStore from '../store/useViagensStore';

const ToggleLabel = ({ checked, labelPerPerson, labelTotal }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {checked ? <PersonIcon fontSize="small" /> : <GroupIcon fontSize="small" />}
    {checked ? labelPerPerson : labelTotal}
  </span>
);

const EditViagemModal = ({ open, handleClose, viagem, isNew, onSave }) => {
  const [formData, setFormData] = React.useState({
    id: "",
    destino: "",
    quantidade_pessoas: "",
    dataIda: "",
    dataVolta: "",
    transporteOption: "",
    transporteCustom: "",
    transportePorPessoa: false,
    valorTransporte: "",
    hospedagem: "",
    hospedagemPorPessoa: false,
    valorHospedagem: "",
    gastoPasseiosPorPessoa: false,
    valorGastoPasseios: "",
    gastoAlimentacaoPorPessoa: false,
    valorGastoAlimentacao: "",
    outrosGastosPorPessoa: false,
    valorOutrosGastos: "",
    preco_sugerido: "",
    limite_parcelas: "1"
  });
  const [loading, setLoading] = React.useState(false);
  const { addViagem, updateViagem } = useViagensStore();
  
  // Definindo as etapas do Stepper
  const steps = [
    "Informações Principais", 
    "Transporte e Hospedagem", 
    "Outros Gastos",
    "Precificação"
  ];
  const [activeStep, setActiveStep] = React.useState(0);

  // Sempre que o modal for aberto, resetar a etapa para a 1 (activeStep = 0)
  React.useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open]);

  React.useEffect(() => {
    if (viagem && Object.keys(viagem).length > 0) {
      const validOptions = ["ônibus", "avião"];
      const transporteOption = viagem.transporte 
        ? (validOptions.includes(viagem.transporte) ? viagem.transporte : "outros")
        : "";
      const transporteCustom = (viagem.transporte && !validOptions.includes(viagem.transporte)) 
        ? viagem.transporte 
        : "";
      setFormData({
        id: viagem.id || "",
        destino: viagem.destino || "",
        quantidade_pessoas: viagem.quantidade_pessoas || "",
        dataIda: viagem.dataIda ? viagem.dataIda.split('T')[0] : "",
        dataVolta: viagem.dataVolta ? viagem.dataVolta.split('T')[0] : "",
        transporteOption,
        transporteCustom,
        transportePorPessoa: viagem.transportePorPessoa || false,
        valorTransporte: viagem.valorTransporte || "",
        hospedagem: viagem.hospedagem || "",
        hospedagemPorPessoa: viagem.hospedagemPorPessoa || false,
        valorHospedagem: viagem.valorHospedagem || "",
        gastoPasseiosPorPessoa: viagem.gastoPasseiosPorPessoa || false,
        valorGastoPasseios: viagem.valorGastoPasseios || "",
        gastoAlimentacaoPorPessoa: viagem.gastoAlimentacaoPorPessoa || false,
        valorGastoAlimentacao: viagem.valorGastoAlimentacao || "",
        outrosGastosPorPessoa: viagem.outrosGastosPorPessoa || false,
        valorOutrosGastos: viagem.valorOutrosGastos || "",
        preco_sugerido: viagem.preco_sugerido || "",
        limite_parcelas: viagem.limite_parcelas ? String(viagem.limite_parcelas) : "1"
      });
    } else {
      setFormData({
        id: "",
        destino: "",
        quantidade_pessoas: "",
        dataIda: "",
        dataVolta: "",
        transporteOption: "",
        transporteCustom: "",
        transportePorPessoa: false,
        valorTransporte: "",
        hospedagem: "",
        hospedagemPorPessoa: false,
        valorHospedagem: "",
        gastoPasseiosPorPessoa: false,
        valorGastoPasseios: "",
        gastoAlimentacaoPorPessoa: false,
        valorGastoAlimentacao: "",
        outrosGastosPorPessoa: false,
        valorOutrosGastos: "",
        preco_sugerido: "",
        limite_parcelas: "1"
      });
    }
  }, [viagem, isNew]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Função para calcular o gasto por pessoa na etapa de Precificação
  const calculateGastoPorPessoa = () => {
    const qtd = parseFloat(formData.quantidade_pessoas) || 1;
  
    const transporte = parseFloat(formData.valorTransporte) || 0;
    const hospedagem = parseFloat(formData.valorHospedagem) || 0;
    const passeios = parseFloat(formData.valorGastoPasseios) || 0;
    const alimentacao = parseFloat(formData.valorGastoAlimentacao) || 0;
    const outros = parseFloat(formData.valorOutrosGastos) || 0;
    
    // Se o custo informado não for já por pessoa, dividir pelo número de pessoas
    const valorTransporte = formData.transportePorPessoa ? transporte : (qtd > 0 ? transporte / qtd : transporte);
    const valorHospedagem = formData.hospedagemPorPessoa ? hospedagem : (qtd > 0 ? hospedagem / qtd : hospedagem);
    const valorPasseios = formData.gastoPasseiosPorPessoa ? passeios : (qtd > 0 ? passeios / qtd : passeios);
    const valorAlimentacao = formData.gastoAlimentacaoPorPessoa ? alimentacao : (qtd > 0 ? alimentacao / qtd : alimentacao);
    const valorOutros = formData.outrosGastosPorPessoa ? outros : (qtd > 0 ? outros / qtd : outros);
    
    // Logs para depuração
    console.log("======= Cálculo de Gasto por Pessoa =======");
    console.log("Quantidade de Pessoas:", qtd);
    console.log("Transporte:", transporte, " | Por Pessoa?", formData.transportePorPessoa, " | Final:", valorTransporte);
    console.log("Hospedagem:", hospedagem, " | Por Pessoa?", formData.hospedagemPorPessoa, " | Final:", valorHospedagem);
    console.log("Passeios:", passeios, " | Por Pessoa?", formData.gastoPasseiosPorPessoa, " | Final:", valorPasseios);
    console.log("Alimentação:", alimentacao, " | Por Pessoa?", formData.gastoAlimentacaoPorPessoa, " | Final:", valorAlimentacao);
    console.log("Outros:", outros, " | Por Pessoa?", formData.outrosGastosPorPessoa, " | Final:", valorOutros);
    console.log("============================================");
  
    return valorTransporte + valorHospedagem + valorPasseios + valorAlimentacao + valorOutros;
  };
  
  
  

  const gastoPorPessoa = calculateGastoPorPessoa();

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    
    // Extraindo os campos que não fazem parte da lógica
    const { transporteOption, transporteCustom, ...rest } = formData;
    const transporte = transporteOption === "outros" ? transporteCustom : transporteOption;
    const dataToSend = { ...rest, transporte, custo_por_pessoa: gastoPorPessoa };
  
    console.log("Payload enviado:", dataToSend);
  
    try {
      const endpoint = isNew 
        ? '/api/Viagens.js?action=createViagem' 
        : '/api/Viagens.js?action=updateViagem';
      const method = isNew ? 'POST' : 'PUT';
  
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();
      if (response.ok) {
        if (isNew) {
          addViagem(result.data[0]);
          toast.success("Viagem adicionada com sucesso!");
        } else {
          updateViagem(dataToSend);
          toast.success("Viagem atualizada com sucesso!");
        }
        handleClose();
      } else {
        toast.error("Erro ao salvar viagem: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.destino.trim()) {
        toast.error("O destino é obrigatório.");
        return;
      }
      if (!formData.dataIda) {
        toast.error("A data de ida é obrigatória.");
        return;
      }
      if (!formData.dataVolta) {
        toast.error("A data de volta é obrigatória.");
        return;
      }
      if (!formData.quantidade_pessoas) {
        toast.error("A quantidade de pessoas é obrigatória.");
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.transporteOption) {
        toast.error("O meio de transporte é obrigatório.");
        return;
      }
      if (formData.transporteOption === "outros" && !formData.transporteCustom.trim()) {
        toast.error("Informe o meio de transporte.");
        return;
      }
      if (!formData.valorTransporte) {
        toast.error("O valor do transporte é obrigatório.");
        return;
      }
      if (!formData.hospedagem.trim()) {
        toast.error("A hospedagem é obrigatória.");
        return;
      }
      if (!formData.valorHospedagem) {
        toast.error("O valor da hospedagem é obrigatório.");
        return;
      }
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: '50%', 
        bgcolor: 'background.paper', 
        boxShadow: 24, 
        p: 4, 
        borderRadius: 2 
      }}>
        <Typography variant="h6" sx={{ mb: 4 }}>
          {isNew ? 'Adicionar Viagem' : 'Editar Viagem'}
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <TextField 
              fullWidth 
              label="Destino" 
              name="destino" 
              value={formData.destino} 
              onChange={handleChange} 
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Quantidade de Pessoas" 
              name="quantidade_pessoas" 
              type="number"
              value={formData.quantidade_pessoas} 
              onChange={handleChange} 
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Data de Ida" 
              name="dataIda" 
              type="date" 
              value={formData.dataIda} 
              onChange={handleChange} 
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Data de Volta" 
              name="dataVolta" 
              type="date" 
              value={formData.dataVolta} 
              onChange={handleChange} 
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }} variant="outlined">
              <InputLabel 
                id="transporte-label"
                shrink={true}
                sx={{
                  backgroundColor: 'background.paper',
                  px: 0.5,
                  transform: 'translate(14px, -9px) scale(0.75)'
                }}
              >
                Transporte
              </InputLabel>
              <Select
                labelId="transporte-label"
                name="transporteOption"
                displayEmpty
                value={formData.transporteOption}
                onChange={handleChange}
                variant="outlined"
                inputProps={{
                  'aria-label': 'Selecione o transporte',
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <em style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Selecione...</em>;
                  }
                  return selected === "outros" ? formData.transporteCustom : selected;
                }}
              >
                <MenuItem value="">
                  <em>Selecione...</em>
                </MenuItem>
                <MenuItem value="ônibus">Ônibus</MenuItem>
                <MenuItem value="avião">Avião</MenuItem>
                <MenuItem value="outros">Outros</MenuItem>
              </Select>
            </FormControl>
            {formData.transporteOption === "outros" && (
              <TextField 
                fullWidth
                label="Informe o Transporte"
                name="transporteCustom"
                value={formData.transporteCustom}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '40%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.transportePorPessoa}
                      onChange={handleChange}
                      name="transportePorPessoa"
                      color="primary"
                    />
                  }
                  label={
                    <ToggleLabel 
                      checked={formData.transportePorPessoa} 
                      labelPerPerson="Calcular transporte por pessoa" 
                      labelTotal="Calcular transporte no total" 
                    />
                  }
                />
              </Box>
              <Box sx={{ width: '60%' }}>
                <TextField 
                  fullWidth 
                  label="Valor do Transporte" 
                  name="valorTransporte" 
                  type="number" 
                  value={formData.valorTransporte} 
                  onChange={handleChange} 
                />
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <TextField 
              fullWidth 
              label="Hospedagem" 
              name="hospedagem" 
              value={formData.hospedagem} 
              onChange={handleChange} 
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '40%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hospedagemPorPessoa}
                      onChange={handleChange}
                      name="hospedagemPorPessoa"
                      color="primary"
                    />
                  }
                  label={
                    <ToggleLabel 
                      checked={formData.hospedagemPorPessoa} 
                      labelPerPerson="Calcular hospedagem por pessoa" 
                      labelTotal="Calcular hospedagem no total" 
                    />
                  }
                />
              </Box>
              <Box sx={{ width: '60%' }}>
                <TextField 
                  fullWidth 
                  label="Valor da Hospedagem" 
                  name="valorHospedagem" 
                  type="number" 
                  value={formData.valorHospedagem} 
                  onChange={handleChange} 
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '40%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.gastoPasseiosPorPessoa}
                      onChange={handleChange}
                      name="gastoPasseiosPorPessoa"
                      color="primary"
                    />
                  }
                  label={
                    <ToggleLabel 
                      checked={formData.gastoPasseiosPorPessoa} 
                      labelPerPerson="Calcular gasto com passeios por pessoa" 
                      labelTotal="Calcular gasto com passeios no total" 
                    />
                  }
                />
              </Box>
              <Box sx={{ width: '60%' }}>
                <TextField 
                  fullWidth 
                  label="Valor gasto com passeios" 
                  name="valorGastoPasseios" 
                  type="number" 
                  value={formData.valorGastoPasseios} 
                  onChange={handleChange} 
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '40%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.gastoAlimentacaoPorPessoa}
                      onChange={handleChange}
                      name="gastoAlimentacaoPorPessoa"
                      color="primary"
                    />
                  }
                  label={
                    <ToggleLabel 
                      checked={formData.gastoAlimentacaoPorPessoa} 
                      labelPerPerson="Calcular gasto com alimentação por pessoa" 
                      labelTotal="Calcular gasto com alimentação no total" 
                    />
                  }
                />
              </Box>
              <Box sx={{ width: '60%' }}>
                <TextField 
                  fullWidth 
                  label="Valor gasto com alimentação" 
                  name="valorGastoAlimentacao" 
                  type="number" 
                  value={formData.valorGastoAlimentacao} 
                  onChange={handleChange} 
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '40%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.outrosGastosPorPessoa}
                      onChange={handleChange}
                      name="outrosGastosPorPessoa"
                      color="primary"
                    />
                  }
                  label={
                    <ToggleLabel 
                      checked={formData.outrosGastosPorPessoa} 
                      labelPerPerson="Calcular outros gastos por pessoa" 
                      labelTotal="Calcular outros gastos no total" 
                    />
                  }
                />
              </Box>
              <Box sx={{ width: '60%' }}>
                <TextField 
                  fullWidth 
                  label="Valor de outros gastos" 
                  name="valorOutrosGastos" 
                  type="number" 
                  value={formData.valorOutrosGastos} 
                  onChange={handleChange} 
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              * Gasto por pessoaa: {gastoPorPessoa}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              * Preço recomendado: {(gastoPorPessoa * 1.3).toFixed(2)}
            </Typography>
            <TextField
              fullWidth
              label="Preço Por Pessoa"
              name="preco_sugerido" 
              type="number"
              value={formData.preco_sugerido}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel id="limite-parcelas-label">Limite de parcelas</InputLabel>
              <Select
                labelId="limite-parcelas-label"
                name="limite_parcelas"
                value={formData.limite_parcelas}
                onChange={handleChange}
                label="Limite de parcelas"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const value = i + 1;
                  return (
                    <MenuItem key={value} value={value}>
                      {value === 1 ? "Somente a vista" : `${value}x`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#f0f0f0' } }}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Voltar
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#505050', color: 'white', '&:hover': { bgcolor: '#333' } }}
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (activeStep === steps.length - 1 ? "Salvar" : "Próximo")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditViagemModal;
