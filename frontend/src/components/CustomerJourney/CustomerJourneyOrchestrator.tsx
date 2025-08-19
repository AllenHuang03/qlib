import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Fade,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import NewCustomerOnboarding from './NewCustomerOnboarding';
import VerifiedCustomerFlow from './VerifiedCustomerFlow';
import PremiumCustomerFlow from './PremiumCustomerFlow';
import InstitutionalClientFlow from './InstitutionalClientFlow';
import KYCWizard from '../KYC/KYCWizard';

interface CustomerJourneyOrchestratorProps {
  onJourneyComplete?: (journeyType: string) => void;
}

const CustomerJourneyOrchestrator: React.FC<CustomerJourneyOrchestratorProps> = ({ 
  onJourneyComplete 
}) => {
  const { user, isAuthenticated, isTestAccount } = useAuthStore();
  const [showKYC, setShowKYC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [journeyType, setJourneyType] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(false);
      
      // Determine journey type based on user type and status
      if (user.userType === 'retail_customer' && user.kyc_status === 'not_started') {
        setJourneyType('new_customer');
      } else if (user.userType === 'retail_customer' && user.kyc_status === 'approved') {
        setJourneyType('verified_customer');
      } else if (user.userType === 'premium_customer') {
        setJourneyType('premium_customer');
      } else if (user.userType === 'institutional') {
        setJourneyType('institutional_client');
      } else {
        setJourneyType('default');
      }
    }
  }, [isAuthenticated, user]);

  const handleStartKYC = () => {
    setShowKYC(true);
  };

  const handleKYCComplete = () => {
    setShowKYC(false);
    // Update user status and refresh journey
    if (onJourneyComplete) {
      onJourneyComplete('kyc_complete');
    }
  };

  const getJourneyTitle = () => {
    switch (journeyType) {
      case 'new_customer':
        return 'New Customer Onboarding';
      case 'verified_customer':
        return 'Portfolio Setup & Configuration';
      case 'premium_customer':
        return 'Premium Features & Advanced Tools';
      case 'institutional_client':
        return 'Enterprise Portfolio Management';
      default:
        return 'Customer Dashboard';
    }
  };

  const getJourneyDescription = () => {
    switch (journeyType) {
      case 'new_customer':
        return 'Complete your account setup and identity verification to start trading';
      case 'verified_customer':
        return 'Import your portfolio, configure investment preferences, and fund your account';
      case 'premium_customer':
        return 'Access advanced AI tools, custom strategies, and premium analytics';
      case 'institutional_client':
        return 'Enterprise-grade portfolio management with compliance tools and API access';
      default:
        return 'Manage your investments with AI-powered insights';
    }
  };

  if (isLoading) {
    return (
      <Backdrop open={true}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="primary" size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Alert severity="error">
        Please log in to access your dashboard.
      </Alert>
    );
  }

  // Show KYC Modal if active
  if (showKYC) {
    return (
      <Box>
        <KYCWizard />
      </Box>
    );
  }

  return (
    <Box>
      {/* Journey Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {getJourneyTitle()}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {getJourneyDescription()}
              </Typography>
            </Box>
            {isTestAccount && (
              <Alert severity="info" sx={{ ml: 2 }}>
                <Typography variant="body2">
                  <strong>Test Account:</strong> {user.email}
                </Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Journey-specific Components */}
      <Fade in={true} timeout={500}>
        <Box>
          {journeyType === 'new_customer' && (
            <NewCustomerOnboarding 
              user={user} 
              onStartKYC={handleStartKYC}
            />
          )}
          
          {journeyType === 'verified_customer' && (
            <VerifiedCustomerFlow 
              user={user}
            />
          )}
          
          {journeyType === 'premium_customer' && (
            <PremiumCustomerFlow 
              user={user}
            />
          )}
          
          {journeyType === 'institutional_client' && (
            <InstitutionalClientFlow 
              user={user}
            />
          )}
          
          {journeyType === 'default' && (
            <Alert severity="info">
              <Typography variant="body1">
                Welcome! Your account type: <strong>{user.userType}</strong>
              </Typography>
              <Typography variant="body2">
                Status: {user.kyc_status} • Subscription: {user.subscription_tier}
              </Typography>
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Journey Analytics (for test accounts) */}
      {isTestAccount && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Scenario Information
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Account Type:</strong> {user.userType}<br />
              <strong>KYC Status:</strong> {user.kyc_status}<br />
              <strong>Subscription:</strong> {user.subscription_tier}<br />
              <strong>Portfolio Value:</strong> ${user.portfolio_value?.toLocaleString() || '0'}<br />
              <strong>Test Scenarios:</strong>
            </Typography>
            {user.test_scenarios && (
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {user.test_scenarios.map((scenario: string, index: number) => (
                  <Typography component="li" variant="body2" key={index}>
                    {scenario}
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CustomerJourneyOrchestrator;