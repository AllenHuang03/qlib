import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Avatar,
  IconButton,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Insights,
  School,
  Notifications,
  Settings,
  PlayArrow,
  Info
} from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerDashboardProps {
  user: any;
  onStartKYC: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onStartKYC }) => {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if user is verified and has initialized portfolio
    setIsVerified(user?.kyc_status === 'approved');
    
    if (isVerified && user?.portfolio_initialized) {
      // Show existing portfolio data
      setPortfolioData({
        totalValue: 47832.50,
        cashBalance: 2450.00,
        totalReturn: 8.5,
        dayChange: 1.2,
        dayChangeValue: 580.40
      });

      setAiInsights([
        {
          type: 'opportunity',
          title: 'Banking Sector Momentum',
          description: 'CBA and WBC showing strong technical patterns. Consider 5-10% allocation.',
          confidence: 85,
          impact: 'Medium'
        },
        {
          type: 'warning',
          title: 'Tech Sector Volatility',
          description: 'Technology stocks experiencing increased volatility. Review position sizing.',
          confidence: 92,
          impact: 'High'
        },
        {
          type: 'rebalance',
          title: 'Portfolio Rebalancing',
          description: 'Your allocation has drifted from target. Suggested rebalancing available.',
          confidence: 78,
          impact: 'Medium'
        }
      ]);
    } else if (isVerified) {
      // New verified user - blank portfolio
      setPortfolioData({
        totalValue: 0,
        cashBalance: 0,
        totalReturn: 0,
        dayChange: 0,
        dayChangeValue: 0
      });

      setAiInsights([
        {
          type: 'opportunity',
          title: 'Welcome to Qlib Pro!',
          description: 'Add funds to your account to start receiving personalized AI investment insights.',
          confidence: 100,
          impact: 'High'
        }
      ]);
    }
  }, [user, isVerified]);

  const allocationData = [
    { name: 'Australian Equities', value: 45, color: '#2196f3' },
    { name: 'International Equities', value: 30, color: '#4caf50' },
    { name: 'Bonds', value: 15, color: '#ff9800' },
    { name: 'Cash', value: 10, color: '#9e9e9e' }
  ];

  const performanceData = [
    { month: 'Jul', value: 42500 },
    { month: 'Aug', value: 43200 },
    { month: 'Sep', value: 44800 },
    { month: 'Oct', value: 46200 },
    { month: 'Nov', value: 47832 }
  ];

  if (!isVerified) {
    // Check if verification is in progress vs not started
    const verificationInProgress = user?.kyc_status === 'pending' || user?.kyc_status === 'in_progress';
    
    return (
      <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
        {/* Verification Status */}
        <Alert severity={verificationInProgress ? "info" : "warning"} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {verificationInProgress ? "Verification in Progress" : "Account Verification Required"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {verificationInProgress 
              ? "Your account verification is being processed. This typically takes 12-24 hours. You'll receive an email notification once complete."
              : "Complete your identity verification to access your investment dashboard and AI-powered features."
            }
          </Typography>
          {!verificationInProgress && (
            <Button
              variant="contained"
              onClick={onStartKYC}
              startIcon={<PlayArrow />}
            >
              Start Verification Process
            </Button>
          )}
          {verificationInProgress && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary">
                Processing...
              </Typography>
            </Box>
          )}
        </Alert>

        {/* Demo Mode Features */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preview: What You'll Get After Verification
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="AI Investment Insights"
                      secondary="Personalized recommendations based on market analysis"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Automated Portfolio Management"
                      secondary="AI-driven rebalancing and optimization"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Real-time Market Data"
                      secondary="Live prices and professional-grade analytics"
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <TrendingUp sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6">
                    Professional Trading Tools
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access the same quantitative models used by institutional investors
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.portfolio_initialized ? `Welcome back, ${user?.name || 'Investor'}` : `Welcome to Qlib Pro, ${user?.name || 'Investor'}!`}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {user?.portfolio_initialized ? 'Your AI-powered investment dashboard' : 'Let\'s get your investment journey started'}
        </Typography>
      </Box>

      {/* New User Onboarding */}
      {isVerified && !user?.portfolio_initialized && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎉 Account Verified Successfully!
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your verification is complete and you're subscribed to the <strong>{user?.subscription_tier?.toUpperCase()} plan</strong>. 
            Ready to start your AI-powered investment journey?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" startIcon={<AccountBalance />}>
              Add Funds to Start Investing
            </Button>
            <Button variant="outlined" startIcon={<School />}>
              Take the Tutorial
            </Button>
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12} lg={9}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  Portfolio Overview
                </Typography>
                <Chip 
                  icon={portfolioData?.dayChange > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${portfolioData?.dayChange > 0 ? '+' : ''}${portfolioData?.dayChange}% today`}
                  color={portfolioData?.dayChange > 0 ? 'success' : 'error'}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" component="div" color="primary">
                      ${portfolioData?.totalValue?.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Portfolio Value
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={portfolioData?.dayChangeValue > 0 ? 'success.main' : 'error.main'}
                    >
                      {portfolioData?.dayChangeValue > 0 ? '+' : ''}${portfolioData?.dayChangeValue} today
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      Total Return: +{portfolioData?.totalReturn}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={portfolioData?.totalReturn} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Cash Available: ${portfolioData?.cashBalance?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Asset Allocation
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, 'Portfolio Value']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights & Actions */}
        <Grid item xs={12} lg={3}>
          {/* AI Insights */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Insights sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  AI Insights
                </Typography>
              </Box>

              {aiInsights.map((insight, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      borderLeft: 4,
                      borderLeftColor: 
                        insight.type === 'opportunity' ? 'success.main' :
                        insight.type === 'warning' ? 'warning.main' :
                        'info.main'
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {insight.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {insight.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={`${insight.confidence}% confidence`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption">
                          {insight.impact} Impact
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}

              <Button variant="outlined" fullWidth>
                View All Insights
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
                startIcon={<AccountBalance />}
              >
                Add Funds
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                startIcon={<TrendingUp />}
              >
                Rebalance Portfolio
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<School />}
              >
                Investment Education
              </Button>
            </CardContent>
          </Card>

          {/* Market News */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Headlines
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="ASX 200 gains 1.2% on banking strength"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="RBA maintains rates amid inflation concerns"
                    secondary="4 hours ago"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Tech sector volatility continues"
                    secondary="6 hours ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDashboard;