import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Models from './pages/Models/Models';
import Backtesting from './pages/Backtesting/Backtesting';
import Portfolio from './pages/Portfolio/Portfolio';
import DataManagement from './pages/DataManagement/DataManagement';
import Settings from './pages/Settings/Settings';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Landing from './pages/Landing/Landing';
import Community from './pages/Community/Community';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Upgrade from './pages/Upgrade/Upgrade';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/landing', '/register', '/login'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Show landing page for root path if not authenticated
  if (!isAuthenticated && location.pathname === '/') {
    return <Landing />;
  }

  // Show login for protected routes if not authenticated
  if (!isAuthenticated && !isPublicRoute) {
    return <Login />;
  }

  // Public routes
  if (isPublicRoute && !isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Authenticated routes
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/landing" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/models/*" element={<Models />} />
          <Route path="/community" element={<Community />} />
          <Route path="/backtesting/*" element={<Backtesting />} />
          <Route path="/portfolio/*" element={<Portfolio />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;