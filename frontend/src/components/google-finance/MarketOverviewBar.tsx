/**
 * Market Overview Bar Component
 * Google Finance style top market ticker bar
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

interface MarketDataPoint {
  name: string;
  value: number;
  change: string;
  trend: 'up' | 'down';
}

const MarketOverviewBar: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('MARKETS');
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([
    { name: 'ASX 200', value: 8234.50, change: '+0.36%', trend: 'up' },
    { name: 'S&P 500', value: 5634.61, change: '-0.24%', trend: 'down' },
    { name: 'Nasdaq', value: 17859.53, change: '-0.67%', trend: 'down' },
    { name: 'FTSE 100', value: 8405.21, change: '+0.12%', trend: 'up' },
    { name: 'AUD/USD', value: 0.6623, change: '+0.15%', trend: 'up' }
  ]);

  const tabs = ['MARKETS', 'US', 'Europe', 'Asia', 'Currencies', 'Crypto', 'Futures'];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => {
        const changeValue = (Math.random() - 0.5) * 0.02;
        const newValue = item.value * (1 + changeValue);
        const changePercent = ((newValue - item.value) / item.value * 100).toFixed(2);
        
        return {
          ...item,
          value: newValue,
          change: `${changeValue >= 0 ? '+' : ''}${changePercent}%`,
          trend: changeValue >= 0 ? 'up' : 'down'
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Market Tabs */}
      <Box
        sx={{
          display: 'flex',
          px: 3,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              py: 1.5,
              px: 2,
              minWidth: 'auto',
              borderRadius: 0,
              borderBottom: activeTab === tab ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
              color: activeTab === tab ? theme.palette.primary.main : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            <Typography variant="body2" fontWeight={activeTab === tab ? 500 : 400}>
              {tab}
            </Typography>
          </Button>
        ))}
      </Box>

      {/* Market Ticker */}
      <Box
        sx={{
          display: 'flex',
          px: 3,
          py: 1,
          gap: 4,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {marketData.map((market, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 120,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.5),
                borderRadius: 1,
                p: 0.5,
                mx: -0.5
              }
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '12px' }}
            >
              {market.name}
            </Typography>
            
            <Typography
              variant="body2"
              fontWeight={500}
              color="text.primary"
              sx={{ fontFamily: 'monospace', fontSize: '14px' }}
            >
              {market.name.includes('USD') 
                ? market.value.toFixed(4) 
                : market.value.toLocaleString()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {market.trend === 'up' ? (
                <TrendingUp sx={{ fontSize: 12, color: 'success.main' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 12, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                color={market.trend === 'up' ? 'success.main' : 'error.main'}
                sx={{ fontFamily: 'monospace', fontSize: '12px' }}
              >
                {market.change}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default MarketOverviewBar;