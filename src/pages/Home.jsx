import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Button,
  Link
} from '@mui/material';
import { Add, Print as PrintIcon } from '@mui/icons-material';
import usePassageirosStore from '../store/usePassageiroStore';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PaymentStatusModal from '../components/PaymentStatusModal';
import AddPassageiroModal from '../components/AddPassageiroModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Home = () => {
  const [dadosProximaViagem, setDadosProximaViagem] = useState(null);
  const [proximasViagens, setProximasViagens] = useState([]);
  const [ultimasViagens, setUltimasViagens] = useState([]);

  useEffect(() => {
    fetch('/api/Inicio.js?action=getInicio')
      .then((res) => res.json())
      .then((data) => {
        if (data.proximaViagem) {
          setDadosProximaViagem(data.proximaViagem);
          setProximasViagens(data.proximasViagens || []);
          setUltimasViagens(data.ultimasViagens || []);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar dados da próxima viagem:", err);
      });
  }, []);

  // Carrega o script do Instagram (se necessário)
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    if (
      window.instgrm &&
      window.instgrm.Embeds &&
      typeof window.instgrm.Embeds.process === "function"
    ) {
      window.instgrm.Embeds.process();
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calcDaysLeft = (dateString) => {
    const tripDate = new Date(dateString);
    const today = new Date();
    const diffTime = tripDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função original para calcular custo total (todos os passageiros)
  const calculateTotal = (valorPorPessoa, passageiros) => {
    let totalPassageiros = 0;
    if (typeof passageiros === 'string' && passageiros.includes('/')) {
      const parts = passageiros.split('/');
      totalPassageiros = Number(parts[1]);
    } else {
      totalPassageiros = Number(passageiros) || 0;
    }
    return Number(valorPorPessoa || 0) * totalPassageiros;
  };

  const custoTotal = dadosProximaViagem
    ? calculateTotal(dadosProximaViagem.custoPorPessoa, dadosProximaViagem.passageiros)
    : 0;

  // Novo cálculo: extrair total de passageiros e descontar os que não vão pagar
  const totalPassageiros = dadosProximaViagem &&
    typeof dadosProximaViagem.passageiros === 'string' &&
    dadosProximaViagem.passageiros.includes('/')
    ? Number(dadosProximaViagem.passageiros.split('/')[1])
    : Number(dadosProximaViagem?.passageiros) || 0;

  // dadosProximaViagem.nao_paga (retornado pelo backend) indica quantos não pagam
  const naoPaga = dadosProximaViagem ? Number(dadosProximaViagem.nao_paga) || 0 : 0;
  const pagantes = totalPassageiros - naoPaga;
  const arrecadacaoTotal = dadosProximaViagem ? dadosProximaViagem.preco_definido * pagantes : 0;
  const lucroTotal = arrecadacaoTotal - custoTotal;

  const handleRedirect = (id) => {
    if (id) {
      window.location.href = `/viagens`;
    }
  };

  // Torna o quadrado "Quo Vadis" um link para a conta do Instagram
  const handleQuoVadisRedirect = () => {
    window.open("https://www.instagram.com/quovadisviagens/", "_blank");

  };

  return (
    <Box sx={{ p: 2, minHeight: '80vh' }}>
      <Grid container spacing={2}>
        {/* Coluna Esquerda (8/12) */}
        <Grid item xs={12} md={8}>
          <Grid container direction="column" spacing={2}>
            {/* Box Superior - QUO VADIS */}
            <Grid item>
              <Paper
                variant="outlined"
                sx={{ p: 2, position: 'relative', minHeight: '30vh', cursor: 'pointer' }}
                onClick={handleQuoVadisRedirect}
              >
                { !dadosProximaViagem ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h2" gutterBottom>
                      Quo Vadis
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      Vamos viajar? Se você quer, você pode!
                    </Typography>
                    {/* Imagem do Quo Vadis alinhada à direita com efeito de fade */}
                    <Box
                      component="img"
                      src="/imgs/quovadisgrupo.jpg"
                      alt="Quo Vadis Grupo"
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: 'auto',
                        objectFit: 'cover',
                        WebkitMaskImage:
                          'linear-gradient(90deg, rgba(2,0,36,0) 10%, rgba(250,250,251,1) 99%, rgba(255,255,255,1) 100%)',
                        maskImage:
                          'linear-gradient(90deg, rgba(2,0,36,0) 10%, rgba(250,250,251,1) 99%, rgba(255,255,255,1) 100%)'
                      }}
                    />
                  </>
                )}
              </Paper>
            </Grid>

            {/* Box Inferior - Próxima Viagem */}
            <Grid item>
              <Paper
                variant="outlined"
                sx={{ p: 2, position: 'relative', overflow: 'hidden', cursor: 'pointer', minHeight: '20vh' }}
                onClick={() => handleRedirect(dadosProximaViagem?.id)}
              >
                { !dadosProximaViagem ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20vh' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      Próxima Viagem: {dadosProximaViagem.destino}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: 'orange', textShadow: '1px 1px 1px black' }}
                      >
                        Em {calcDaysLeft(dadosProximaViagem.data_ida)} dias
                      </Typography>
                      <Typography variant="body1" mt={4}>
                        Data: {formatDate(dadosProximaViagem.data_ida)}
                      </Typography>
                      <Typography variant="body1">
                        Passageiros: {dadosProximaViagem.passageiros}
                      </Typography>
                      <Typography variant="body1">
                        Preço por pessoa: R${dadosProximaViagem.preco_definido}
                      </Typography>
                      <Typography variant="body1" mt={4}>
                        Custo total da viagem: R${custoTotal}
                      </Typography>
                      <Typography variant="body1">
                        Faturamento esperado: R${arrecadacaoTotal}
                      </Typography>
                      <Typography variant="body1">
                        Lucro esperado: R${lucroTotal}
                      </Typography>
                    </Box>
                    {dadosProximaViagem.imageUrl && (
                      <Box
                        component="img"
                        src={dadosProximaViagem.imageUrl}
                        alt={`Viagem ${dadosProximaViagem.destino}`}
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          height: '100%',
                          width: 'auto',
                          objectFit: 'cover',
                          borderRadius: 0,
                          boxShadow: 30,
                          background: 'rgb(2,0,36)',
                          WebkitMaskImage:
                            'linear-gradient(90deg, rgba(2,0,36,0) 10%, rgba(250,250,251,1) 99%, rgba(255,255,255,1) 100%)'
                        }}
                      />
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna Direita (4/12) */}
        <Grid item xs={12} md={4}>
          <Grid container direction="column" spacing={2}>
            {/* Box Superior - Inadimplentes */}

            {/* Box do Meio - Próximas Viagens */}
            <Grid item>
              <Paper variant="outlined" sx={{ p: 2, minHeight: '15vh' }}>
                <Typography variant="h6" gutterBottom>
                  PRÓXIMAS VIAGENS
                </Typography>
                {proximasViagens.length === 0 && !dadosProximaViagem ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '10vh' }}>
                    <CircularProgress />
                  </Box>
                ) : proximasViagens.length > 0 ? (
                  proximasViagens.map((viagem) => (
                    <Box
                      key={viagem.id}
                      sx={{
                        mb: 1,
                        p: 1,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRedirect(viagem.id)}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {viagem.viagem}
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(viagem.data_ida)} - {formatDate(viagem.data_volta)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1">Nenhuma outra viagem encontrada.</Typography>
                )}
              </Paper>
            </Grid>

            {/* Box Inferior - Últimas Viagens */}
            <Grid item>
              <Paper variant="outlined" sx={{ p: 2, minHeight: '15vh' }}>
                <Typography variant="h6" gutterBottom>
                  ÚLTIMAS VIAGENS
                </Typography>
                {ultimasViagens.length === 0 && !dadosProximaViagem ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '10vh' }}>
                    <CircularProgress />
                  </Box>
                ) : ultimasViagens.length > 0 ? (
                  ultimasViagens.map((viagem) => (
                    <Box
                      key={viagem.id}
                      sx={{
                        mb: 1,
                        p: 1,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRedirect(viagem.id)}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {viagem.viagem}
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(viagem.data_ida)} - {formatDate(viagem.data_volta)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1">Nenhuma última viagem encontrada.</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
