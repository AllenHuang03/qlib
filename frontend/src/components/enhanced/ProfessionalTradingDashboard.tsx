/**
 * Professional Trading Dashboard
 * Institutional-grade trading terminal integrating all components
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close,
  Fullscreen,
  FullscreenExit,
  Settings,
  Analytics,
  Timeline,
  VolumeUp,
  Psychology,
  TrendingUp,
  Notifications,
  AccountBalance,
} from '@mui/icons-material';

// Import our enhanced components
import CandlestickChart from './CandlestickChart';
import TechnicalIndicators from './TechnicalIndicators';
import TradingSignalOverlay from './TradingSignalOverlay';
import ChartToolbar, { ChartToolbarConfig } from './ChartToolbar';
import VolumePanel from './VolumePanel';
import ChartInteractionLayer from './ChartInteractionLayer';

// Import market data service
import marketDataService from '../../services/marketDataService';
import { CandlestickData, TechnicalIndicator, TradingSignal } from '../../types/market';

interface ProfessionalTradingDashboardProps {
  symbol?: string;
  initialLayout?: 'compact' | 'standard' | 'pro';
  className?: string;
}

const ProfessionalTradingDashboard: React.FC<ProfessionalTradingDashboardProps> = ({
  symbol = 'CBA.AX',
  initialLayout = 'standard',
  className = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // State management
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  // Layout and view state
  const [layout, setLayout] = useState(initialLayout);
  const [showVolumePanel, setShowVolumePanel] = useState(!isMobile);
  const [showIndicators, setShowIndicators] = useState(!isMobile);
  const [showSignalOverlay, setShowSignalOverlay] = useState(true);

  // Chart configuration
  const [chartConfig, setChartConfig] = useState<ChartToolbarConfig>({
    symbol: currentSymbol,
    timeframe: '1d',
    chartType: 'candlestick',
    showVolume: true,
    showGrid: true,
    showCrosshair: true,
    autoRefresh: true,
    refreshInterval: 5000,
    theme: theme.palette.mode,
  });

  // Chart dimensions
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 600 });

  // Load market data
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketDataService.getHistoricalData(
        currentSymbol,
        chartConfig.timeframe
      );
      setChartData(response.data);
      
      if (response.indicators) {
        setIndicators(response.indicators);
      }
      
      if (response.signals) {
        setSignals(response.signals);
      }
      
    } catch (error) {
      console.error('Error loading market data:', error);
      setAlertMessage('Failed to load market data. Using demo data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSymbol, chartConfig.timeframe]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!chartConfig.autoRefresh) return;

    const unsubscribe = marketDataService.subscribeToMarketData({
      symbol: currentSymbol,
      timeframe: chartConfig.timeframe as any,
      onData: (newCandle) => {
        setChartData(prev => [...prev.slice(-199), newCandle]); // Keep last 200 candles
      },
      onError: (error) => {
        setAlertMessage(`Real-time data error: ${error.message}`);
      }
    });

    return unsubscribe;
  }, [currentSymbol, chartConfig.timeframe, chartConfig.autoRefresh]);

  // Subscribe to AI signals
  useEffect(() => {
    const unsubscribe = marketDataService.subscribeToSignals({
      symbols: [currentSymbol],
      onSignal: (signal) => {
        setSignals(prev => [signal, ...prev.slice(0, 19)]); // Keep last 20 signals
        setAlertMessage(`New ${signal.signal} signal for ${signal.symbol} with ${(signal.confidence * 100).toFixed(0)}% confidence`);
      }
    });

    return unsubscribe;
  }, [currentSymbol]);

  // Handle chart configuration changes
  const handleConfigChange = useCallback((newConfig: Partial<ChartToolbarConfig>) => {
    setChartConfig(prev => ({ ...prev, ...newConfig }));
    
    if (newConfig.symbol && newConfig.symbol !== currentSymbol) {
      setCurrentSymbol(newConfig.symbol);
    }
  }, [currentSymbol]);

  // Handle chart actions
  const handleChartAction = useCallback((action: string, params?: any) => {
    switch (action) {
      case 'fullscreen':
        setIsFullscreen(!isFullscreen);
        break;
      case 'refresh':
        loadMarketData();
        break;
      case 'export':
        // Export chart data
        const dataStr = JSON.stringify(chartData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${currentSymbol}_${chartConfig.timeframe}_data.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        break;
      case 'screenshot':
        // Take screenshot of chart
        if (chartContainerRef.current) {
          // Implementation would use html2canvas or similar
          setAlertMessage('Screenshot saved to downloads');
        }
        break;
    }
  }, [isFullscreen, loadMarketData, chartData, currentSymbol, chartConfig.timeframe]);

  // Handle signal actions
  const handleSignalAction = useCallback((signal: TradingSignal, action: 'execute' | 'ignore' | 'watchlist') => {
    switch (action) {
      case 'execute':
        setAlertMessage(`Executing ${signal.signal} order for ${signal.symbol}`);
        // Integration with trading system would go here
        break;
      case 'ignore':
        setSignals(prev => prev.filter(s => s.id !== signal.id));
        break;
      case 'watchlist':
        setAlertMessage(`Added ${signal.symbol} to watchlist`);
        break;
    }
  }, []);

  // Update chart dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        setChartDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen, sidebarOpen]);

  // Load initial data
  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Responsive layout calculations
  const sidebarWidth = isMobile ? '100%' : isTablet ? 300 : 350;
  const mainContentWidth = sidebarOpen ? `calc(100% - ${typeof sidebarWidth === 'number' ? sidebarWidth + 'px' : sidebarWidth})` : '100%';

  // Speed dial actions for mobile
  const speedDialActions = [
    { icon: <Analytics />, name: 'Indicators', onClick: () => setShowIndicators(!showIndicators) },
    { icon: <Psychology />, name: 'AI Signals', onClick: () => setShowSignalOverlay(!showSignalOverlay) },
    { icon: <VolumeUp />, name: 'Volume', onClick: () => setShowVolumePanel(!showVolumePanel) },
    { icon: <Settings />, name: 'Settings', onClick: () => setSidebarOpen(!sidebarOpen) },
  ];

  return (
    <Box 
      className={className}
      sx={{ 
        height: '100vh', 
        display: 'flex',
        overflow: 'hidden',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? theme.zIndex.modal : 'auto',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Alert Messages */}
      <Collapse in={!!alertMessage}>
        <Alert 
          severity="info" 
          onClose={() => setAlertMessage(null)}
          sx={{ 
            position: 'absolute', 
            top: 16, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: theme.zIndex.snackbar,
            minWidth: 300,
          }}
        >
          {alertMessage}
        </Alert>
      </Collapse>

      {/* Main Trading Area */}
      <Box 
        sx={{ 
          width: mainContentWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('width'),
        }}
      >
        {/* Chart Toolbar */}
        <ChartToolbar
          config={chartConfig}
          onConfigChange={handleConfigChange}
          onAction={handleChartAction}
          isFullscreen={isFullscreen}
          isLoading={isLoading}
        />

        {/* Chart Area */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Box 
            ref={chartContainerRef}
            sx={{ 
              width: '100%', 
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Main Candlestick Chart */}
            <CandlestickChart
              symbol={currentSymbol}
              data={chartData}
              indicators={indicators}
              signals={signals}
              height={chartDimensions.height}
              onTimeframeChange={(timeframe) => handleConfigChange({ timeframe })}
              onSignalClick={(signal) => console.log('Signal clicked:', signal)}
            />

            {/* Chart Interaction Layer */}
            <ChartInteractionLayer
              chartRef={chartContainerRef}
              width={chartDimensions.width}
              height={chartDimensions.height}
              onAnnotationAdd={(annotation) => console.log('Annotation added:', annotation)}
            />

            {/* Trading Signal Overlay */}
            {showSignalOverlay && (
              <TradingSignalOverlay
                signals={signals}
                chartWidth={chartDimensions.width}
                chartHeight={chartDimensions.height}
                onSignalClick={(signal) => console.log('Signal clicked:', signal)}
                onSignalAction={handleSignalAction}
              />
            )}
          </Box>
        </Box>

        {/* Volume Panel (Desktop only or when explicitly shown) */}
        {showVolumePanel && !isMobile && (
          <Box sx={{ height: 300, borderTop: `1px solid ${theme.palette.divider}` }}>
            <VolumePanel
              data={chartData}
              symbol={currentSymbol}
              showVolumeProfile={true}
              showOrderBook={true}
              showVolumeIndicators={true}
            />
          </Box>
        )}
      </Box>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography variant="h6">
            Trading Tools
          </Typography>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        {/* Sidebar Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Grid container spacing={2}>
            
            {/* Technical Indicators */}
            {showIndicators && (
              <Grid item xs={12}>
                <TechnicalIndicators
                  data={chartData}
                  onIndicatorChange={(indicators) => console.log('Indicators changed:', indicators)}
                  onCalculatedData={setIndicators}
                />
              </Grid>
            )}

            {/* Volume Panel (Mobile) */}
            {isMobile && showVolumePanel && (
              <Grid item xs={12}>
                <VolumePanel
                  data={chartData}
                  symbol={currentSymbol}
                  showVolumeProfile={true}
                  showOrderBook={false}
                  showVolumeIndicators={true}
                />
              </Grid>
            )}

            {/* Market Statistics */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance />
                  Market Statistics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Market Cap</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      $189.2B
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">P/E Ratio</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      15.4
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">52W High</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      $118.80
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">52W Low</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      $95.20
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Drawer>

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Trading tools"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      )}

      {/* Sidebar Toggle (Desktop) */}
      {!isMobile && (
        <Zoom in={!sidebarOpen}>
          <Fab
            color="primary"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              right: 16, 
              transform: 'translateY(-50%)',
              zIndex: theme.zIndex.fab,
            }}
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default ProfessionalTradingDashboard;