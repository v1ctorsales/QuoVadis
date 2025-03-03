import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Box, CircularProgress } from "@mui/material";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove o token ao acessar a página de logout
    localStorage.removeItem("token");

    // Redireciona para a página de login após 1.5 segundos
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Você saiu do sistema.
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Redirecionando para a página de login...
      </Typography>
      <CircularProgress />
    </Box>
  );
};

export default Logout;
