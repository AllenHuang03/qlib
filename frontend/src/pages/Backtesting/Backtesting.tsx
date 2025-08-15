import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add, PlayArrow, Assessment } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { backtestsAPI, modelsAPI, Backtest, Model } from '../../services/api';

interface BacktestResult {
  id: string;
  name: string;
  model: string;
  startDate: string;
  endDate: string;
  returns: number;
  sharpe: number;
  maxDrawdown: number;
  status: 'completed' | 'running' | 'failed';
  createdAt: string;
}

const mockResults: BacktestResult[] = [
  {
    id: '1',
    name: 'LSTM Strategy Test',
    model: 'LSTM-Alpha158',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    returns: 18.5,
    sharpe: 1.67,
    maxDrawdown: -5.2,
    status: 'completed',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Multi-Factor Analysis',
    model: 'LightGBM-Multi',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    returns: 22.1,
    sharpe: 1.89,
    maxDrawdown: -4.8,
    status: 'completed',
    createdAt: '2024-01-12',
  },
  {
    id: '3',
    name: 'HFT Strategy Test',
    model: 'GRU-HFT',
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    returns: 12.8,
    sharpe: 1.43,
    maxDrawdown: -3.2,
    status: 'running',
    createdAt: '2024-01-10',
  },
];

const performanceData = [
  { date: '2023-01', value: 100, benchmark: 100 },
  { date: '2023-02', value: 102.5, benchmark: 101.2 },
  { date: '2023-03', value: 108.9, benchmark: 103.8 },
  { date: '2023-04', value: 106.7, benchmark: 102.1 },
  { date: '2023-05', value: 114.5, benchmark: 105.6 },
  { date: '2023-06', value: 118.2, benchmark: 107.2 },
  { date: '2023-07', value: 122.8, benchmark: 108.9 },
  { date: '2023-08', value: 119.5, benchmark: 107.5 },
  { date: '2023-09', value: 125.6, benchmark: 110.2 },
  { date: '2023-10', value: 128.9, benchmark: 111.8 },
  { date: '2023-11', value: 132.1, benchmark: 113.4 },
  { date: '2023-12', value: 135.8, benchmark: 115.0 },
];

export default function Backtesting() {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>(mockResults);
  const [newBacktest, setNewBacktest] = useState({
    name: '',
    model: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    benchmark: 'CSI300',
    initialCapital: '1000000',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCreateBacktest = () => {
    console.log('Creating backtest:', newBacktest);
    
    // Create new backtest entry
    const newBacktestEntry: BacktestResult = {
      id: (backtestResults.length + 1).toString(),
      name: newBacktest.name || 'New Backtest',
      model: newBacktest.model,
      startDate: newBacktest.startDate?.toISOString().split('T')[0] || '2024-01-01',
      endDate: newBacktest.endDate?.toISOString().split('T')[0] || '2024-12-31',
      returns: Math.round((Math.random() * 20 - 5) * 10) / 10, // Random returns between -5% and 15%
      sharpe: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // Random sharpe between 0.5 and 2.5
      maxDrawdown: Math.round(-(Math.random() * 10 + 2) * 10) / 10, // Random drawdown between -2% and -12%
      status: 'running' as const,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    // Add to the results list
    setBacktestResults(prev => [newBacktestEntry, ...prev]);
    
    console.log('New backtest created:', newBacktestEntry);
    alert(`Backtest "${newBacktest.name}" started successfully!\n\nModel: ${newBacktest.model}\nPeriod: ${newBacktest.startDate?.toDateString()} to ${newBacktest.endDate?.toDateString()}\nStatus: Running\n\nCheck the Results tab to monitor progress.`);
    
    setCreateDialogOpen(false);
    setNewBacktest({
      name: '',
      model: '',
      startDate: null,
      endDate: null,
      benchmark: 'CSI300',
      initialCapital: '1000000',
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setNewBacktest(prev => ({ ...prev, [field]: value }));
  };

  const handleBacktestClick = (backtest: BacktestResult) => {
    console.log('Backtest clicked:', backtest);
    alert(`Backtest Details:\nName: ${backtest.name}\nModel: ${backtest.model}\nReturns: ${backtest.returns}%\nSharpe: ${backtest.sharpe}\nMax Drawdown: ${backtest.maxDrawdown}%\n\nFull performance metrics and trade logs available in detailed view.`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Backtesting
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Backtest
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Results" />
            <Tab label="Performance" />
            <Tab label="Configuration" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Backtest Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Returns</TableCell>
                      <TableCell align="right">Sharpe</TableCell>
                      <TableCell align="right">Max DD</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backtestResults.map((result) => (
                      <TableRow key={result.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleBacktestClick(result)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {result.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{result.model}</TableCell>
                        <TableCell>
                          {result.startDate} to {result.endDate}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={result.returns >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="medium"
                          >
                            {result.returns >= 0 ? '+' : ''}{result.returns.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{result.sharpe.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Typography color="error.main" fontWeight="medium">
                            {result.maxDrawdown.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={result.status}
                            color={getStatusColor(result.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{result.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Strategy vs Benchmark Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#1976d2"
                        strokeWidth={3}
                        name="Strategy"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#dc004e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Benchmark"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Key Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Return
                      </Typography>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        +35.8%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Annual Volatility
                      </Typography>
                      <Typography variant="h6">12.4%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6">67.3%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Beta
                      </Typography>
                      <Typography variant="h6">0.84</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Risk Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed risk analysis charts and metrics would be displayed here.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Backtest Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure default settings for new backtests, including risk management parameters,
                execution settings, and benchmark selections.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Create Backtest Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Backtest</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Backtest Name"
              fullWidth
              variant="outlined"
              value={newBacktest.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={newBacktest.model}
                label="Model"
                onChange={(e: SelectChangeEvent) => handleInputChange('model', e.target.value)}
              >
                <MenuItem value="LSTM-Alpha158">LSTM-Alpha158</MenuItem>
                <MenuItem value="LightGBM-Multi">LightGBM-Multi</MenuItem>
                <MenuItem value="Transformer-HFT">Transformer-HFT</MenuItem>
                <MenuItem value="GRU-Momentum">GRU-Momentum</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <DatePicker
                  label="Start Date"
                  value={newBacktest.startDate}
                  onChange={(date) => handleInputChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="End Date"
                  value={newBacktest.endDate}
                  onChange={(date) => handleInputChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Benchmark</InputLabel>
              <Select
                value={newBacktest.benchmark}
                label="Benchmark"
                onChange={(e: SelectChangeEvent) => handleInputChange('benchmark', e.target.value)}
              >
                <MenuItem value="CSI300">CSI300</MenuItem>
                <MenuItem value="CSI500">CSI500</MenuItem>
                <MenuItem value="SZSE">SZSE Composite</MenuItem>
                <MenuItem value="SSE">SSE Composite</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Initial Capital"
              type="number"
              fullWidth
              variant="outlined"
              value={newBacktest.initialCapital}
              onChange={(e) => handleInputChange('initialCapital', e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBacktest} variant="contained" startIcon={<PlayArrow />}>
              Start Backtest
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}