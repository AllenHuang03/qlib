import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Person,
  Business,
  AdminPanelSettings,
  TrendingUp,
  Security,
  AccountBalance,
  Analytics
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';

const RoleTester: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  const switchToRole = (role: 'customer' | 'trader' | 'admin', kycStatus: string = 'approved') => {
    const baseUser = {
      id: user?.id || 'demo-user-1',
      email: user?.email || 'demo@qlib.com',
      name: user?.name || 'Demo User',
      subscription_tier: 'pro',
      paper_trading: true
    };

    const roleSpecificUser = {
      ...baseUser,
      role,
      kyc_status: kycStatus,
      name: role === 'customer' ? 'Sarah Chen (Retail Investor)' :
            role === 'trader' ? 'Michael Rodriguez (Trading Agent)' :
            'Alex Kim (IT Administrator)'
    };

    updateUser(roleSpecificUser);
  };

  const testScenarios = [
    {
      role: 'customer',
      title: 'Retail Investor Experience',
      description: 'Individual investor seeking AI-powered portfolio management',
      icon: <Person sx={{ fontSize: 40, color: 'primary.main' }} />,
      features: [
        'Simplified investment dashboard',
        'AI-generated insights in plain language',
        'Paper trading simulations',
        'Educational content and tutorials'
      ],
      action: () => switchToRole('customer')
    },
    {
      role: 'trader',
      title: 'Trading Agent Experience',
      description: 'Financial expert requiring advanced quantitative tools',
      icon: <Business sx={{ fontSize: 40, color: 'secondary.main' }} />,
      features: [
        'Advanced model development environment',
        'Multi-factor algorithm creation',
        'Live execution with risk controls',
        'Professional analytics and backtesting'
      ],
      action: () => switchToRole('trader')
    },
    {
      role: 'admin',
      title: 'IT Administrator Experience',
      description: 'System administrator managing platform infrastructure',
      icon: <AdminPanelSettings sx={{ fontSize: 40, color: 'error.main' }} />,
      features: [
        'System health monitoring',
        'User management and KYC oversight',
        'Security alerts and API monitoring',
        'Platform configuration and maintenance'
      ],
      action: () => switchToRole('admin')
    }
  ];

  const unverifiedScenarios = [
    {
      title: 'New Customer (Unverified)',
      description: 'Test the KYC onboarding flow',
      action: () => switchToRole('customer', 'pending')
    },
    {
      title: 'New Trader (Unverified)',
      description: 'Test professional verification process',
      action: () => switchToRole('trader', 'pending')
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Role-Based User Experience Testing
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Role-Based Testing Mode
        </Typography>
        <Typography variant="body2">
          Switch between different user types to test the complete experience from each perspective. 
          Notice how the navigation, dashboard content, and available features change based on user role.
        </Typography>
      </Alert>

      {/* Current User Status */}
      <Card sx={{ mb: 4, backgroundColor: 'primary.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current User: {user?.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label={`Role: ${user?.role?.toUpperCase()}`} 
              color="primary" 
            />
            <Chip 
              label={`KYC: ${user?.kyc_status?.toUpperCase() || 'PENDING'}`} 
              color={user?.kyc_status === 'approved' ? 'success' : 'warning'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Experience the platform as this user type. Check the navigation menu, dashboard content, 
            and available features to understand role-based access control.
          </Typography>
        </CardContent>
      </Card>

      {/* Verified User Scenarios */}
      <Typography variant="h5" gutterBottom>
        Verified User Experiences
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {testScenarios.map((scenario) => (
          <Grid item xs={12} md={4} key={scenario.role}>
            <Card 
              sx={{ 
                height: '100%',
                border: user?.role === scenario.role ? 2 : 1,
                borderColor: user?.role === scenario.role ? 'primary.main' : 'grey.300',
                backgroundColor: user?.role === scenario.role ? 'primary.50' : 'background.paper'
              }}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {scenario.icon}
                  <Typography variant="h6" gutterBottom>
                    {scenario.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {scenario.description}
                  </Typography>
                </Box>

                <List dense sx={{ flexGrow: 1 }}>
                  {scenario.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <TrendingUp fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant={user?.role === scenario.role ? "outlined" : "contained"}
                  fullWidth
                  onClick={scenario.action}
                  disabled={user?.role === scenario.role && user?.kyc_status === 'approved'}
                  sx={{ mt: 2 }}
                >
                  {user?.role === scenario.role && user?.kyc_status === 'approved' 
                    ? 'Currently Active' 
                    : `Switch to ${scenario.role}`}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Unverified User Scenarios */}
      <Typography variant="h5" gutterBottom>
        KYC Onboarding Testing
      </Typography>
      
      <Grid container spacing={3}>
        {unverifiedScenarios.map((scenario, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {scenario.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {scenario.description}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={scenario.action}
                >
                  Test Onboarding Flow
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Testing Instructions */}
      <Card sx={{ mt: 4, backgroundColor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing Instructions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                🎯 What to Test:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Navigation Structure"
                    secondary="Notice how menu items change based on role"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Dashboard Content"
                    secondary="Different data and tools for each user type"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Feature Access"
                    secondary="Some features are role-restricted"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="KYC Flow"
                    secondary="Complete onboarding for each user type"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                🔍 Key Differences:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Customer: Simple & Guided"
                    secondary="Investment focus with AI insights"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Trader: Advanced & Technical"
                    secondary="Professional tools and model development"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Admin: System Management"
                    secondary="Platform oversight and security monitoring"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoleTester;