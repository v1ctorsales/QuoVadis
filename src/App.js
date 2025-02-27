import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from './components/SideBar';
import Home from './pages/Home';
import Viagens from './pages/Viagens';
import Pessoas from './pages/Pessoas';
import ViagemDetails from './components/ViagemDetails'; // importe o componente de detalhes
import ViagemOverview from './pages/ViagemOverview';
import Logout from './pages/Logout';
import { ToastContainer } from 'react-toastify';

function Layout() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar onNavigate={(page) => navigate(`/${page}`)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/viagens" element={<Viagens />} />
          <Route path="/viagem" element={<ViagemOverview />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/logout" element={<Logout />} />
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
