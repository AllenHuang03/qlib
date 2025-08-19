/**
 * Enhanced Premium Trading Interface
 * Professional-grade trading terminal with advanced candlestick charting
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';

// Import our enhanced charting components
import ProfessionalTradingDashboard from './ProfessionalTradingDashboard';
import ChartPerformanceMonitor from './ChartPerformanceMonitor';
import { useChartPerformance } from '../../hooks/useChartPerformance';
import marketDataService from '../../services/marketDataService';
import { CandlestickData } from '../../types/market';

interface EnhancedPremiumTradingInterfaceProps {
  symbol?: string;
  className?: string;
}

const EnhancedPremiumTradingInterface: React.FC<EnhancedPremiumTradingInterfaceProps> = ({
  symbol = 'CBA.AX',
  className = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for market data
  const [marketData, setMarketData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);

  // Performance optimization
  const {
    data: optimizedData,
    metrics,
    warnings,
    optimizationSuggestions,
    originalDataLength,
    updateDataWithAnimation,
    cleanup,
  } = useChartPerformance(marketData, {
    maxDataPoints: isMobile ? 500 : 1000,
    enableVirtualization: true,
    enableDataCompression: true,
    compressionThreshold: isMobile ? 2000 : 5000,
    memoryLimit: isMobile ? 30 : 50,
    animationDuration: isMobile ? 200 : 300,
  });

  // Load initial market data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await marketDataService.getHistoricalData(symbol, '1d');
        setMarketData(response.data);
      } catch (error) {
        console.error('Error loading market data:', error);
        // Generate mock data for demo
        const mockData = generateMockData(symbol);
        setMarketData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = marketDataService.subscribeToMarketData({
      symbol,
      timeframe: '1d',
      onData: (newCandle) => {
        setMarketData(prev => {
          const updated = [...prev.slice(-999), newCandle]; // Keep last 1000 candles
          updateDataWithAnimation(updated, setMarketData);
          return updated;
        });
      },
      onError: (error) => {
        console.error('Real-time data error:', error);
      }
    });

    return () => {
      unsubscribe();
      cleanup();
    };
  }, [symbol, updateDataWithAnimation, cleanup]);

  // Generate mock data for demonstration
  const generateMockData = (symbol: string): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let currentPrice = getBasePrice(symbol);
    const now = Date.now();
    
    for (let i = 200; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily candles
      const date = new Date(timestamp).toISOString();
      
      // Random walk with some trend
      const change = (Math.random() - 0.5) * 0.04 * currentPrice; // 4% max daily change
      const open = currentPrice;
      const close = Math.max(0.01, open + change);
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 2000000) + 500000;
      
      data.push({
        timestamp,
        date,
        open,
        high,
        low,
        close,
        volume,
        symbol,
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const getBasePrice = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'CBA.AX': 110.50,
      'BHP.AX': 45.20,
      'CSL.AX': 285.40,
      'WBC.AX': 24.80,
      'TLS.AX': 3.95,
      'RIO.AX': 112.80,
    };
    return basePrices[symbol] || 100.00;
  };

  return (
    <Box className={className} sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              Professional Trading Terminal
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Institutional-grade charting and trading platform
            </Typography>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPerformanceMonitor}
                      onChange={(e) => setShowPerformanceMonitor(e.target.checked)}
                    />
                  }
                  label="Performance Monitor"
                />
              )}
              
              <Typography variant="body2" color="text.secondary">
                {originalDataLength.toLocaleString()} data points loaded
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Main Trading Dashboard */}
      <Box sx={{ height: 'calc(100vh - 80px)' }}>
        <ProfessionalTradingDashboard
          symbol={symbol}
          initialLayout={isMobile ? 'compact' : 'pro'}
        />
      </Box>

      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <ChartPerformanceMonitor
          metrics={metrics}
          warnings={warnings}
          suggestions={optimizationSuggestions}
          originalDataLength={originalDataLength}
          onConfigChange={(config) => {
            console.log('Performance optimization applied:', config);
          }}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Loading Professional Trading Terminal
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Initializing advanced charting components...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedPremiumTradingInterface;