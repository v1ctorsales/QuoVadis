import React, { useEffect, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Modal, Button, CircularProgress, TextField } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-toastify';
import EditPersonModal from '../components/EditPersonModal';
import usePessoasStore from '../store/usePessoasStore';

const Pessoas = () => {
  const { pessoas, setPessoas, removePessoa, addPessoa } = usePessoasStore();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10; // Número de registros por página
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchData = async (search = "", pageNumber = 1) => {
    if (search.length > 0 && search.length < 3) return;

    setLoading(true);
    try {
      let url = `/api/Pessoas?action=getAll&page=${pageNumber}&limit=${limit}`;
      
      if (search.length >= 3) {
        url = `/api/Pessoas?action=getSearch&query=${encodeURIComponent(search)}&page=${pageNumber}&limit=${limit}`;
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
      setPessoas(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Erro na requisição:", error);
      setPessoas([]);
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

  const handleAddPerson = () => {
    setSelectedPerson({ nome: "", telefone: "", cpf: "", rg: "", nascimento: "" }); // 🔥 Agora passa um objeto vazio
    setModalOpen(true);
  };
  
  

  const handleSavePerson = async (newPerson) => {
    try {
      const response = await fetch('/api/Pessoas?action=createPessoa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPerson)
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Pessoa adicionada com sucesso!");

        // Se a página já estiver cheia, não adicionamos na UI, apenas notificamos
        if (pessoas.length >= limit) {
          toast.info("Pessoa adicionada, mas não visível na página atual.");
          fetchData(searchQuery, page);
          return;
        }

        addPessoa(result.data[0]);
      } else {
        toast.error("Erro ao adicionar pessoa: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    }
  };

  const handleEdit = (id) => {
    const person = pessoas.find(p => p.id === id);
    setSelectedPerson({ ...person, id: person.id || "" }); // 🔥 Garante que o ID sempre existe
    setModalOpen(true);
  };
  

  const handleDelete = (id) => {
    const person = pessoas.find(p => p.id === id);
    setPersonToDelete(person);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/Pessoas?action=deletePessoa&id=${personToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        removePessoa(personToDelete.id);
        toast.success("Pessoa excluída com sucesso!");
        fetchData(searchQuery, page);
      } else {
        toast.error("Erro ao excluir pessoa: " + result.error);
      }
    } catch (error) {
      toast.error("Erro na requisição: " + error.message);
    } finally {
      setConfirmDeleteOpen(false);
      setPersonToDelete(null);
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', textAlign: 'center', mt: -5 }}>
      <Typography variant="h5" sx={{ mt: 0, mb: 2 }}>
        Lista de Pessoas
      </Typography>

      {/* Barra de pesquisa e botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Pesquisar por nome"
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
          onClick={handleAddPerson}
        >
          Nova Pessoa
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#505050"}}>
              <TableRow>
                <TableCell sx={{ color: "white"}}>Nome</TableCell>
                <TableCell sx={{ color: "white"}}>Telefone</TableCell>
                <TableCell sx={{ color: "white"}}>CPF</TableCell>
                <TableCell sx={{ color: "white"}}>RG</TableCell>
                <TableCell sx={{ color: "white"}}>Data de Nascimento</TableCell>
                <TableCell sx={{ color: "white"}}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pessoas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell sx={{ py: 1.5, px: 1 }}>{pessoa.nome}</TableCell>
                  <TableCell sx={{ py: 1.5, px: 1 }}>{pessoa.telefone}</TableCell>
                  <TableCell sx={{ py: 1.5, px: 1 }}>{pessoa.cpf}</TableCell>
                  <TableCell sx={{ py: 1.5, px: 1 }}>{pessoa.rg}</TableCell>
                  <TableCell sx={{ py: 1.5, px: 1 }}>{new Date(pessoa.nascimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell sx={{ py: 1.5, px: 1 }}>
                  <IconButton 
                    color="primary" 
                    onClick={() => handleEdit(pessoa.id)}
                    sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>

                  <IconButton 
                    onClick={() => handleDelete(pessoa.id)}
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
    sx={{ bgcolor: "#505050"}}
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
    sx={{ bgcolor: "#505050"}}
    disabled={page >= Math.ceil(total / limit)} 
    onClick={() => handlePageChange(page + 1)}
  >
    Próxima
  </Button>
</Box>


<EditPersonModal 
  open={modalOpen} 
  handleClose={() => setModalOpen(false)} 
  person={selectedPerson} 
  isNew={selectedPerson?.id ? false : true}  // 🔥 Agora verifica corretamente
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
      Tem certeza que deseja excluir <b>{personToDelete?.nome}</b>?
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

export default Pessoas;
