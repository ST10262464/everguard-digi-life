import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Assignment,
  AccountBalance,
  Security,
  LocalHospital,
  SmartToy,
  VolunteerActivism,
  Info,
} from '@mui/icons-material';
import WalletConnectButton from './WalletConnectButton';
import LanguageSelector from './LanguageSelector';

  const getNavigationItems = (t) => [
  { path: '/', label: t('nav.home'), icon: <Home /> },
  { path: '/requests', label: t('nav.requests'), icon: <Assignment /> },
  { path: '/finance', label: t('nav.finance'), icon: <AccountBalance /> },
  { path: '/gbv-support', label: t('nav.gbvSupport'), icon: <Security /> },
  { path: '/sanitary-aid', label: t('nav.sanitaryAid'), icon: <LocalHospital /> },
  { path: '/ai-assistant', label: t('nav.aiAssistant'), icon: <SmartToy /> },
  { path: '/donate', label: 'Donate', icon: <VolunteerActivism /> },
  { path: '/about', label: t('nav.about'), icon: <Info /> },
];

const NavBar = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigationItems = getNavigationItems(t);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src="/logo-full.png" alt="GirliesHub Logo" sx={{ width: 32, height: 32 }} />
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          GirliesHub
        </Typography>
      </Box>
      
      {/* Wallet Connect Button for Mobile */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <WalletConnectButton />
      </Box>
      
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={handleDrawerToggle}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box
            component={Link}
            to="/"
            sx={{
              flexGrow: isMobile ? 1 : 0,
              mr: isMobile ? 0 : 4,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Avatar src="/logo-full.png" alt="GirliesHub Logo" sx={{ width: 32, height: 32 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
              }}
            >
              GirliesHub
            </Typography>
          </Box>

          {!isMobile && (
            <>
              <Box sx={{ display: 'flex', flexGrow: 1 }}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    color="inherit"
                    sx={{
                      mx: 1,
                      backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              <LanguageSelector />
            </>
          )}

          {/* Wallet Connect Button */}
          <Box sx={{ ml: 2 }}>
            <WalletConnectButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default NavBar;
