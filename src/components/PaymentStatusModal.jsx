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
  Typography
} from '@mui/material';
import { addMonths, format } from 'date-fns';

const PaymentStatusModal = ({
  open,
  onClose,
  registroId, // ID do registro na tabela pessoas_viagens
  nome,
  telefone,
  mesInicioPagamento,
  parcelas,
  parcelasPagas,
  valorViagem,
  onSave
}) => {
  useEffect(() => {
    console.log("PaymentStatusModal props:", {
      registroId,
      nome,
      telefone,
      mesInicioPagamento,
      parcelas,
      parcelasPagas,
      valorViagem
    });
  }, [registroId, nome, telefone, mesInicioPagamento, parcelas, parcelasPagas, valorViagem]);

  // Calcula o valor de cada parcela
  const valorParcelaCalculado = valorViagem && parcelas ? valorViagem / parcelas : 0;
  const [installments, setInstallments] = useState([]);

  useEffect(() => {
    if (parcelas) {
      const today = new Date();
      const dateBase = mesInicioPagamento ? new Date(mesInicioPagamento) : new Date();
      const data = [];
      for (let i = 0; i < parcelas; i++) {
        if (i < parcelasPagas) {
          data.push({
            number: i + 1,
            dueDate: format(addMonths(dateBase, i), 'dd/MM/yyyy'),
            status: 'Pago'
          });
        } else {
          const dueDateObj = addMonths(dateBase, i);
          const status = dueDateObj < today ? 'Atrasado' : 'Não Pago';
          data.push({
            number: i + 1,
            dueDate: format(dueDateObj, 'dd/MM/yyyy'),
            status
          });
        }
      }
      console.log("Installments gerados:", data);
      setInstallments(data);
    }
  }, [mesInicioPagamento, parcelas, parcelasPagas]);

  const showCobra = installments.some(inst => inst.status === 'Atrasado');

  const handleStatusChange = (index, newStatus) => {
    const updated = installments.map((inst, i) =>
      i === index ? { ...inst, status: newStatus } : inst
    );
    console.log("Installments atualizados:", updated);
    setInstallments(updated);
  };

  const handleSave = () => {
    const newParcelasPagas = installments.filter(inst => inst.status === 'Pago').length;
    console.log("Registro ID que será atualizado:", registroId);
    console.log("Novo número de parcelas pagas:", newParcelasPagas);
    console.log("Corpo da requisição:", { id: registroId, parcelasPagas: newParcelasPagas });
    
    fetch('/api/Passageiros.js?action=updatePagamento', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: registroId, parcelasPagas: newParcelasPagas })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Resposta da atualização:", data);
        onSave(newParcelasPagas, installments);
        onClose();
      })
      .catch(error => {
        console.error("Erro ao atualizar pagamento:", error);
      });
  };

  const handleCobra = () => {
    const phoneWithCountry = `55${telefone}`;
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=Olá,%20verificamos%20que%20algumas%20parcelas%20estão%20atrasadas.%20Por%20favor,%20entre%20em%20contato%20para%20regularizar%20seu%20pagamento.`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{ sx: { maxWidth: '100%', position: 'relative' } }}
    >
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
              {installments.map((inst, index) => (
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
                      <MenuItem value="Pago">Pago</MenuItem>
                      <MenuItem value="Não Pago">Não Pago</MenuItem>
                      <MenuItem value="Atrasado">Atrasado</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentStatusModal;
