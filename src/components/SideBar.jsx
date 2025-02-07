import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Home, Flight, Person, Settings, ExitToApp } from '@mui/icons-material';

const drawerWidth = 240; // Definindo uma largura fixa

const Sidebar = ({ onNavigate }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
    }}
  >
    <Toolbar />
    <List>
      {[
        { text: 'Home', icon: <Home />, page: 'home' },
        { text: 'Viagens', icon: <Flight />, page: 'viagens' },
        { text: 'Pessoas', icon: <Person />, page: 'pessoas' },
        { text: 'Logout', icon: <ExitToApp />, page: 'logout' },
      ].map(({ text, icon, page }) => (
        <ListItem button key={text} onClick={() => onNavigate(page)}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={text} />
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;
