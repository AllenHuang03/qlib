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
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Badge,
  Avatar,
  Divider,
  Switch,
  FormControlLabel
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
  Security,
  Person,
  AccountBalance,
  ShowChart,
  Refresh,
  Launch,
  Stop,
  Schedule,
  Compare,
  Insights,
  Engineering,
  MonetizationOn,
  BarChart,
  Notifications,
  ContactSupport
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Bar, PieChart, Pie, Cell } from 'recharts';
import { StaffUser, ClientPortfolio, TradingModel, TradingSignal, Position } from '../../types/staff';

interface TradingAgentDashboardProps {
  user: StaffUser;
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
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TradingAgentDashboard: React.FC<TradingAgentDashboardProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [clientPortfolios, setClientPortfolios] = useState<ClientPortfolio[]>([]);
  const [tradingModels, setTradingModels] = useState<TradingModel[]>([]);
  const [liveSignals, setLiveSignals] = useState<TradingSignal[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPortfolio | null>(null);
  const [marketData, setMarketData] = useState<any>({});
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TradingModel | null>(null);

  useEffect(() => {
    // Mock client portfolios data
    setClientPortfolios([
      {
        id: 'portfolio_001',
        clientId: 'client_001',
        clientName: 'David Chen',
        clientEmail: 'verified@test.com',
        totalValue: 275000,
        cash: 25000,
        positions: [
          {
            symbol: 'CBA.AX',
            quantity: 850,
            avgPrice: 108.20,
            currentPrice: 110.50,
            marketValue: 93925,
            unrealizedPnL: 1955,
            unrealizedPnLPercent: 2.13,
            sector: 'Financials',
            assetClass: 'equity'
          },
          {
            symbol: 'BHP.AX',
            quantity: 2200,
            avgPrice: 44.80,
            currentPrice: 45.20,
            marketValue: 99440,
            unrealizedPnL: 880,
            unrealizedPnLPercent: 0.89,
            sector: 'Materials',
            assetClass: 'equity'
          },
          {
            symbol: 'CSL.AX',
            quantity: 320,
            avgPrice: 289.50,
            currentPrice: 295.20,
            marketValue: 94464,
            unrealizedPnL: 1824,
            unrealizedPnLPercent: 1.97,
            sector: 'Healthcare',
            assetClass: 'equity'
          }
        ],
        performance: {
          totalReturn: 37650,
          totalReturnPercent: 15.8,
          ytdReturn: 32100,
          ytdReturnPercent: 13.2,
          sharpeRatio: 1.45,
          maxDrawdown: -8.5,
          volatility: 18.2,
          beta: 0.92
        },
        riskMetrics: {
          var95: 8250,
          var99: 12400,
          expectedShortfall: 15200,
          portfolioVolatility: 18.2,
          concentrationRisk: 0.34,
          correlationRisk: 0.67
        },
        lastUpdate: '2024-08-19T10:30:00Z'
      },
      {
        id: 'portfolio_002',
        clientId: 'client_002',
        clientName: 'Sarah Martinez',
        clientEmail: 'premium@test.com',
        totalValue: 1850000,
        cash: 125000,
        positions: [
          {
            symbol: 'APT',
            quantity: 15000,
            avgPrice: 95.50,
            currentPrice: 98.20,
            marketValue: 1473000,
            unrealizedPnL: 40500,
            unrealizedPnLPercent: 2.83,
            sector: 'Technology',
            assetClass: 'equity'
          },
          {
            symbol: 'WBC.AX',
            quantity: 8500,
            avgPrice: 25.60,
            currentPrice: 26.10,
            marketValue: 221850,
            unrealizedPnL: 4250,
            unrealizedPnLPercent: 1.95,
            sector: 'Financials',
            assetClass: 'equity'
          }
        ],
        performance: {
          totalReturn: 285400,
          totalReturnPercent: 18.2,
          ytdReturn: 256800,
          ytdReturnPercent: 16.1,
          sharpeRatio: 1.68,
          maxDrawdown: -12.3,
          volatility: 22.1,
          beta: 1.15
        },
        riskMetrics: {
          var95: 42500,
          var99: 68200,
          expectedShortfall: 89400,
          portfolioVolatility: 22.1,
          concentrationRisk: 0.79,
          correlationRisk: 0.43
        },
        lastUpdate: '2024-08-19T10:30:00Z'
      }
    ]);

    // Mock trading models
    setTradingModels([
      {
        id: 'momentum_v3',
        name: 'Enhanced Momentum Strategy v3.2',
        type: 'momentum',
        status: 'active',
        performance: {
          totalReturn: 18.7,
          sharpeRatio: 1.52,
          maxDrawdown: -7.8,
          winRate: 64.2,
          avgTrade: 2.3
        },
        allocatedCapital: 500000,
        lastTradeDate: '2024-08-19T09:45:00Z',
        createdDate: '2024-01-15T10:00:00Z',
        backtestResults: {
          period: '2022-2024',
          totalReturn: 28.5,
          annualizedReturn: 13.8,
          volatility: 16.2,
          sharpeRatio: 1.47,
          maxDrawdown: -9.2,
          winRate: 62.8,
          trades: 342,
          avgHoldingPeriod: 8.5
        },
        riskLimits: {
          maxPositionSize: 0.1,
          maxSectorExposure: 0.3,
          maxVaR: 0.02,
          maxDrawdown: 0.15,
          stopLoss: 0.05
        }
      },
      {
        id: 'ml_alpha',
        name: 'ML Alpha Generation Model',
        type: 'ml_based',
        status: 'training',
        performance: {
          totalReturn: 22.1,
          sharpeRatio: 1.78,
          maxDrawdown: -6.2,
          winRate: 71.5,
          avgTrade: 3.1
        },
        allocatedCapital: 750000,
        lastTradeDate: '2024-08-18T16:20:00Z',
        createdDate: '2024-03-01T10:00:00Z',
        riskLimits: {
          maxPositionSize: 0.08,
          maxSectorExposure: 0.25,
          maxVaR: 0.015,
          maxDrawdown: 0.12,
          stopLoss: 0.04
        }
      },
      {
        id: 'value_quality',
        name: 'Value & Quality Multi-Factor',
        type: 'multi_factor',
        status: 'paused',
        performance: {
          totalReturn: 12.8,
          sharpeRatio: 1.33,
          maxDrawdown: -11.2,
          winRate: 58.7,
          avgTrade: 1.8
        },
        allocatedCapital: 300000,
        lastTradeDate: '2024-08-15T11:30:00Z',
        createdDate: '2024-02-10T10:00:00Z',
        riskLimits: {
          maxPositionSize: 0.12,
          maxSectorExposure: 0.35,
          maxVaR: 0.025,
          maxDrawdown: 0.18,
          stopLoss: 0.06
        }
      }
    ]);

    // Mock live signals
    setLiveSignals([
      {
        id: 'signal_001',
        symbol: 'ANZ.AX',
        signal: 'BUY',
        strength: 0.85,
        confidence: 'high',
        factors: ['momentum', 'value'],
        targetPrice: 28.50,
        stopLoss: 26.20,
        generatedDate: '2024-08-19T10:15:00Z',
        expiryDate: '2024-08-19T16:00:00Z',
        modelId: 'momentum_v3',
        executionStatus: 'pending'
      },
      {
        id: 'signal_002',
        symbol: 'RIO.AX',
        signal: 'SELL',
        strength: -0.72,
        confidence: 'medium',
        factors: ['momentum', 'technical'],
        targetPrice: 118.00,
        stopLoss: 122.50,
        generatedDate: '2024-08-19T09:45:00Z',
        expiryDate: '2024-08-19T15:30:00Z',
        modelId: 'ml_alpha',
        executionStatus: 'pending'
      },
      {
        id: 'signal_003',
        symbol: 'TLS.AX',
        signal: 'BUY',
        strength: 0.68,
        confidence: 'high',
        factors: ['value', 'quality'],
        targetPrice: 4.25,
        stopLoss: 3.95,
        generatedDate: '2024-08-19T10:30:00Z',
        expiryDate: '2024-08-19T16:30:00Z',
        modelId: 'value_quality',
        executionStatus: 'pending'
      }
    ]);

    // Mock market data
    setMarketData({
      asx200: { current: 7845.2, change: 23.5, changePercent: 0.30 },
      volatilityIndex: { current: 14.2, change: -0.8, changePercent: -5.3 },
      sectorPerformance: [
        { sector: 'Technology', performance: 2.1 },
        { sector: 'Healthcare', performance: 1.8 },
        { sector: 'Financials', performance: 0.9 },
        { sector: 'Materials', performance: -0.3 },
        { sector: 'Energy', performance: -1.2 }
      ]
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewClientDetails = (client: ClientPortfolio) => {
    setSelectedClient(client);
  };

  const handleModelSettings = (model: TradingModel) => {
    setSelectedModel(model);
    setModelDialogOpen(true);
  };

  const handleExecuteSignal = (signalId: string) => {
    setLiveSignals(signals => 
      signals.map(signal => 
        signal.id === signalId 
          ? { ...signal, executionStatus: 'executed' }
          : signal
      )
    );
  };

  const handleToggleModel = (modelId: string) => {
    setTradingModels(models =>
      models.map(model =>
        model.id === modelId
          ? { 
              ...model, 
              status: model.status === 'active' ? 'paused' : 'active'
            }
          : model
      )
    );
  };

  const performanceData = [
    { date: '08/15', portfolio: 1420000, benchmark: 1380000 },
    { date: '08/16', portfolio: 1445000, benchmark: 1390000 },
    { date: '08/17', portfolio: 1468000, benchmark: 1402000 },
    { date: '08/18', portfolio: 1482000, benchmark: 1408000 },
    { date: '08/19', portfolio: 1503000, benchmark: 1415000 }
  ];

  const sectorAllocation = [
    { name: 'Technology', value: 35, color: '#8884d8' },
    { name: 'Financials', value: 25, color: '#82ca9d' },
    { name: 'Healthcare', value: 20, color: '#ffc658' },
    { name: 'Materials', value: 12, color: '#ff7300' },
    { name: 'Energy', value: 8, color: '#00ff88' }
  ];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      case 'HOLD': return 'info';
      default: return 'default';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'training': return 'warning';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Professional Trading Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced portfolio management and algorithmic trading platform
        </Typography>
      </Box>

      {/* Market Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {clientPortfolios.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Managed Portfolios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                $2.1M
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assets Under Management
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" color="success.main">
                  +16.9%
                </Typography>
                <TrendingUp sx={{ ml: 1, color: 'success.main' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Average Performance YTD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {tradingModels.filter(m => m.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Models
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Market Data */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Live Market Data</Typography>
            <IconButton size="small">
              <Refresh />
            </IconButton>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>ASX 200:</Typography>
                <Typography variant="h6" color="primary" sx={{ mr: 1 }}>
                  {marketData.asx200?.current}
                </Typography>
                <Chip 
                  label={`+${marketData.asx200?.change} (+${marketData.asx200?.changePercent}%)`}
                  color="success"
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>VIX:</Typography>
                <Typography variant="h6" sx={{ mr: 1 }}>
                  {marketData.volatilityIndex?.current}
                </Typography>
                <Chip 
                  label={`${marketData.volatilityIndex?.change} (${marketData.volatilityIndex?.changePercent}%)`}
                  color="success"
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Badge badgeContent={liveSignals.filter(s => s.executionStatus === 'pending').length} color="warning">
                <Button variant="outlined" startIcon={<Notifications />}>
                  Active Signals
                </Button>
              </Badge>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Client Portfolios" />
            <Tab label="Trading Models" />
            <Tab label="Live Signals" />
            <Tab label="Performance Analytics" />
            <Tab label="Risk Management" />
          </Tabs>
        </Box>

        {/* Client Portfolios Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                Client Portfolio Overview
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell align="right">Portfolio Value</TableCell>
                      <TableCell align="right">YTD Return</TableCell>
                      <TableCell align="right">Risk Score</TableCell>
                      <TableCell align="right">Last Updated</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientPortfolios.map((portfolio) => (
                      <TableRow key={portfolio.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {portfolio.clientName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {portfolio.clientName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {portfolio.clientEmail}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1">
                            ${portfolio.totalValue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={portfolio.performance.ytdReturnPercent > 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            +{portfolio.performance.ytdReturnPercent}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${portfolio.riskMetrics.portfolioVolatility.toFixed(1)}%`}
                            color={portfolio.riskMetrics.portfolioVolatility > 20 ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {new Date(portfolio.lastUpdate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewClientDetails(portfolio)}
                          >
                            <Launch />
                          </IconButton>
                          <IconButton size="small">
                            <ContactSupport />
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
                Sector Allocation
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Trading Models Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quantitative Trading Models
            </Typography>
            <Button variant="contained" startIcon={<Engineering />} sx={{ mr: 2 }}>
              Deploy New Model
            </Button>
            <Button variant="outlined" startIcon={<Assessment />}>
              Backtest Suite
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Performance</TableCell>
                  <TableCell align="right">Sharpe Ratio</TableCell>
                  <TableCell align="right">Allocated Capital</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tradingModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{model.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(model.createdDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.type.replace('_', ' ')}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.status}
                        color={getModelStatusColor(model.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main" fontWeight="bold">
                        +{model.performance.totalReturn}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {model.performance.sharpeRatio}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography>
                        ${model.allocatedCapital.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleModel(model.id)}
                        color={model.status === 'active' ? 'error' : 'primary'}
                      >
                        {model.status === 'active' ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleModelSettings(model)}
                      >
                        <Settings />
                      </IconButton>
                      <IconButton size="small">
                        <BarChart />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Live Signals Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Trading Signals
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              {liveSignals.filter(s => s.executionStatus === 'pending').length} signals pending execution
            </Alert>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Signal</TableCell>
                  <TableCell align="right">Strength</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell align="right">Target Price</TableCell>
                  <TableCell align="right">Stop Loss</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Generated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {liveSignals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {signal.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={signal.signal}
                        color={getSignalColor(signal.signal) as any}
                        icon={
                          signal.signal === 'BUY' ? <TrendingUp /> :
                          signal.signal === 'SELL' ? <TrendingDown /> : undefined
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={signal.strength > 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {signal.strength > 0 ? '+' : ''}{(signal.strength * 100).toFixed(0)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={signal.confidence}
                        color={
                          signal.confidence === 'high' ? 'success' :
                          signal.confidence === 'medium' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography>${signal.targetPrice?.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">
                        ${signal.stopLoss?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {signal.modelId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(signal.generatedDate).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {signal.executionStatus === 'pending' ? (
                        <Button 
                          size="small" 
                          variant="contained"
                          color="primary"
                          onClick={() => handleExecuteSignal(signal.id)}
                        >
                          Execute
                        </Button>
                      ) : (
                        <Chip 
                          label={signal.executionStatus}
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Performance Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
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
                  <RechartsTooltip formatter={(value) => [`$${value?.toLocaleString()}`, '']} />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    stroke="#2196f3" 
                    strokeWidth={3} 
                    name="Managed Portfolios" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#ff9800" 
                    strokeWidth={2} 
                    name="ASX 200 Benchmark" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MonetizationOn color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total Alpha Generated"
                    secondary="$127,500 above benchmark"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ShowChart color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Information Ratio"
                    secondary="1.68 (Excellent)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Maximum Drawdown"
                    secondary="-8.9% (Within limits)"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Risk Management Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Portfolio Risk Metrics
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Value at Risk (95%)"
                        secondary="$42,500 daily exposure"
                      />
                      <Typography color="warning.main">MONITOR</Typography>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Concentration Risk"
                        secondary="Max position: 12% (Limit: 15%)"
                      />
                      <Typography color="success.main">OK</Typography>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Sector Exposure"
                        secondary="Tech: 35% (Limit: 40%)"
                      />
                      <Typography color="success.main">OK</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Model Risk Controls
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  {tradingModels.map((model) => (
                    <Box key={model.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {model.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Max Drawdown:</Typography>
                        <Typography variant="body2" color="success.main">
                          {model.performance.maxDrawdown}% / {(model.riskLimits.maxDrawdown * 100)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Position Limit:</Typography>
                        <Typography variant="body2" color="success.main">
                          {(model.riskLimits.maxPositionSize * 100)}%
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Model Settings Dialog */}
      <Dialog 
        open={modelDialogOpen} 
        onClose={() => setModelDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Model Configuration - {selectedModel?.name}
        </DialogTitle>
        <DialogContent>
          {selectedModel && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Risk Limits
                  </Typography>
                  <TextField
                    fullWidth
                    label="Max Position Size (%)"
                    value={(selectedModel.riskLimits.maxPositionSize * 100).toString()}
                    margin="normal"
                    type="number"
                  />
                  <TextField
                    fullWidth
                    label="Max Sector Exposure (%)"
                    value={(selectedModel.riskLimits.maxSectorExposure * 100).toString()}
                    margin="normal"
                    type="number"
                  />
                  <TextField
                    fullWidth
                    label="Stop Loss (%)"
                    value={(selectedModel.riskLimits.stopLoss * 100).toString()}
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Model Controls
                  </Typography>
                  <FormControlLabel
                    control={<Switch checked={selectedModel.status === 'active'} />}
                    label="Enable Model"
                  />
                  <TextField
                    fullWidth
                    label="Allocated Capital"
                    value={selectedModel.allocatedCapital.toString()}
                    margin="normal"
                    type="number"
                  />
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Model performance: +{selectedModel.performance.totalReturn}% return, 
                    {selectedModel.performance.sharpeRatio} Sharpe ratio
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModelDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingAgentDashboard;