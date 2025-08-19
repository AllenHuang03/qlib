/**
 * Premium Trading Interface
 * Professional-grade trading terminal superior to existing retail platforms
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Avatar,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Stop,
  Add,
  Remove,
  Settings,
  Timeline,
  Speed,
  Psychology,
  Security,
  Notifications,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  GridOn,
  ShowChart,
  CandlestickChart,
  BarChart,
  MultilineChart
} from '@mui/icons-material';
import { Line, Candlestick } from 'react-chartjs-2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradingAPI, marketAPI, modelsAPI } from '../../services/api';

interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: string;
}

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  marketValue: number;
}

interface TradingSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  priceTarget: number;
  currentPrice: number;
  reasoning: string[];
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  timestamp: string;
}

const PremiumTradingInterface: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedSymbol, setSelectedSymbol] = useState('CBA.AX');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [stopPrice, setStopPrice] = useState<number>(0);
  const [riskAmount, setRiskAmount] = useState<number>(1000);
  const [activeTab, setActiveTab] = useState(0);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'candlestick' | 'bar'>('line');
  const [chartTimeframe, setChartTimeframe] = useState('1D');

  // Data queries
  const { data: liveSignals, refetch: refetchSignals } = useQuery({
    queryKey: ['tradingSignals'],
    queryFn: () => tradingAPI.getActivity(),
    refetchInterval: 3000,
  });

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => tradingAPI.getActivity(),
    refetchInterval: 5000,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => tradingAPI.getActivity(),
    refetchInterval: 5000,
  });

  const { data: marketData } = useQuery({
    queryKey: ['marketData', selectedSymbol],
    queryFn: () => marketAPI.getQuote(selectedSymbol),
    refetchInterval: 1000, // Real-time updates
  });

  // Mock data for demonstration
  const mockSignals: TradingSignal[] = [
    {
      id: '1',
      symbol: 'CBA.AX',
      signal: 'BUY',
      confidence: 0.89,
      priceTarget: 115.50,
      currentPrice: 110.50,
      reasoning: ['Strong momentum breakout', 'Earnings beat expected', 'Sector rotation positive'],
      strength: 'VERY_STRONG',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      symbol: 'BHP.AX',
      signal: 'SELL',
      confidence: 0.76,
      priceTarget: 42.80,
      currentPrice: 45.20,
      reasoning: ['Iron ore prices declining', 'Technical resistance'],
      strength: 'STRONG',
      timestamp: new Date().toISOString()
    }
  ];

  const mockPositions: Position[] = [
    {
      symbol: 'CBA.AX',
      quantity: 500,
      averagePrice: 108.50,
      currentPrice: 110.50,
      unrealizedPnL: 1000,
      unrealizedPnLPercent: 1.84,
      marketValue: 55250
    },
    {
      symbol: 'WBC.AX',
      quantity: 800,
      averagePrice: 24.20,
      currentPrice: 25.20,
      unrealizedPnL: 800,
      unrealizedPnLPercent: 4.13,
      marketValue: 20160
    }
  ];

  const mockOrders: Order[] = [
    {
      id: '1',
      symbol: 'CSL.AX',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 100,
      price: 290.00,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    }
  ];

  // Chart data
  const priceChartData = {
    labels: Array.from({ length: 50 }, (_, i) => i),
    datasets: [
      {
        label: selectedSymbol,
        data: Array.from({ length: 50 }, () => 
          110.50 + (Math.random() - 0.5) * 5
        ),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 2,
      }
    ]
  };

  // Mutations
  const placeOrderMutation = useMutation({
    mutationFn: (orderData: any) => {
      // In real implementation, this would call the trading API
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setOrderDialogOpen(false);
    }
  });

  const handlePlaceOrder = () => {
    const orderData = {
      symbol: selectedSymbol,
      side: orderSide,
      type: orderType,
      quantity,
      price: orderType === 'LIMIT' ? limitPrice : undefined,
      stopPrice: orderType === 'STOP' ? stopPrice : undefined
    };
    
    placeOrderMutation.mutate(orderData);
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

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'VERY_STRONG': return theme.palette.success.dark;
      case 'STRONG': return theme.palette.success.main;
      case 'MODERATE': return theme.palette.warning.main;
      default: return theme.palette.error.main;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Professional Trading Terminal
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoTradingEnabled}
                onChange={(e) => setAutoTradingEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Auto Trading"
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOrderDialogOpen(true)}
          >
            New Order
          </Button>
          
          <IconButton>
            <Badge badgeContent={mockSignals.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Trading Signals & Market Data */}
        <Grid item xs={12} lg={4}>
          {/* Live Trading Signals */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology color="primary" />
                AI Trading Signals
                <Chip label="LIVE" color="success" size="small" />
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {mockSignals.map((signal) => (
                  <Paper 
                    key={signal.id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: `2px solid ${getSignalColor(signal.signal)}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(getSignalColor(signal.signal), 0.05)
                      }
                    }}
                    onClick={() => setSelectedSymbol(signal.symbol)}
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
                          <Chip
                            label={signal.strength}
                            size="small"
                            sx={{ 
                              backgroundColor: getStrengthColor(signal.strength),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: getSignalColor(signal.signal) }}>
                          {signal.signal}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(signal.confidence * 100).toFixed(0)}% confidence
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Current: ${signal.currentPrice} → Target: ${signal.priceTarget}
                      </Typography>
                      <Typography variant="body2" sx={{ color: getSignalColor(signal.signal), fontWeight: 'bold' }}>
                        Potential: {((signal.priceTarget - signal.currentPrice) / signal.currentPrice * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={signal.confidence * 100} 
                      sx={{ 
                        mb: 1,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getSignalColor(signal.signal)
                        }
                      }}
                    />
                    
                    <Typography variant="caption" color="text.secondary">
                      {signal.reasoning.join(' • ')}
                    </Typography>
                    
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color={signal.signal === 'BUY' ? 'success' : 'error'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbol(signal.symbol);
                          setOrderSide(signal.signal as 'BUY' | 'SELL');
                          setOrderDialogOpen(true);
                        }}
                      >
                        Trade {signal.signal}
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Quick Order Panel */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Quick Order</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Symbol</InputLabel>
                <Select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  {['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'TLS.AX'].map(symbol => (
                    <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant={orderSide === 'BUY' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setOrderSide('BUY')}
                  fullWidth
                >
                  BUY
                </Button>
                <Button
                  variant={orderSide === 'SELL' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setOrderSide('SELL')}
                  fullWidth
                >
                  SELL
                </Button>
              </Box>
              
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                >
                  <MenuItem value="MARKET">Market</MenuItem>
                  <MenuItem value="LIMIT">Limit</MenuItem>
                  <MenuItem value="STOP">Stop</MenuItem>
                </Select>
              </FormControl>
              
              {orderType === 'LIMIT' && (
                <TextField
                  label="Limit Price"
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              
              {orderType === 'STOP' && (
                <TextField
                  label="Stop Price"
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(Number(e.target.value))}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              
              <Button
                variant="contained"
                color={orderSide === 'BUY' ? 'success' : 'error'}
                fullWidth
                onClick={handlePlaceOrder}
                disabled={placeOrderMutation.isPending}
              >
                Place {orderSide} Order
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Panel - Chart */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '800px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  {selectedSymbol} - Real-time Chart
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Line Chart">
                    <IconButton
                      color={chartType === 'line' ? 'primary' : 'default'}
                      onClick={() => setChartType('line')}
                    >
                      <ShowChart />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Candlestick Chart">
                    <IconButton
                      color={chartType === 'candlestick' ? 'primary' : 'default'}
                      onClick={() => setChartType('candlestick')}
                    >
                      <CandlestickChart />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Bar Chart">
                    <IconButton
                      color={chartType === 'bar' ? 'primary' : 'default'}
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart />
                    </IconButton>
                  </Tooltip>
                  
                  <IconButton>
                    <Fullscreen />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ height: 500 }}>
                <Line 
                  data={priceChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
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
                        display: false,
                      },
                    },
                    elements: {
                      point: {
                        radius: 0,
                      },
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index',
                    },
                  }} 
                />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={chartTimeframe === timeframe ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setChartTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </Box>
              
              <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Last</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>$110.50</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Change</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +$2.30 (+2.12%)
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Volume</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>1.25M</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Market Cap</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>$189.2B</Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Positions & Orders */}
        <Grid item xs={12} lg={3}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Positions" />
                <Tab label="Orders" />
              </Tabs>
              
              {activeTab === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Open Positions</Typography>
                  
                  {mockPositions.map((position, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {position.symbol}
                        </Typography>
                        <Chip
                          label={position.quantity > 0 ? 'LONG' : 'SHORT'}
                          color={position.quantity > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Qty: {position.quantity} @ ${position.averagePrice}
                      </Typography>
                      
                      <Typography variant="body2">
                        Current: ${position.currentPrice}
                      </Typography>
                      
                      <Typography variant="body2">
                        Market Value: ${position.marketValue.toLocaleString()}
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: position.unrealizedPnL >= 0 ? theme.palette.success.main : theme.palette.error.main
                          }}
                        >
                          {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL}
                        </Typography>
                        
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: position.unrealizedPnL >= 0 ? theme.palette.success.main : theme.palette.error.main
                          }}
                        >
                          ({position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" color="error">
                          Close
                        </Button>
                        <Button size="small" variant="outlined">
                          Edit
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Open Orders</Typography>
                  
                  {mockOrders.map((order) => (
                    <Paper key={order.id} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {order.symbol}
                        </Typography>
                        <Chip
                          label={order.status}
                          color={order.status === 'FILLED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2">
                        {order.side} {order.quantity} @ {order.type}
                      </Typography>
                      
                      {order.price && (
                        <Typography variant="body2">
                          Price: ${order.price}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" color="error">
                          Cancel
                        </Button>
                        <Button size="small" variant="outlined">
                          Modify
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="primary" />
                Risk Management
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Portfolio Risk</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={35} 
                  color="warning"
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption">35% of maximum risk</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Position Concentration</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={65} 
                  color="info"
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption">65% in top 3 positions</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Daily P&L</Typography>
                <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                  +$2,450 (+0.24%)
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Risk levels are within acceptable limits. Consider diversifying into healthcare sector.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Place New Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Symbol</InputLabel>
                <Select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  {['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'TLS.AX'].map(symbol => (
                    <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Side</InputLabel>
                <Select
                  value={orderSide}
                  onChange={(e) => setOrderSide(e.target.value as any)}
                >
                  <MenuItem value="BUY">BUY</MenuItem>
                  <MenuItem value="SELL">SELL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                >
                  <MenuItem value="MARKET">Market</MenuItem>
                  <MenuItem value="LIMIT">Limit</MenuItem>
                  <MenuItem value="STOP">Stop</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            
            {orderType === 'LIMIT' && (
              <Grid item xs={12}>
                <TextField
                  label="Limit Price"
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            )}
            
            {orderType === 'STOP' && (
              <Grid item xs={12}>
                <TextField
                  label="Stop Price"
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={orderSide === 'BUY' ? 'success' : 'error'}
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isPending}
          >
            {placeOrderMutation.isPending ? 'Placing...' : `Place ${orderSide} Order`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PremiumTradingInterface;