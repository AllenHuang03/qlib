/**
 * Professional Trading Chart V2
 * Complete rewrite with professional-grade features
 * Multi-agent system implementation for trading platform quality
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  ButtonGroup,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
  alpha,
  Chip,
  Divider,
} from '@mui/material';
import {
  ShowChart,
  CandlestickChart as CandlestickIcon,
  Timeline,
  TrendingUp,
  TrendingDown,
  VolumeUp,
  Fullscreen,
  Settings,
  Refresh,
} from '@mui/icons-material';

import { CandlestickData, TechnicalIndicator } from '../../types/market';
import { safeArray, safeIncludes, safeNumber, safeString, validateChartData, SafeWrapper } from '../../utils/safeguards';

// Professional Chart Layout Configuration
interface TradingChartLayout {
  mainChart: {
    height: number;
    minHeight: number;
  };
  volumeChart: {
    height: number;
  };
  indicatorPanels: {
    height: number;
    count: number;
  };
  sidebar: {
    width: number;
  };
}

interface ChartDimensions {
  width: number;
  height: number;
  chartHeight: number;
  volumeHeight: number;
  indicatorHeight: number;
}

interface ProfessionalTradingChartV2Props {
  symbol: string;
  data: CandlestickData[];
  indicators?: TechnicalIndicator[];
  onTimeframeChange?: (timeframe: string) => void;
  height?: number;
  realTimeEnabled?: boolean;
}

// ==============================================
// AGENT 1: CHART LAYOUT & SIZING SPECIALIST
// ==============================================

const useChartDimensions = (containerHeight: number = 800): ChartDimensions => {
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: containerHeight,
    chartHeight: Math.max(500, containerHeight * 0.65),
    volumeHeight: 120,
    indicatorHeight: 100,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.professional-chart-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const availableWidth = rect.width - 20; // Padding
        
        setDimensions({
          width: availableWidth,
          height: containerHeight,
          chartHeight: Math.max(500, containerHeight * 0.65),
          volumeHeight: 120,
          indicatorHeight: 100,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Use ResizeObserver for better detection
    const observer = new ResizeObserver(updateDimensions);
    const container = document.querySelector('.professional-chart-container');
    if (container) {
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, [containerHeight]);

  return dimensions;
};

// ==============================================
// AGENT 2: PROFESSIONAL CANDLESTICK RENDERER
// ==============================================

interface CandlestickRendererProps {
  data: CandlestickData[];
  width: number;
  height: number;
  theme: any;
}

const ProfessionalCandlestickRenderer: React.FC<CandlestickRendererProps> = ({
  data,
  width,
  height,
  theme,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const { priceScale, timeScale } = useMemo(() => {
    if (data.length === 0) return { priceScale: { min: 0, max: 100, range: 100 }, timeScale: { start: 0, end: 1 } };

    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;

    return {
      priceScale: {
        min: minPrice - padding,
        max: maxPrice + padding,
        range: maxPrice - minPrice + (padding * 2)
      },
      timeScale: {
        start: data[0]?.time || 0,
        end: data[data.length - 1]?.time || 1
      }
    };
  }, [data]);

  const priceToY = useCallback((price: number) => {
    return height - ((price - priceScale.min) / priceScale.range) * height;
  }, [height, priceScale]);

  const indexToX = useCallback((index: number) => {
    return (index / (data.length - 1)) * width;
  }, [width, data.length]);

  if (data.length === 0) {
    return (
      <Box 
        sx={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: theme.palette.background.default,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
        }}
      >
        <Typography color="text.secondary">Loading market data...</Typography>
      </Box>
    );
  }

  const candleWidth = Math.max(2, Math.min(12, width / data.length * 0.7));
  const spacing = width / data.length;

  return (
    <Box sx={{ position: 'relative', width, height, background: theme.palette.background.paper }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', background: theme.palette.background.paper }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
            <path 
              d="M 50 0 L 0 0 0 25" 
              fill="none" 
              stroke={alpha(theme.palette.text.primary, 0.1)} 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Horizontal Price Lines */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => {
          const y = height * ratio;
          const price = priceScale.max - (priceScale.range * ratio);
          return (
            <g key={index}>
              <line 
                x1="0" 
                y1={y} 
                x2={width} 
                y2={y} 
                stroke={alpha(theme.palette.text.primary, 0.2)} 
                strokeWidth="1" 
                strokeDasharray="2,2"
              />
              <text 
                x={width - 10} 
                y={y - 5} 
                fill={theme.palette.text.secondary} 
                fontSize="11" 
                textAnchor="end"
                fontFamily="monospace"
              >
                ${price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {data.map((candle, index) => {
          const x = indexToX(index);
          const centerX = x;
          
          const openY = priceToY(candle.open);
          const closeY = priceToY(candle.close);
          const highY = priceToY(candle.high);
          const lowY = priceToY(candle.low);
          
          const isBullish = candle.close > candle.open;
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.abs(openY - closeY);

          const bullColor = theme.palette.success.main;
          const bearColor = theme.palette.error.main;
          const candleColor = isBullish ? bullColor : bearColor;

          return (
            <g key={index} className="candlestick">
              {/* High-Low Wick */}
              <line
                x1={centerX}
                y1={highY}
                x2={centerX}
                y2={lowY}
                stroke={candleColor}
                strokeWidth="1"
              />
              
              {/* Open-Close Body */}
              <rect
                x={centerX - candleWidth/2}
                y={bodyTop}
                width={candleWidth}
                height={Math.max(1, bodyHeight)}
                fill={isBullish ? candleColor : candleColor}
                stroke={isBullish ? alpha(candleColor, 0.8) : alpha(candleColor, 0.8)}
                strokeWidth="1"
                opacity={isBullish ? 0.8 : 1}
              />
              
              {/* Hover Detection Area */}
              <rect
                x={x - spacing/2}
                y="0"
                width={spacing}
                height={height}
                fill="transparent"
                className="hover-area"
                style={{ cursor: 'crosshair' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Price Scale on Right */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 80,
          height: '100%',
          background: alpha(theme.palette.background.paper, 0.9),
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          padding: 1,
        }}
      >
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio, index) => {
          const price = priceScale.max - (priceScale.range * ratio);
          return (
            <Typography
              key={index}
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: theme.palette.text.secondary,
                textAlign: 'center',
              }}
            >
              ${price.toFixed(2)}
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
};

// ==============================================
// AGENT 3: TECHNICAL INDICATORS SPECIALIST
// ==============================================

// Moving Average Calculations
const calculateMA = (data: CandlestickData[], period: number) => {
  const ma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1)
      .reduce((acc, candle) => acc + candle.close, 0);
    ma.push({
      index: i,
      value: sum / period
    });
  }
  return ma;
};

// K-Line (Stochastic Oscillator)
const calculateKLine = (data: CandlestickData[], kPeriod: number = 14) => {
  const kValues = [];
  
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map(d => d.high));
    const lowest = Math.min(...slice.map(d => d.low));
    const current = data[i].close;
    
    const k = lowest !== highest ? ((current - lowest) / (highest - lowest)) * 100 : 50;
    kValues.push({
      index: i,
      k: k
    });
  }
  
  return kValues;
};

interface TechnicalIndicatorsOverlayProps {
  data: CandlestickData[];
  width: number;
  height: number;
  indicators: string[];
  theme: any;
  priceScale: { min: number; max: number; range: number };
}

const TechnicalIndicatorsOverlay: React.FC<TechnicalIndicatorsOverlayProps> = ({
  data,
  width,
  height,
  indicators,
  theme,
  priceScale,
}) => {
  const ma5 = useMemo(() => calculateMA(data, 5), [data]);
  const ma15 = useMemo(() => calculateMA(data, 15), [data]);
  const ma30 = useMemo(() => calculateMA(data, 30), [data]);

  const priceToY = useCallback((price: number) => {
    return height - ((price - priceScale.min) / priceScale.range) * height;
  }, [height, priceScale]);

  const indexToX = useCallback((index: number) => {
    return (index / (data.length - 1)) * width;
  }, [width, data.length]);

  const renderMALine = (maData: any[], color: string, label: string) => {
    if (maData.length === 0) return null;

    const path = maData.map((point, idx) => {
      const x = indexToX(point.index);
      const y = priceToY(point.value);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <g key={label}>
        <path 
          d={path} 
          stroke={color} 
          strokeWidth="2" 
          fill="none" 
          opacity="0.8"
        />
        <text 
          x="10" 
          y={20 + (Object.keys(indicators).indexOf(label) * 15)} 
          fill={color} 
          fontSize="11"
          fontFamily="monospace"
        >
          {label}: {maData[maData.length - 1]?.value.toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <svg 
      width={width} 
      height={height} 
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {safeIncludes(indicators, 'MA5') && renderMALine(ma5, '#ffeb3b', 'MA5')}
      {safeIncludes(indicators, 'MA15') && renderMALine(ma15, '#ff9800', 'MA15')}
      {safeIncludes(indicators, 'MA30') && renderMALine(ma30, '#f44336', 'MA30')}
    </svg>
  );
};

// ==============================================
// AGENT 4: PROFESSIONAL UI CONTROLS SPECIALIST
// ==============================================

interface ChartToolbarProps {
  onTimeframeChange: (timeframe: string) => void;
  onIndicatorsChange: (indicators: string[]) => void;
  onChartTypeChange: (type: string) => void;
  selectedTimeframe: string;
  selectedIndicators: string[];
  chartType: string;
}

const ProfessionalChartToolbar: React.FC<ChartToolbarProps> = ({
  onTimeframeChange,
  onIndicatorsChange,
  onChartTypeChange,
  selectedTimeframe,
  selectedIndicators,
  chartType,
}) => {
  const theme = useTheme();

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' }
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
    const currentIndicators = safeArray(selectedIndicators);
    const newIndicators = safeIncludes(currentIndicators, indicatorValue)
      ? currentIndicators.filter(i => i !== indicatorValue)
      : [...currentIndicators, indicatorValue];
    onIndicatorsChange(newIndicators);
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2, 
        mb: 1,
        background: alpha(theme.palette.background.paper, 0.95),
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      <Grid container spacing={3} alignItems="center">
        {/* Chart Type Selector */}
        <Grid item>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>图表类型:</Typography>
          <ButtonGroup size="small" variant="outlined">
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

        <Divider orientation="vertical" flexItem />

        {/* Timeframe Selector */}
        <Grid item>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>时间周期:</Typography>
          <ButtonGroup size="small" variant="outlined">
            {timeframes.map(tf => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? 'contained' : 'outlined'}
                onClick={() => onTimeframeChange(tf.value)}
                sx={{ 
                  minWidth: 45,
                  fontFamily: 'monospace',
                  fontWeight: selectedTimeframe === tf.value ? 'bold' : 'normal'
                }}
              >
                {tf.label}
              </Button>
            ))}
          </ButtonGroup>
        </Grid>

        <Divider orientation="vertical" flexItem />

        {/* Technical Indicators */}
        <Grid item xs>
          <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>技术指标:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {indicators.map(indicator => (
              <FormControlLabel
                key={indicator.value}
                control={
                  <Checkbox
                    size="small"
                    checked={(selectedIndicators || []).includes(indicator.value)}
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
                      color: (selectedIndicators || []).includes(indicator.value) ? indicator.color : 'text.secondary',
                      fontFamily: 'monospace',
                      fontWeight: (selectedIndicators || []).includes(indicator.value) ? 'bold' : 'normal'
                    }}
                  >
                    {indicator.label}
                  </Typography>
                }
              />
            ))}
          </Box>
        </Grid>

        {/* Action Buttons */}
        <Grid item>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="刷新数据">
              <IconButton size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="全屏显示">
              <IconButton size="small">
                <Fullscreen />
              </IconButton>
            </Tooltip>
            <Tooltip title="图表设置">
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

// ==============================================
// MAIN PROFESSIONAL TRADING CHART COMPONENT
// ==============================================

const ProfessionalTradingChartV2: React.FC<ProfessionalTradingChartV2Props> = ({
  symbol,
  data,
  indicators = [],
  onTimeframeChange,
  height = 800,
  realTimeEnabled = false,
}) => {
  const theme = useTheme();
  const dimensions = useChartDimensions(height);
  
  // Chart state
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedIndicators, setSelectedIndicators] = useState(['MA5', 'MA15']);
  const [chartType, setChartType] = useState('candlestick');

  // Generate sample data if none provided
  const chartData = useMemo(() => {
    if (data.length > 0) return data;
    
    // Generate sample data for demonstration
    const sampleData: CandlestickData[] = [];
    const basePrice = 100;
    
    for (let i = 0; i < 100; i++) {
      const prevClose = i > 0 ? sampleData[i-1].close : basePrice;
      const change = (Math.random() - 0.5) * 4;
      const open = prevClose + (Math.random() - 0.5) * 2;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      sampleData.push({
        time: Date.now() - (100 - i) * 60 * 60 * 1000,
        date: new Date(Date.now() - (100 - i) * 60 * 60 * 1000).toISOString(),
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }
    
    return sampleData;
  }, [data]);

  const priceScale = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100, range: 100 };
    
    const prices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;

    return {
      min: minPrice - padding,
      max: maxPrice + padding,
      range: maxPrice - minPrice + (padding * 2)
    };
  }, [chartData]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    onTimeframeChange?.(timeframe);
  };

  return (
    <Box 
      className="professional-chart-container"
      sx={{ 
        width: '100%', 
        height,
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Professional Chart Toolbar */}
      <ProfessionalChartToolbar
        onTimeframeChange={handleTimeframeChange}
        onIndicatorsChange={setSelectedIndicators}
        onChartTypeChange={setChartType}
        selectedTimeframe={selectedTimeframe}
        selectedIndicators={selectedIndicators}
        chartType={chartType}
      />

      {/* Chart Header with Symbol and Live Price */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
              {symbol}
            </Typography>
          </Grid>
          <Grid item>
            <Chip 
              label={realTimeEnabled ? "实时" : "模拟"} 
              color={realTimeEnabled ? "success" : "warning"} 
              size="small"
              variant="outlined"
            />
          </Grid>
          {chartData.length > 0 && (
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  ${chartData[chartData.length - 1]?.close.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {chartData[chartData.length - 1]?.close > chartData[chartData.length - 2]?.close ? 
                    <TrendingUp color="success" /> : 
                    <TrendingDown color="error" />
                  }
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: chartData[chartData.length - 1]?.close > chartData[chartData.length - 2]?.close ? 
                        theme.palette.success.main : 
                        theme.palette.error.main,
                      fontFamily: 'monospace'
                    }}
                  >
                    {chartData.length > 1 ? (
                      ((chartData[chartData.length - 1]?.close - chartData[chartData.length - 2]?.close) / 
                       chartData[chartData.length - 2]?.close * 100).toFixed(2)
                    ) : '0.00'}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Chart Area */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {dimensions.width > 0 && (
          <Box sx={{ position: 'relative' }}>
            <ProfessionalCandlestickRenderer
              data={chartData}
              width={dimensions.width}
              height={dimensions.chartHeight}
              theme={theme}
            />
            <TechnicalIndicatorsOverlay
              data={chartData}
              width={dimensions.width}
              height={dimensions.chartHeight}
              indicators={selectedIndicators}
              theme={theme}
              priceScale={priceScale}
            />
          </Box>
        )}
      </Box>

      {/* Status Bar */}
      <Box 
        sx={{ 
          p: 1, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          专业交易图表 • {chartData.length} 数据点 • {selectedTimeframe.toUpperCase()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Powered by Qlib Pro
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfessionalTradingChartV2;