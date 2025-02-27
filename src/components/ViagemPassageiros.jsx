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
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PaymentStatusModal from './PaymentStatusModal';

const ViagemPassageiros = ({ viagemId }) => {
  const [passageiros, setPassageiros] = useState([]);
  const [rawPassageiros, setRawPassageiros] = useState(null); // Armazena os dados brutos da API
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPassageiro, setSelectedPassageiro] = useState(null);
  const [valorViagem, setValorViagem] = useState(0);

  // Refs para garantir que os fetchs ocorram apenas uma vez
  const didFetchViagem = useRef(false);
  const didFetchPassageiros = useRef(false);

  // 1. Buscar os detalhes da viagem para obter o valor total (preco_definido)
  useEffect(() => {
    if (!viagemId) return;
    if (didFetchViagem.current) return;
    didFetchViagem.current = true;

    fetch(`/api/Viagens.js?action=getById&id=${viagemId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dados da viagem:", data);
        if (data.data && data.data[0]) {
          // Use o campo preco_definido
          setValorViagem(data.data[0].preco_definido || 0);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar dados da viagem:", error);
      });
  }, [viagemId]);

  // 2. Buscar os passageiros da viagem (executa apenas uma vez)
  useEffect(() => {
    if (!viagemId) return;
    if (didFetchPassageiros.current) return;
    didFetchPassageiros.current = true;

    fetch(`/api/Passageiros.js?action=getByViagemId&id=${viagemId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dados recebidos da API (passageiros):", data);
        if (data.data) {
          setRawPassageiros(data.data);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar passageiros da viagem:", error);
      });
  }, [viagemId]);

  // 3. Achatar os dados e incluir o valorViagem (sempre que rawPassageiros ou valorViagem mudar)
  useEffect(() => {
    if (!rawPassageiros) return;
    const flattened = rawPassageiros.map((item) => {
      console.log("Item recebido (flatten):", item);
      return {
        registroId: item.id, // ID do registro na tabela pessoas_viagens
        nome: item.pessoa?.nome || "Sem Nome",
        cpf: item.pessoa?.cpf,
        rg: item.pessoa?.rg,
        telefone: item.pessoa?.telefone || "",
        nascimento: item.pessoa?.nascimento,
        parcelas: item.parcelas,
        parcelasPagas: item.parcelas_pagas,
        mesInicioPagamento: item.mes_inicio_pagamento,
        valorViagem: valorViagem  // Atualizado com o valor da viagem
      };
    });
    console.log("Dados processados (flattened):", flattened);
    setPassageiros(flattened);
  }, [rawPassageiros, valorViagem]);

  const handleOpenModal = (passageiro) => {
    console.log("Abrindo modal para passageiro:", passageiro);
    setSelectedPassageiro(passageiro);
    setModalOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Viagem Passageiros
      </Typography>
      {viagemId && (
        <Typography variant="body1" gutterBottom>
          Visualizando dados da viagem com ID: {viagemId}
        </Typography>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CPF</TableCell>
              <TableCell>RG</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Nascimento</TableCell>
              <TableCell>Status do Pagamento</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {passageiros.map((passageiro) => (
              <TableRow key={passageiro.registroId}>
                <TableCell>{passageiro.nome}</TableCell>
                <TableCell>{passageiro.cpf}</TableCell>
                <TableCell>{passageiro.rg}</TableCell>
                <TableCell>{passageiro.telefone}</TableCell>
                <TableCell>
                  {new Date(passageiro.nascimento).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>{`${passageiro.parcelasPagas}/${passageiro.parcelas} parcelas pagas`}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    aria-label="editar"
                    onClick={() => handleOpenModal(passageiro)}
                  >
                    <MonetizationOnIcon />
                  </IconButton>
                  <IconButton sx={{ color: 'red', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}>
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {passageiros.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum passageiro encontrado para esta viagem.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedPassageiro && (
        <PaymentStatusModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          registroId={selectedPassageiro.registroId}
          nome={selectedPassageiro.nome}
          telefone={selectedPassageiro.telefone}
          mesInicioPagamento={selectedPassageiro.mesInicioPagamento}
          parcelas={selectedPassageiro.parcelas}
          parcelasPagas={selectedPassageiro.parcelasPagas}
          valorViagem={selectedPassageiro.valorViagem}
          onSave={(newParcelasPagas, updatedParcelas) => {
            console.log("Novos dados salvos:", newParcelasPagas, updatedParcelas);
            // Aqui você pode atualizar o backend se necessário.
            setModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default ViagemPassageiros;
