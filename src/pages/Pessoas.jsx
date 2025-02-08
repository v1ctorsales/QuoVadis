import React, { useState, useEffect } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const Pessoas = () => {
  const [pessoas, setPessoas] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/getPessoas.js', {
        method: 'GET',
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
  
      console.log("Status da resposta:", response.status);
      console.log("Cabeçalhos:", response.headers);
  
      const text = await response.text();
      console.log("Resposta bruta:", text);
  
      const data = JSON.parse(text);
      setPessoas(data);
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  };
  

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (id) => {
    console.log("Editar pessoa com ID:", id);
  };

  const handleDelete = (id) => {
    console.log("Excluir pessoa com ID:", id);
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', textAlign: 'center', mt: 5 }}>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Lista de Pessoas
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CPF</TableCell>
              <TableCell>RG</TableCell>
              <TableCell>Data de Nascimento</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pessoas.map((pessoa) => (
              <TableRow key={pessoa.id}>
                <TableCell>{pessoa.nome}</TableCell>
                <TableCell>{pessoa.cpf}</TableCell>
                <TableCell>{pessoa.rg}</TableCell>
                <TableCell>{new Date(pessoa.nascimento).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(pessoa.id)} sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleDelete(pessoa.id)} sx={{ bgcolor: 'secondary.main', color: 'white', borderRadius: 1, mx: 0.5, width: 32, height: 32 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Pessoas;
