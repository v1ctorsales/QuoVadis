import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from './components/SideBar';
import Home from './pages/Home';
import Viagens from './pages/Viagens';
import Pessoas from './pages/Pessoas';
import ViagemOverview from './pages/ViagemOverview';
import Logout from './pages/Logout';
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token");

  // Verifica se está na página de login
  const isLoginPage = location.pathname === "/login";

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Mostra a Sidebar apenas se NÃO estiver na página de login */}
      {isAuthenticated && !isLoginPage && <Sidebar onNavigate={(page) => navigate(`/${page}`)} />}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        {/* Se estiver logado, mantém o espaço para a Toolbar */}
        {isAuthenticated && !isLoginPage && <Toolbar />}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/logout" element={<Logout />} />

          {/* Rotas protegidas */}
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/viagens" element={<PrivateRoute><Viagens /></PrivateRoute>} />
          <Route path="/viagem" element={<PrivateRoute><ViagemOverview /></PrivateRoute>} />
          <Route path="/pessoas" element={<PrivateRoute><Pessoas /></PrivateRoute>} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <Layout />
    </Router>
  );
}

export default App;
