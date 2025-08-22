/**
 * Professional Trading Interface
 * Full-screen trading platform with advanced charts, order books, and live data
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  ButtonGroup,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
} from '@mui/material';
import {
  Fullscreen,
  TrendingUp,
  TrendingDown,
  ShowChart,
  CandlestickChart as CandlestickIcon,
  Timeline,
  Settings,
  PlayArrow,
  Pause,
  Refresh
} from '@mui/icons-material';

import { LiveDataManager } from '../../services/LiveDataManager';
import { SandboxTradingEngine } from '../../services/SandboxTradingEngine';
import { safeNumber } from '../../utils/safeguards';
import AdvancedCandlestickChart from './AdvancedCandlestickChart';
import LiveOrderBook from './LiveOrderBook';
import TradingPanel from './TradingPanel';
import MarketDepth from './MarketDepth';
import Watchlist from './Watchlist';

interface ProfessionalTradingInterfaceProps {
  initialSymbol?: string;
  height?: string;
}

const ProfessionalTradingInterface: React.FC<ProfessionalTradingInterfaceProps> = ({
  initialSymbol = 'CBA.AX',
  height = '100vh'
}) => {
  const theme = useTheme();
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1h');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [isLiveDataEnabled, setIsLiveDataEnabled] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState(['MA5', 'MA15']);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tradingPanelVisible, setTradingPanelVisible] = useState(true);

  const liveDataRef = useRef<LiveDataManager | null>(null);
  const tradingEngineRef = useRef<SandboxTradingEngine | null>(null);

  // Available symbols for trading
  const symbols = [
    { value: 'CBA.AX', label: 'CBA.AX - Commonwealth Bank', sector: 'Finance' },
    { value: 'BHP.AX', label: 'BHP.AX - BHP Group', sector: 'Mining' },
    { value: 'CSL.AX', label: 'CSL.AX - CSL Limited', sector: 'Healthcare' },
    { value: 'WBC.AX', label: 'WBC.AX - Westpac Banking', sector: 'Finance' },
    { value: 'ANZ.AX', label: 'ANZ.AX - ANZ Banking', sector: 'Finance' },
    { value: 'NAB.AX', label: 'NAB.AX - National Australia Bank', sector: 'Finance' },
    { value: 'WES.AX', label: 'WES.AX - Wesfarmers', sector: 'Retail' },
    { value: 'TLS.AX', label: 'TLS.AX - Telstra Corporation', sector: 'Telecommunications' }
  ];

  // Timeframe options
  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' }
  ];

  // Technical indicators
  const indicators = [
    { value: 'MA5', label: 'MA5', color: '#ffeb3b' },
    { value: 'MA15', label: 'MA15', color: '#ff9800' },
    { value: 'MA30', label: 'MA30', color: '#f44336' },
    { value: 'BOLL', label: 'BOLL', color: '#00bcd4' },
    { value: 'RSI', label: 'RSI', color: '#9c27b0' },
    { value: 'MACD', label: 'MACD', color: '#4caf50' }
  ];

  // Initialize live data and trading engine
  useEffect(() => {
    // Initialize live data manager
    liveDataRef.current = new LiveDataManager();
    
    // Initialize sandbox trading engine
    tradingEngineRef.current = new SandboxTradingEngine(100000); // $100k starting capital

    // Subscribe to live data
    if (isLiveDataEnabled) {
      const subscription = liveDataRef.current.subscribe(selectedSymbol, (data) => {
        setMarketData(prev => [...prev.slice(-999), data]);
        setLivePrice(data.close);
        setPriceChange(data.change);
      });

      return () => {
        if (subscription && liveDataRef.current) {
          liveDataRef.current.unsubscribe(subscription);
        }
      };
    }
  }, [selectedSymbol, isLiveDataEnabled]);

  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    // Clear previous data
    setMarketData([]);
    console.log(`Switched to symbol: ${newSymbol}`);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    console.log(`Changed timeframe to: ${newTimeframe}`);
  };

  // Handle indicator toggle
  const handleIndicatorToggle = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Get current symbol info
  const currentSymbolInfo = symbols.find(s => s.value === selectedSymbol);

  return (
    <Box
      sx={{
        height: isFullscreen ? '100vh' : height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto'
      }}
    >
      {/* Top Toolbar */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: isFullscreen ? 0 : 2,
          background: alpha(theme.palette.background.paper, 0.95),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Symbol Selector */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Trading Symbol</InputLabel>
              <Select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                label="Trading Symbol"
              >
                {symbols.map(symbol => (
                  <MenuItem key={symbol.value} value={symbol.value}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {symbol.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {symbol.label.split(' - ')[1]} • {symbol.sector}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Timeframe Selector */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
                时间周期:
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                {timeframes.map(tf => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? 'contained' : 'outlined'}
                    onClick={() => handleTimeframeChange(tf.value)}
                    sx={{ 
                      minWidth: 50,
                      fontFamily: 'monospace',
                      fontWeight: timeframe === tf.value ? 'bold' : 'normal'
                    }}
                  >
                    {tf.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
          </Grid>

          {/* Technical Indicators */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>
                技术指标:
              </Typography>
              {indicators.map(indicator => (
                <Chip
                  key={indicator.value}
                  label={indicator.label}
                  size="small"
                  variant={selectedIndicators.includes(indicator.value) ? "filled" : "outlined"}
                  onClick={() => handleIndicatorToggle(indicator.value)}
                  sx={{
                    backgroundColor: selectedIndicators.includes(indicator.value) 
                      ? indicator.color 
                      : 'transparent',
                    color: selectedIndicators.includes(indicator.value) 
                      ? 'white' 
                      : indicator.color,
                    borderColor: indicator.color,
                    '&:hover': {
                      backgroundColor: alpha(indicator.color, 0.2)
                    }
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Control Buttons */}
          <Grid item xs={12} md={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isLiveDataEnabled ? "暂停实时数据" : "启动实时数据"}>
                <IconButton 
                  size="small"
                  onClick={() => setIsLiveDataEnabled(!isLiveDataEnabled)}
                  color={isLiveDataEnabled ? "success" : "default"}
                >
                  {isLiveDataEnabled ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="全屏显示">
                <IconButton size="small" onClick={toggleFullscreen}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="刷新数据">
                <IconButton size="small" onClick={() => window.location.reload()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Trading Layout */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Watchlist & Market Depth */}
        <Paper
          elevation={1}
          sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}
        >
          <Watchlist 
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={handleSymbolChange}
          />
          <MarketDepth symbol={selectedSymbol} />
        </Paper>

        {/* Center - Main Chart Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chart Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            background: alpha(theme.palette.background.paper, 0.8)
          }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {selectedSymbol}
                  </Typography>
                  <Chip 
                    label={isLiveDataEnabled ? "实时" : "暂停"} 
                    color={isLiveDataEnabled ? "success" : "warning"} 
                    size="small"
                    variant="outlined"
                  />
                  {currentSymbolInfo && (
                    <Chip 
                      label={currentSymbolInfo.sector} 
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                    ${safeNumber(livePrice, 0).toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {safeNumber(priceChange, 0) > 0 ? 
                      <TrendingUp color="success" /> : 
                      <TrendingDown color="error" />
                    }
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: safeNumber(priceChange, 0) > 0 ? 
                          theme.palette.success.main : 
                          theme.palette.error.main,
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                      }}
                    >
                      {safeNumber(priceChange, 0) > 0 ? '+' : ''}{safeNumber(priceChange, 0).toFixed(2)} ({((safeNumber(priceChange, 0) / safeNumber(livePrice, 1)) * 100).toFixed(2)}%)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Main Chart */}
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <AdvancedCandlestickChart
              symbol={selectedSymbol}
              timeframe={timeframe}
              data={marketData}
              indicators={selectedIndicators}
              width="100%"
              height="100%"
              isLiveDataEnabled={isLiveDataEnabled}
            />
          </Box>
        </Box>

        {/* Right Panel - Trading & Order Book */}
        {tradingPanelVisible && (
          <Paper
            elevation={1}
            sx={{
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}
          >
            <LiveOrderBook symbol={selectedSymbol} />
            <TradingPanel 
              symbol={selectedSymbol}
              currentPrice={livePrice}
              tradingEngine={tradingEngineRef.current}
            />
          </Paper>
        )}
      </Box>

      {/* Status Bar */}
      <Paper
        elevation={1}
        sx={{
          p: 1,
          borderRadius: isFullscreen ? 0 : 2,
          background: alpha(theme.palette.background.paper, 0.9),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="caption" color="text.secondary">
              专业交易平台 • {marketData.length} 数据点 • {timeframe.toUpperCase()} • {selectedIndicators.join(', ')}
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={tradingPanelVisible}
                    onChange={(e) => setTradingPanelVisible(e.target.checked)}
                  />
                }
                label="交易面板"
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Powered by Qlib Professional Trading System
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProfessionalTradingInterface;