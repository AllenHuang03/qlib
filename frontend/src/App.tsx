import React, { useEffect } from 'react';
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
import KYCWizard from './components/KYC/KYCWizard';
import RoleTester from './components/Testing/RoleTester';
import PlanSelection from './pages/PlanSelection/PlanSelection';
import PaperTrading from './pages/PaperTrading/PaperTrading';
import TraderAgents from './pages/TraderAgents/TraderAgents';
import TradingEnvironment from './pages/Trading/TradingEnvironment';
import DebugLayout from './pages/DebugLayout/DebugLayout';
import AIInsights from './pages/AIInsights/AIInsights';
import AboutUs from './pages/Legal/AboutUs';
import ContactUs from './pages/Legal/ContactUs';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
import FAQ from './pages/Support/FAQ';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, initializeAuth, loading } = useAuthStore();
  const location = useLocation();

  // Initialize authentication on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/landing', '/register', '/login', '/about', '/contact', '/privacy', '/terms', '/faq'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Show loading while initializing auth to prevent flash
  if (loading) {
    return <div>Loading...</div>;
  }

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
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
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
          <Route path="/kyc" element={<KYCWizard />} />
          <Route path="/plan-selection" element={<PlanSelection />} />
          <Route path="/paper-trading" element={<PaperTrading />} />
          <Route path="/trader-agents" element={<TraderAgents />} />
          <Route path="/trading-environment" element={<TradingEnvironment />} />
          <Route path="/debug-layout" element={<DebugLayout />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/role-tester" element={<RoleTester />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;