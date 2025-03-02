import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';

const DeleteConfirmationModal = ({ open, onClose, onConfirm, pessoaNome, nomeViagem, loading }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Confirmar Remoção</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography variant="body1">
            Tem certeza que deseja remover <strong>{pessoaNome}</strong> da viagem para <strong>{nomeViagem}</strong>?
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
