import React from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Box 
} from '@mui/material';
import { Home, Flight, Person, ExitToApp } from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = ({ onNavigate, selectedPage }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': { 
        width: drawerWidth, 
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        mt: 2,
      },
    }}
  >
    <Toolbar sx={{ justifyContent: 'center' }}>
      <Box
        component="img"
        src="/imgs/quovadislogo.png"
        alt="Logo Quovadis"
        sx={{ maxWidth: '80%', my: 2 }}
      />
    </Toolbar>
    <List sx={{ width: '100%', mt: 5 }}>
      {[
        { text: 'Início', icon: <Home />, page: 'home' },
        { text: 'Viagens', icon: <Flight />, page: 'viagens' },
        { text: 'Pessoas', icon: <Person />, page: 'pessoas' },
        { text: 'Logout', icon: <ExitToApp />, page: 'logout' },
      ].map(({ text, icon, page }) => (
        <ListItemButton
          key={text}
          onClick={() => onNavigate(page)}
          sx={{
            transition: 'transform 0.2s, background-color 0.2s',
            transform: 'scale(1)',
            // Destaque para o item selecionado:
            backgroundColor: selectedPage === page ? 'primary.main' : 'transparent',
            color: selectedPage === page ? 'white' : 'inherit',
            '&:hover': { 
              backgroundColor: selectedPage === page ? 'primary.dark' : 'rgba(0,0,0,0.08)',
              transform: 'scale(1.05)',
            },
          }}
        >
          <ListItemIcon
            sx={{ 
              minWidth: 0, 
              width: "20%",
              textAlign: "left",
              ml: 5,
              mr: 0.5, // Espaçamento reduzido
              color: selectedPage === page ? 'white' : 'inherit',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            {icon}
          </ListItemIcon>
          <ListItemText 
            primary={text} 
            sx={{
              width: "50%",
              transition: 'transform 0.2s',
              '& .MuiTypography-root': { fontWeight: 'normal' },
              '&:hover': { transform: 'scale(1.05)' }
            }} 
          />
        </ListItemButton>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;
