import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';
import { portfolioAPI, marketAPI } from '../../services/api';
import { CircularProgress, Snackbar, Alert } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  pnl: number;
  pnlPercent: number;
}

// 🇦🇺 Australian Portfolio Holdings - ASX Listed Companies
const mockHoldings: Holding[] = [
  {
    symbol: 'CBA.AX',
    name: 'Commonwealth Bank',
    quantity: 850,
    price: 110.50,
    value: 93925,
    weight: 15.2,
    pnl: 4850,
    pnlPercent: 5.4,
  },
  {
    symbol: 'BHP.AX', 
    name: 'BHP Group',
    quantity: 2200,
    price: 45.20,
    value: 99440,
    weight: 16.1,
    pnl: 6240,
    pnlPercent: 6.7,
  },
  {
    symbol: 'CSL.AX',
    name: 'CSL Limited',
    quantity: 180,
    price: 285.40,
    value: 51372,
    weight: 8.3,
    pnl: 2180,
    pnlPercent: 4.4,
  },
  {
    symbol: 'WBC.AX',
    name: 'Westpac Banking',
    quantity: 1850,
    price: 24.50,
    value: 45325,
    weight: 7.3,
    pnl: -890,
    pnlPercent: -1.9,
  },
  {
    symbol: 'WOW.AX',
    name: 'Woolworths Group',
    quantity: 1100,
    price: 38.50,
    value: 42350,
    weight: 6.9,
    pnl: 1850,
    pnlPercent: 4.6,
  },
  {
    symbol: 'TLS.AX',
    name: 'Telstra Corporation',
    quantity: 8500,
    price: 4.15,
    value: 35275,
    weight: 5.7,
    pnl: 980,
    pnlPercent: 2.9,
  },
  {
    symbol: 'RIO.AX',
    name: 'Rio Tinto',
    quantity: 480,
    price: 124.30,
    value: 59664,
    weight: 9.7,
    pnl: 3420,
    pnlPercent: 6.1,
  },
  {
    symbol: 'ANZ.AX',
    name: 'ANZ Bank',
    quantity: 1650,
    price: 27.30,
    value: 45045,
    weight: 7.3,
    pnl: 1245,
    pnlPercent: 2.8,
  },
];

// 🇦🇺 Australian Sector Allocation (ASX sectors)
const sectorData = [
  { name: 'Financials', value: 45.9, color: '#8884d8' }, // CBA, WBC, ANZ
  { name: 'Materials', value: 25.8, color: '#82ca9d' }, // BHP, RIO  
  { name: 'Healthcare', value: 8.3, color: '#ff7300' }, // CSL
  { name: 'Consumer Staples', value: 6.9, color: '#ffc658' }, // WOW
  { name: 'Communication Services', value: 5.7, color: '#00ff88' }, // TLS
  { name: 'Other', value: 7.4, color: '#ff6b6b' }, // Diversification
];

export default function Portfolio() {
  const [tabValue, setTabValue] = useState(0);
  const [holdings, setHoldings] = useState(mockHoldings);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefreshPortfolio = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // Try to fetch real portfolio data
      const portfolioData = await portfolioAPI.getHoldings();
      
      if (portfolioData && portfolioData.length > 0) {
        // Convert API data to component format
        const formattedHoldings = portfolioData.map(holding => ({
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          price: holding.price,
          value: holding.value,
          weight: holding.weight,
          pnl: holding.pnl,
          pnlPercent: holding.pnl_percent,
        }));
        setHoldings(formattedHoldings);
      } else {
        // Refresh current mock data with updated prices
        const updatedHoldings = await Promise.all(
          holdings.map(async (holding) => {
            try {
              const quote = await marketAPI.getQuote(holding.symbol);
              const newPrice = quote.price || holding.price;
              const newValue = holding.quantity * newPrice;
              const pnl = newValue - (holding.value - holding.pnl);
              
              return {
                ...holding,
                price: newPrice,
                value: newValue,
                pnl: pnl,
                pnlPercent: ((pnl / (newValue - pnl)) * 100),
              };
            } catch (error) {
              console.warn(`Failed to update price for ${holding.symbol}:`, error);
              return holding;
            }
          })
        );
        setHoldings(updatedHoldings);
      }
      
      setLastUpdated(new Date());
      setSnackbar({ open: true, message: 'Portfolio refreshed successfully', severity: 'success' });
      console.log('Portfolio refreshed successfully');
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      setSnackbar({ open: true, message: 'Failed to refresh portfolio. Using cached data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh portfolio on component mount
  useEffect(() => {
    handleRefreshPortfolio();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Portfolio
        </Typography>
        <IconButton 
          color="primary" 
          onClick={handleRefreshPortfolio}
          disabled={loading}
          title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
        >
          <Refresh sx={{ 
            animation: loading ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
        </IconButton>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ${totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total P&L
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${totalPnL.toLocaleString()}
                  </Typography>
                </Box>
                {totalPnL >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                P&L Percentage
              </Typography>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                color={totalPnLPercent >= 0 ? 'success.main' : 'error.main'}
              >
                {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Number of Holdings
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {holdings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Holdings" />
          <Tab label="Sector Allocation" />
          <Tab label="Performance" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Current Holdings
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">P&L</TableCell>
                    <TableCell align="right">P&L %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((holding) => (
                    <TableRow key={holding.symbol} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {holding.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {holding.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {holding.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${holding.price.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${holding.value.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {holding.weight.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={holding.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {holding.pnl >= 0 ? '+' : ''}${Math.abs(holding.pnl).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${holding.pnlPercent >= 0 ? '+' : ''}${holding.pnlPercent.toFixed(1)}%`}
                          color={holding.pnlPercent >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
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
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Sector Allocation
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Sector Details
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sector</TableCell>
                        <TableCell align="right">Allocation</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sectorData.map((sector) => (
                        <TableRow key={sector.name}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: sector.color,
                                }}
                              />
                              {sector.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{sector.value}%</TableCell>
                          <TableCell align="right">
                            ${((totalValue * sector.value) / 100).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      30-Day Return
                    </Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      +8.4%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Volatility
                    </Typography>
                    <Typography variant="h6">
                      12.3%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="h6">
                      1.67
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Beta (vs ASX 200)
                    </Typography>
                    <Typography variant="h6">
                      0.84
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Risk Analysis
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Value at Risk (95%)
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      -$8,450
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      -5.2%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Concentration Risk
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      Medium
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Correlation to Market
                    </Typography>
                    <Typography variant="h6">
                      0.78
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}