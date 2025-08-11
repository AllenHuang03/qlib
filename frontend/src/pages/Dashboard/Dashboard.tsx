import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Alert,
  Avatar,
  LinearProgress,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AutoAwesome,
  AccountBalance,
  Refresh,
  PlayArrow,
  Notifications,
  Star,
  Security,
  SwapHoriz,
  Psychology,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';
import AIInsightsModal from '../../components/AIInsights/AIInsightsModal';
import { aiAPI } from '../../services/api';

const mockPerformanceData = [
  { date: 'Jan', portfolio: 100000, benchmark: 100000, month: 'January' },
  { date: 'Feb', portfolio: 102340, benchmark: 101200, month: 'February' },
  { date: 'Mar', portfolio: 107890, benchmark: 103800, month: 'March' },
  { date: 'Apr', portfolio: 111670, benchmark: 102100, month: 'April' },
  { date: 'May', portfolio: 115450, benchmark: 105600, month: 'May' },
  { date: 'Jun', portfolio: 118200, benchmark: 107200, month: 'June' },
  { date: 'Jul', portfolio: 122340, benchmark: 108900, month: 'July' },
];

// Real AI opportunities will be loaded from API
const defaultOpportunities = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    signal: 'BUY',
    confidence: 92,
    price: '$229.35',
    change: '+4.24%',
    reason: 'Loading real market data...',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    signal: 'BUY', 
    confidence: 89,
    price: '$337.20',
    change: '+1.8%',
    reason: 'Loading real market data...',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    signal: 'HOLD',
    confidence: 76,
    price: '$134.80',
    change: '-0.5%',
    reason: 'Loading real market data...',
  },
];

export default function Dashboard() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPaperMode, setIsPaperMode] = useState(true);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [aiOpportunities, setAiOpportunities] = useState(defaultOpportunities);
  const [loadingSignals, setLoadingSignals] = useState(false);
  
  // Check if user came from registration (paper mode)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    if (mode === 'paper') {
      setIsPaperMode(true);
    }
  }, [location]);

  // Load real AI signals
  useEffect(() => {
    const loadAISignals = async () => {
      setLoadingSignals(true);
      try {
        const signals = await aiAPI.getSignals("AAPL,MSFT,GOOGL");
        
        // Convert API signals to dashboard format
        const opportunities = signals.map((signal: any) => ({
          symbol: signal.symbol,
          name: getCompanyName(signal.symbol),
          signal: signal.signal,
          confidence: Math.round(signal.confidence * 100),
          price: `$${signal.target_price || 'N/A'}`,
          change: '+0.00%', // Will be updated with real quote data
          reason: signal.reasoning,
        }));
        
        setAiOpportunities(opportunities);
      } catch (error) {
        console.error('Failed to load AI signals:', error);
        // Keep default data if API fails
      } finally {
        setLoadingSignals(false);
      }
    };

    loadAISignals();
  }, []);

  // Helper function to get company names
  const getCompanyName = (symbol: string) => {
    const names: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
    };
    return names[symbol] || symbol;
  };

  const portfolioValue = isPaperMode ? 122340 : 45230;
  const totalGain = isPaperMode ? 22340 : 5230;
  const percentGain = ((totalGain / (portfolioValue - totalGain)) * 100);
  const monthlyGain = isPaperMode ? 4890 : 1840;

  const aiModels = [
    {
      id: 1,
      name: 'AI Stock Picker #1',
      description: 'Conservative Growth Strategy',
      status: 'active',
      monthlyReturn: '+$2,340',
      confidence: 94,
      trades: 12,
    },
    {
      id: 2,
      name: 'AI Value Hunter',
      description: 'Undervalued Stock Finder', 
      status: 'active',
      monthlyReturn: '+$1,890',
      confidence: 87,
      trades: 8,
    },
  ];

  const handleSwitchToReal = () => {
    setIsPaperMode(false);
    // Show upgrade modal or redirect to funding
  };

  const handleViewOpportunity = (symbol: string) => {
    const opportunity = aiOpportunities.find(opp => opp.symbol === symbol);
    if (opportunity) {
      setSelectedStock(opportunity);
      setAiInsightsOpen(true);
    }
  };

  return (
    <Box>
      {/* Paper Trading Banner */}
      {isPaperMode && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            bgcolor: alpha('#2196F3', 0.1),
            border: `1px solid ${alpha('#2196F3', 0.3)}`,
          }}
          action={
            <Button 
              color="primary" 
              variant="contained" 
              size="small"
              onClick={handleSwitchToReal}
              sx={{ fontWeight: 600 }}
            >
              Switch to Real Money
            </Button>
          }
          icon={<Security sx={{ color: '#2196F3' }} />}
        >
          <Typography variant="body1" fontWeight={600}>
            🎯 Risk-Free Mode Active • Virtual Portfolio: $100,000 Starting Balance
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {isPaperMode ? 'Paper Trading Portfolio' : 'Your Portfolio'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isPaperMode ? 'Practice with virtual money • Learn risk-free' : 'Real money investing'}
          </Typography>
        </Box>
        <IconButton color="primary" onClick={() => window.location.reload()}>
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Portfolio Value
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    ${portfolioValue.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    <Typography variant="h6" fontWeight={600}>
                      +${totalGain.toLocaleString()} (+{percentGain.toFixed(1)}%)
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={isPaperMode ? 'Paper Trading' : 'Real Money'} 
                  sx={{ 
                    bgcolor: alpha('#fff', 0.2), 
                    color: 'white',
                    fontWeight: 600,
                  }} 
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      This Month
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      +${monthlyGain.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Active AIs
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      2 Models
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Success Rate
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      87%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Trades Today
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      3 New
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Portfolio Growth
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your AI is beating the market by {(percentGain - 8.9).toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Chip label="7 Months" size="small" sx={{ mr: 1, bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }} />
                  <Chip label="All Time" variant="outlined" size="small" />
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelFormatter={(label) => mockPerformanceData.find(d => d.date === label)?.month}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#4CAF50"
                    strokeWidth={4}
                    name="Your Portfolio"
                    dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#FF9800"
                    strokeWidth={2}
                    strokeDasharray="8 8"
                    name="Market Average"
                    dot={{ fill: '#FF9800', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Opportunities */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesome sx={{ color: '#4CAF50', mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  AI Found 3 Opportunities
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fresh picks from your AI models today
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aiOpportunities.map((opportunity, index) => (
                  <Card 
                    key={opportunity.symbol} 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', width: 32, height: 32, mr: 1 }}>
                            {opportunity.symbol[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {opportunity.symbol}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {opportunity.name}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={opportunity.signal}
                          color={opportunity.signal === 'BUY' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {opportunity.price}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: opportunity.change.startsWith('+') ? '#4CAF50' : '#F44336',
                            fontWeight: 600,
                          }}
                        >
                          {opportunity.change}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {opportunity.reason}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ color: '#FFD700', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {opportunity.confidence}% confidence
                          </Typography>
                        </Box>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleViewOpportunity(opportunity.symbol)}
                          sx={{ fontSize: '0.75rem' }}
                          startIcon={<Psychology sx={{ fontSize: '16px !important' }} />}
                        >
                          Why?
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Models Performance */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Your AI Models Performance
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aiModels.map((model, index) => (
                  <Card key={model.id} variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                            <AutoAwesome />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {model.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {model.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label="Active"
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              This Month
                            </Typography>
                            <Typography variant="h6" fontWeight={600} sx={{ color: '#4CAF50' }}>
                              {model.monthlyReturn}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Confidence
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {model.confidence}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Trades Made
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {model.trades}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button variant="outlined" size="small">
                              Pause
                            </Button>
                            <Button variant="contained" size="small">
                              Settings
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<PlayArrow />}
                  sx={{ 
                    bgcolor: '#4CAF50',
                    py: 1.5,
                    '&:hover': { bgcolor: '#45a049' },
                  }}
                  onClick={() => navigate('/models')}
                >
                  View All Models
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<SwapHoriz />}
                  sx={{ py: 1.5 }}
                >
                  Rebalance Portfolio
                </Button>
                
                {isPaperMode && (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<AccountBalance />}
                    sx={{ 
                      bgcolor: '#2196F3',
                      py: 1.5,
                      '&:hover': { bgcolor: '#1976d2' },
                    }}
                    onClick={handleSwitchToReal}
                  >
                    Ready for Real Money?
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Insights Modal */}
      {selectedStock && (
        <AIInsightsModal
          open={aiInsightsOpen}
          onClose={() => setAiInsightsOpen(false)}
          stock={selectedStock}
        />
      )}
    </Box>
  );
}