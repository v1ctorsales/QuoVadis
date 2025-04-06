import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Link,
  CircularProgress,
  TextField
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PaymentStatusModal from './PaymentStatusModal';
import usePassageirosStore from '../store/usePassageiroStore';
import { Add, Print as PrintIcon } from '@mui/icons-material';
import AddPassageiroModal from './AddPassageiroModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ViagemPassageiros = ({ viagemId }) => {
  // Função para formatar datas
  const formatLocalDate = (dateString) => {
    if (!dateString) return "Data não informada";
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('pt-BR');
  };

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const { passageiros, setPassageiros, updatePassageiro, removePassageiro } = usePassageirosStore();
  const [rawPassageiros, setRawPassageiros] = useState(null);
  const [loadingPassageiros, setLoadingPassageiros] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPassageiro, setSelectedPassageiro] = useState(null);
  const [valorViagem, setValorViagem] = useState(0);
  const [nomeViagem, setNomeViagem] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passageiroToDelete, setPassageiroToDelete] = useState(null);

  // Estados para busca e paginação
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Buscar detalhes da viagem (ex: preco_definido)
  useEffect(() => {
    if (!viagemId) return;
    fetch(`/api/Viagens.js?action=getById&id=${viagemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data[0]) {
          const viagemData = data.data[0];
          setValorViagem(viagemData.preco_definido || 0);
          setNomeViagem(viagemData.viagem || "");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar dados da viagem:", error);
      });
  }, [viagemId]);

  // Função para buscar passageiros com paginação e busca
  const fetchPassengers = async (query = "", pageNumber = 1) => {
    setLoadingPassageiros(true);
    let url = "";
    if (query.length >= 3) {
      url = `/api/Passageiros.js?action=getSearch&query=${encodeURIComponent(query)}&viagemId=${viagemId}&page=${pageNumber}&limit=${limit}`;
    } else {
      url = `/api/Passageiros.js?action=getByViagemId&id=${viagemId}&page=${pageNumber}&limit=${limit}`;
    }
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result.data) {
        setRawPassageiros(result.data);
        setTotal(result.total || result.data.length);
      } else {
        setRawPassageiros([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Erro ao buscar passageiros:", error);
    } finally {
      setLoadingPassageiros(false);
    }
  };

  useEffect(() => {
    if (viagemId) {
      setPage(1);
      fetchPassengers(searchQuery, 1);
    }
  }, [viagemId]);

  useEffect(() => {
    if (viagemId) {
      fetchPassengers(searchQuery, page);
    }
  }, [page]);

  // Processar dados para a store, calculando "valor pago" e "valor faltante"
  useEffect(() => {
    if (!rawPassageiros) return;
    const processed = rawPassageiros.map((item) => {
      // Converte cada pagamento garantindo que vírgulas sejam substituídas por pontos
      const valorPago = item.pagamentos
        ? item.pagamentos.reduce((acc, pag) => {
            const valorConvertido = parseFloat(String(pag.valor).replace(',', '.')) || 0;
            return acc + valorConvertido;
          }, 0)
        : 0;
        
      // Garante que o valor total da viagem seja numérico
      const totalViagem = parseFloat(String(valorViagem).replace(',', '.')) || 0;
      const valorFaltante = totalViagem - valorPago;
      
      return {
        id: item.id,
        nome: item.pessoa?.nome || "Sem Nome",
        cpf: item.pessoa?.cpf,
        rg: item.pessoa?.rg,
        telefone: item.pessoa?.telefone || "",
        nascimento: item.pessoa?.nascimento,
        mesInicioPagamento: item.mes_inicio_pagamento,
        valorViagem: totalViagem,
        valorPago: valorPago,
        pagamentos: item.pagamentos,
        valorFaltante: valorFaltante,
        isPaymentDisabled: item.pessoa && item.pessoa.nao_paga
      };
    });
    setPassageiros(processed, total);
  }, [rawPassageiros, valorViagem, setPassageiros, total]);
  

  const handleOpenModal = (passageiro) => {
    setSelectedPassageiro(passageiro);
    setModalOpen(true);
  };

  const handleSave = (updatedPayments) => {
    if (selectedPassageiro) {
      const updatedValorPago = updatedPayments.reduce((acc, payment) => {
        return acc + Number(payment.valor);
      }, 0);
      const updatedPassageiro = {
        ...selectedPassageiro,
        valorPago: updatedValorPago,
        valorFaltante: Number(selectedPassageiro.valorViagem) - updatedValorPago,
        pagamentos: updatedPayments
      };
      updatePassageiro(updatedPassageiro);
    }
    setModalOpen(false);
  };
  

  const handleOpenDeleteModal = (passageiro) => {
    setPassageiroToDelete(passageiro);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!passageiroToDelete) return;
    setDeleteLoading(true);
    fetch(`/api/Passageiros.js?action=deletePassageiro&id=${passageiroToDelete.id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        removePassageiro(passageiroToDelete.id);
        setDeleteLoading(false);
        setDeleteModalOpen(false);
        fetchPassengers(searchQuery, page);
      })
      .catch(err => {
        console.error("Erro ao excluir passageiro:", err);
        setDeleteLoading(false);
        setDeleteModalOpen(false);
      });
  };

  const handleAddNewPassageiro = () => {
    fetchPassengers(searchQuery, page);
  };

  const handleAddPassenger = () => {
    setAddModalOpen(true);
  };

  const handlePrint = () => {
    window.open(`/api/Passageiros.js?action=PrintListaPassageiros&id=${viagemId}`, '_blank');
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(total / limit)) return;
    setPage(newPage);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Cabeçalho com busca, impressão e botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1, mr: 2, mb: { xs: 1, sm: 0 } }}>
          <TextField
            label="Pesquisar por nome do passageiro"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value.trim();
              setSearchQuery(value);
              if (searchTimeout) clearTimeout(searchTimeout);
              const timeout = setTimeout(() => {
                setPage(1);
                fetchPassengers(value, 1);
              }, 500);
              setSearchTimeout(timeout);
            }}
          />
        </Box>
        <Link 
          component="button"
          variant="body1"
          underline="always"
          onClick={handlePrint}
          sx={{ mr: 2, color: '#505050' }}
        >
          <PrintIcon sx={{ mr: 0.5 }} />
        </Link>
        <Button variant="contained" color="primary" onClick={handleAddPassenger}>
          <Add sx={{ mr: 1 }} /> Adicionar Passageiro
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#505050' }}>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Nome</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>CPF</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>RG</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Telefone</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Nascimento</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Valor Pago</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Valor Faltante</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingPassageiros ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : passageiros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum passageiro encontrado para esta viagem.
                </TableCell>
              </TableRow>
            ) : (
              passageiros.map((passageiro) => {
                const dataNascimento = formatLocalDate(passageiro.nascimento);
                const cpfValido = passageiro.cpf || "CPF não informado";
                const rgValido = passageiro.rg || "RG não informado";
                const telefoneValido = passageiro.telefone || "Telefone não informado";
                return (
                  <TableRow key={passageiro.id}>
                    <TableCell align="center">{passageiro.nome}</TableCell>
                    <TableCell align="center">{cpfValido}</TableCell>
                    <TableCell align="center">{rgValido}</TableCell>
                    <TableCell align="center">{telefoneValido}</TableCell>
                    <TableCell align="center">{dataNascimento}</TableCell>
                    <TableCell align="center">{formatCurrency(passageiro.valorPago)}</TableCell>
                    <TableCell align="center">{formatCurrency(passageiro.valorFaltante)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        aria-label="editar"
                        onClick={() => handleOpenModal(passageiro)}
                        disabled={passageiro.isPaymentDisabled}
                      >
                        <MonetizationOnIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        aria-label="excluir"
                        onClick={() => handleOpenDeleteModal(passageiro)}
                        sx={{ borderRadius: 1, mx: 0.5, width: 32, height: 32 }}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {!loadingPassageiros && passageiros.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: "#505050" }}
            disabled={page === 1} 
            onClick={() => handlePageChange(page - 1)}
          >
            Anterior
          </Button>
          <Typography sx={{ mx: 2 }}>
            Página {page} de {Math.ceil(total / limit)}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ bgcolor: "#505050" }}
            disabled={page >= Math.ceil(total / limit)} 
            onClick={() => handlePageChange(page + 1)}
          >
            Próxima
          </Button>
        </Box>
      )}

      {selectedPassageiro && (
        <PaymentStatusModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          registroId={selectedPassageiro.id}
          nome={selectedPassageiro.nome}
          telefone={selectedPassageiro.telefone}
          mesInicioPagamento={selectedPassageiro.mesInicioPagamento}
          valorViagem={selectedPassageiro.valorViagem}
          pagamentos={selectedPassageiro.pagamentos}
          onSave={handleSave}
        />
      )}

      <AddPassageiroModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddNewPassageiro}
        viagemId={viagemId}
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        pessoaNome={passageiroToDelete ? passageiroToDelete.nome : ""}
        nomeViagem={nomeViagem}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default ViagemPassageiros;
