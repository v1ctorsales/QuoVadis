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
  CircularProgress
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
  const { passageiros, setPassageiros, updatePassageiro, removePassageiro } = usePassageirosStore();

  const [rawPassageiros, setRawPassageiros] = useState(null);
  const [loadingPassageiros, setLoadingPassageiros] = useState(false); // <--- NOVO estado de loading
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPassageiro, setSelectedPassageiro] = useState(null);
  const [valorViagem, setValorViagem] = useState(0);
  const [nomeViagem, setNomeViagem] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passageiroToDelete, setPassageiroToDelete] = useState(null);

  const didFetchViagem = useRef(false);
  const didFetchPassageiros = useRef(false);

  // Recarregar passageiros do backend
  const refetchPassengers = () => {
    setLoadingPassageiros(true); // Inicia o loading antes do fetch
    fetch(`/api/Passageiros.js?action=getByViagemId&id=${viagemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setRawPassageiros(data.data);
        } else {
          setRawPassageiros([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao refetch passageiros da viagem:", error);
      })
      .finally(() => {
        setLoadingPassageiros(false); // Fim do loading
      });
  };

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
    if (didFetchViagem.current) return;
    didFetchViagem.current = true;

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

  // Buscar passageiros da viagem (uma vez)
  useEffect(() => {
    if (!viagemId) return;
    if (didFetchPassageiros.current) return;
    didFetchPassageiros.current = true;

    setLoadingPassageiros(true); // <--- Ativa o loading antes de iniciar o fetch
    fetch(`/api/Passageiros.js?action=getByViagemId&id=${viagemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setRawPassageiros(data.data);
        } else {
          setRawPassageiros([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar passageiros da viagem:", error);
      })
      .finally(() => {
        setLoadingPassageiros(false); // <--- Desativa o loading ao finalizar
      });
  }, [viagemId]);

  // Processar dados e atualizar a store
  useEffect(() => {
    if (!rawPassageiros) return;
    const processed = rawPassageiros.map((item) => ({
      id: item.id,
      nome: item.pessoa?.nome || "Sem Nome",
      cpf: item.pessoa?.cpf,
      rg: item.pessoa?.rg,
      telefone: item.pessoa?.telefone || "",
      nascimento: item.pessoa?.nascimento,
      parcelas: item.parcelas,
      parcelasPagas: item.parcelas_pagas,
      mesInicioPagamento: item.mes_inicio_pagamento,
      valorViagem: valorViagem,
      statusPagamento: computeStatus(item.parcelas, item.parcelas_pagas, item.mes_inicio_pagamento)
    }));
    setPassageiros(processed, processed.length);
  }, [rawPassageiros, valorViagem, setPassageiros]);

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
      })
      .catch(err => {
        console.error("[ViagemPassageiros] Erro ao excluir passageiro:", err);
        setDeleteLoading(false);
        setDeleteModalOpen(false);
      });
  };

  // Ao inserir um novo passageiro, refetch do backend para dados oficiais
  const handleAddNewPassageiro = () => {
    refetchPassengers();
  };

  const handleAddPassenger = () => {
    setAddModalOpen(true);
  };

  const handlePrint = () => {
    window.open(`/api/Passageiros.js?action=PrintListaPassageiros&id=${viagemId}`, '_blank');
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Cabeçalho com título, link de impressão e botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#505050' }}>
            Passageiros
          </Typography>
        </Box>
        <Link 
          component="button"
          variant="body1"
          underline="always"
          onClick={handlePrint}
          sx={{ mr: 2, color: '#505050' }}
        >
          <PrintIcon sx={{ mr: 0.5 }} /> Imprimir lista de passageiros
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
            {/* Se ainda estiver carregando passageiros, exibe um spinner */}
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
                const dataNascimento = passageiro.nascimento
                  ? new Date(passageiro.nascimento).toLocaleDateString('pt-BR')
                  : "Data não informada";
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
                    <TableCell align="center">{`${passageiro.parcelasPagas}/${passageiro.parcelas}`}</TableCell>
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

      {selectedPassageiro && (
        <PaymentStatusModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          registroId={selectedPassageiro.id}
          nome={selectedPassageiro.nome}
          telefone={selectedPassageiro.telefone}
          mesInicioPagamento={selectedPassageiro.mesInicioPagamento}
          parcelas={selectedPassageiro.parcelas}
          parcelasPagas={selectedPassageiro.parcelasPagas}
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
