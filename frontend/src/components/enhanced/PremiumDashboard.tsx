/**
 * Premium Dashboard Component
 * Enterprise-grade trading interface superior to existing retail platforms
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Paper,
  LinearProgress,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Settings,
  Notifications,
  AccountBalance,
  Speed,
  Security,
  Timeline,
  Assessment,
  PieChart,
  ShowChart,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Bolt,
  AutoGraph,
  Psychology
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketAPI, tradingAPI, modelsAPI } from '../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement
);

interface TradingSignal {
  signal_id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price_target: number;
  current_price: number;
  reasoning: string[];
  timestamp: string;
}

interface PortfolioMetrics {
  total_value: number;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  daily_return: number;
  volatility: number;
  win_rate: number;
}

interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: string;
  volume: number;
  company_name: string;
}

const PremiumDashboard: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tradingSessionActive, setTradingSessionActive] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  // Real-time data queries
  const { data: liveSignals, refetch: refetchSignals } = useQuery({
    queryKey: ['liveSignals'],
    queryFn: () => tradingAPI.getActivity(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: portfolioMetrics } = useQuery({
    queryKey: ['portfolioMetrics'],
    queryFn: () => tradingAPI.getActivity(), // This would be portfolio API in real implementation
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: marketQuotes } = useQuery({
    queryKey: ['marketQuotes'],
    queryFn: () => marketAPI.getQuotes(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: modelsPerformance } = useQuery({
    queryKey: ['modelsPerformance'],
    queryFn: () => modelsAPI.getModels(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Mock data for demonstration (in production, this would come from APIs)
  const mockSignals: TradingSignal[] = [
    {
      signal_id: '1',
      symbol: 'CBA.AX',
      signal: 'BUY',
      confidence: 0.87,
      price_target: 115.50,
      current_price: 110.50,
      reasoning: ['Strong technical momentum', 'Positive earnings outlook', 'Sector rotation into financials'],
      timestamp: new Date().toISOString()
    },
    {
      signal_id: '2',
      symbol: 'BHP.AX',
      signal: 'HOLD',
      confidence: 0.72,
      price_target: 47.20,
      current_price: 45.20,
      reasoning: ['Commodity prices stabilizing', 'Iron ore demand steady'],
      timestamp: new Date().toISOString()
    },
    {
      signal_id: '3',
      symbol: 'CSL.AX',
      signal: 'SELL',
      confidence: 0.78,
      price_target: 285.00,
      current_price: 295.50,
      reasoning: ['Overvalued relative to peers', 'Regulatory headwinds'],
      timestamp: new Date().toISOString()
    }
  ];

  const mockPortfolioMetrics: PortfolioMetrics = {
    total_value: 1050000,
    total_return: 5.2,
    sharpe_ratio: 1.68,
    max_drawdown: 7.8,
    daily_return: 0.24,
    volatility: 12.5,
    win_rate: 68.5
  };

  const mockQuotes: MarketQuote[] = [
    { symbol: 'CBA.AX', price: 110.50, change: 2.30, change_percent: '2.12%', volume: 1250000, company_name: 'Commonwealth Bank' },
    { symbol: 'BHP.AX', price: 45.20, change: -0.80, change_percent: '-1.74%', volume: 2100000, company_name: 'BHP Group' },
    { symbol: 'CSL.AX', price: 295.50, change: 3.20, change_percent: '1.10%', volume: 850000, company_name: 'CSL Limited' },
    { symbol: 'WBC.AX', price: 25.20, change: 0.15, change_percent: '0.60%', volume: 1800000, company_name: 'Westpac Banking' }
  ];

  // Chart data
  const performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio',
        data: [100, 102.5, 104.8, 103.2, 107.1, 105.2],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
        fill: true,
      },
      {
        label: 'ASX 200',
        data: [100, 101.2, 103.5, 102.8, 104.9, 103.8],
        borderColor: theme.palette.secondary.main,
        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
        tension: 0.4,
        fill: false,
      }
    ]
  };

  const sectorAllocationData = {
    labels: ['Financials', 'Materials', 'Healthcare', 'Technology', 'Consumer', 'Other'],
    datasets: [{
      data: [35, 25, 15, 12, 8, 5],
      backgroundColor: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.error.main
      ],
    }]
  };

  const riskMetricsData = {
    labels: ['VaR 1D', 'VaR 5D', 'Max DD', 'Volatility'],
    datasets: [{
      label: 'Risk Metrics (%)',
      data: [1.5, 3.4, 7.8, 12.5],
      backgroundColor: alpha(theme.palette.error.main, 0.7),
      borderColor: theme.palette.error.main,
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: alpha(theme.palette.text.primary, 0.1),
        },
      },
      x: {
        grid: {
          color: alpha(theme.palette.text.primary, 0.1),
        },
      },
    },
  };

  const handleStartTradingSession = async () => {
    try {
      setTradingSessionActive(true);
      // In real implementation, call trading session API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      setTradingSessionActive(false);
      console.error('Failed to start trading session:', error);
    }
  };

  const handleStopTradingSession = async () => {
    try {
      setTradingSessionActive(false);
      // In real implementation, call trading session API
    } catch (error) {
      console.error('Failed to stop trading session:', error);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return theme.palette.success.main;
      case 'SELL': return theme.palette.error.main;
      default: return theme.palette.warning.main;
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp />;
      case 'SELL': return <TrendingDown />;
      default: return <Timeline />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            Qlib Pro Trading Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Advanced AI-Powered Quantitative Trading Platform
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Trading Session">
            <Button
              variant={tradingSessionActive ? "contained" : "outlined"}
              color={tradingSessionActive ? "error" : "success"}
              startIcon={tradingSessionActive ? <Stop /> : <PlayArrow />}
              onClick={tradingSessionActive ? handleStopTradingSession : handleStartTradingSession}
              sx={{ minWidth: 140 }}
            >
              {tradingSessionActive ? 'Stop Trading' : 'Start Trading'}
            </Button>
          </Tooltip>
          
          <IconButton onClick={() => queryClient.invalidateQueries()}>
            <Refresh />
          </IconButton>
          
          <IconButton>
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Portfolio Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ${mockPortfolioMetrics.total_value.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    +${(mockPortfolioMetrics.total_value * mockPortfolioMetrics.total_return / 100).toLocaleString()} 
                    ({mockPortfolioMetrics.total_return}%)
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Sharpe Ratio</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {mockPortfolioMetrics.sharpe_ratio}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Excellent Risk-Adjusted Returns
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Win Rate</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {mockPortfolioMetrics.win_rate}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    AI Signal Accuracy
                  </Typography>
                </Box>
                <Psychology sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Max Drawdown</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {mockPortfolioMetrics.max_drawdown}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Risk Control
                  </Typography>
                </Box>
                <Security sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Live Trading Signals */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bolt color="primary" />
                  Live AI Trading Signals
                </Typography>
                <Chip
                  label={tradingSessionActive ? "LIVE" : "OFFLINE"}
                  color={tradingSessionActive ? "success" : "default"}
                  variant="filled"
                  size="small"
                />
              </Box>
              
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {mockSignals.map((signal) => (
                  <Paper 
                    key={signal.signal_id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: `2px solid ${getSignalColor(signal.signal)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: getSignalColor(signal.signal), width: 32, height: 32 }}>
                          {getSignalIcon(signal.signal)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {signal.symbol}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {signal.signal} Signal
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${(signal.confidence * 100).toFixed(0)}% Confidence`}
                          color={signal.confidence > 0.8 ? "success" : signal.confidence > 0.6 ? "warning" : "error"}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Target: ${signal.price_target}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Current: ${signal.current_price} → Target: ${signal.price_target} 
                      ({((signal.price_target - signal.current_price) / signal.current_price * 100).toFixed(1)}%)
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      Reasoning: {signal.reasoning.join(', ')}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Performance Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChart color="primary" />
                Portfolio Performance vs Benchmark
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <Line data={performanceChartData} options={chartOptions} />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {['1D', '1W', '1M', '3M', '6M', '1Y'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Overview */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment color="primary" />
                ASX Market Overview
              </Typography>
              
              <Box>
                {mockQuotes.map((quote) => (
                  <Box key={quote.symbol} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {quote.symbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quote.company_name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ${quote.price}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: quote.change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {quote.change >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                        {quote.change_percent}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sector Allocation */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChart color="primary" />
                Sector Allocation
              </Typography>
              
              <Box sx={{ height: 250 }}>
                <Doughnut 
                  data={sectorAllocationData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Metrics */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="primary" />
                Risk Metrics
              </Typography>
              
              <Box sx={{ height: 250 }}>
                <Bar data={riskMetricsData} options={chartOptions} />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Risk metrics are within acceptable limits. Portfolio shows excellent risk-adjusted returns.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Model Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoGraph color="primary" />
                AI Model Performance
              </Typography>
              
              <Grid container spacing={2}>
                {[
                  { name: 'LSTM Alpha158', accuracy: 87.2, sharpe: 1.89, status: 'active' },
                  { name: 'LightGBM Multi-Factor', accuracy: 85.5, sharpe: 1.67, status: 'active' },
                  { name: 'GRU Momentum', accuracy: 82.8, sharpe: 1.54, status: 'training' },
                  { name: 'Transformer Ensemble', accuracy: 89.1, sharpe: 2.12, status: 'active' }
                ].map((model, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {model.name}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                          {model.accuracy}%
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                          {model.sharpe}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={model.status.toUpperCase()}
                        color={model.status === 'active' ? 'success' : model.status === 'training' ? 'warning' : 'default'}
                        size="small"
                        icon={model.status === 'active' ? <CheckCircle /> : model.status === 'training' ? <AutoGraph /> : <ErrorIcon />}
                      />
                      
                      {model.status === 'training' && (
                        <LinearProgress sx={{ mt: 1 }} variant="determinate" value={75} />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PremiumDashboard;