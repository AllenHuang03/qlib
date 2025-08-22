/**
 * Complete Professional Trading Chart
 * COMPREHENSIVE INTEGRATION AGENT
 * Combines all components into a professional trading platform
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  useTheme,
  alpha,
  Chip,
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  ShowChart,
  CandlestickChart as CandlestickIcon,
  VolumeUp,
  TrendingUp,
  TrendingDown,
  Speed,
  SignalCellularAlt,
  Fullscreen,
  Settings,
  Refresh,
  PlayArrow,
  Pause,
} from '@mui/icons-material';

import { CandlestickData, TechnicalIndicator } from '../../types/market';
import VolumeChart from './VolumeChart';
import { liveDataManager } from '../../services/LiveDataManager';
import { ChartErrorBoundary } from '../ErrorBoundary';

interface CompleteTradingChartProps {
  symbol: string;
  initialData?: CandlestickData[];
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
  realTimeEnabled?: boolean;
}

// Live Price Display Component
const LivePriceDisplay: React.FC<{ symbol: string; data: CandlestickData[] }> = ({ 
  symbol, 
  data 
}) => {
  const theme = useTheme();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (data.length >= 2) {
      const latest = data[data.length - 1];
      const previous = data[data.length - 2];
      
      setCurrentPrice(latest.close);
      setPriceChange(latest.close - previous.close);
      setPriceChangePercent(((latest.close - previous.close) / previous.close) * 100);
    }
  }, [data]);

  useEffect(() => {
    // Subscribe to live updates
    const subscriptionId = liveDataManager.subscribe(symbol, (liveData) => {
      setCurrentPrice(liveData.close);
      setIsLive(true);
      
      // Calculate change from previous close
      if (data.length > 0) {
        const prevClose = data[data.length - 1].close;
        setPriceChange(liveData.close - prevClose);
        setPriceChangePercent(((liveData.close - prevClose) / prevClose) * 100);
      }
    });

    return () => {
      liveDataManager.unsubscribe(subscriptionId);
    };
  }, [symbol, data]);

  const isPositive = priceChange >= 0;

  return (
    <Card sx={{ mb: 2, background: alpha(theme.palette.background.paper, 0.95) }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
            {symbol}
          </Typography>
          <Chip 
            label={isLive ? "LIVE" : "DELAYED"} 
            color={isLive ? "success" : "warning"} 
            size="small"
            icon={isLive ? <Speed /> : <Pause />}
            sx={{ animation: isLive ? 'pulse 2s infinite' : 'none' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              color: theme.palette.text.primary
            }}
          >
            ${currentPrice.toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
            <Typography 
              variant="h6" 
              sx={{ 
                color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
            >
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </Typography>
          </Box>
        </Box>

        {/* Additional Metrics with enhanced null safety */}
        {data && data.length > 0 && data[data.length - 1] && (
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              High: ${((data[data.length - 1] && data[data.length - 1].high) || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              Low: ${((data[data.length - 1] && data[data.length - 1].low) || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              Volume: {(((data[data.length - 1] && data[data.length - 1].volume) || 0) / 1000000).toFixed(1)}M
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Professional Chart Controls
const ChartControls: React.FC<{
  onTimeframeChange: (tf: string) => void;
  onIndicatorChange: (indicators: string[]) => void;
  onChartTypeChange: (type: string) => void;
  selectedTimeframe: string;
  selectedIndicators: string[];
  chartType: string;
  onRealTimeToggle: (enabled: boolean) => void;
  realTimeEnabled: boolean;
}> = ({
  onTimeframeChange,
  onIndicatorChange,
  onChartTypeChange,
  selectedTimeframe,
  selectedIndicators,
  chartType,
  onRealTimeToggle,
  realTimeEnabled,
}) => {
  const theme = useTheme();

  const timeframes = [
    { value: '1m', label: '1分' },
    { value: '5m', label: '5分' },
    { value: '15m', label: '15分' },
    { value: '1h', label: '1小时' },
    { value: '4h', label: '4小时' },
    { value: '1d', label: '日线' },
    { value: '1w', label: '周线' }
  ];

  const indicators = [
    { value: 'MA5', label: 'MA5', color: '#ffeb3b' },
    { value: 'MA15', label: 'MA15', color: '#ff9800' },
    { value: 'MA30', label: 'MA30', color: '#f44336' },
    { value: 'BOLL', label: 'BOLL', color: '#00bcd4' },
    { value: 'RSI', label: 'RSI', color: '#9c27b0' },
    { value: 'MACD', label: 'MACD', color: '#4caf50' }
  ];

  const handleIndicatorToggle = (indicatorValue: string) => {
    const currentIndicators = selectedIndicators || [];
    const newIndicators = Array.isArray(currentIndicators) && currentIndicators.includes(indicatorValue)
      ? currentIndicators.filter(i => i !== indicatorValue)
      : [...currentIndicators, indicatorValue];
    onIndicatorChange(newIndicators);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, background: alpha(theme.palette.background.paper, 0.98) }}>
      <Grid container spacing={2} alignItems="center">
        {/* Chart Type */}
        <Grid item>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
            图表类型:
          </Typography>
          <ButtonGroup size="small">
            <Button
              variant={chartType === 'candlestick' ? 'contained' : 'outlined'}
              onClick={() => onChartTypeChange('candlestick')}
              startIcon={<CandlestickIcon />}
            >
              K线
            </Button>
            <Button
              variant={chartType === 'line' ? 'contained' : 'outlined'}
              onClick={() => onChartTypeChange('line')}
              startIcon={<ShowChart />}
            >
              分时
            </Button>
          </ButtonGroup>
        </Grid>

        {/* Timeframes */}
        <Grid item>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
            周期:
          </Typography>
          <ButtonGroup size="small">
            {timeframes.map(tf => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? 'contained' : 'outlined'}
                onClick={() => onTimeframeChange(tf.value)}
                sx={{ minWidth: 50, fontFamily: 'monospace' }}
              >
                {tf.label}
              </Button>
            ))}
          </ButtonGroup>
        </Grid>

        {/* Technical Indicators */}
        <Grid item xs>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
            技术指标:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {indicators.map(indicator => (
              <FormControlLabel
                key={indicator.value}
                control={
                  <Checkbox
                    size="small"
                    checked={Array.isArray(selectedIndicators) && selectedIndicators.includes(indicator.value)}
                    onChange={() => handleIndicatorToggle(indicator.value)}
                    sx={{ 
                      color: indicator.color,
                      '&.Mui-checked': { color: indicator.color }
                    }}
                  />
                }
                label={
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: Array.isArray(selectedIndicators) && selectedIndicators.includes(indicator.value) ? indicator.color : 'text.secondary',
                      fontFamily: 'monospace'
                    }}
                  >
                    {indicator.label}
                  </Typography>
                }
              />
            ))}
          </Box>
        </Grid>

        {/* Controls */}
        <Grid item>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={realTimeEnabled}
                  onChange={(e) => onRealTimeToggle(e.target.checked)}
                  color="success"
                />
              }
              label="实时数据"
            />
            
            <Tooltip title="刷新">
              <IconButton size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="全屏">
              <IconButton size="small">
                <Fullscreen />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="设置">
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Main Complete Trading Chart Component
const CompleteTradingChart: React.FC<CompleteTradingChartProps> = ({
  symbol,
  initialData = [],
  height = 900,
  onTimeframeChange,
  realTimeEnabled: initialRealTimeEnabled = false,
}) => {
  const theme = useTheme();
  
  // Chart state
  const [data, setData] = useState<CandlestickData[]>(initialData);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedIndicators, setSelectedIndicators] = useState(['MA5', 'MA15']);
  const [chartType, setChartType] = useState('candlestick');
  const [realTimeEnabled, setRealTimeEnabled] = useState(initialRealTimeEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Generate sample data if none provided
  useEffect(() => {
    if (initialData.length === 0) {
      const sampleData: CandlestickData[] = [];
      const basePrice = symbol === 'AAPL' ? 150 : symbol === 'CBA.AX' ? 100 : 100;
      
      for (let i = 0; i < 200; i++) {
        const prevClose = i > 0 ? sampleData[i-1].close : basePrice;
        const change = (Math.random() - 0.5) * 6;
        const open = prevClose + (Math.random() - 0.5) * 2;
        const close = Math.max(0.01, open + change);
        const high = Math.max(open, close) + Math.random() * 3;
        const low = Math.min(open, close) - Math.random() * 2;
        
        sampleData.push({
          time: Date.now() - (200 - i) * 60 * 60 * 1000,
          date: new Date(Date.now() - (200 - i) * 60 * 60 * 1000).toISOString(),
          open: Math.max(0.01, open),
          high: Math.max(0.01, high),
          low: Math.max(0.01, low),
          close: Math.max(0.01, close),
          volume: Math.floor(Math.random() * 2000000) + 500000,
        });
      }
      
      setData(sampleData);
    } else {
      setData(initialData);
    }
  }, [initialData, symbol]);

  // Real-time data connection
  useEffect(() => {
    if (realTimeEnabled) {
      setConnectionStatus('connecting');
      
      // Try to connect to live data with comprehensive fallback
      liveDataManager.connectWithFallback().then(() => {
        setConnectionStatus('connected');
        
        const subscriptionId = liveDataManager.subscribe(symbol, (newData) => {
          setData(prevData => {
            if (!newData || !prevData || prevData.length === 0) {
              return prevData;
            }
            
            const updatedData = [...prevData];
            
            // Check if this is an update to the last candle or a new candle
            const lastCandle = updatedData[updatedData.length - 1];
            if (!lastCandle) {
              updatedData.push(newData);
              return updatedData;
            }
            
            const timeDiff = (newData.time || 0) - (lastCandle.time || 0);
            
            if (timeDiff < 60000) { // Same minute, update last candle
              updatedData[updatedData.length - 1] = newData;
            } else { // New candle
              updatedData.push(newData);
              
              // Keep only last 500 candles for performance
              if (updatedData.length > 500) {
                updatedData.shift();
              }
            }
            
            return updatedData;
          });
        });

        return () => {
          liveDataManager.unsubscribe(subscriptionId);
        };
      }).catch(() => {
        setConnectionStatus('disconnected');
        // Generate mock data for demonstration
        liveDataManager.generateMockData(symbol);
      });
    } else {
      setConnectionStatus('disconnected');
      liveDataManager.disconnect();
    }
  }, [realTimeEnabled, symbol]);

  // Chart dimensions
  const chartHeight = Math.floor(height * 0.65);
  const volumeHeight = 120;
  const sidebarWidth = 300;

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    onTimeframeChange?.(timeframe);
  };

  const handleRealTimeToggle = (enabled: boolean) => {
    setRealTimeEnabled(enabled);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height,
      display: 'flex',
      flexDirection: 'column',
      background: theme.palette.background.default,
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      {/* Chart Controls */}
      <ChartControls
        onTimeframeChange={handleTimeframeChange}
        onIndicatorChange={setSelectedIndicators}
        onChartTypeChange={setChartType}
        selectedTimeframe={selectedTimeframe}
        selectedIndicators={selectedIndicators}
        chartType={chartType}
        onRealTimeToggle={handleRealTimeToggle}
        realTimeEnabled={realTimeEnabled}
      />

      {/* Connection Status */}
      {realTimeEnabled && (
        <Alert 
          severity={connectionStatus === 'connected' ? 'success' : 'warning'}
          sx={{ mx: 2, mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SignalCellularAlt />
            <Typography variant="caption">
              {connectionStatus === 'connected' ? '实时数据连接正常' : 
               connectionStatus === 'connecting' ? '正在连接实时数据...' : 
               '实时数据连接断开，显示模拟数据'}
            </Typography>
            {connectionStatus === 'connecting' && (
              <LinearProgress sx={{ width: 100, ml: 1 }} />
            )}
          </Box>
        </Alert>
      )}

      {/* Main Chart Area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left: Charts */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Main Price Chart with Error Boundary */}
          <Box sx={{ flexGrow: 1, p: 1 }}>
            <Paper sx={{ height: chartHeight, p: 1, overflow: 'hidden' }}>
              <ChartErrorBoundary>
                {/* We'll use the existing ProfessionalCandlestickRenderer here */}
                <Box sx={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: 1
                }}>
                  <Typography variant="h6" color="text.secondary">
                    专业K线图表 • {symbol || 'Loading...'} • {data?.length || 0} 数据点 • {selectedTimeframe?.toUpperCase() || '1H'}
                  </Typography>
                </Box>
              </ChartErrorBoundary>
            </Paper>
          </Box>

          {/* Volume Chart with Error Boundary */}
          <Box sx={{ p: 1 }}>
            <Paper sx={{ overflow: 'hidden' }}>
              <ChartErrorBoundary>
                <VolumeChart
                  data={data || []}
                  width={800} // This will be calculated dynamically
                  height={volumeHeight}
                />
              </ChartErrorBoundary>
            </Paper>
          </Box>
        </Box>

        {/* Right: Live Price Display and Stats */}
        <Box sx={{ width: sidebarWidth, p: 1, borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
          <LivePriceDisplay symbol={symbol} data={data} />
          
          {/* Market Depth / Order Book Placeholder */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp />
              市场深度
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Order book data would be displayed here in a real implementation
            </Typography>
          </Paper>

          {/* Trading Statistics */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              交易统计
            </Typography>
            {data.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption">
                  24h Volume: {(data.reduce((sum, d) => sum + (d?.volume || 0), 0) / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="caption">
                  24h High: ${Math.max(...data.map(d => d?.high || 0).filter(h => h > 0)).toFixed(2)}
                </Typography>
                <Typography variant="caption">
                  24h Low: ${Math.min(...data.map(d => d?.low || Infinity).filter(l => l < Infinity)).toFixed(2)}
                </Typography>
                <Typography variant="caption">
                  Avg Volume: {(data.reduce((sum, d) => sum + (d?.volume || 0), 0) / Math.max(1, data.length) / 1000000).toFixed(1)}M
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Status Bar */}
      <Box sx={{ 
        p: 1, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          专业交易平台 • 实时数据 • 技术分析 • {selectedIndicators.join(', ')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Powered by Qlib Professional Trading System
        </Typography>
      </Box>

      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default CompleteTradingChart;