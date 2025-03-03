import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import useViagensStore from '../store/useViagensStore';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddPassageiroModal = ({ open, onClose, onAdd, viagemId: propViagemId }) => {
  // Obtem as viagens da store
  const { viagens } = useViagensStore();
  console.log("[AddPassageiroModal] Viagens da store:", viagens);

  // Converte propViagemId para número e filtra a viagem na store
  const viagemIdNum = propViagemId ? Number(propViagemId) : undefined;
  const selectedViagem = viagemIdNum 
    ? viagens.find(v => v.id === viagemIdNum)
    : viagens.find(v => v.preco_definido != null);
  console.log("[AddPassageiroModal] Viagem selecionada:", selectedViagem);

  // Usa o valor de preco_definido se estiver definido; caso contrário, 0
  const totalViagem = selectedViagem && selectedViagem.preco_definido != null ? selectedViagem.preco_definido : 0;
  console.log("[AddPassageiroModal] totalViagem:", totalViagem);

  // Estados para a busca de pessoas
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleOptions, setPeopleOptions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Estado para o dropdown de parcelas (default = 1)
  const [installmentsCount, setInstallmentsCount] = useState(1);
  // Estado para a data da primeira cobrança (formato YYYY-MM-DD)
  const [firstChargeDate, setFirstChargeDate] = useState('');

  // Estado de loading para salvar
  const [saving, setSaving] = useState(false);

  // Busca de pessoas: dispara quando o input tiver 3 ou mais caracteres
  useEffect(() => {
    if (searchQuery.length < 3) {
      setPeopleOptions([]);
      return;
    }
    setLoadingSearch(true);
    fetch(`/api/Pessoas.js?action=getSearch&query=${encodeURIComponent(searchQuery)}&page=1&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setPeopleOptions(data.data);
          console.log("[AddPassageiroModal] Pessoas encontradas:", data.data);
        }
        setLoadingSearch(false);
      })
      .catch(err => {
        console.error("[AddPassageiroModal] Erro na busca:", err);
        setLoadingSearch(false);
      });
  }, [searchQuery]);

  // Calcula o valor de cada parcela com base no valor total da viagem e no número de parcelas selecionado
  const installmentValue = totalViagem ? totalViagem / installmentsCount : 0;
  console.log("[AddPassageiroModal] installmentValue:", installmentValue);

  const handleSave = () => {
    if (!selectedPerson || !installmentsCount || !firstChargeDate) {
      toast.warn("Preencha todos os campos.");
      return;
    }
    const payload = {
      idPessoa: selectedPerson.id,
      idViagem: selectedViagem ? selectedViagem.id : null,
      parcelas: installmentsCount,
      parcelas_pagas: 0,
      mes_inicio_pagamento: firstChargeDate
    };
  
    setSaving(true);
    fetch('/api/Passageiros.js?action=createPassageiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        let json = {};
        try {
          json = await res.json();
        } catch (e) {
          console.warn("Nenhum JSON retornado");
        }
        if (!res.ok) {
          throw new Error(json.error || 'Erro desconhecido');
        }
        return json;
      })
      .then(data => {
        console.log("[AddPassageiroModal] Passageiro inserido com sucesso:", data);
        setSaving(false);
        toast.success("Passageiro inserido com sucesso!");
        if (onAdd) onAdd(payload);
        if (onClose) onClose();
      })
      .catch(err => {
        console.error("[AddPassageiroModal] Erro ao inserir passageiro:", err);
        setSaving(false);
        // Se for o caso de duplicado, virá "Passageiro já cadastrado para esta viagem." do backend
        if (err.message.includes("Passageiro já cadastrado")) {
          toast.error("Erro: Este passageiro já foi adicionado a esta viagem.");
        } else {
          toast.error("Erro ao inserir passageiro.");
        }
      });
  };
  

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Adicionar Passageiro</DialogTitle>
      <DialogContent>
        {/* Campo de busca */}
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            options={peopleOptions}
            getOptionLabel={(option) => option.nome || ''}
            loading={loadingSearch}
            noOptionsText="Digite um nome"
            loadingText="Procurando..."
            onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
            onChange={(event, newValue) => setSelectedPerson(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pesquisar pessoa"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        </Box>

        {/* Área para selecionar o número de parcelas e exibir o cálculo (50% cada) */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <FormControl fullWidth sx={{ width: '50%' }}>
            <InputLabel id="limite-parcelas-label">Limite de parcelas</InputLabel>
            <Select
              labelId="limite-parcelas-label"
              name="limite_parcelas"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
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
          <Box sx={{ width: '50%', ml: 2, textAlign: 'right' }}>
            <Typography variant="body1">
              {installmentsCount}x{" "}
              {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
          </Box>
        </Box>

        {/* Campo para a data da primeira cobrança */}
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Data da primeira cobrança"
            variant="outlined"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={firstChargeDate}
            onChange={(e) => setFirstChargeDate(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? <CircularProgress size={24} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPassageiroModal;
