import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { SafeWrapper, LoadingWrapper } from './utils/safeguards';
import './utils/platformTest';
import './utils/emergencyNullProtection';
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
import PlanSelection from './pages/PlanSelection/PlanSelection';
import PaperTrading from './pages/PaperTrading/PaperTrading';
import TraderAgents from './pages/TraderAgents/TraderAgents';
import TradingEnvironment from './pages/Trading/TradingEnvironment';
import AIInsights from './pages/AIInsights/AIInsights';
import LiveTradingDashboard from './pages/enhanced/LiveTradingDashboard';
import ProfessionalTradingPage from './pages/ProfessionalTrading/ProfessionalTradingPage';
import GoogleFinancePage from './pages/GoogleFinance/GoogleFinancePage';
import FeaturesOverview from './pages/Features/FeaturesOverview';
import AboutUs from './pages/Legal/AboutUs';
import ContactUs from './pages/Legal/ContactUs';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
import FAQ from './pages/Support/FAQ';
import { useAuthStore } from './store/authStore';
import './utils/systemDiagnostics';
import NotificationProvider from './components/common/NotificationProvider';
import ModalSystem from './components/common/ModalSystem';

function App() {
  const { isAuthenticated, initializeAuth, loading } = useAuthStore();
  const location = useLocation();

  // Initialize authentication on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/landing', '/register', '/login', '/about', '/contact', '/privacy', '/terms', '/faq'];
  const isPublicRoute = location?.pathname ? publicRoutes.includes(location.pathname) : false;

  // Show loading while initializing auth to prevent flash
  if (loading) {
    return (
      <LoadingWrapper loading={true} loadingText="Initializing Qlib Trading Platform...">
        <div />
      </LoadingWrapper>
    );
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
      <ErrorBoundary>
        <SafeWrapper>
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
        </SafeWrapper>
      </ErrorBoundary>
    );
  }

  // Authenticated routes
  return (
    <ErrorBoundary>
      <SafeWrapper>
        <NotificationProvider>
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
          <Route path="/live-trading" element={<LiveTradingDashboard />} />
          <Route path="/professional-trading" element={<ProfessionalTradingPage />} />
          <Route path="/google-finance" element={<GoogleFinancePage />} />
          <Route path="/features" element={<FeaturesOverview />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Layout>
          <ModalSystem />
        </NotificationProvider>
      </SafeWrapper>
    </ErrorBoundary>
  );
}

export default App;