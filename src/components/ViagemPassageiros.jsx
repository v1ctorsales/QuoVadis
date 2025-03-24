import React, { useEffect, useState, useRef } from 'react';
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
import { addMonths } from 'date-fns';
import usePassageirosStore from '../store/usePassageiroStore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { Add, Print as PrintIcon } from '@mui/icons-material';
import AddPassageiroModal from './AddPassageiroModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ViagemPassageiros = ({ viagemId }) => {
  // Função auxiliar para formatar a data no formato local
  const formatLocalDate = (dateString) => {
    if (!dateString) return "Data não informada";
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day); // Cria a data como local
    return dateObj.toLocaleDateString('pt-BR');
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
  const limit = 10; // número de registros por página
  const [searchTimeout, setSearchTimeout] = useState(null);

  const computeStatus = (parcelas, parcelasPagas, mesInicioPagamento) => {
    if (parcelasPagas >= parcelas) return "Viagem Paga";
    const start = mesInicioPagamento ? new Date(mesInicioPagamento) : new Date();
    const today = new Date();
    let dueCount = 0;
    for (let i = 0; i < parcelas; i++) {
      const dueDate = addMonths(start, i);
      if (dueDate <= today) {
        dueCount++;
      }
    }
    return parcelasPagas >= dueCount ? "Em dia" : "Atrasado";
  };

  // Buscar detalhes da viagem
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

  // Função unificada para buscar passageiros com busca e paginação
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

  // Buscar passageiros ao montar ou quando o ID da viagem mudar
  useEffect(() => {
    if (viagemId) {
      setPage(1);
      fetchPassengers(searchQuery, 1);
    }
  }, [viagemId]);

  // Buscar novamente quando a página mudar
  useEffect(() => {
    if (viagemId) {
      fetchPassengers(searchQuery, page);
    }
  }, [page]);

  // Processar dados e atualizar a store
  useEffect(() => {
    if (!rawPassageiros) return;
    const processed = rawPassageiros.map((item) => {
      // Converte o valor de parcelas pagas para número
      const parcelasPagasNumber = Number(item.parcelas_pagas) || 0;
      let statusPagamento = computeStatus(item.parcelas, parcelasPagasNumber, item.mes_inicio_pagamento);
      const parcelasPagasDisplay = `${parcelasPagasNumber}/${item.parcelas}`;
      let isPaymentDisabled = false;
      
      if (item.pessoa && item.pessoa.nao_paga) {
        statusPagamento = "Viagem Paga";
        // Se não paga, podemos definir o display como "-"
        // e desabilitar a ação de pagamento
        isPaymentDisabled = true;
      }
      
      return {
        id: item.id,
        nome: item.pessoa?.nome || "Sem Nome",
        cpf: item.pessoa?.cpf,
        rg: item.pessoa?.rg,
        telefone: item.pessoa?.telefone || "",
        // Utiliza a função auxiliar para formatar a data corretamente
        nascimento: item.pessoa?.nascimento,
        parcelas: item.parcelas,
        parcelasPagas: parcelasPagasNumber, // valor numérico para cálculos
        parcelasPagasDisplay: item.pessoa && item.pessoa.nao_paga ? "-" : parcelasPagasDisplay, // para exibição
        mesInicioPagamento: item.mes_inicio_pagamento,
        valorViagem: valorViagem,
        statusPagamento: statusPagamento,
        isPaymentDisabled: isPaymentDisabled
      };
    });
    setPassageiros(processed, total);
  }, [rawPassageiros, valorViagem, setPassageiros, total]);

  const handleOpenModal = (passageiro) => {
    setSelectedPassageiro(passageiro);
    setModalOpen(true);
  };

  const handleSave = (newParcelasPagas) => {
    if (selectedPassageiro) {
      const updatedPassageiro = {
        ...selectedPassageiro,
        parcelasPagas: newParcelasPagas,
        statusPagamento: computeStatus(
          selectedPassageiro.parcelas,
          newParcelasPagas,
          selectedPassageiro.mesInicioPagamento
        )
      };
      updatePassageiro(updatedPassageiro);
    }
    setModalOpen(false);
  };

  // Abrir modal de exclusão
  const handleOpenDeleteModal = (passageiro) => {
    setPassageiroToDelete(passageiro);
    setDeleteModalOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (!passageiroToDelete) return;
    setDeleteLoading(true);
    fetch(`/api/Passageiros.js?action=deletePassageiro&id=${passageiroToDelete.id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        console.log("[ViagemPassageiros] Passageiro excluído:", data);
        removePassageiro(passageiroToDelete.id);
        setDeleteLoading(false);
        setDeleteModalOpen(false);
        // Após a exclusão, refaz a busca mantendo a página e query atuais
        fetchPassengers(searchQuery, page);
      })
      .catch(err => {
        console.error("[ViagemPassageiros] Erro ao excluir passageiro:", err);
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
      {/* Cabeçalho com título, busca, link de impressão e botão de adicionar */}
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
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Parcelas Pagas</TableCell>
              <TableCell sx={{ color: 'white', textAlign: 'center' }}>Status</TableCell>
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
                // Usa a função auxiliar para formatar a data de nascimento
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
                    <TableCell align="center">{passageiro.parcelasPagasDisplay}</TableCell>
                    <TableCell align="center">
                      {passageiro.statusPagamento === "Atrasado" && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
                          <ErrorOutlineIcon sx={{ mr: 1 }} /> Atrasado
                        </Box>
                      )}
                      {passageiro.statusPagamento === "Em dia" && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'green' }}>
                          <CheckCircleIcon sx={{ mr: 1 }} /> Em dia
                        </Box>
                      )}
                      {passageiro.statusPagamento === "Viagem Paga" && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                          <StarIcon sx={{ mr: 1 }} /> Viagem Paga
                        </Box>
                      )}
                    </TableCell>
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
          parcelas={selectedPassageiro.parcelas}
          parcelasPagas={selectedPassageiro.parcelasPagas}  // valor numérico
          valorViagem={selectedPassageiro.valorViagem}
          nomeViagem={nomeViagem}
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
