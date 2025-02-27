import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ViagemPassageiros from '../components/ViagemPassageiros';
import ViagemDetails from '../components/ViagemDetails';

const ViagemOverview = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  console.log("ViagemOverview id:", id); // Verifique se o id é capturado
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box>
      <Tabs 
        value={selectedTab} 
        onChange={handleTabChange} 
        aria-label="Visão geral da viagem"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Passageiros" />
        <Tab label="Detalhes" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {selectedTab === 0 && <ViagemPassageiros viagemId={id} />}
        {selectedTab === 1 && <ViagemDetails viagemId={id} />}
      </Box>
    </Box>
  );
};

export default ViagemOverview;
