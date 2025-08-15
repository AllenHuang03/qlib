import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Settings,
  TrendingUp,
  TrendingDown,
  ShowChart
} from '@mui/icons-material';
import { marketAPI, aiAPI, tradingAPI } from '../../services/api';

interface TradingAgent {
  id: string;
  name: string;
  model_type: string;
  status: 'running' | 'paused' | 'stopped';
  performance: {
    total_return: number;
    sharpe_ratio: number;
    win_rate: number;
    trades_count: number;
  };
  current_position: {
    symbol: string;
    quantity: number;
    entry_price: number;
    current_pnl: number;
  } | null;
  last_signal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    confidence: number;
    timestamp: string;
  } | null;
}

const TradingEnvironment: React.FC = () => {
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [tradingActivity, setTradingActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [testMode, setTestMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    initializeEnvironment();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        updateMarketData();
        updateAgentStatus();
        updateTradingActivity();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const initializeEnvironment = async () => {
    setLoading(true);
    try {
      // Get trading agents from API
      const agentsResponse = await tradingAPI.getAgents();
      setAgents(agentsResponse.agents || []);
      
      // Get market data
      await updateMarketData();
      
      // Get trading activity
      await updateTradingActivity();
    } catch (error) {
      console.error('Failed to initialize trading environment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTradingActivity = async () => {
    try {
      const response = await tradingAPI.getActivity();
      setTradingActivity(response.activity || []);
    } catch (error) {
      console.error('Failed to update trading activity:', error);
    }
  };

  const updateMarketData = async () => {
    try {
      const response = await marketAPI.getQuotes();
      setMarketData(response.quotes || []);
    } catch (error) {
      console.error('Failed to update market data:', error);
    }
  };

  const updateAgentStatus = async () => {
    try {
      // Get fresh agent data from API
      const agentsResponse = await tradingAPI.getAgents();
      setAgents(agentsResponse.agents || []);
    } catch (error) {
      console.error('Failed to update agent status:', error);
    }
  };

  const controlAgent = async (agentId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      await tradingAPI.controlAgent(agentId, action);
      
      // Update local state immediately for better UX
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'stopped' }
          : agent
      ));
    } catch (error) {
      console.error('Failed to control agent:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'error';
      default: return 'default';
    }
  };

  const getSignalColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      case 'HOLD': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Trading Environment</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Trading Environment</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
              />
            }
            label="Test Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <IconButton onClick={() => setSettingsOpen(true)}>
            <Settings />
          </IconButton>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => {
              updateMarketData();
              updateAgentStatus();
              updateTradingActivity();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {testMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Test Mode Enabled - All trades are simulated and no real money is involved
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Market Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Market Overview</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell align="right">Volume</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketData.slice(0, 5).map((quote) => (
                      <TableRow key={quote.symbol}>
                        <TableCell>{quote.symbol}</TableCell>
                        <TableCell>{quote.company_name}</TableCell>
                        <TableCell align="right">${quote.price}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: quote.change >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {quote.change >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                            {quote.change_percent}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{quote.volume?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trading Agents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Trading Agents</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="right">Sharpe</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                      <TableCell>Current Position</TableCell>
                      <TableCell>Last Signal</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">{agent.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {agent.model_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={agent.status} 
                            color={getStatusColor(agent.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={agent.performance.total_return >= 0 ? 'success.main' : 'error.main'}
                          >
                            {agent.performance.total_return.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{agent.performance.sharpe_ratio}</TableCell>
                        <TableCell align="right">{agent.performance.win_rate.toFixed(1)}%</TableCell>
                        <TableCell>
                          {agent.current_position ? (
                            <Box>
                              <Typography variant="caption">
                                {agent.current_position.symbol} x{agent.current_position.quantity}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                display="block"
                                color={agent.current_position.current_pnl >= 0 ? 'success.main' : 'error.main'}
                              >
                                P&L: ${agent.current_position.current_pnl.toFixed(0)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No position
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {agent.last_signal && (
                            <Box>
                              <Chip
                                label={agent.last_signal.action}
                                color={getSignalColor(agent.last_signal.action) as any}
                                size="small"
                              />
                              <Typography variant="caption" display="block">
                                {agent.last_signal.symbol} ({(agent.last_signal.confidence * 100).toFixed(0)}%)
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => controlAgent(agent.id, agent.status === 'running' ? 'pause' : 'start')}
                              color={agent.status === 'running' ? 'warning' : 'success'}
                            >
                              {agent.status === 'running' ? <Pause /> : <PlayArrow />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => controlAgent(agent.id, 'stop')}
                              color="error"
                            >
                              <Stop />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Overall Performance</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Return</Typography>
                  <Typography variant="h4" color="success.main">
                    {agents.reduce((sum, agent) => sum + agent.performance.total_return, 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average Sharpe Ratio</Typography>
                  <Typography variant="h4">
                    {(agents.reduce((sum, agent) => sum + agent.performance.sharpe_ratio, 0) / agents.length).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Active Agents</Typography>
                  <Typography variant="h4">
                    {agents.filter(a => a.status === 'running').length}/{agents.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trades */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Trading Activity</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Agent</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tradingActivity.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{trade.time}</TableCell>
                        <TableCell>{trade.agent}</TableCell>
                        <TableCell>
                          <Chip 
                            label={trade.action} 
                            color={trade.action === 'BUY' ? 'success' : trade.action === 'SELL' ? 'error' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell align="right">{trade.quantity}</TableCell>
                        <TableCell align="right">${trade.price}</TableCell>
                      </TableRow>
                    ))}
                    {tradingActivity.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No recent trading activity</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trading Environment Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Default Market</InputLabel>
              <Select value="ASX" label="Default Market">
                <MenuItem value="ASX">Australian Securities Exchange (ASX)</MenuItem>
                <MenuItem value="NYSE">New York Stock Exchange (NYSE)</MenuItem>
                <MenuItem value="NASDAQ">NASDAQ</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Refresh Interval (seconds)"
              type="number"
              defaultValue={5}
              fullWidth
            />
            
            <TextField
              label="Max Agents"
              type="number"
              defaultValue={5}
              fullWidth
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Risk Management"
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Real-time Notifications"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingEnvironment;