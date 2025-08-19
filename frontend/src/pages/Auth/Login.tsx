import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { TrendingUp, ExpandMore, Person, Business, AdminPanelSettings, Support } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { TestAccountService, TestAccount } from '../../services/testAccountService';
import { Link as RouterLink } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const { login } = useAuthStore();

  useEffect(() => {
    setTestAccounts(TestAccountService.getAllAccounts());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please use one of the test accounts below or demo@qlib.com / demo123');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAccountLogin = async (account: TestAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    setError('');

    try {
      const success = await login(account.email, account.password);
      if (!success) {
        setError('Test account login failed.');
      }
    } catch (err) {
      setError('Test account login failed.');
    } finally {
      setLoading(false);
    }
  };

  const getAccountIcon = (userType: string) => {
    switch (userType) {
      case 'institutional':
      case 'trading_agent':
        return <Business color="primary" />;
      case 'admin':
        return <AdminPanelSettings color="error" />;
      case 'kyc_staff':
      case 'support_staff':
        return <Support color="info" />;
      default:
        return <Person color="success" />;
    }
  };

  const getAccountsByCategory = () => {
    const customers = testAccounts.filter(acc => acc.role === 'customer');
    const traders = testAccounts.filter(acc => acc.role === 'trader');
    const staff = testAccounts.filter(acc => acc.role === 'staff');
    const admins = testAccounts.filter(acc => acc.role === 'admin');
    
    return { customers, traders, staff, admins };
  };

  const { customers, traders, staff, admins } = getAccountsByCategory();

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Grid container spacing={4}>
          {/* Login Form */}
          <Grid item xs={12} md={5}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography component="h1" variant="h4" fontWeight="bold">
                  Qlib Pro
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  AI-Powered Quantitative Trading Platform
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" underline="hover">
                      Sign up
                    </Link>
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Professional quantitative trading with advanced AI models and comprehensive backtesting.
              </Typography>
            </Paper>
          </Grid>

          {/* Test Accounts Showcase */}
          <Grid item xs={12} md={7}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Test Account Matrix
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Experience different user journeys with our specialized test accounts. Each account represents a unique user type with realistic data and specific testing scenarios.
              </Typography>

              {/* Customer Accounts */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="success" />
                    <Typography variant="h6">Customer Accounts ({customers.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {customers.map((account) => (
                      <Grid item xs={12} sm={6} key={account.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { backgroundColor: 'action.hover' },
                            height: '100%'
                          }}
                          onClick={() => handleTestAccountLogin(account)}
                        >
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getAccountIcon(account.userType)}
                              <Typography variant="subtitle1" fontWeight="bold">
                                {account.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {account.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip label={account.userType.replace('_', ' ')} size="small" />
                              <Chip 
                                label={account.kycStatus} 
                                size="small" 
                                color={account.kycStatus === 'approved' ? 'success' : 'warning'} 
                              />
                            </Box>
                            <Typography variant="caption" display="block">
                              Email: {account.email}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Password: {account.password}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Trader Accounts */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business color="primary" />
                    <Typography variant="h6">Trader Accounts ({traders.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {traders.map((account) => (
                      <Grid item xs={12} key={account.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { backgroundColor: 'action.hover' } 
                          }}
                          onClick={() => handleTestAccountLogin(account)}
                        >
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getAccountIcon(account.userType)}
                              <Typography variant="subtitle1" fontWeight="bold">
                                {account.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {account.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip label={account.userType.replace('_', ' ')} size="small" />
                              <Chip label={`$${account.portfolio_value?.toLocaleString()}`} size="small" color="primary" />
                            </Box>
                            <Typography variant="caption" display="block">
                              Email: {account.email} | Password: {account.password}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Staff Accounts */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Support color="info" />
                    <Typography variant="h6">Staff Accounts ({staff.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {staff.map((account) => (
                      <Grid item xs={12} sm={6} key={account.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { backgroundColor: 'action.hover' },
                            height: '100%'
                          }}
                          onClick={() => handleTestAccountLogin(account)}
                        >
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getAccountIcon(account.userType)}
                              <Typography variant="subtitle1" fontWeight="bold">
                                {account.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {account.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip label={account.department} size="small" />
                              <Chip label={account.userType.replace('_', ' ')} size="small" />
                            </Box>
                            <Typography variant="caption" display="block">
                              Email: {account.email}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Password: {account.password}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Admin Accounts */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings color="error" />
                    <Typography variant="h6">Admin Accounts ({admins.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {admins.map((account) => (
                      <Grid item xs={12} key={account.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { backgroundColor: 'action.hover' } 
                          }}
                          onClick={() => handleTestAccountLogin(account)}
                        >
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getAccountIcon(account.userType)}
                              <Typography variant="subtitle1" fontWeight="bold">
                                {account.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {account.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip label={account.department} size="small" />
                              <Chip label="Full Access" size="small" color="error" />
                            </Box>
                            <Typography variant="caption" display="block">
                              Email: {account.email} | Password: {account.password}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="bold">
                  Testing Instructions
                </Typography>
                <Typography variant="body2">
                  Click any test account card to automatically login and experience that user's journey. 
                  Notice how navigation, dashboard content, and available features change based on user role and type.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}