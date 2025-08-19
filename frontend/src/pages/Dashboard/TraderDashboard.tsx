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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  ModelTraining,
  Speed,
  Warning,
  PlayArrow,
  Pause,
  Settings,
  Assessment,
  Timeline,
  Security
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DemoMarketDataCard from '../../components/enhanced/DemoMarketDataCard';

interface TraderDashboardProps {
  user: any;
  onStartKYC: () => void;
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
      id={`trader-tabpanel-${index}`}
      aria-labelledby={`trader-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({ user, onStartKYC }) => {
  const [tabValue, setTabValue] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    setIsVerified(user?.kyc_status === 'approved');
    
    if (isVerified) {
      // Mock data - in production, fetch from API
      setModels([
        {
          id: 'momentum_v2',
          name: 'Momentum Factor Model v2.1',
          status: 'active',
          performance: 15.2,
          sharpe: 1.45,
          lastTrained: '2024-01-12',
          trades: 342
        },
        {
          id: 'value_quality',
          name: 'Value & Quality Multi-Factor',
          status: 'training',
          performance: 12.8,
          sharpe: 1.33,
          lastTrained: '2024-01-10',
          trades: 189
        },
        {
          id: 'volatility_arb',
          name: 'Volatility Arbitrage',
          status: 'paused',
          performance: 8.9,
          sharpe: 1.12,
          lastTrained: '2024-01-08',
          trades: 76
        }
      ]);

      setPositions([
        { symbol: 'CBA.AX', quantity: 850, avgPrice: 108.20, currentPrice: 110.50, pnl: 1955, pnlPercent: 2.13 },
        { symbol: 'BHP.AX', quantity: 2200, avgPrice: 44.80, currentPrice: 45.20, pnl: 880, pnlPercent: 0.89 },
        { symbol: 'CSL.AX', quantity: 320, avgPrice: 289.50, currentPrice: 295.20, pnl: 1824, pnlPercent: 1.97 },
        { symbol: 'WBC.AX', quantity: -500, avgPrice: 25.60, currentPrice: 25.20, pnl: 200, pnlPercent: 1.56 }
      ]);

      setSignals([
        { symbol: 'ANZ.AX', signal: 'BUY', strength: 0.85, factors: ['momentum', 'value'], confidence: 'High' },
        { symbol: 'TLS.AX', signal: 'SELL', strength: -0.72, factors: ['quality', 'volatility'], confidence: 'Medium' },
        { symbol: 'RIO.AX', signal: 'BUY', strength: 0.68, factors: ['momentum'], confidence: 'Medium' },
        { symbol: 'WOW.AX', signal: 'HOLD', strength: 0.15, factors: ['value'], confidence: 'Low' }
      ]);
    }
  }, [user, isVerified]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const performanceData = [
    { date: '01/08', portfolio: 142500, benchmark: 140000 },
    { date: '01/09', portfolio: 148200, benchmark: 142000 },
    { date: '01/10', portfolio: 151800, benchmark: 143500 },
    { date: '01/11', portfolio: 156200, benchmark: 145000 },
    { date: '01/12', portfolio: 162300, benchmark: 146500 }
  ];

  const factorPerformance = [
    { factor: 'Momentum', return: 15.2, sharpe: 1.45 },
    { factor: 'Value', return: 12.8, sharpe: 1.33 },
    { factor: 'Quality', return: 11.5, sharpe: 1.28 },
    { factor: 'Volatility', return: 8.9, sharpe: 1.12 },
    { factor: 'Size', return: 6.7, sharpe: 0.98 }
  ];

  if (!isVerified) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Professional Account Verification Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Complete enhanced verification to access advanced quantitative trading tools and algorithm development environment.
          </Typography>
          <Button
            variant="contained"
            onClick={onStartKYC}
            startIcon={<PlayArrow />}
          >
            Start Professional Verification
          </Button>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Professional Trading Tools Preview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <ModelTraining sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">Model Development</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Build and train multi-factor quantitative models
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">Advanced Analytics</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Professional backtesting and risk management
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Speed sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">Live Execution</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time algorithm execution with controls
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
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trading Operations Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Quantitative model development and execution platform
        </Typography>
      </Box>

      {/* Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Models
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                +15.2%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best Model Return
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                1.45
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                607
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Trades
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Portfolio & Performance" />
            <Tab label="Models & Algorithms" />
            <Tab label="Live Signals" />
            <Tab label="Risk Management" />
          </Tabs>
        </Box>

        {/* Portfolio & Performance Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                Portfolio Performance vs Benchmark
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="portfolio" stroke="#2196f3" strokeWidth={3} name="Portfolio" />
                  <Line type="monotone" dataKey="benchmark" stroke="#ff9800" strokeWidth={2} name="Benchmark" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Grid container spacing={2}>
                {/* Enhanced Market Data Card */}
                <Grid item xs={12}>
                  <DemoMarketDataCard />
                </Grid>
                
                {/* Current Positions */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Current Positions
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">P&L</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {positions.map((position) => (
                          <TableRow key={position.symbol}>
                            <TableCell>{position.symbol}</TableCell>
                            <TableCell align="right">{position.quantity}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ color: position.pnl > 0 ? 'success.main' : 'error.main' }}
                            >
                              ${position.pnl}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Models & Algorithms Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                Model Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="right">Sharpe</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>{model.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={model.status}
                            color={
                              model.status === 'active' ? 'success' :
                              model.status === 'training' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">+{model.performance}%</Typography>
                        </TableCell>
                        <TableCell align="right">{model.sharpe}</TableCell>
                        <TableCell align="right">{model.trades}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            {model.status === 'active' ? <Pause /> : <PlayArrow />}
                          </IconButton>
                          <IconButton size="small">
                            <Settings />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Factor Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={factorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="factor" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="return" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Live Signals Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Current Trading Signals
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Signal</TableCell>
                  <TableCell align="right">Strength</TableCell>
                  <TableCell>Factors</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {signals.map((signal, index) => (
                  <TableRow key={index}>
                    <TableCell>{signal.symbol}</TableCell>
                    <TableCell>
                      <Chip 
                        label={signal.signal}
                        color={
                          signal.signal === 'BUY' ? 'success' :
                          signal.signal === 'SELL' ? 'error' : 'default'
                        }
                        icon={
                          signal.signal === 'BUY' ? <TrendingUp /> :
                          signal.signal === 'SELL' ? <TrendingDown /> : undefined
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {signal.strength > 0 ? '+' : ''}{(signal.strength * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>{signal.factors.join(', ')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={signal.confidence}
                        color={
                          signal.confidence === 'High' ? 'success' :
                          signal.confidence === 'Medium' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Execute
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Risk Management Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ mr: 1 }} />
                    Risk Limits
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Position Limit"
                        secondary="Max 10% per position"
                      />
                      <Typography variant="body2" color="success.main">
                        WITHIN LIMIT
                      </Typography>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Sector Concentration"
                        secondary="Max 30% per sector"
                      />
                      <Typography variant="body2" color="success.main">
                        WITHIN LIMIT
                      </Typography>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Daily VaR"
                        secondary="95% confidence level"
                      />
                      <Typography variant="body2" color="warning.main">
                        $2,450 (2.1%)
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ mr: 1 }} />
                    Risk Alerts
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Correlation Alert:</strong> High correlation detected between CBA and WBC positions (0.87)
                    </Typography>
                  </Alert>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Volatility Watch:</strong> Tech sector volatility above 30-day average
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default TraderDashboard;