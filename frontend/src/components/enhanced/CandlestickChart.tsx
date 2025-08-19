/**
 * Professional-Grade Candlestick Chart Component
 * Institutional-quality charting for the Qlib Trading Platform
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  ButtonGroup,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  CandlestickChart as CandlestickIcon,
  ShowChart,
  BarChart,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  Refresh,
  Settings,
  TrendingUp,
  TrendingDown,
  VolumeUp,
} from '@mui/icons-material';
import { createChart, IChartApi, ISeriesApi, ColorType, LineStyle } from 'lightweight-charts';
import { CandlestickData, TechnicalIndicator, TradingSignal, ChartConfig, MarketDataResponse } from '../../types/market';

interface CandlestickChartProps {
  symbol: string;
  data: CandlestickData[];
  indicators?: TechnicalIndicator[];
  signals?: TradingSignal[];
  config?: Partial<ChartConfig>;
  onTimeframeChange?: (timeframe: string) => void;
  onSignalClick?: (signal: TradingSignal) => void;
  height?: number;
  className?: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  data,
  indicators = [],
  signals = [],
  config: configProp,
  onTimeframeChange,
  onSignalClick,
  height = 600,
  className = '',
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // Chart configuration state
  const [config, setConfig] = useState<ChartConfig>({
    symbol,
    timeframe: '1d',
    indicators: ['SMA_20', 'SMA_50'],
    showVolume: true,
    showSignals: true,
    showLevels: true,
    theme: theme.palette.mode,
    autoUpdate: true,
    ...configProp,
  });

  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [crosshairData, setCrosshairData] = useState<any>(null);

  // Available timeframes for Australian market
  const timeframes = [
    { value: '1m', label: '1M', disabled: false },
    { value: '5m', label: '5M', disabled: false },
    { value: '15m', label: '15M', disabled: false },
    { value: '1h', label: '1H', disabled: false },
    { value: '4h', label: '4H', disabled: false },
    { value: '1d', label: '1D', disabled: false },
    { value: '1w', label: '1W', disabled: false },
  ];

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create new chart with professional settings
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: theme.palette.background.paper 
        },
        textColor: theme.palette.text.primary,
        fontSize: 12,
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      },
      width: chartContainerRef.current.clientWidth,
      height: height - 100, // Account for controls
      grid: {
        vertLines: {
          color: alpha(theme.palette.text.primary, 0.1),
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: alpha(theme.palette.text.primary, 0.1),
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: theme.palette.primary.main,
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: theme.palette.primary.main,
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: alpha(theme.palette.text.primary, 0.2),
        textColor: theme.palette.text.secondary,
        scaleMargins: {
          top: 0.1,
          bottom: config.showVolume ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: alpha(theme.palette.text.primary, 0.2),
        textColor: theme.palette.text.secondary,
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: true,
        fontSize: 24,
        color: alpha(theme.palette.text.primary, 0.1),
        text: symbol,
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        fontStyle: 'bold',
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderUpColor: theme.palette.success.main,
      borderDownColor: theme.palette.error.main,
      wickUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
    });
    
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series if enabled
    if (config.showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: alpha(theme.palette.primary.main, 0.5),
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Setup crosshair tracking
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candlestickSeries);
        setCrosshairData(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [theme, config, height, symbol]);

  // Update chart data
  const updateChartData = useCallback(() => {
    if (!candlestickSeriesRef.current || !data.length) return;

    // Convert data to lightweight-charts format
    const chartData = data.map((candle) => ({
      time: new Date(candle.date).getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candlestickSeriesRef.current.setData(chartData);

    // Update volume data
    if (config.showVolume && volumeSeriesRef.current) {
      const volumeData = data.map((candle) => ({
        time: new Date(candle.date).getTime() / 1000,
        value: candle.volume,
        color: candle.close >= candle.open 
          ? alpha(theme.palette.success.main, 0.5)
          : alpha(theme.palette.error.main, 0.5),
      }));

      volumeSeriesRef.current.setData(volumeData);
    }

    // Auto-fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, config.showVolume, theme]);

  // Add technical indicators
  const updateIndicators = useCallback(() => {
    if (!chartRef.current) return;

    // Clear existing indicator series
    indicatorSeriesRef.current.forEach((series) => {
      chartRef.current!.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Add new indicators
    indicators.forEach((indicator) => {
      const indicatorData = data.map((candle, index) => {
        const matchingIndicator = indicators.find(
          ind => ind.timestamp === new Date(candle.date).getTime()
        );
        
        return {
          time: new Date(candle.date).getTime() / 1000,
          value: matchingIndicator?.value || null,
        };
      }).filter(point => point.value !== null);

      if (indicatorData.length > 0) {
        const color = getIndicatorColor(indicator.type);
        const series = chartRef.current!.addLineSeries({
          color,
          lineWidth: 2,
          title: indicator.type,
        });

        series.setData(indicatorData as any);
        indicatorSeriesRef.current.set(indicator.type, series);
      }
    });
  }, [indicators, data]);

  // Add trading signals
  const updateSignals = useCallback(() => {
    if (!config.showSignals || !chartRef.current || !candlestickSeriesRef.current) return;

    signals.forEach((signal) => {
      const signalData = {
        time: signal.timestamp / 1000,
        position: signal.signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color: signal.signal === 'BUY' ? theme.palette.success.main : theme.palette.error.main,
        shape: signal.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${signal.signal} (${(signal.confidence * 100).toFixed(0)}%)`,
        size: 1,
      };

      candlestickSeriesRef.current!.createPriceLine({
        price: signal.currentPrice,
        color: signal.signal === 'BUY' ? theme.palette.success.main : theme.palette.error.main,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${signal.signal} Signal`,
      });
    });
  }, [signals, config.showSignals, theme]);

  // Get indicator color
  const getIndicatorColor = (type: string): string => {
    const colors = {
      'SMA': theme.palette.primary.main,
      'EMA': theme.palette.secondary.main,
      'RSI': theme.palette.warning.main,
      'MACD': theme.palette.info.main,
      'BOLLINGER_UPPER': theme.palette.success.light,
      'BOLLINGER_LOWER': theme.palette.error.light,
      'BOLLINGER_MIDDLE': theme.palette.grey[500],
    };
    return colors[type as keyof typeof colors] || theme.palette.text.primary;
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setConfig(prev => ({ ...prev, timeframe: newTimeframe as any }));
    onTimeframeChange?.(newTimeframe);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Initialize chart on mount
  useEffect(() => {
    const cleanup = initializeChart();
    return cleanup;
  }, [initializeChart]);

  // Update data when it changes
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  // Update indicators when they change
  useEffect(() => {
    updateIndicators();
  }, [updateIndicators]);

  // Update signals when they change
  useEffect(() => {
    updateSignals();
  }, [updateSignals]);

  // Market summary calculations
  const latestCandle = data[data.length - 1];
  const previousCandle = data[data.length - 2];
  const priceChange = latestCandle && previousCandle ? latestCandle.close - previousCandle.close : 0;
  const priceChangePercent = latestCandle && previousCandle ? 
    ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100 : 0;

  return (
    <Card className={className} sx={{ height }}>
      <CardContent sx={{ height: '100%', p: 0 }}>
        {/* Chart Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {symbol} - Professional Chart
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Chart Type Controls */}
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('line')}
                  startIcon={<ShowChart />}
                >
                  Line
                </Button>
                <Button
                  variant={chartType === 'candlestick' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('candlestick')}
                  startIcon={<CandlestickIcon />}
                >
                  Candles
                </Button>
              </ButtonGroup>

              <Divider orientation="vertical" flexItem />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showVolume}
                    onChange={(e) => setConfig(prev => ({ ...prev, showVolume: e.target.checked }))}
                    size="small"
                  />
                }
                label="Volume"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.showSignals}
                    onChange={(e) => setConfig(prev => ({ ...prev, showSignals: e.target.checked }))}
                    size="small"
                  />
                }
                label="Signals"
              />

              <Divider orientation="vertical" flexItem />

              <Tooltip title="Zoom In">
                <IconButton size="small">
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Zoom Out">
                <IconButton size="small">
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh">
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={toggleFullscreen}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Settings">
                <IconButton size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Timeframe Controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                size="small"
                variant={config.timeframe === tf.value ? 'contained' : 'outlined'}
                onClick={() => handleTimeframeChange(tf.value)}
                disabled={tf.disabled}
              >
                {tf.label}
              </Button>
            ))}
          </Box>

          {/* Market Summary */}
          {latestCandle && (
            <Grid container spacing={3}>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">Last</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${latestCandle.close.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">Change</Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: priceChange >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {priceChange >= 0 ? <TrendingUp /> : <TrendingDown />}
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">High</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${latestCandle.high.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">Low</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${latestCandle.low.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">Volume</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VolumeUp />
                  {(latestCandle.volume / 1000000).toFixed(2)}M
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" color="text.secondary">Open</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${latestCandle.open.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Chart Container */}
        <Box 
          ref={chartContainerRef} 
          sx={{ 
            height: `calc(100% - ${latestCandle ? '180px' : '120px'})`,
            position: 'relative',
          }} 
        />

        {/* Crosshair Info */}
        {crosshairData && (
          <Paper 
            sx={{ 
              position: 'absolute', 
              top: 100, 
              right: 16, 
              p: 1, 
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" display="block">
              O: ${crosshairData.open?.toFixed(2)}
            </Typography>
            <Typography variant="caption" display="block">
              H: ${crosshairData.high?.toFixed(2)}
            </Typography>
            <Typography variant="caption" display="block">
              L: ${crosshairData.low?.toFixed(2)}
            </Typography>
            <Typography variant="caption" display="block">
              C: ${crosshairData.close?.toFixed(2)}
            </Typography>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default CandlestickChart;