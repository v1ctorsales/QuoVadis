import React, { useState, useEffect, useRef } from 'react';
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
import html2canvas from 'html2canvas';

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
  
  // Ref para o comprovante
  const receiptRef = useRef(null);

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
        toast.success("Parcelas salvas com sucesso", {
          position: 'top-right',
          style: { backgroundColor: "white", color: "black" }
        });
      })
      .catch(error => {
        console.error("Erro ao atualizar pagamentos:", error);
        setLoading(false);
      });
  };

  // Função para gerar o comprovante como imagem
  const generateReceipt = async () => {
    // Calcula os valores para o resumo
    const valorPago = payments.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
    const totalViagemNum = Number(valorViagem) || 0;
    const valorFaltante = totalViagemNum - valorPago;
  
    // Define as dimensões do recibo
    const width = 600;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
  
    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  
    // Carregar e desenhar o logo do QuoVadis
    const logoImg = new Image();
    logoImg.src = '/imgs/quovadislogo.png'; // Caminho relativo à pasta public
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });
    const logoWidth = 200;
    const logoHeight = 60;
    // Centraliza o logo horizontalmente
    ctx.drawImage(logoImg, (width - logoWidth) / 2, 10, logoWidth, logoHeight);
  
    // Cabeçalho do Recibo
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Recibo de Pagamento', width / 2, 110);
  
    // Informações do Cliente e Viagem
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Nome: ${nome}`, 20, 150);
    ctx.fillText(`Telefone: ${telefone}`, 20, 170);
    ctx.fillText(
      `Valor Total: ${totalViagemNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      20,
      190
    );
  
    // Título da Tabela de Pagamentos
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Parcelas Pagas:', 20, 230);
  
    // Cabeçalho da tabela
    ctx.font = 'bold 16px Arial';
    const startY = 260;
    ctx.fillText('Parcela', 20, startY);
    ctx.fillText('Data', 150, startY);
    ctx.fillText('Valor', 300, startY);
  
    // Conteúdo da tabela
    ctx.font = '16px Arial';
    let y = startY + 30;
    payments.forEach((payment) => {
      ctx.fillText(payment.parcela.toString(), 20, y);
      // Converte data do formato YYYY-MM-DD para dd/mm/aaaa
      const parts = payment.data_pagamento ? payment.data_pagamento.split('-') : [];
      const dataFormatada = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '-';
      ctx.fillText(dataFormatada, 150, y);
      const valorFormatado = Number(payment.valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      ctx.fillText(valorFormatado, 300, y);
      y += 30;
    });
  
    // Resumo
    y += 20;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Valor Pago: ${valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, y);
    y += 25;
    ctx.fillText(`Valor Faltante: ${valorFaltante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, y);
  
    // Marca d'água para evitar fraudes
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.font = '60px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText('COMPROVANTE OFICIAL', 0, 0);
    ctx.restore();
  
    // Rodapé: "QuoVadis viagens" seguido da data e hora de emissão
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    // Usa dayjs para formatar a data atual no padrão dd/mm/aaaa HH:mm
    const now = dayjs().format('DD/MM/YYYY HH:mm');
    const footerText = `QuoVadis Viagens - Emitido em: ${now}`;
    ctx.textAlign = 'center';
    ctx.fillText(footerText, width / 2, height - 30);
  
    // Converte o canvas para data URL e força o download
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'comprovante.png';
    link.click();
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
          {/* Área de comprovante que será capturada */}
          <Box ref={receiptRef}>
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
            {/* Tabela de pagamentos */}
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
          </Box>
        </DialogContent>
        <DialogActions>
  <Button onClick={generateReceipt} variant="outlined" color="primary" disabled={loading || deleteLoading}>
    Gerar Comprovante
  </Button>
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
