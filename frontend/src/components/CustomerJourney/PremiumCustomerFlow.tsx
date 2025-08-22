import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Switch,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  Analytics,
  Settings,
  Notifications,
  Assessment,
  Timeline,
  Security,
  Speed,
  TuneRounded,
  Science,
  Psychology,
  AutoGraph,
  BarChart,
  ShowChart,
  PieChart,
  AccountBalance,
  Warning,
  CheckCircle,
  Star,
  Diamond,
  Bolt,
  Rocket,
  Build,
  Visibility,
  Edit,
  Delete,
  Add,
  PlayArrow,
  Pause,
  Stop,
  FileDownload,
  Share,
  ContentCopy
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface PremiumCustomerFlowProps {
  user: any;
}

interface CustomStrategy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  performance: number;
  riskScore: number;
  allocation: { [key: string]: number };
  createdDate: string;
  lastModified: string;
}

interface AlertConfig {
  id: string;
  name: string;
  type: 'price' | 'volume' | 'technical' | 'news' | 'portfolio';
  condition: string;
  threshold: number;
  enabled: boolean;
  channels: string[];
}

const PremiumCustomerFlow: React.FC<PremiumCustomerFlowProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [customStrategies, setCustomStrategies] = useState<CustomStrategy[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showTaxReportDialog, setShowTaxReportDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CustomStrategy | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  useEffect(() => {
    // Initialize premium features data
    setCustomStrategies([
      {
        id: 'strategy-1',
        name: 'Conservative Growth',
        description: 'AI-optimized low-risk growth strategy with dividend focus',
        status: 'active',
        performance: 12.5,
        riskScore: 3.2,
        allocation: { 'ASX Banks': 35, 'ASX Healthcare': 25, 'Bonds': 30, 'Cash': 10 },
        createdDate: '2024-08-01',
        lastModified: '2024-08-18'
      },
      {
        id: 'strategy-2',
        name: 'Tech Momentum',
        description: 'High-growth technology sector momentum strategy',
        status: 'paused',
        performance: 28.7,
        riskScore: 7.8,
        allocation: { 'ASX Tech': 60, 'US Tech ETF': 25, 'Growth Stocks': 15 },
        createdDate: '2024-07-15',
        lastModified: '2024-08-10'
      }
    ]);

    setAlertConfigs([
      {
        id: 'alert-1',
        name: 'Portfolio Rebalancing',
        type: 'portfolio',
        condition: 'allocation_drift',
        threshold: 5,
        enabled: true,
        channels: ['email', 'push']
      },
      {
        id: 'alert-2',
        name: 'CBA Price Alert',
        type: 'price',
        condition: 'price_above',
        threshold: 100,
        enabled: true,
        channels: ['email', 'sms']
      }
    ]);

    // Simulate optimization results
    setOptimizationResults({
      currentSharpe: 1.24,
      optimizedSharpe: 1.67,
      expectedReturn: 14.2,
      volatility: 8.5,
      maxDrawdown: 12.3,
      recommendations: [
        { action: 'increase', asset: 'Healthcare ETF', from: 15, to: 22, reason: 'Low correlation, strong fundamentals' },
        { action: 'decrease', asset: 'Mining Stocks', from: 20, to: 12, reason: 'High volatility, cyclical risk' },
        { action: 'add', asset: 'International Bonds', from: 0, to: 8, reason: 'Diversification, currency hedge' }
      ]
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateStrategy = () => {
    const newStrategy: CustomStrategy = {
      id: `strategy-${Date.now()}`,
      name: 'New Custom Strategy',
      description: 'Custom AI-powered investment strategy',
      status: 'draft',
      performance: 0,
      riskScore: 5.0,
      allocation: {},
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setCustomStrategies([...customStrategies, newStrategy]);
    setSelectedStrategy(newStrategy);
    setShowStrategyDialog(true);
  };

  const TabPanel = ({ children, value, index }: any) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const PortfolioOptimizationTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                AI Portfolio Optimization
              </Typography>
              <Chip 
                icon={<Diamond />} 
                label="Premium Feature" 
                color="primary" 
                variant="outlined" 
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Portfolio Analysis
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                      <Typography variant="h4" color="primary">1.24</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Expected Return</Typography>
                      <Typography variant="h4" color="success.main">11.8%</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Volatility</Typography>
                      <Typography variant="h4" color="warning.main">9.5%</Typography>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Analytics />}
                      sx={{ mt: 2 }}
                    >
                      Run Deep Analysis
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Optimized Portfolio Preview
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Projected Sharpe Ratio</Typography>
                      <Typography variant="h4" color="primary">1.67</Typography>
                      <Chip label="+35%" color="success" size="small" />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Projected Return</Typography>
                      <Typography variant="h4" color="success.main">14.2%</Typography>
                      <Chip label="+2.4%" color="success" size="small" />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Projected Volatility</Typography>
                      <Typography variant="h4" color="success.main">8.5%</Typography>
                      <Chip label="-1.0%" color="success" size="small" />
                    </Box>
                    
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<Rocket />}
                      sx={{ mt: 2 }}
                    >
                      Apply Optimization
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {optimizationResults && (
              <Card sx={{ mt: 3 }} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Optimization Recommendations
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Action</TableCell>
                          <TableCell>Asset</TableCell>
                          <TableCell>Current %</TableCell>
                          <TableCell>Target %</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {optimizationResults.recommendations.map((rec: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={rec.action.toUpperCase()} 
                                color={rec.action === 'increase' || rec.action === 'add' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{rec.asset}</TableCell>
                            <TableCell>{rec.from}%</TableCell>
                            <TableCell>{rec.to}%</TableCell>
                            <TableCell>{rec.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const CustomStrategiesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Custom Strategy Builder
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleCreateStrategy}
          >
            Create New Strategy
          </Button>
        </Box>
      </Grid>

      {customStrategies.map((strategy) => (
        <Grid item xs={12} md={6} key={strategy.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {strategy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {strategy.description}
                  </Typography>
                </Box>
                <Chip 
                  label={strategy.status.toUpperCase()}
                  color={strategy.status === 'active' ? 'success' : strategy.status === 'paused' ? 'warning' : 'default'}
                  size="small"
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Performance</Typography>
                  <Typography variant="h6" color={strategy.performance > 0 ? 'success.main' : 'error.main'}>
                    {strategy.performance > 0 ? '+' : ''}{strategy.performance}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Risk Score</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">{strategy.riskScore}/10</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={strategy.riskScore * 10} 
                      sx={{ ml: 1, flexGrow: 1 }}
                      color={strategy.riskScore < 4 ? 'success' : strategy.riskScore < 7 ? 'warning' : 'error'}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom>
                Asset Allocation
              </Typography>
              {Object.entries(strategy.allocation).map(([asset, percentage]) => (
                <Box key={asset} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{asset}</Typography>
                  <Typography variant="body2" fontWeight="bold">{percentage}%</Typography>
                </Box>
              ))}

              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                <Button size="small" startIcon={<Edit />}>Edit</Button>
                <Button size="small" startIcon={<Analytics />}>Backtest</Button>
                <Button size="small" startIcon={strategy.status === 'active' ? <Pause /> : <PlayArrow />}>
                  {strategy.status === 'active' ? 'Pause' : 'Activate'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const AlertsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Real-time Alert Configuration
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setShowAlertDialog(true)}
          >
            Create Alert
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            
            {alertConfigs.map((alert) => (
              <Paper key={alert.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ mr: 2 }}>
                        {alert.name}
                      </Typography>
                      <Chip 
                        label={alert.type.toUpperCase()} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {alert.condition.replace('_', ' ')} {alert.threshold}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {alert.channels.map((channel) => (
                        <Chip key={channel} label={channel} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch 
                      checked={alert.enabled}
                      size="small"
                    />
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alert Categories
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Price Alerts"
                  secondary="Stock price movements"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><BarChart color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Volume Alerts"
                  secondary="Trading volume spikes"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assessment color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Technical Indicators"
                  secondary="RSI, MACD, moving averages"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Psychology color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="AI Insights"
                  secondary="Model predictions and signals"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><AccountBalance color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Portfolio Events"
                  secondary="Rebalancing, risk thresholds"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const TaxReportingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Tax Reporting & Optimization
        </Typography>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              2024 Tax Year Summary
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">$3,247</Typography>
                  <Typography variant="body2" color="text.secondary">Realized Gains</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">$1,158</Typography>
                  <Typography variant="body2" color="text.secondary">Realized Losses</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">$892</Typography>
                  <Typography variant="body2" color="text.secondary">Dividend Income</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Tax Loss Harvesting Opportunity:</strong> You can realize $2,340 in losses 
                to offset your gains and reduce your tax liability by approximately $702.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                startIcon={<FileDownload />}
                onClick={() => setShowTaxReportDialog(true)}
              >
                Generate Tax Report
              </Button>
              <Button variant="outlined" startIcon={<TuneRounded />}>
                Optimize Tax Strategy
              </Button>
              <Button variant="outlined" startIcon={<Science />}>
                Tax Loss Harvesting
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tax Optimization Tools
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Automatic Tax Loss Harvesting"
                  secondary="Enabled"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Capital Gains Optimization"
                  secondary="Active"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Warning color="warning" /></ListItemIcon>
                <ListItemText 
                  primary="Dividend Timing"
                  secondary="Review recommended"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="FIFO Cost Basis"
                  secondary="Configured"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AdvancedAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Advanced Analytics & Performance Tracking
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk-Adjusted Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', portfolio: 1.2, benchmark: 0.8 },
                { month: 'Feb', portfolio: 1.5, benchmark: 1.1 },
                { month: 'Mar', portfolio: 1.8, benchmark: 1.3 },
                { month: 'Apr', portfolio: 2.1, benchmark: 1.6 },
                { month: 'May', portfolio: 2.4, benchmark: 1.8 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="portfolio" stroke="#2196f3" strokeWidth={3} name="Your Portfolio" />
                <Line type="monotone" dataKey="benchmark" stroke="#ff9800" strokeWidth={2} name="ASX 200 Benchmark" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sector Allocation vs Benchmark
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Banking', value: 25, color: '#2196f3' },
                    { name: 'Healthcare', value: 20, color: '#4caf50' },
                    { name: 'Mining', value: 18, color: '#ff9800' },
                    { name: 'Technology', value: 15, color: '#9c27b0' },
                    { name: 'REITs', value: 12, color: '#f44336' },
                    { name: 'Other', value: 10, color: '#607d8b' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {[
                    { name: 'Banking', value: 25, color: '#2196f3' },
                    { name: 'Healthcare', value: 20, color: '#4caf50' },
                    { name: 'Mining', value: 18, color: '#ff9800' },
                    { name: 'Technology', value: 15, color: '#9c27b0' },
                    { name: 'REITs', value: 12, color: '#f44336' },
                    { name: 'Other', value: 10, color: '#607d8b' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">1.67</Typography>
                  <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">2.8%</Typography>
                  <Typography variant="body2" color="text.secondary">Alpha vs ASX 200</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">0.92</Typography>
                  <Typography variant="body2" color="text.secondary">Beta</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">8.2%</Typography>
                  <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Premium Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white' }}>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
              <Star sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Premium Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Advanced AI-powered investment tools for {user?.name}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip 
                icon={<Diamond />} 
                label="ENTERPRISE PLAN" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Portfolio Value: <strong>${user?.portfolio_value?.toLocaleString() || '150,000'}</strong> • 
            Daily P&L: <strong style={{ color: '#4ade80' }}>+$1,247 (+0.83%)</strong>
          </Typography>
        </CardContent>
      </Card>

      {/* Premium Features Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Rocket />} label="Portfolio Optimization" />
            <Tab icon={<Build />} label="Custom Strategies" />
            <Tab icon={<Notifications />} label="Smart Alerts" />
            <Tab icon={<Assessment />} label="Tax Reporting" />
            <Tab icon={<Analytics />} label="Advanced Analytics" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={activeTab} index={0}>
            <PortfolioOptimizationTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <CustomStrategiesTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <AlertsTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <TaxReportingTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={4}>
            <AdvancedAnalyticsTab />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Strategy Creation Dialog */}
      <Dialog open={showStrategyDialog} onClose={() => setShowStrategyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Custom Strategy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Strategy Name"
                defaultValue={selectedStrategy?.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                defaultValue={selectedStrategy?.description}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select label="Risk Level" defaultValue="medium">
                  <MenuItem value="low">Low Risk (1-3)</MenuItem>
                  <MenuItem value="medium">Medium Risk (4-6)</MenuItem>
                  <MenuItem value="high">High Risk (7-10)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Investment Horizon</InputLabel>
                <Select label="Investment Horizon" defaultValue="long">
                  <MenuItem value="short">Short-term (1-3 years)</MenuItem>
                  <MenuItem value="medium">Medium-term (3-7 years)</MenuItem>
                  <MenuItem value="long">Long-term (7+ years)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStrategyDialog(false)}>Cancel</Button>
          <Button variant="contained">Create Strategy</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Creation Dialog */}
      <Dialog open={showAlertDialog} onClose={() => setShowAlertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Alert Name" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Alert Type</InputLabel>
                <Select label="Alert Type">
                  <MenuItem value="price">Price Movement</MenuItem>
                  <MenuItem value="volume">Volume Spike</MenuItem>
                  <MenuItem value="technical">Technical Indicator</MenuItem>
                  <MenuItem value="portfolio">Portfolio Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Threshold" type="number" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Notification Channels
              </Typography>
              <FormControlLabel control={<Checkbox defaultChecked />} label="Email" />
              <FormControlLabel control={<Checkbox />} label="SMS" />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Push Notification" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertDialog(false)}>Cancel</Button>
          <Button variant="contained">Create Alert</Button>
        </DialogActions>
      </Dialog>

      {/* Tax Report Dialog */}
      <Dialog open={showTaxReportDialog} onClose={() => setShowTaxReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Tax Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Generate comprehensive tax reports for the Australian Tax Office (ATO).
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tax Year</InputLabel>
            <Select label="Tax Year" defaultValue="2024">
              <MenuItem value="2024">2023-2024</MenuItem>
              <MenuItem value="2023">2022-2023</MenuItem>
              <MenuItem value="2022">2021-2022</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" defaultValue="full">
              <MenuItem value="full">Complete Tax Statement</MenuItem>
              <MenuItem value="gains">Capital Gains/Losses Only</MenuItem>
              <MenuItem value="dividends">Dividend Income Only</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel 
            control={<Checkbox defaultChecked />} 
            label="Include ATO-ready CSV format" 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaxReportDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<FileDownload />}>
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PremiumCustomerFlow;