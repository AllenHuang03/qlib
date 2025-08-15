import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AddCircle,
  AccountBalance,
  Assessment,
  Timeline,
  Refresh,
  PlayArrow,
  Info,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  side: 'long' | 'short';
  entryTime: string;
}

interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`paper-trading-tabpanel-${index}`}
      aria-labelledby={`paper-trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PaperTrading() {
  const [tabValue, setTabValue] = useState(0);
  const [virtualBalance, setVirtualBalance] = useState(100000); // $100k virtual money
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeType, setTradeType] = useState<'market' | 'limit'>('market');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');

  // Sample portfolio performance data
  const performanceData = [
    { date: '01/08', value: 100000 },
    { date: '01/09', value: 102500 },
    { date: '01/10', value: 98750 },
    { date: '01/11', value: 105300 },
    { date: '01/12', value: 108420 },
  ];

  // Sample positions for demo
  useEffect(() => {
    setPositions([
      {
        id: '1',
        symbol: 'CBA.AX',
        quantity: 100,
        entryPrice: 108.50,
        currentPrice: 110.25,
        pnl: 175,
        pnlPercent: 1.61,
        side: 'long',
        entryTime: '2024-01-10 09:30',
      },
      {
        id: '2',
        symbol: 'BHP.AX',
        quantity: 200,
        entryPrice: 44.80,
        currentPrice: 45.20,
        pnl: 80,
        pnlPercent: 0.89,
        side: 'long',
        entryTime: '2024-01-10 14:15',
      },
    ]);

    setOrders([
      {
        id: '1',
        symbol: 'ANZ.AX',
        type: 'limit',
        side: 'buy',
        quantity: 150,
        price: 27.00,
        status: 'pending',
        timestamp: '2024-01-12 09:30',
      },
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const currentPortfolioValue = virtualBalance + totalPnL;

  const handlePlaceTrade = () => {
    if (!selectedSymbol || !tradeQuantity) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      type: tradeType,
      side: tradeSide,
      quantity: parseInt(tradeQuantity),
      price: tradeType === 'limit' ? parseFloat(tradePrice) : undefined,
      status: tradeType === 'market' ? 'filled' : 'pending',
      timestamp: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // If market order, immediately create position
    if (tradeType === 'market') {
      const mockPrice = Math.random() * 100 + 50; // Mock current price
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        quantity: tradeSide === 'buy' ? parseInt(tradeQuantity) : -parseInt(tradeQuantity),
        entryPrice: mockPrice,
        currentPrice: mockPrice,
        pnl: 0,
        pnlPercent: 0,
        side: tradeSide === 'buy' ? 'long' : 'short',
        entryTime: new Date().toISOString(),
      };
      setPositions(prev => [newPosition, ...prev]);
    }

    setTradeDialogOpen(false);
    setSelectedSymbol('');
    setTradeQuantity('');
    setTradePrice('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Paper Trading Simulator
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Practice trading with virtual money in real market conditions
        </Typography>
      </Box>

      {/* Virtual Portfolio Overview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Simulation Mode:</strong> You're trading with virtual money. Perfect your strategy risk-free before investing real capital.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                ${currentPortfolioValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Portfolio Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                ${virtualBalance.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Cash
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={totalPnL >= 0 ? 'success.main' : 'error.main'}
              >
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unrealized P&L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {positions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open Positions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trading Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => setTradeDialogOpen(true)}
        >
          Place Trade
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
        >
          Refresh Prices
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
        >
          Performance Report
        </Button>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Portfolio Performance" />
            <Tab label="Open Positions" />
            <Tab label="Orders" />
            <Tab label="Trading Ideas" />
          </Tabs>
        </Box>

        {/* Portfolio Performance Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Portfolio Performance Chart
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
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
        </TabPanel>

        {/* Open Positions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Current Positions
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Entry Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="right">P&L %</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell align="right">{position.quantity}</TableCell>
                    <TableCell align="right">${position.entryPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">${position.currentPrice.toFixed(2)}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: position.pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: position.pnlPercent >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={position.side.toUpperCase()}
                        color={position.side === 'long' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(position.entryTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" color="error">
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Order History
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell>{order.type.toUpperCase()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.side.toUpperCase()}
                        color={order.side === 'buy' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{order.quantity}</TableCell>
                    <TableCell align="right">
                      {order.price ? `$${order.price.toFixed(2)}` : 'Market'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status.toUpperCase()}
                        color={
                          order.status === 'filled' ? 'success' :
                          order.status === 'pending' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(order.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <Button size="small" variant="outlined" color="error">
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Trading Ideas Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            AI-Generated Trading Ideas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">BUY Signal: ANZ.AX</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Strong momentum and value indicators suggest upward potential.
                  </Typography>
                  <Typography variant="body2">
                    <strong>Target:</strong> $28.50 | <strong>Stop Loss:</strong> $26.80
                  </Typography>
                  <Typography variant="body2">
                    <strong>Confidence:</strong> 82%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingDown color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">SELL Signal: TLS.AX</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Technical indicators show bearish divergence and weakening fundamentals.
                  </Typography>
                  <Typography variant="body2">
                    <strong>Target:</strong> $3.80 | <strong>Stop Loss:</strong> $4.30
                  </Typography>
                  <Typography variant="body2">
                    <strong>Confidence:</strong> 75%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Place Trade Dialog */}
      <Dialog open={tradeDialogOpen} onClose={() => setTradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Place Trade Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Symbol"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                placeholder="e.g., CBA.AX"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Side</InputLabel>
                <Select
                  value={tradeSide}
                  label="Side"
                  onChange={(e) => setTradeSide(e.target.value as 'buy' | 'sell')}
                >
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={tradeType}
                  label="Order Type"
                  onChange={(e) => setTradeType(e.target.value as 'market' | 'limit')}
                >
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value)}
              />
            </Grid>
            {tradeType === 'limit' && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTradeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePlaceTrade} 
            variant="contained"
            disabled={!selectedSymbol || !tradeQuantity}
          >
            Place Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}