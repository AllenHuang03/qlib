import React, { useState } from 'react';
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

const mockHoldings: Holding[] = [
  {
    symbol: '000001.SZ',
    name: 'Ping An Bank',
    quantity: 5000,
    price: 15.68,
    value: 78400,
    weight: 6.4,
    pnl: 3200,
    pnlPercent: 4.2,
  },
  {
    symbol: '000002.SZ',
    name: 'Vanke A',
    quantity: 3200,
    price: 18.45,
    value: 59040,
    weight: 4.8,
    pnl: -1250,
    pnlPercent: -2.1,
  },
  {
    symbol: '600036.SH',
    name: 'China Merchants Bank',
    quantity: 2500,
    price: 42.15,
    value: 105375,
    weight: 8.6,
    pnl: 5640,
    pnlPercent: 5.7,
  },
  {
    symbol: '600519.SH',
    name: 'Kweichow Moutai',
    quantity: 100,
    price: 1845.50,
    value: 184550,
    weight: 15.0,
    pnl: 12400,
    pnlPercent: 7.2,
  },
  {
    symbol: '000858.SZ',
    name: 'Wuliangye',
    quantity: 800,
    price: 168.90,
    value: 135120,
    weight: 11.0,
    pnl: 8960,
    pnlPercent: 7.1,
  },
];

const sectorData = [
  { name: 'Consumer Staples', value: 35.2, color: '#8884d8' },
  { name: 'Financials', value: 28.7, color: '#82ca9d' },
  { name: 'Technology', value: 18.5, color: '#ffc658' },
  { name: 'Healthcare', value: 9.8, color: '#ff7300' },
  { name: 'Industrials', value: 7.8, color: '#00ff00' },
];

export default function Portfolio() {
  const [tabValue, setTabValue] = useState(0);
  
  const totalValue = mockHoldings.reduce((sum, holding) => sum + holding.value, 0);
  const totalPnL = mockHoldings.reduce((sum, holding) => sum + holding.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Portfolio
        </Typography>
        <IconButton color="primary">
          <Refresh />
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
                {mockHoldings.length}
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
                  {mockHoldings.map((holding) => (
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
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Portfolio Performance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance metrics and analytics will be displayed here.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}