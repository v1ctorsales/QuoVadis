import React, { useEffect, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Modal, Button, CircularProgress, TextField } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-toastify';
import EditViagemModal from '../components/EditViagemModal';
import useViagensStore from '../store/useViagensStore';

import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';

import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

const Viagens = () => {
  const navigate = useNavigate();
  const { viagens, setViagens, removeViagem, addViagem } = useViagensStore();
  const [selectedViagem, setSelectedViagem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [viagemToDelete, setViagemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10; // Número de registros por página
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleView = (id) => {
    console.log("handleView chamado com id:", id);
    navigate(`/viagem?id=${id}`);
  };
    

  const fetchData = async (search = "", pageNumber = 1) => {
    if (search.length > 0 && search.length < 3) return;

    setLoading(true);
    try {
      let url = `/api/Viagens?action=getAll&page=${pageNumber}&limit=${limit}`;
      if (search.length >= 3) {
        url = `/api/Viagens?action=getSearch&query=${encodeURIComponent(search)}&page=${pageNumber}&limit=${limit}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const result = await response.json();
      setViagens(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Erro na requisição:", error);
      setViagens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 3) {
      setPage(1);
      fetchData(searchQuery, 1);
    } else if (searchQuery.length === 0) {
      fetchData("", page);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      fetchData("", page);
    } else {
      fetchData(searchQuery, page);
    }
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(total / limit)) return;
    setPage(newPage);
  };

  const handleAddViagem = () => {
    // Define um objeto vazio com as propriedades necessárias para uma nova viagem
    setSelectedViagem({ destino: "", dataPartida: "", dataRetorno: "", preco: "" });
    setModalOpen(true);
  };

  const handleSaveViagem = async (newViagem) => {
    try {
      const response = await fetch('/api/Viagens?action=createViagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newViagem)
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Viagem adicionada com sucesso!");

        // Se a página já estiver cheia, apenas atualiza os dados
        if (viagens.length >= limit) {
          toast.info("Viagem adicionada, mas não visível na página atual.");
          fetchData(searchQuery, page);
          return;
        }

        addViagem(result.data[0]);
      } else {
        toast.error("Erro ao adicionar viagem: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    }
  };

  const handleEdit = (id) => {
    const viagem = viagens.find(v => v.id === id);
    setSelectedViagem({ ...viagem, id: viagem.id || "" });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    const viagem = viagens.find(v => v.id === id);
    setViagemToDelete(viagem);
    setConfirmDeleteOpen(true);
  };

  const convertUTCDateToLocalDate = (dateStr) => {
    const date = new Date(dateStr);
    // Adiciona o offset do fuso horário para neutralizar a conversão automática
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date;
  };

  const confirmDelete = async () => {
    if (!viagemToDelete) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/Viagens?action=deleteViagem&id=${viagemToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        removeViagem(viagemToDelete.id);
        toast.success("Viagem excluída com sucesso!");
        fetchData(searchQuery, page);
      } else {
        toast.error("Erro ao excluir viagem: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    } finally {
      setConfirmDeleteOpen(false);
      setViagemToDelete(null);
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', textAlign: 'center', mt: 4 }}>
      <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
        Lista de Viagens
      </Typography>

      {/* Barra de pesquisa e botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Pesquisar por destino"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value.trim();
            setSearchQuery(value);

            if (searchTimeout) clearTimeout(searchTimeout);

            const timeout = setTimeout(() => {
              if (value.length >= 3) {
                fetchData(value, 1);
                setPage(1);
              } else if (value.length === 0) {
                fetchData("", 1);
                setPage(1);
              }
            }, 500);
            setSearchTimeout(timeout);
          }}
          sx={{ mr: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          sx={{ width: 230 }}
          startIcon={<Add />}
          onClick={handleAddViagem}
        >
          Nova Viagem
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
  <Table>
  <TableHead sx={{ bgcolor: "#505050" }}>
  <TableRow>
    <TableCell sx={{ color: "white", py: 1, px: 3 }}>Destino</TableCell>
    <TableCell sx={{ color: "white", py: 1, px: 3 }}>Data</TableCell>
    <TableCell sx={{ color: "white", py: 1, px: 3, textAlign: "center" }}>
      Transporte
    </TableCell>
    <TableCell sx={{ color: "white", py: 1, px: 3 }}>Hotel</TableCell>
    <TableCell sx={{ color: "white", py: 1, px: 3 }}>Ações</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {viagens.map((viagem) => (
    <TableRow key={viagem.id}>
      <TableCell sx={{ py: 1, px: 3 }}>{viagem.viagem}</TableCell>
      <TableCell sx={{ py: 1, px: 3 }}>
  {convertUTCDateToLocalDate(viagem.data_ida).toLocaleDateString('pt-BR')}
  <ArrowRightAltIcon sx={{ verticalAlign: 'middle', mx: 1 }} />
  {convertUTCDateToLocalDate(viagem.data_volta).toLocaleDateString('pt-BR')}
</TableCell>

      <TableCell sx={{ py: 1, px: 3, textAlign: "center" }}>
        {viagem.transporte === 'ônibus' ? (
          <DirectionsBusIcon />
        ) : viagem.transporte === 'avião' ? (
          <AirplanemodeActiveIcon />
        ) : (
          viagem.transporte
        )}
      </TableCell>
      <TableCell sx={{ py: 1, px: 3 }}>{viagem.hotel}</TableCell>
      <TableCell sx={{ py: 1, px: 3 }}>
  <IconButton 
    color="primary" 
    onClick={() => handleView(viagem.id)}
    sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}
  >
    <VisibilityIcon fontSize="small" />
  </IconButton>
  <IconButton 
    onClick={() => handleDelete(viagem.id)}
    sx={{ bgcolor: 'red', color: 'white', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}
  >
    <Delete fontSize="small" />
  </IconButton>
</TableCell>
    </TableRow>
  ))}
</TableBody>

  </Table>
</TableContainer>


      )}

      {/* Paginação */}
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

      {/* Modal de Edição */}
      <EditViagemModal 
        open={modalOpen} 
        handleClose={() => setModalOpen(false)} 
        viagem={selectedViagem} 
        isNew={selectedViagem?.id ? false : true}
        onSave={handleSaveViagem}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tem certeza que deseja excluir <b>{viagemToDelete?.destino}</b>?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="contained"
              sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#f0f0f0' } }}
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: 'red', color: 'white', '&:hover': { bgcolor: '#b71c1c' } }}
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : "Excluir"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Viagens;
