/**
 * Volume Indicators and Market Data Display Panel
 * Professional-grade volume analysis and market microstructure data
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  TrendingUp,
  TrendingDown,
  Speed,
  Timeline,
  Analytics,
  MonetizationOn,
  AccountBalance,
  ShowChart,
  BarChart,
  Equalizer,
  Settings,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { CandlestickData } from '../../types/market';

export interface VolumeMetrics {
  totalVolume: number;
  avgVolume: number;
  volumeRatio: number;
  vwap: number;
  volumeProfile: VolumeLevel[];
  buyVolume: number;
  sellVolume: number;
  neutralVolume: number;
  largeTradeCount: number;
  mediumTradeCount: number;
  smallTradeCount: number;
  volumeWeightedPrice: number;
}

export interface VolumeLevel {
  price: number;
  volume: number;
  percentage: number;
  type: 'buy' | 'sell' | 'neutral';
}

export interface MarketDepth {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  orders: number;
}

interface VolumePanelProps {
  data: CandlestickData[];
  symbol: string;
  marketDepth?: MarketDepth;
  showVolumeProfile?: boolean;
  showOrderBook?: boolean;
  showVolumeIndicators?: boolean;
  className?: string;
}

const VolumePanel: React.FC<VolumePanelProps> = ({
  data,
  symbol,
  marketDepth,
  showVolumeProfile = true,
  showOrderBook = true,
  showVolumeIndicators = true,
  className = '',
}) => {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'vwap' | 'profile'>('volume');
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1d');
  const [showSettings, setShowSettings] = useState(false);

  // Calculate volume metrics
  const volumeMetrics = useMemo((): VolumeMetrics => {
    if (!data || data.length === 0) {
      return {
        totalVolume: 0,
        avgVolume: 0,
        volumeRatio: 1,
        vwap: 0,
        volumeProfile: [],
        buyVolume: 0,
        sellVolume: 0,
        neutralVolume: 0,
        largeTradeCount: 0,
        mediumTradeCount: 0,
        smallTradeCount: 0,
        volumeWeightedPrice: 0,
      };
    }

    const recentData = data.slice(-50); // Last 50 periods
    const totalVolume = recentData.reduce((sum, candle) => sum + candle.volume, 0);
    const avgVolume = totalVolume / recentData.length;
    const currentVolume = recentData[recentData.length - 1]?.volume || 0;

    // Calculate VWAP (Volume Weighted Average Price)
    let vwapNumerator = 0;
    let vwapDenominator = 0;
    
    recentData.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      vwapNumerator += typicalPrice * candle.volume;
      vwapDenominator += candle.volume;
    });
    
    const vwap = vwapDenominator > 0 ? vwapNumerator / vwapDenominator : 0;

    // Generate volume profile
    const priceRanges = 20;
    const minPrice = Math.min(...recentData.map(c => c.low));
    const maxPrice = Math.max(...recentData.map(c => c.high));
    const priceStep = (maxPrice - minPrice) / priceRanges;
    
    const volumeProfile: VolumeLevel[] = [];
    
    for (let i = 0; i < priceRanges; i++) {
      const rangeMin = minPrice + (i * priceStep);
      const rangeMax = minPrice + ((i + 1) * priceStep);
      const rangePrice = (rangeMin + rangeMax) / 2;
      
      let rangeVolume = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      
      recentData.forEach(candle => {
        if (candle.low <= rangeMax && candle.high >= rangeMin) {
          const overlap = Math.min(rangeMax, candle.high) - Math.max(rangeMin, candle.low);
          const overlapRatio = overlap / (candle.high - candle.low);
          const allocatedVolume = candle.volume * overlapRatio;
          
          rangeVolume += allocatedVolume;
          
          // Classify volume based on price action
          if (candle.close > candle.open) {
            buyVolume += allocatedVolume * 0.7;
            sellVolume += allocatedVolume * 0.3;
          } else if (candle.close < candle.open) {
            sellVolume += allocatedVolume * 0.7;
            buyVolume += allocatedVolume * 0.3;
          } else {
            buyVolume += allocatedVolume * 0.5;
            sellVolume += allocatedVolume * 0.5;
          }
        }
      });
      
      if (rangeVolume > 0) {
        volumeProfile.push({
          price: rangePrice,
          volume: rangeVolume,
          percentage: (rangeVolume / totalVolume) * 100,
          type: buyVolume > sellVolume ? 'buy' : sellVolume > buyVolume ? 'sell' : 'neutral',
        });
      }
    }
    
    volumeProfile.sort((a, b) => b.volume - a.volume);

    // Mock additional metrics (in real implementation, these would come from trade data)
    const buyVolume = totalVolume * (0.45 + Math.random() * 0.1); // 45-55% buy
    const sellVolume = totalVolume * (0.45 + Math.random() * 0.1); // 45-55% sell
    const neutralVolume = totalVolume - buyVolume - sellVolume;
    
    return {
      totalVolume,
      avgVolume,
      volumeRatio: currentVolume / avgVolume,
      vwap,
      volumeProfile: volumeProfile.slice(0, 10), // Top 10 levels
      buyVolume,
      sellVolume,
      neutralVolume,
      largeTradeCount: Math.floor(Math.random() * 50) + 10,
      mediumTradeCount: Math.floor(Math.random() * 200) + 50,
      smallTradeCount: Math.floor(Math.random() * 1000) + 500,
      volumeWeightedPrice: vwap,
    };
  }, [data]);

  // Mock market depth data
  const mockMarketDepth: MarketDepth = marketDepth || {
    bids: [
      { price: 110.45, size: 1500, orders: 8 },
      { price: 110.44, size: 2200, orders: 12 },
      { price: 110.43, size: 1800, orders: 9 },
      { price: 110.42, size: 3100, orders: 15 },
      { price: 110.41, size: 2500, orders: 11 },
    ],
    asks: [
      { price: 110.50, size: 1200, orders: 6 },
      { price: 110.51, size: 1900, orders: 10 },
      { price: 110.52, size: 1600, orders: 8 },
      { price: 110.53, size: 2800, orders: 14 },
      { price: 110.54, size: 2100, orders: 9 },
    ],
    spread: 0.05,
    midPrice: 110.475,
  };

  const latestCandle = data[data.length - 1];

  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      
      {/* Volume Overview */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp color="primary" />
              Volume Analysis - {symbol}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                >
                  <MenuItem value="1h">1H</MenuItem>
                  <MenuItem value="4h">4H</MenuItem>
                  <MenuItem value="1d">1D</MenuItem>
                  <MenuItem value="1w">1W</MenuItem>
                </Select>
              </FormControl>
              
              <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
                <Settings />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Current Volume */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="caption" color="text.secondary">Current Volume</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  {latestCandle ? (latestCandle.volume / 1000000).toFixed(2) + 'M' : '0M'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                  {volumeMetrics.volumeRatio > 1 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                  <Typography 
                    variant="caption" 
                    color={volumeMetrics.volumeRatio > 1 ? "success.main" : "error.main"}
                  >
                    {volumeMetrics.volumeRatio.toFixed(2)}x avg
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Average Volume */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">50-Period Avg</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {(volumeMetrics.avgVolume / 1000000).toFixed(2)}M
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volume Average
                </Typography>
              </Paper>
            </Grid>

            {/* VWAP */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
                <Typography variant="caption" color="text.secondary">VWAP</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                  ${volumeMetrics.vwap.toFixed(2)}
                </Typography>
                <Typography 
                  variant="caption" 
                  color={latestCandle && latestCandle.close > volumeMetrics.vwap ? "success.main" : "error.main"}
                >
                  {latestCandle ? (latestCandle.close > volumeMetrics.vwap ? 'Above' : 'Below') : 'N/A'}
                </Typography>
              </Paper>
            </Grid>

            {/* Total Volume */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Total Volume (50P)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {(volumeMetrics.totalVolume / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recent Activity
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        
        {/* Volume Breakdown */}
        {showVolumeIndicators && (
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChart />
                  Volume Breakdown
                </Typography>

                {/* Buy/Sell Volume */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Buy Volume</Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {((volumeMetrics.buyVolume / volumeMetrics.totalVolume) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(volumeMetrics.buyVolume / volumeMetrics.totalVolume) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                    <Typography variant="body2">Sell Volume</Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {((volumeMetrics.sellVolume / volumeMetrics.totalVolume) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(volumeMetrics.sellVolume / volumeMetrics.totalVolume) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.error.main,
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Trade Size Distribution */}
                <Typography variant="subtitle2" gutterBottom>Trade Size Distribution</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, bgcolor: theme.palette.success.main }}>
                        <Typography variant="caption">L</Typography>
                      </Avatar>
                      <Typography variant="body2">Large (>$10k)</Typography>
                    </Box>
                    <Chip label={volumeMetrics.largeTradeCount} size="small" color="success" />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, bgcolor: theme.palette.warning.main }}>
                        <Typography variant="caption">M</Typography>
                      </Avatar>
                      <Typography variant="body2">Medium ($1k-$10k)</Typography>
                    </Box>
                    <Chip label={volumeMetrics.mediumTradeCount} size="small" color="warning" />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, bgcolor: theme.palette.info.main }}>
                        <Typography variant="caption">S</Typography>
                      </Avatar>
                      <Typography variant="body2">Small (<$1k)</Typography>
                    </Box>
                    <Chip label={volumeMetrics.smallTradeCount} size="small" color="info" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Volume Profile */}
        {showVolumeProfile && (
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Equalizer />
                  Volume Profile
                </Typography>

                <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                  {volumeMetrics.volumeProfile.map((level, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          ${level.price.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${level.percentage.toFixed(1)}%`}
                          size="small"
                          color={level.type === 'buy' ? 'success' : level.type === 'sell' ? 'error' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={level.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: level.type === 'buy' 
                              ? theme.palette.success.main 
                              : level.type === 'sell'
                              ? theme.palette.error.main
                              : theme.palette.grey[500],
                          }
                        }}
                      />
                      
                      <Typography variant="caption" color="text.secondary">
                        {(level.volume / 1000).toFixed(0)}k volume
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Order Book / Market Depth */}
        {showOrderBook && (
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance />
                  Market Depth
                  <Chip label={`Spread: $${mockMarketDepth.spread.toFixed(3)}`} size="small" color="primary" />
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflow: 'auto' }}>
                  
                  {/* Asks (Sell Orders) */}
                  <Typography variant="subtitle2" color="error.main" sx={{ textAlign: 'center', mb: 1 }}>
                    ASKS (Sell Orders)
                  </Typography>
                  {mockMarketDepth.asks.reverse().map((ask, index) => (
                    <Box key={`ask-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: theme.palette.error.main }}>
                        ${ask.price.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {ask.size.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({ask.orders})
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 1 }}>
                    <Chip 
                      label={`Mid: $${mockMarketDepth.midPrice.toFixed(2)}`} 
                      size="small" 
                      color="primary"
                    />
                  </Divider>

                  {/* Bids (Buy Orders) */}
                  <Typography variant="subtitle2" color="success.main" sx={{ textAlign: 'center', mb: 1 }}>
                    BIDS (Buy Orders)
                  </Typography>
                  {mockMarketDepth.bids.map((bid, index) => (
                    <Box key={`bid-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: theme.palette.success.main }}>
                        ${bid.price.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {bid.size.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({bid.orders})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
      </Grid>
    </Box>
  );
};

export default VolumePanel;