/**
 * Live Trading Dashboard
 * Professional trading interface with real-time market data, advanced charts, and AI signals
 * Mobile-responsive design with institutional-grade functionality
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Alert,
  Badge,
  useTheme,
  useMediaQuery,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  LinearProgress,
  Tooltip,
  Button,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Timeline,
  ShowChart,
  Assessment,
  Notifications,
  Settings,
  Refresh,
  Fullscreen,
  Menu as MenuIcon,
  Close,
  PlayArrow,
  Pause,
  Stop,
  AutoAwesome,
  BubbleChart,
  AccountBalance,
  CurrencyBitcoin,
  BusinessCenter,
  TrendingFlat,
  SignalCellularAlt,
  VolumeUp,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import ProfessionalCandlestickChart from '../../components/enhanced/ProfessionalCandlestickChart';
import enhancedMarketDataService from '../../services/enhancedMarketDataService';
import { marketAPI } from '../../services/api';
import { CandlestickData, TechnicalIndicator, TradingSignal } from '../../types/market';

interface LiveMarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid?: number;
  ask?: number;
  high: number;
  low: number;
  open: number;
  assetClass: string;
  lastUpdated: string;
}

interface MarketSummary {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  activeSignals: number;
  marketStatus: string;
  activeTrades: number;
}

interface PerformanceMetrics {
  latency: number;
  updateRate: number;
  dataQuality: number;
  connectionStatus: string;
}

const LiveTradingDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Core state
  const [selectedSymbol, setSelectedSymbol] = useState('CBA.AX');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [assetClass, setAssetClass] = useState('equity');
  const [marketData, setMarketData] = useState<CandlestickData[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<LiveMarketQuote[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [supportedSymbols, setSupportedSymbols] = useState<Record<string, string[]>>({});

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    latency: 0,
    updateRate: 0,
    dataQuality: 0,
    connectionStatus: 'disconnected',
  });

  // Market summary state
  const [marketSummary, setMarketSummary] = useState<MarketSummary>({
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    activeSignals: 0,
    marketStatus: 'closed',
    activeTrades: 0,
  });

  // Get current asset class symbols
  const currentSymbols = useMemo(() => {
    return supportedSymbols[assetClass] || [];
  }, [supportedSymbols, assetClass]);

  // Initialize supported symbols
  useEffect(() => {
    const loadSupportedSymbols = async () => {
      try {
        const symbols = await enhancedMarketDataService.getSupportedSymbols();
        setSupportedSymbols(symbols);
      } catch (error) {
        console.error('Error loading supported symbols:', error);
        // Fallback symbols
        setSupportedSymbols({
          equity: ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX'],
          cryptocurrency: ['BTC.AX', 'ETH.AX', 'ADA.AX'],
          commodity: ['GOLD', 'SILVER', 'OIL.WTI'],
          fixed_income: ['AGB.2Y', 'AGB.5Y', 'AGB.10Y'],
          forex: ['AUDUSD', 'EURAUD', 'GBPAUD'],
        });
      }
    };

    loadSupportedSymbols();
  }, []);

  // Initialize market data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load historical data
        const historicalData = await enhancedMarketDataService.getHistoricalData(
          selectedSymbol,
          selectedTimeframe,
          30
        );
        setMarketData(historicalData.data || []);

        // Load technical indicators
        const indicatorData = await marketAPI.getTechnicalIndicators(selectedSymbol);
        setIndicators(indicatorData.indicators ? Object.values(indicatorData.indicators).flat() : []);

        // Load trading signals
        const signalData = await marketAPI.getTradingSignals(selectedSymbol);
        setSignals(signalData.signals || []);

        // Detect asset class
        const assetInfo = await enhancedMarketDataService.getAssetClassInfo(selectedSymbol);
        setAssetClass(assetInfo.assetClass);

      } catch (error) {
        console.error('Error loading initial data:', error);
        addNotification('Failed to load market data', 'error');
      }
    };

    if (selectedSymbol) {
      loadInitialData();
    }
  }, [selectedSymbol, selectedTimeframe]);

  // Real-time data subscriptions
  useEffect(() => {
    if (!isRealTimeActive) return;

    let unsubscribes: (() => void)[] = [];

    const setupRealTimeData = async () => {
      try {
        // Subscribe to live market data
        const unsubscribeMarket = enhancedMarketDataService.subscribeToLiveData({
          symbol: selectedSymbol,
          timeframe: selectedTimeframe as any,
          onData: (data) => {
            setMarketData(prev => {
              const newData = [...prev, data];
              return newData.slice(-1000); // Keep last 1000 candles
            });
          },
          onError: (error) => {
            console.error('Market data error:', error);
            addNotification('Market data connection lost', 'error');
          },
          onDisconnect: () => {
            addNotification('Market data disconnected', 'warning');
          },
        });

        // Subscribe to indicators
        const unsubscribeIndicators = enhancedMarketDataService.subscribeToIndicators({
          symbol: selectedSymbol,
          indicators: ['SMA_20', 'SMA_50', 'RSI_14', 'MACD', 'BOLLINGER_BANDS'],
          onData: (indicatorData) => {
            setIndicators(indicatorData);
          },
          onError: (error) => {
            console.error('Indicator error:', error);
          },
        });

        // Subscribe to signals
        const unsubscribeSignals = enhancedMarketDataService.subscribeToSignals({
          symbols: [selectedSymbol],
          onSignal: (signal) => {
            setSignals(prev => [signal, ...prev.slice(0, 49)]); // Keep last 50 signals
            addNotification(`New ${signal.signal} signal for ${signal.symbol}`, 'info');
          },
          onError: (error) => {
            console.error('Signal error:', error);
          },
        });

        unsubscribes = [unsubscribeMarket, unsubscribeIndicators, unsubscribeSignals];

      } catch (error) {
        console.error('Error setting up real-time data:', error);
        addNotification('Failed to connect to real-time data', 'error');
      }
    };

    setupRealTimeData();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [selectedSymbol, selectedTimeframe, isRealTimeActive]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = enhancedMarketDataService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load live quotes for watchlist
  useEffect(() => {
    const loadLiveQuotes = async () => {
      try {
        const symbols = currentSymbols.slice(0, 10); // Limit to 10 symbols
        if (symbols.length === 0) return;

        const quotesData = await marketAPI.getLiveQuotes(symbols);
        
        if (quotesData?.quotes) {
          const formattedQuotes: LiveMarketQuote[] = quotesData.quotes.map((quote: any) => ({
            symbol: quote.symbol,
            price: quote.price || 0,
            change: quote.change || 0,
            changePercent: quote.change_percent || 0,
            volume: quote.volume || 0,
            bid: quote.bid,
            ask: quote.ask,
            high: quote.high || quote.price,
            low: quote.low || quote.price,
            open: quote.open || quote.price,
            assetClass: quote.asset_class || assetClass,
            lastUpdated: quote.last_updated || new Date().toISOString(),
          }));
          
          setLiveQuotes(formattedQuotes);

          // Update market summary
          const totalValue = formattedQuotes.reduce((sum, quote) => sum + quote.price, 0);
          const totalChange = formattedQuotes.reduce((sum, quote) => sum + quote.change, 0);
          const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

          setMarketSummary(prev => ({
            ...prev,
            totalValue,
            totalChange,
            totalChangePercent,
            activeSignals: signals.length,
            marketStatus: quotesData.market_status || 'open',
          }));
        }
      } catch (error) {
        console.error('Error loading live quotes:', error);
      }
    };

    if (currentSymbols.length > 0) {
      loadLiveQuotes();
      const interval = setInterval(loadLiveQuotes, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentSymbols, assetClass, signals.length]);

  // Add notification helper
  const addNotification = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const notification = `${type.toUpperCase()}: ${message}`;
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 5000);
  }, []);

  // Handle symbol change
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setMarketData([]); // Clear data while loading
  }, []);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: string) => {
    setSelectedTimeframe(timeframe);
  }, []);

  // Handle asset class change
  const handleAssetClassChange = useCallback((newAssetClass: string) => {
    setAssetClass(newAssetClass);
    const symbols = supportedSymbols[newAssetClass];
    if (symbols && symbols.length > 0) {
      setSelectedSymbol(symbols[0]);
    }
  }, [supportedSymbols]);

  // Toggle real-time data
  const toggleRealTime = useCallback(() => {
    setIsRealTimeActive(prev => !prev);
    addNotification(
      isRealTimeActive ? 'Real-time data paused' : 'Real-time data resumed',
      'info'
    );
  }, [isRealTimeActive, addNotification]);

  // SpeedDial actions
  const speedDialActions = [
    {
      icon: isRealTimeActive ? <Pause /> : <PlayArrow />,
      name: isRealTimeActive ? 'Pause Live Data' : 'Resume Live Data',
      onClick: toggleRealTime,
    },
    {
      icon: <Refresh />,
      name: 'Refresh Data',
      onClick: () => window.location.reload(),
    },
    {
      icon: <Fullscreen />,
      name: 'Fullscreen',
      onClick: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      },
    },
    {
      icon: <Settings />,
      name: 'Settings',
      onClick: () => addNotification('Settings panel coming soon', 'info'),
    },
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return theme.palette.success.main;
      case 'connecting': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Render market summary cards
  const renderMarketSummary = () => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
          <CardContent sx={{ color: 'white', textAlign: 'center', py: 1 }}>
            <Typography variant="caption">Portfolio Value</Typography>
            <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
              ${marketSummary.totalValue.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ 
          height: '100%', 
          background: marketSummary.totalChangePercent >= 0 
            ? 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)'
            : 'linear-gradient(45deg, #f44336 30%, #e57373 90%)'
        }}>
          <CardContent sx={{ color: 'white', textAlign: 'center', py: 1 }}>
            <Typography variant="caption">24h Change</Typography>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              {marketSummary.totalChangePercent >= 0 ? <TrendingUp /> : <TrendingDown />}
              {marketSummary.totalChangePercent.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)' }}>
          <CardContent sx={{ color: 'white', textAlign: 'center', py: 1 }}>
            <Typography variant="caption">Active Signals</Typography>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <AutoAwesome />
              {marketSummary.activeSignals}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card sx={{ 
          height: '100%', 
          background: marketSummary.marketStatus === 'open' 
            ? 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)'
            : 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)'
        }}>
          <CardContent sx={{ color: 'white', textAlign: 'center', py: 1 }}>
            <Typography variant="caption">Market Status</Typography>
            <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
              {marketSummary.marketStatus.toUpperCase()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render watchlist
  const renderWatchlist = () => (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline />
          Watchlist • {assetClass.toUpperCase()}
        </Typography>
      </Box>
      <List dense>
        {liveQuotes.map((quote) => (
          <ListItem
            key={quote.symbol}
            button
            selected={quote.symbol === selectedSymbol}
            onClick={() => handleSymbolChange(quote.symbol)}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon>
              {quote.assetClass === 'cryptocurrency' ? <CurrencyBitcoin /> :
               quote.assetClass === 'fixed_income' ? <AccountBalance /> :
               quote.assetClass === 'commodity' ? <BubbleChart /> :
               <BusinessCenter />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {quote.symbol}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      color: quote.changePercent >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    ${quote.price.toFixed(2)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    Vol: {(quote.volume / 1000).toFixed(0)}K
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {quote.changePercent >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: quote.changePercent >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        fontFamily: 'monospace',
                      }}
                    >
                      {quote.changePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  // Render control panel
  const renderControlPanel = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {/* Asset Class Selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Asset Class</InputLabel>
          <Select
            value={assetClass}
            label="Asset Class"
            onChange={(e) => handleAssetClassChange(e.target.value)}
          >
            <MenuItem value="equity">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessCenter />
                Equity
              </Box>
            </MenuItem>
            <MenuItem value="cryptocurrency">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CurrencyBitcoin />
                Crypto
              </Box>
            </MenuItem>
            <MenuItem value="commodity">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BubbleChart />
                Commodity
              </Box>
            </MenuItem>
            <MenuItem value="fixed_income">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance />
                Bonds
              </Box>
            </MenuItem>
            <MenuItem value="forex">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingFlat />
                Forex
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Symbol Selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Symbol</InputLabel>
          <Select
            value={selectedSymbol}
            label="Symbol"
            onChange={(e) => handleSymbolChange(e.target.value)}
          >
            {currentSymbols.map((symbol) => (
              <MenuItem key={symbol} value={symbol}>
                {symbol}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Performance Indicators */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={<Speed />}
            label={`${performanceMetrics.latency.toFixed(0)}ms`}
            size="small"
            color={performanceMetrics.latency < 50 ? 'success' : performanceMetrics.latency < 100 ? 'warning' : 'error'}
            variant="outlined"
          />
          <Chip
            icon={<SignalCellularAlt />}
            label={`${performanceMetrics.updateRate.toFixed(1)}/s`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={performanceMetrics.connectionStatus.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: getStatusColor(performanceMetrics.connectionStatus),
              color: 'white',
            }}
          />
        </Box>

        {/* Real-time Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isRealTimeActive}
              onChange={toggleRealTime}
              color="primary"
            />
          }
          label="Live Data"
        />
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mobile Header */}
      {isMobile && (
        <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Live Trading
          </Typography>
          <Badge badgeContent={notifications.length} color="error">
            <IconButton>
              <Notifications />
            </IconButton>
          </Badge>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            width: isMobile ? 280 : 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isMobile ? 280 : 300,
              position: isMobile ? 'fixed' : 'relative',
              height: '100%',
            },
          }}
        >
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Market Data</Typography>
            {isMobile && (
              <IconButton onClick={() => setSidebarOpen(false)}>
                <Close />
              </IconButton>
            )}
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {renderWatchlist()}
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Control Panel */}
          <Box sx={{ p: isMobile ? 1 : 2 }}>
            {renderMarketSummary()}
            {renderControlPanel()}
          </Box>

          {/* Chart and Analysis */}
          <Box sx={{ flexGrow: 1, p: isMobile ? 1 : 2, pt: 0, overflow: 'hidden' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Main Chart */}
              <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
                <ProfessionalCandlestickChart
                  symbol={selectedSymbol}
                  data={marketData}
                  indicators={indicators}
                  signals={signals}
                  config={{
                    symbol: selectedSymbol,
                    timeframe: selectedTimeframe as any,
                    indicators: ['SMA_20', 'SMA_50', 'RSI_14'],
                    showVolume: true,
                    showSignals: true,
                    showLevels: true,
                    theme: theme.palette.mode,
                    autoUpdate: true,
                  }}
                  onTimeframeChange={handleTimeframeChange}
                  height={isMobile ? 400 : 600}
                  realTimeEnabled={isRealTimeActive}
                  assetClass={assetClass}
                  performance={performanceMetrics}
                />
              </Grid>

              {/* Side Panel - Hidden on mobile in favor of drawer */}
              {!isMobile && (
                <Grid item lg={4} sx={{ height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                    {/* Trading Signals */}
                    <Paper sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesome />
                        AI Signals
                        <Badge badgeContent={signals.length} color="primary" />
                      </Typography>
                      {signals.length === 0 ? (
                        <Alert severity="info">No active signals</Alert>
                      ) : (
                        signals.slice(0, 5).map((signal) => (
                          <Card key={signal.id} sx={{ mb: 1, borderLeft: `4px solid ${
                            signal.signal === 'BUY' ? theme.palette.success.main :
                            signal.signal === 'SELL' ? theme.palette.error.main :
                            theme.palette.warning.main
                          }` }}>
                            <CardContent sx={{ py: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Chip
                                  label={signal.signal}
                                  size="small"
                                  color={signal.signal === 'BUY' ? 'success' : signal.signal === 'SELL' ? 'error' : 'warning'}
                                />
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                  {(signal.confidence * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {signal.symbol} • ${signal.priceTarget?.toFixed(2) || '0.00'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {signal.reasoning?.[0] || 'Technical analysis'}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Paper>

                    {/* Notifications */}
                    <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notifications />
                        Notifications
                        <Badge badgeContent={notifications.length} color="error" />
                      </Typography>
                      {notifications.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          No new notifications
                        </Typography>
                      ) : (
                        notifications.slice(0, 5).map((notification, index) => (
                          <Alert
                            key={index}
                            severity={notification.includes('ERROR') ? 'error' : 
                                    notification.includes('WARNING') ? 'warning' : 'info'}
                            size="small"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.replace(/^(INFO|WARNING|ERROR):\s*/, '')}
                          </Alert>
                        ))
                      )}
                    </Paper>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Trading Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}

      {/* Performance Indicator */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: isMobile ? 80 : 16, 
        left: 16, 
        zIndex: 1000,
        display: 'flex',
        gap: 1,
      }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, performanceMetrics.dataQuality)}
          sx={{
            width: 100,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.grey[300],
            '& .MuiLinearProgress-bar': {
              backgroundColor: performanceMetrics.dataQuality > 80 ? theme.palette.success.main :
                             performanceMetrics.dataQuality > 60 ? theme.palette.warning.main :
                             theme.palette.error.main,
            },
          }}
        />
        <Typography variant="caption" sx={{ 
          backgroundColor: theme.palette.background.paper, 
          px: 1, 
          borderRadius: 1,
          fontFamily: 'monospace',
        }}>
          {performanceMetrics.dataQuality.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveTradingDashboard;