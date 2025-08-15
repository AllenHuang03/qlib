import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  ModelTraining,
  Analytics,
  Speed,
  DataObject,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  Refresh,
  Assessment,
  Timeline,
  Storage,
  Warning,
  CheckCircle,
  Science,
  BugReport,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AIModel {
  id: string;
  name: string;
  type: string;
  status: 'training' | 'active' | 'testing' | 'paused';
  accuracy: number;
  sharpe: number;
  lastTrained: string;
  dataset: string;
  performance: number;
  trades: number;
}

interface DataFeed {
  source: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  lastUpdate: string;
  recordsPerSecond: number;
}

interface BacktestResult {
  id: string;
  modelName: string;
  dateRange: string;
  return: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  status: 'completed' | 'running' | 'failed';
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
      id={`trader-agents-tabpanel-${index}`}
      aria-labelledby={`trader-agents-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TraderAgents() {
  const [tabValue, setTabValue] = useState(0);
  const [models, setModels] = useState<AIModel[]>([]);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [newBacktestOpen, setNewBacktestOpen] = useState(false);

  useEffect(() => {
    // Load AI models data
    setModels([
      {
        id: 'momentum_v3',
        name: 'Momentum Factor Model v3.0',
        type: 'LSTM',
        status: 'active',
        accuracy: 87.2,
        sharpe: 1.85,
        lastTrained: '2024-01-12 09:30',
        dataset: 'Alpha158',
        performance: 15.8,
        trades: 342,
      },
      {
        id: 'value_quality_v2',
        name: 'Value & Quality Multi-Factor v2.1',
        type: 'XGBoost',
        status: 'training',
        accuracy: 83.5,
        sharpe: 1.67,
        lastTrained: '2024-01-11 14:20',
        dataset: 'Alpha360',
        performance: 12.4,
        trades: 189,
      },
      {
        id: 'volatility_arb',
        name: 'Volatility Arbitrage Neural Net',
        type: 'Transformer',
        status: 'testing',
        accuracy: 91.8,
        sharpe: 2.12,
        lastTrained: '2024-01-10 16:45',
        dataset: 'Custom_Vol',
        performance: 18.9,
        trades: 76,
      },
    ]);

    // Load data feeds status
    setDataFeeds([
      {
        source: 'Alpha Vantage',
        status: 'connected',
        latency: 45,
        lastUpdate: '2024-01-12 09:45:23',
        recordsPerSecond: 1250,
      },
      {
        source: 'ASX Market Data',
        status: 'connected',
        latency: 23,
        lastUpdate: '2024-01-12 09:45:18',
        recordsPerSecond: 2840,
      },
      {
        source: 'Reuters News Feed',
        status: 'connected',
        latency: 156,
        lastUpdate: '2024-01-12 09:44:55',
        recordsPerSecond: 45,
      },
      {
        source: 'Social Sentiment API',
        status: 'error',
        latency: 0,
        lastUpdate: '2024-01-12 08:30:12',
        recordsPerSecond: 0,
      },
    ]);

    // Load backtest results
    setBacktestResults([
      {
        id: 'bt_001',
        modelName: 'Momentum Factor Model v3.0',
        dateRange: '2023-01-01 to 2023-12-31',
        return: 18.5,
        sharpe: 1.92,
        maxDrawdown: -8.2,
        winRate: 68.4,
        status: 'completed',
      },
      {
        id: 'bt_002',
        modelName: 'Value & Quality Multi-Factor v2.1',
        dateRange: '2023-06-01 to 2023-12-31',
        return: 14.2,
        sharpe: 1.75,
        maxDrawdown: -6.1,
        winRate: 71.2,
        status: 'completed',
      },
      {
        id: 'bt_003',
        modelName: 'Volatility Arbitrage Neural Net',
        dateRange: '2023-09-01 to 2023-12-31',
        return: 0,
        sharpe: 0,
        maxDrawdown: 0,
        winRate: 0,
        status: 'running',
      },
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'training': return 'warning';
      case 'testing': return 'info';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  const getDataFeedStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const performanceData = [
    { date: '01/08', momentum: 115.2, value: 112.8, volatility: 118.9 },
    { date: '01/09', momentum: 118.5, value: 114.2, volatility: 121.3 },
    { date: '01/10', momentum: 116.8, value: 116.1, volatility: 119.7 },
    { date: '01/11', momentum: 119.2, value: 117.5, volatility: 122.4 },
    { date: '01/12', momentum: 115.8, value: 119.2, volatility: 118.9 },
  ];

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trader Agents Control Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Internal AI model development, testing, and deployment platform
        </Typography>
      </Box>

      {/* Access Warning */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Restricted Access:</strong> This page is for internal trader agents and developers only. 
          Customer accounts cannot access advanced model testing and development tools.
        </Typography>
      </Alert>

      {/* System Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {models.filter(m => m.status === 'active').length}
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
                {dataFeeds.filter(d => d.status === 'connected').length}/{dataFeeds.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data Feeds Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {backtestResults.filter(b => b.status === 'running').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Running Backtests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                91.2%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Model Accuracy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="AI Models" />
            <Tab label="Live Data Feeds" />
            <Tab label="Backtesting Results" />
            <Tab label="Model Performance" />
          </Tabs>
        </Box>

        {/* AI Models Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              AI Trading Models
            </Typography>
            <Button variant="contained" startIcon={<Science />}>
              Deploy New Model
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Sharpe Ratio</TableCell>
                  <TableCell align="right">Performance</TableCell>
                  <TableCell>Dataset</TableCell>
                  <TableCell>Last Trained</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ModelTraining sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {model.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{model.type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={model.status.toUpperCase()}
                        color={getModelStatusColor(model.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{model.accuracy}%</TableCell>
                    <TableCell align="right">{model.sharpe}</TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">+{model.performance}%</Typography>
                    </TableCell>
                    <TableCell>{model.dataset}</TableCell>
                    <TableCell>{model.lastTrained}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" title="Start/Pause">
                          {model.status === 'active' ? <Pause /> : <PlayArrow />}
                        </IconButton>
                        <IconButton size="small" title="Stop">
                          <Stop />
                        </IconButton>
                        <IconButton size="small" title="Settings">
                          <Settings />
                        </IconButton>
                        <IconButton size="small" title="Test">
                          <BugReport />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Live Data Feeds Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Real-time Market Data Feeds
            </Typography>
            <Button variant="outlined" startIcon={<Refresh />}>
              Refresh All
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Latency (ms)</TableCell>
                  <TableCell align="right">Records/sec</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataFeeds.map((feed, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DataObject sx={{ mr: 1, color: 'primary.main' }} />
                        {feed.source}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={feed.status.toUpperCase()}
                        color={getDataFeedStatusColor(feed.status)}
                        size="small"
                        icon={
                          feed.status === 'connected' ? <CheckCircle /> :
                          feed.status === 'error' ? <Warning /> : undefined
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={feed.latency > 100 ? 'warning.main' : 'text.primary'}
                      >
                        {feed.latency}ms
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{feed.recordsPerSecond.toLocaleString()}</TableCell>
                    <TableCell>{feed.lastUpdate}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        {feed.status === 'connected' ? 'Disconnect' : 'Reconnect'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Backtesting Results Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Backtesting Results & Strategy Validation
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Assessment />}
              onClick={() => setNewBacktestOpen(true)}
            >
              Run New Backtest
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model Name</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Sharpe Ratio</TableCell>
                  <TableCell align="right">Max Drawdown</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backtestResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.modelName}</TableCell>
                    <TableCell>{result.dateRange}</TableCell>
                    <TableCell align="right">
                      {result.status === 'running' ? (
                        <LinearProgress sx={{ width: 80 }} />
                      ) : (
                        <Typography color="success.main">+{result.return}%</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {result.status === 'running' ? '-' : result.sharpe}
                    </TableCell>
                    <TableCell align="right">
                      {result.status === 'running' ? '-' : (
                        <Typography color="error.main">{result.maxDrawdown}%</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {result.status === 'running' ? '-' : `${result.winRate}%`}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={result.status.toUpperCase()}
                        color={
                          result.status === 'completed' ? 'success' :
                          result.status === 'running' ? 'info' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        {result.status === 'running' ? 'Stop' : 'View Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Model Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Comparative Model Performance
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="momentum" stroke="#2196f3" strokeWidth={2} name="Momentum Model" />
              <Line type="monotone" dataKey="value" stroke="#4caf50" strokeWidth={2} name="Value Model" />
              <Line type="monotone" dataKey="volatility" stroke="#ff9800" strokeWidth={2} name="Volatility Model" />
            </LineChart>
          </ResponsiveContainer>
        </TabPanel>
      </Card>

      {/* New Backtest Dialog */}
      <Dialog open={newBacktestOpen} onClose={() => setNewBacktestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Run New Backtest</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Select Model"
                SelectProps={{ native: true }}
              >
                <option value="">Choose a model...</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Dataset"
                SelectProps={{ native: true }}
              >
                <option value="Alpha158">Alpha158</option>
                <option value="Alpha360">Alpha360</option>
                <option value="Custom_Vol">Custom Volatility</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBacktestOpen(false)}>Cancel</Button>
          <Button variant="contained">Start Backtest</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}