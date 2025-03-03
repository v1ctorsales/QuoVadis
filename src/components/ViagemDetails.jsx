import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch 
} from '@mui/material';
import { toast } from 'react-toastify';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

const ToggleLabelCustom = ({ checked }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {checked ? <PersonIcon fontSize="small" /> : <GroupIcon fontSize="small" />}
    {checked ? "Calcular por pessoa" : "Calcular no total"}
  </span>
);

function ViagemDetails() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    destino: "",
    quantidade_pessoas: "",
    data_ida: "",
    data_volta: "",
    hotel: "",
    calculo_valor_hotel_por_pessoa: false,
    valor_hotel: "",
    transporte: "",
    transporteCustom: "",
    valor_transporte: "",
    calculo_valor_transporte_por_pessoa: false,
    gastos_passeios: "",
    gastos_passeios_por_pessoa: false,
    gastos_alimentacao: "",
    gastos_alimentacao_por_pessoa: false,
    outros_gastos: "",
    outros_gastos_por_pessoa: false,
    preco_definido: "",
    preco_sugerido: "",
    limite_parcelas: "1"  // novo campo
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/Viagens?action=getById&id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data && data.data[0]) {
            const v = data.data[0];
            setFormData({
              destino: v.viagem || "",
              quantidade_pessoas: v.quantidade_pessoas || "",
              data_ida: v.data_ida || "",
              data_volta: v.data_volta || "",
              hotel: v.hotel || "",
              calculo_valor_hotel_por_pessoa: v.calculo_valor_hotel_por_pessoa || false,
              valor_hotel: v.valor_hotel || "",
              transporte: (v.transporte === "ônibus" || v.transporte === "avião") ? v.transporte : "outros",
              transporteCustom: (v.transporte === "ônibus" || v.transporte === "avião") ? "" : v.transporte,
              valor_transporte: v.valor_transporte || "",
              calculo_valor_transporte_por_pessoa: v.calculo_valor_transporte_por_pessoa || false,
              gastos_passeios: v.gastos_passeios || "",
              gastos_passeios_por_pessoa: v.gastos_passeios_por_pessoa || false,
              gastos_alimentacao: v.gastos_alimentacao || "",
              gastos_alimentacao_por_pessoa: v.gastos_alimentacao_por_pessoa || false,
              outros_gastos: v.outros_gastos || "",
              outros_gastos_por_pessoa: v.outros_gastos_por_pessoa || false,
              preco_definido: v.preco_definido ?? "",
              preco_sugerido: v.preco_sugerido || "",
              limite_parcelas: v.limite_parcelas || "1"
            });
          } else {
            toast.error("Viagem não encontrada.");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Erro ao buscar dados da viagem.");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Função para calcular o gasto por pessoa
  const calculateGastoPorPessoa = () => {
    const qtd = parseFloat(formData.quantidade_pessoas) || 1;
    let hotel = parseFloat(formData.valor_hotel) || 0;
    let transporte = parseFloat(formData.valor_transporte) || 0;
    let passeios = parseFloat(formData.gastos_passeios) || 0;
    let alimentacao = parseFloat(formData.gastos_alimentacao) || 0;
    let outros = parseFloat(formData.outros_gastos) || 0;
    
    if (!formData.calculo_valor_hotel_por_pessoa && qtd > 0) {
      hotel = hotel / qtd;
    }
    if (!formData.calculo_valor_transporte_por_pessoa && qtd > 0) {
      transporte = transporte / qtd;
    }
    if (!formData.gastos_passeios_por_pessoa && qtd > 0) {
      passeios = passeios / qtd;
    }
    if (!formData.gastos_alimentacao_por_pessoa && qtd > 0) {
      alimentacao = alimentacao / qtd;
    }
    if (!formData.outros_gastos_por_pessoa && qtd > 0) {
      outros = outros / qtd;
    }
    
    return hotel + transporte + passeios + alimentacao + outros;
  };

  const gastoPorPessoa = calculateGastoPorPessoa();



  const handleSave = async () => {
    setSaving(true);
    try {
      const transporteFinal = formData.transporte === "outros" ? formData.transporteCustom : formData.transporte;
      // Calcular o custo por pessoa (gastoPorPessoa já deve ser calculado corretamente)
      const custoPorPessoa = parseFloat(gastoPorPessoa) || 0;
      
      const payload = { 
        id, 
        ...formData, 
        viagem: formData.destino, 
        transporte: transporteFinal,
        limite_parcelas: parseInt(formData.limite_parcelas),
        preco_definido: parseFloat(formData.preco_definido), // Se esse campo existir
        custo_por_pessoa: custoPorPessoa  // Inclua o valor calculado aqui
      };
      
      const response = await fetch('/api/Viagens?action=updateViagem', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Viagem atualizada com sucesso!");
      } else {
        toast.error("Erro ao atualizar: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    } finally {
      setSaving(false);
    }
  };
  

  
  

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 15 }}>
        Editar Detalhes da Viagem
      </Typography>

      {/* Seção 1: Dados da Viagem */}
      <Box sx={{ mb: 15 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Dados da Viagem</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            sx={{ width: '50%' }}
            name="destino"
            label="Destino"
            value={formData.destino}
            onChange={handleChange}
          />
          <TextField
            sx={{ width: '50%' }}
            name="quantidade_pessoas"
            label="Quantidade de Pessoas"
            type="number"
            value={formData.quantidade_pessoas}
            onChange={handleChange}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            name="data_ida"
            label="Data de Ida"
            type="date"
            value={formData.data_ida}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            name="data_volta"
            label="Data de Volta"
            type="date"
            value={formData.data_volta}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      {/* Seção 2: Hotel */}
      <Box sx={{ mb: 15 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Hotel</Typography>
        <TextField
          fullWidth
          name="hotel"
          label="Hotel"
          value={formData.hotel}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: '20%' }}>
            <FormControlLabel
              control={
                <Switch
                  name="calculo_valor_hotel_por_pessoa"
                  checked={formData.calculo_valor_hotel_por_pessoa}
                  onChange={handleChange}
                />
              }
              label={<ToggleLabelCustom checked={formData.calculo_valor_hotel_por_pessoa} />}
            />
          </Box>
          <Box sx={{ width: '80%' }}>
            <TextField
              fullWidth
              name="valor_hotel"
              label="Valor do Hotel"
              type="number"
              value={formData.valor_hotel}
              onChange={handleChange}
            />
          </Box>
        </Box>
      </Box>

      {/* Seção 3: Transporte */}
      <Box sx={{ mb: 15 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Transporte</Typography>
        {formData.transporte !== "outros" ? (
          <TextField
            select
            fullWidth
            name="transporte"
            label="Transporte"
            value={formData.transporte}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value === "outros") {
                setFormData(prev => ({ ...prev, transporteCustom: "" }));
              }
            }}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="">Selecione...</option>
            <option value="ônibus">Ônibus</option>
            <option value="avião">Avião</option>
            <option value="outros">Outros</option>
          </TextField>
        ) : (
          <TextField
            fullWidth
            name="transporteCustom"
            label="Transporte (especifique)"
            value={formData.transporteCustom}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: '20%' }}>
            <FormControlLabel
              control={
                <Switch
                  name="calculo_valor_transporte_por_pessoa"
                  checked={formData.calculo_valor_transporte_por_pessoa}
                  onChange={handleChange}
                />
              }
              label={<ToggleLabelCustom checked={formData.calculo_valor_transporte_por_pessoa} />}
            />
          </Box>
          <Box sx={{ width: '80%' }}>
            <TextField
              fullWidth
              name="valor_transporte"
              label="Valor do Transporte"
              type="number"
              value={formData.valor_transporte}
              onChange={handleChange}
            />
          </Box>
        </Box>
      </Box>

      {/* Seção 4: Gastos */}
      <Box sx={{ mb: 15 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Gastos</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ width: '20%' }}>
            <FormControlLabel
              control={
                <Switch
                  name="gastos_passeios_por_pessoa"
                  checked={formData.gastos_passeios_por_pessoa}
                  onChange={handleChange}
                />
              }
              label={<ToggleLabelCustom checked={formData.gastos_passeios_por_pessoa} />}
            />
          </Box>
          <Box sx={{ width: '80%' }}>
            <TextField
              fullWidth
              name="gastos_passeios"
              label="Gastos com Passeios"
              type="number"
              value={formData.gastos_passeios}
              onChange={handleChange}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ width: '20%' }}>
            <FormControlLabel
              control={
                <Switch
                  name="gastos_alimentacao_por_pessoa"
                  checked={formData.gastos_alimentacao_por_pessoa}
                  onChange={handleChange}
                />
              }
              label={<ToggleLabelCustom checked={formData.gastos_alimentacao_por_pessoa} />}
            />
          </Box>
          <Box sx={{ width: '80%' }}>
            <TextField
              fullWidth
              name="gastos_alimentacao"
              label="Gastos com Alimentação"
              type="number"
              value={formData.gastos_alimentacao}
              onChange={handleChange}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ width: '20%' }}>
            <FormControlLabel
              control={
                <Switch
                  name="outros_gastos_por_pessoa"
                  checked={formData.outros_gastos_por_pessoa}
                  onChange={handleChange}
                />
              }
              label={<ToggleLabelCustom checked={formData.outros_gastos_por_pessoa} />}
            />
          </Box>
          <Box sx={{ width: '80%' }}>
            <TextField
              fullWidth
              name="outros_gastos"
              label="Outros Gastos"
              type="number"
              value={formData.outros_gastos}
              onChange={handleChange}
            />
          </Box>
        </Box>
      </Box>

      {/* Seção 5: Precificação */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Precificação</Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          * Gasto por pessoa: {gastoPorPessoa}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 3 }}>
          * Preço recomendado: {gastoPorPessoa.toFixed(2) * 1.3}
        </Typography>
        <TextField
        fullWidth
        name="preco_definido"
        label="Preço Por Pessoa"
        type="number"
        value={formData.preco_definido}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

        <TextField
          select
          fullWidth
          name="limite_parcelas"
          label="Limite de parcelas"
          value={formData.limite_parcelas}
          onChange={handleChange}
          SelectProps={{ native: true }}
        >
          {Array.from({ length: 10 }, (_, i) => {
            const value = i + 1;
            return (
              <option key={value} value={value}>
                {value === 1 ? "Somente a vista" : `${value}x`}
              </option>
            );
          })}
        </TextField>
      </Box>

      <Button 
        variant="contained" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </Box>
  );
}

export default ViagemDetails;
