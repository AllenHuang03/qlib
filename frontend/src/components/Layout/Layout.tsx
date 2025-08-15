import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
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
  VerifiedUser,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Dynamic menu items based on user role
  const getMenuItems = () => {
    const userRole = user?.role || "customer";

    if (userRole === "admin") {
      return [
        { text: "System Overview", icon: <Dashboard />, path: "/dashboard" },
        { text: "User Management", icon: <People />, path: "/admin" },
        { text: "Security", icon: <VerifiedUser />, path: "/admin" },
        { text: "System Settings", icon: <Settings />, path: "/settings" },
      ];
    }

    if (userRole === "trader") {
      return [
        { text: "Trading Center", icon: <Dashboard />, path: "/dashboard" },
        {
          text: "Trading Environment",
          icon: <Assessment />,
          path: "/trading-environment",
        },
        { text: "Trader Agents", icon: <People />, path: "/trader-agents" },
        { text: "Models", icon: <TrendingUp />, path: "/models" },
        { text: "Backtesting", icon: <Assessment />, path: "/backtesting" },
        { text: "Portfolio", icon: <AccountBalance />, path: "/portfolio" },
        { text: "Data", icon: <Storage />, path: "/data" },
        { text: "Settings", icon: <Settings />, path: "/settings" },
      ];
    }

    // Customer role (default) - simplified navigation, hide advanced features
    return [
      { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
      { text: "AI Insights", icon: <TrendingUp />, path: "/insights" },
      { text: "Portfolio", icon: <AccountBalance />, path: "/portfolio" },
      { text: "Paper Trading", icon: <Assessment />, path: "/paper-trading" },
      { text: "Learning Hub", icon: <People />, path: "/community" },
    ];
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Mobile menu drawer content
  const mobileMenuDrawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" color="primary" fontWeight="bold">
            Qlib Pro
          </Typography>
        </Box>
      </Box>
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Navigation Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 4 }}>
            <TrendingUp />
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              Qlib Pro
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
              {getMenuItems().map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor: location.pathname.startsWith(item.path)
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "flex-end",
                mr: 2,
              }}
            >
              <IconButton
                color="inherit"
                aria-label="open menu"
                onClick={handleMobileMenuToggle}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* User Profile Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              {user?.name?.charAt(0) || "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileMenuAnchor}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(profileMenuAnchor)}
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

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        {mobileMenuDrawer}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for fixed header
          backgroundColor: "background.default",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Centered Content Container */}
        <Box
          sx={{
            flexGrow: 1,
            maxWidth: "1200px", // Max width constraint
            width: "100%", // Take available width up to max
            margin: "0 auto", // Center the container
            paddingLeft: { xs: 2, sm: 3 }, // Responsive padding
            paddingRight: { xs: 2, sm: 3 }, // Responsive padding
            paddingTop: 3,
            paddingBottom: 3,
          }}
        >
          {children}
        </Box>

        {/* Full-width Footer */}
        <Footer />
      </Box>
    </Box>
  );
}
