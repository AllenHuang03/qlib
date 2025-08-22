/**
 * Market Depth Component
 * Simple market depth visualization and trading statistics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  VolumeUp,
  Schedule
} from '@mui/icons-material';

interface MarketDepthProps {
  symbol: string;
}

interface MarketStats {
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  lastTrade: number;
  bidSize: number;
  askSize: number;
}

const MarketDepth: React.FC<MarketDepthProps> = ({ symbol }) => {
  const theme = useTheme();
  const [stats, setStats] = useState<MarketStats>({
    dayHigh: 0,
    dayLow: 0,
    volume: 0,
    avgVolume: 0,
    lastTrade: Date.now(),
    bidSize: 0,
    askSize: 0
  });

  // Generate realistic market statistics
  useEffect(() => {
    const basePrice = getBasePriceForSymbol(symbol);
    const baseVolume = getBaseVolumeForSymbol(symbol);
    
    const updateStats = () => {
      const volatility = 0.03; // 3% daily range
      const dayLow = basePrice * (1 - volatility/2 - Math.random() * volatility/2);
      const dayHigh = basePrice * (1 + volatility/2 + Math.random() * volatility/2);
      
      setStats({
        dayHigh,
        dayLow,
        volume: Math.floor(baseVolume * (0.8 + Math.random() * 0.4)),
        avgVolume: baseVolume,
        lastTrade: Date.now() - Math.floor(Math.random() * 30000), // Last 30 seconds
        bidSize: Math.floor(Math.random() * 10000) + 1000,
        askSize: Math.floor(Math.random() * 10000) + 1000
      });
    };

    updateStats();
    
    // Update every 10 seconds
    const interval = setInterval(updateStats, 10000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  const getBasePriceForSymbol = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'CBA.AX': 94.50,
      'BHP.AX': 42.30,
      'CSL.AX': 295.80,
      'WBC.AX': 23.45,
      'ANZ.AX': 25.67,
      'NAB.AX': 32.10,
      'WES.AX': 52.30,
      'TLS.AX': 4.15
    };
    return basePrices[symbol] || 50.00;
  };

  const getBaseVolumeForSymbol = (symbol: string): number => {
    const baseVolumes: { [key: string]: number } = {
      'CBA.AX': 1200000,
      'BHP.AX': 1800000,
      'CSL.AX': 600000,
      'WBC.AX': 1000000,
      'ANZ.AX': 900000,
      'NAB.AX': 950000,
      'WES.AX': 450000,
      'TLS.AX': 1300000
    };
    return baseVolumes[symbol] || 800000;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toString();
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}秒前`;
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', px: 2 }}>
        交易统计
      </Typography>
      
      <Box sx={{ px: 2 }}>
        <Grid container spacing={1}>
          {/* Day High/Low */}
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1 }}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" display="block" color="text.secondary">
                  日内最高
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                  ${stats.dayHigh.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1 }}>
                <TrendingDown fontSize="small" color="error" />
                <Typography variant="caption" display="block" color="text.secondary">
                  日内最低
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                  ${stats.dayLow.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Volume */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VolumeUp fontSize="small" color="primary" />
                  <Typography variant="caption" fontWeight="bold">
                    成交量统计
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      今日成交:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                      {formatVolume(stats.volume)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      平均成交:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                      {formatVolume(stats.avgVolume)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Bid/Ask Size */}
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
                  买盘量
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                  {formatVolume(stats.bidSize)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" display="block" color="error.main" fontWeight="bold">
                  卖盘量
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                  {formatVolume(stats.askSize)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Last Trade */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule fontSize="small" color="info" />
                  <Typography variant="caption" fontWeight="bold">
                    最后交易: {formatTime(stats.lastTrade)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Market Status */}
      <Box sx={{ 
        mt: 2, 
        p: 1.5, 
        mx: 2,
        borderRadius: 1,
        background: alpha(theme.palette.success.main, 0.1),
        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
      }}>
        <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: theme.palette.success.main,
              animation: 'pulse 2s infinite'
            }}
          />
          市场开放中
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          交易活跃 • 正常波动范围内
        </Typography>
      </Box>
    </Box>
  );
};

export default MarketDepth;