import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  TrendingUp,
  Assessment,
  AccountBalance,
  Storage,
  Settings,
  AccountCircle,
  Logout,
  People,
  AdminPanelSettings,
  VerifiedUser,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Footer from './Footer';

const drawerWidth = 240;


interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Dynamic menu items based on user role
  const getMenuItems = () => {
    const userRole = user?.role || 'customer';
    
    if (userRole === 'admin') {
      return [
        { text: 'System Overview', icon: <Dashboard />, path: '/dashboard' },
        { text: 'User Management', icon: <People />, path: '/admin' },
        { text: 'Security', icon: <VerifiedUser />, path: '/admin' },
        { text: 'System Settings', icon: <Settings />, path: '/settings' },
      ];
    }
    
    if (userRole === 'trader') {
      return [
        { text: 'Trading Center', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Models & Algorithms', icon: <TrendingUp />, path: '/models' },
        { text: 'Advanced Backtesting', icon: <Assessment />, path: '/backtesting' },
        { text: 'Live Portfolio', icon: <AccountBalance />, path: '/portfolio' },
        { text: 'Market Data', icon: <Storage />, path: '/data' },
        { text: 'Risk Management', icon: <VerifiedUser />, path: '/risk' },
        { text: 'Settings', icon: <Settings />, path: '/settings' },
      ];
    }
    
    // Customer role (default)
    return [
      { text: 'My Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'AI Insights', icon: <TrendingUp />, path: '/insights' },
      { text: 'My Portfolio', icon: <AccountBalance />, path: '/portfolio' },
      { text: 'Paper Trading', icon: <Assessment />, path: '/backtesting' },
      { text: 'Learning Hub', icon: <People />, path: '/community' },
      { text: 'Account Settings', icon: <Settings />, path: '/settings' },
    ];
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
            Qlib Pro
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role === 'admin' ? 'System Administration Portal' :
             user?.role === 'trader' ? 'Professional Trading Platform' :
             'AI-Powered Investment Platform'}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}