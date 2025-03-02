import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const Home = () => {
  const [dadosProximaViagem, setDadosProximaViagem] = useState(null);

  useEffect(() => {
    // Buscar dados da rota /api/Inicio.js?action=getInicio
    fetch('/api/Inicio.js?action=getInicio')
      .then((res) => res.json())
      .then((data) => {
        if (data.proximaViagem) {
          setDadosProximaViagem(data.proximaViagem);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar dados da próxima viagem:", err);
      });
  }, []);

  return (
    <Box sx={{ height: '100vh', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Coluna Esquerda (8/12) */}
        <Grid item xs={8} sx={{ height: '100%' }}>
          <Grid container direction="column" spacing={2} sx={{ height: '100%' }}>
            {/* Box Superior (25% da altura) */}
            <Grid item sx={{ flex: '0 0 25%' }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  QUO VADIS vamos viajar?
                </Typography>
                <Typography variant="body1">
                  Se você quer, você pode!
                </Typography>
              </Paper>
            </Grid>
            {/* Box Inferior (75% da altura) */}
            <Grid item sx={{ flex: '0 0 75%' }}>
              <Paper 
                variant="outlined" 
                sx={{ p: 2, height: '100%', position: 'relative' }}
              >
                <Typography variant="h6" gutterBottom>
                  PRÓXIMA VIAGEM:
                </Typography>
                {dadosProximaViagem ? (
                  <>
                    <Typography variant="body1">
                      DESTINO: {dadosProximaViagem.destino}
                    </Typography>
                    <Typography variant="body1">
                      DATA: {dadosProximaViagem.data_ida} - {dadosProximaViagem.data_volta}
                    </Typography>
                    <Typography variant="body1">
                      PASSAGEIROS: {dadosProximaViagem.passageiros}
                    </Typography>
                    <Typography variant="body1">
                      CUSTO DA VIAGEM: R${dadosProximaViagem.preco_definido}
                    </Typography>
                    <Typography variant="body1">
                      VALOR ARRECADADO: R${dadosProximaViagem.valor_arrecadado}
                    </Typography>
                    <Typography variant="body1">
                      FALTA RECEBER: R${dadosProximaViagem.falta_receber}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1">
                    Carregando dados...
                  </Typography>
                )}
                {/* Exibe a imagem se houver, alinhada à direita */}
                {dadosProximaViagem && dadosProximaViagem.imageUrl && (
                  <Box
                    component="img"
                    src={dadosProximaViagem.imageUrl}
                    alt={`Viagem ${dadosProximaViagem.destino}`}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      maxWidth: '40%',
                      borderRadius: 1,
                      boxShadow: 3,
                    }}
                  />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna Direita (4/12) */}
        <Grid item xs={4} sx={{ height: '100%' }}>
          <Grid container direction="column" spacing={2} sx={{ height: '100%' }}>
            {/* Box Superior (50% da altura) */}
            <Grid item sx={{ flex: '0 0 50%' }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  LISTA DE INADIMPLENTES:
                </Typography>
                <Typography variant="body1">- Fulano</Typography>
                <Typography variant="body1">- Sicrano</Typography>
                <Typography variant="body1">- Beltrano</Typography>
              </Paper>
            </Grid>
            {/* Box do Meio (25% da altura) */}
            <Grid item sx={{ flex: '0 0 25%' }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  PRÓXIMAS VIAGENS
                </Typography>
                <Typography variant="body1">- Próxima viagem aqui...</Typography>
              </Paper>
            </Grid>
            {/* Box Inferior (25% da altura) */}
            <Grid item sx={{ flex: '0 0 25%' }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  ÚLTIMAS VIAGENS
                </Typography>
                <Typography variant="body1">- Última viagem aqui...</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
