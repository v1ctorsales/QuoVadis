import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { addMonths, format } from 'date-fns';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const PaymentStatusModal = ({
  open,
  onClose,
  registroId,     // ID do registro na tabela pessoas_viagens
  nome,           // Nome da pessoa
  telefone,
  mesInicioPagamento,
  parcelas,
  parcelasPagas,
  valorViagem,
  nomeViagem,     // Nome da viagem
  onSave
}) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);

  const valorParcelaCalculado = valorViagem && parcelas ? valorViagem / parcelas : 0;

  useEffect(() => {
    if (!parcelas) return;
    const todayNoTime = dateOnly(new Date());
    const dateBase = mesInicioPagamento ? new Date(mesInicioPagamento) : new Date();
    const data = [];
    for (let i = 0; i < parcelas; i++) {
      const dueDateObj = addMonths(dateBase, i);
      const dueDateNoTime = dateOnly(dueDateObj);
      const formattedDueDate = format(dueDateNoTime, 'dd/MM/yyyy');
      let statusInicial;
      if (i < parcelasPagas) {
        statusInicial = "Pago";
      } else {
        statusInicial = dueDateNoTime < todayNoTime ? "Atrasado" : "Não Pago";
      }
      data.push({
        number: i + 1,
        dueDate: formattedDueDate,
        dueDateObj: dueDateNoTime,
        status: statusInicial
      });
    }
    setInstallments(data);
  }, [mesInicioPagamento, parcelas, parcelasPagas]);

  const showCobra = installments.some(inst => inst.status === 'Atrasado');

  const handleStatusChange = (index, newStatus) => {
    setInstallments(prev =>
      prev.map((inst, i) => i === index ? { ...inst, status: newStatus } : inst)
    );
  };

  const handleSave = () => {
    const newParcelasPagas = installments.filter(inst => inst.status === 'Pago').length;
    setLoading(true);
    fetch('/api/Passageiros?action=updatePagamento', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: registroId, parcelasPagas: newParcelasPagas })
    })
      .then(res => res.json())
      .then(data => {
        onSave(newParcelasPagas, installments);
        setLoading(false);
        onClose();
      })
      .catch(error => {
        console.error("Erro ao atualizar pagamento:", error);
        setLoading(false);
      });
  };

  const handleCobra = () => {
    // Seleciona todas as parcelas em atraso
    const overdueInstallments = installments.filter(inst => inst.status === "Atrasado");
    if (overdueInstallments.length === 0) return;
    const phoneWithCountry = `55${telefone}`;
    let message = "";
    if (overdueInstallments.length === 1) {
      message = `Olá, ${nome}, verificamos que você não efetuou o pagamento da ${overdueInstallments[0].number}ª parcela referente à viagem para ${nomeViagem}.\n\nSegue abaixo os dados para pagamento:\n\nChave PIX (CNPJ): 590356320001-33\nValor: ${valorParcelaCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nAtenciosamente, Quovadis (Gilda e Ricardo)`;
    } else {
      const installmentNumbers = overdueInstallments.map(inst => inst.number).join(', ');
      const totalDue = overdueInstallments.length * valorParcelaCalculado;
      message = `Olá, ${nome}, verificamos que você não efetuou o pagamento das parcelas ${installmentNumbers} referentes à viagem para ${nomeViagem}.\n\nSegue abaixo os dados para pagamento:\n\nChave PIX (CNPJ): 590356320001-33\nValor Total: ${totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nAtenciosamente, Quovadis (Gilda e Ricardo)`;
    }
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth
      PaperProps={{ sx: { maxWidth: '100%', position: 'relative' } }}>
      <DialogTitle>
        Status do Pagamento - {nome || 'Sem Nome'}
      </DialogTitle>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1">
          Valor da Parcela: R$ {valorParcelaCalculado ? valorParcelaCalculado.toFixed(2) : "0.00"}
        </Typography>
      </Box>
      {showCobra && (
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button variant="contained" color="error" onClick={handleCobra}>
            COBRAR
          </Button>
        </Box>
      )}
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              {installments.map((inst, index) => (
                <TableCell key={index} align="center">
                  Parcela {inst.number}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {installments.map((inst, index) => (
                <TableCell key={index} align="center">
                  {inst.dueDate}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {installments.map((inst, index) => {
                const todayNoTime = dateOnly(new Date());
                const isFuture = inst.dueDateObj > todayNoTime;
                const allowedOptions = isFuture ? ["Pago", "Não Pago"] : ["Pago", "Atrasado"];
                return (
                  <TableCell key={index} align="center">
                    <FormControl fullWidth size="small">
                      <InputLabel
                        sx={{
                          color:
                            inst.status === 'Pago'
                              ? 'green'
                              : inst.status === 'Atrasado'
                              ? 'red'
                              : 'inherit'
                        }}
                      >
                        Status
                      </InputLabel>
                      <Select
                        value={inst.status}
                        label="Status"
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              inst.status === 'Pago'
                                ? 'green'
                                : inst.status === 'Atrasado'
                                ? 'red'
                                : 'inherit'
                          },
                          color:
                            inst.status === 'Pago'
                              ? 'green'
                              : inst.status === 'Atrasado'
                              ? 'red'
                              : 'inherit'
                        }}
                      >
                        {allowedOptions.map((opt, idx) => (
                          <MenuItem key={idx} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentStatusModal;
