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
  Box,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  LinearProgress,
  DialogContentText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentStatusModal = ({
  open,
  onClose,
  registroId,     // ID do registro na tabela pessoas_viagens
  nome,           // Nome da pessoa
  telefone,
  valorViagem,    // Valor total da viagem
  nomeViagem,     // Nome da viagem
  pagamentos,     // Array de pagamentos: [{ id, valor, data_pagamento, parcela }]
  onSave          // Função para atualizar os dados após salvar
}) => {
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({ parcela: 1, data_pagamento: '', valor: '' });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Estados para confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePaymentIndex, setDeletePaymentIndex] = useState(null);
  
  // Inicializa os pagamentos e o novo pagamento quando o modal abre
  useEffect(() => {
    setPayments(pagamentos || []);
    setNewPayment({
      parcela: (pagamentos ? pagamentos.length + 1 : 1),
      data_pagamento: '',
      valor: ''
    });
  }, [pagamentos, open]);

  const handlePaymentChange = (index, field, value) => {
    setPayments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleNewPaymentChange = (field, value) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  // Abre o modal de confirmação de exclusão
  const openDeleteConfirmation = (index) => {
    setDeletePaymentIndex(index);
    setDeleteModalOpen(true);
  };

  // Função que confirma a exclusão, com loading e notificações via toast
  const confirmDeletePayment = async () => {
    if (deletePaymentIndex === null) return;
    const payment = payments[deletePaymentIndex];
    setDeleteLoading(true);
  
    // Se o pagamento não possui ID, remove apenas do estado local
    if (!payment.id) {
      setPayments(prev =>
        prev.filter((_, i) => i !== deletePaymentIndex).map((p, idx) => ({ ...p, parcela: idx + 1 }))
      );
      toast.success("Parcela excluída com sucesso", {
        position: 'top-right',
        style: { backgroundColor: "white", color: "black" }
      });
      setDeleteModalOpen(false);
      setDeletePaymentIndex(null);
      setDeleteLoading(false);
      return;
    }
  
    try {
      const res = await fetch(`/api/Passageiros.js?action=deleteParcela&parcelaId=${payment.id}`, {
        method: 'DELETE'
      });
      const response = await res.json();
      if (res.ok) {
        setPayments(prev =>
          prev.filter((_, i) => i !== deletePaymentIndex).map((p, idx) => ({ ...p, parcela: idx + 1 }))
        );
        toast.success("Parcela excluída com sucesso", {
          position: 'top-right',
          style: { backgroundColor: "white", color: "black" }
        });
      } else {
        toast.error("Erro ao excluir parcela", {
          position: 'top-right',
          style: { backgroundColor: "white", color: "black" }
        });
        console.error("Erro ao excluir parcela:", response.error);
      }
    } catch (error) {
      console.error("Erro na requisição de exclusão:", error);
      toast.error("Erro ao excluir parcela", {
        position: 'top-right',
        style: { backgroundColor: "white", color: "black" }
      });
    } finally {
      setDeleteModalOpen(false);
      setDeletePaymentIndex(null);
      setDeleteLoading(false);
    }
  };
  
  const handleSave = () => {
    setLoading(true);
    const trimmedValor = parseFloat(newPayment.valor);
    const hasNewPayment =
      newPayment.data_pagamento &&
      !isNaN(trimmedValor) &&
      trimmedValor > 0;
    const allPayments = hasNewPayment
      ? [...payments, { ...newPayment, parcela: payments.length + 1, valor: Number(newPayment.valor) }]
      : payments;
    
    fetch('/api/Passageiros.js?action=updatePagamento', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: registroId, pagamentos: allPayments })
    })
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          onSave(result.data);
        } else {
          onSave(allPayments);
        }
        setLoading(false);
        onClose();
        toast.success("Parcela adicionada com sucesso", {
          position: 'top-right',
          style: { backgroundColor: "white", color: "black" }
        });
      })
      .catch(error => {
        console.error("Erro ao atualizar pagamentos:", error);
        setLoading(false);
      });
  };
  
  const totalViagemNum = Number(valorViagem) || 0;
  const valorPago = payments.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
  const valorFaltante = totalViagemNum - valorPago;
  const percentPaid = totalViagemNum ? Math.min(100, (valorPago / totalViagemNum) * 100) : 0;
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>Status de Pagamentos - {nome || 'Sem Nome'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1, backgroundColor: '#E3F2FD', borderRadius: 2, p: 1, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                {totalViagemNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#2196F3' }}>Total</Typography>
            </Box>
            <Box sx={{ flex: 1, backgroundColor: '#E8F5E9', borderRadius: 2, p: 1, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#4CAF50' }}>Pago</Typography>
            </Box>
            <Box sx={{ flex: 1, backgroundColor: '#FFEBEE', borderRadius: 2, p: 1, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#F44336', fontWeight: 'bold' }}>
                {valorFaltante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#F44336' }}>Falta</Typography>
            </Box>
          </Box>
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={percentPaid} />
            <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
              {percentPaid.toFixed(0)}% Pago
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Parcela</TableCell>
                <TableCell align="center">Data do Pagamento</TableCell>
                <TableCell align="center">Valor</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow key={index}>
                  <TableCell align="center">{payment.parcela}</TableCell>
                  <TableCell align="center">
                    <DatePicker
                      inputFormat="DD/MM/YYYY"
                      value={payment.data_pagamento ? dayjs(`${payment.data_pagamento}T00:00:00`) : null}
                      onChange={(newValue) => {
                        if (newValue && newValue.isValid()) {
                          const formattedDate = newValue.format('YYYY-MM-DD');
                          handlePaymentChange(index, 'data_pagamento', formattedDate);
                        } else {
                          handlePaymentChange(index, 'data_pagamento', '');
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} variant="outlined" size="small" />
                      )}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      variant="outlined"
                      size="small"
                      type="number"
                      value={payment.valor}
                      onChange={(e) => handlePaymentChange(index, 'valor', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="error" onClick={() => openDeleteConfirmation(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell align="center">{payments.length + 1}</TableCell>
                <TableCell align="center">
                  <DatePicker
                    inputFormat="DD/MM/YYYY"
                    value={newPayment.data_pagamento ? dayjs(`${newPayment.data_pagamento}T00:00:00`) : null}
                    onChange={(newValue) => {
                      if (newValue && newValue.isValid()) {
                        const formattedDate = newValue.format('YYYY-MM-DD');
                        handleNewPaymentChange('data_pagamento', formattedDate);
                      } else {
                        handleNewPaymentChange('data_pagamento', '');
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" size="small" />
                    )}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    variant="outlined"
                    size="small"
                    type="number"
                    value={newPayment.valor}
                    onChange={(e) => handleNewPaymentChange('valor', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* Sem ação para remover a linha de novo pagamento */}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={loading || deleteLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={loading || deleteLoading}>
            {loading ? <CircularProgress size={24} /> : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja realmente excluir esta parcela?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button onClick={confirmDeletePayment} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={24} /> : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PaymentStatusModal;
