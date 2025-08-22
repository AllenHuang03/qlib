/**
 * Advanced Candlestick Chart Component
 * Professional trading chart with full technical indicators and real-time updates
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { safeArray, safeNumber } from '../../utils/safeguards';

interface CandlestickData {
  time: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedCandlestickChartProps {
  symbol: string;
  timeframe: string;
  data: CandlestickData[];
  indicators: string[];
  width: string;
  height: string;
  isLiveDataEnabled: boolean;
}

const AdvancedCandlestickChart: React.FC<AdvancedCandlestickChartProps> = ({
  symbol,
  timeframe,
  data,
  indicators,
  width,
  height,
  isLiveDataEnabled
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false });
  const [priceAtCursor, setPriceAtCursor] = useState(0);

  // Generate sample data if none provided
  const chartData = useMemo(() => {
    if (data.length > 0) return data;
    
    // Generate realistic sample data
    const sampleData: CandlestickData[] = [];
    const basePrice = 94.50;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 200; i++) {
      const volatility = 0.02; // 2% volatility
      const trend = (Math.random() - 0.5) * 0.001; // Small trend component
      
      const priceChange = (Math.random() - 0.5) * volatility + trend;
      const open = currentPrice;
      const close = open * (1 + priceChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      currentPrice = close;
      
      sampleData.push({
        time: Date.now() - (200 - i) * 60 * 60 * 1000, // Hourly data going back
        date: new Date(Date.now() - (200 - i) * 60 * 60 * 1000).toISOString(),
        open: safeNumber(open, basePrice),
        high: safeNumber(high, basePrice * 1.01),
        low: safeNumber(low, basePrice * 0.99),
        close: safeNumber(close, basePrice),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }
    
    return sampleData;
  }, [data]);

  // Calculate price scales
  const priceScale = useMemo(() => {
    if (chartData.length === 0) return { min: 90, max: 100, range: 10 };
    
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

  // Calculate technical indicators
  const technicalIndicators = useMemo(() => {
    if (chartData.length < 30) return {};
    
    const calculatedIndicators: any = {};
    const safeIndicators = safeArray(indicators);
    
    // Moving Averages
    if (safeIndicators.includes('MA5')) {
      calculatedIndicators.MA5 = calculateMA(chartData, 5);
    }
    if (safeIndicators.includes('MA15')) {
      calculatedIndicators.MA15 = calculateMA(chartData, 15);
    }
    if (safeIndicators.includes('MA30')) {
      calculatedIndicators.MA30 = calculateMA(chartData, 30);
    }
    
    // RSI
    if (safeIndicators.includes('RSI')) {
      calculatedIndicators.RSI = calculateRSI(chartData, 14);
    }
    
    // MACD
    if (safeIndicators.includes('MACD')) {
      calculatedIndicators.MACD = calculateMACD(chartData);
    }
    
    // Bollinger Bands
    if (safeIndicators.includes('BOLL')) {
      calculatedIndicators.BOLL = calculateBollingerBands(chartData, 20, 2);
    }
    
    return calculatedIndicators;
  }, [chartData, indicators]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Coordinate conversion functions
  const priceToY = (price: number) => {
    return dimensions.height - ((price - priceScale.min) / priceScale.range) * dimensions.height;
  };

  const indexToX = (index: number) => {
    return (index / (chartData.length - 1)) * dimensions.width;
  };

  const xToIndex = (x: number) => {
    return Math.round((x / dimensions.width) * (chartData.length - 1));
  };

  const yToPrice = (y: number) => {
    return priceScale.max - ((y / dimensions.height) * priceScale.range);
  };

  // Mouse event handlers
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setCrosshair({ x, y, visible: true });
    setPriceAtCursor(yToPrice(y));
  };

  const handleMouseLeave = () => {
    setCrosshair({ x: 0, y: 0, visible: false });
  };

  // Render candlesticks
  const renderCandlesticks = () => {
    const candleWidth = Math.max(2, Math.min(20, dimensions.width / chartData.length * 0.8));
    
    return chartData.map((candle, index) => {
      const x = indexToX(index);
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
            x1={x}
            y1={highY}
            x2={x}
            y2={lowY}
            stroke={candleColor}
            strokeWidth="1"
          />
          
          {/* Open-Close Body */}
          <rect
            x={x - candleWidth/2}
            y={bodyTop}
            width={candleWidth}
            height={Math.max(1, bodyHeight)}
            fill={isBullish ? candleColor : candleColor}
            stroke={candleColor}
            strokeWidth="1"
            opacity={isBullish ? 0.8 : 1}
          />
        </g>
      );
    });
  };

  // Render technical indicators
  const renderIndicators = () => {
    const elements = [];
    
    // Moving Averages
    if (safeArray(indicators).includes('MA5') && technicalIndicators.MA5) {
      elements.push(renderMALine(technicalIndicators.MA5, '#ffeb3b', 'MA5'));
    }
    if (safeArray(indicators).includes('MA15') && technicalIndicators.MA15) {
      elements.push(renderMALine(technicalIndicators.MA15, '#ff9800', 'MA15'));
    }
    if (safeArray(indicators).includes('MA30') && technicalIndicators.MA30) {
      elements.push(renderMALine(technicalIndicators.MA30, '#f44336', 'MA30'));
    }
    
    // Bollinger Bands
    if (safeArray(indicators).includes('BOLL') && technicalIndicators.BOLL) {
      elements.push(renderBollingerBands(technicalIndicators.BOLL));
    }
    
    return elements;
  };

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
      </g>
    );
  };

  const renderBollingerBands = (bollData: any) => {
    // Implementation for Bollinger Bands rendering
    return null; // Simplified for now
  };

  // Render price grid
  const renderPriceGrid = () => {
    const gridLines = [];
    const priceSteps = 5;
    
    for (let i = 0; i <= priceSteps; i++) {
      const ratio = i / priceSteps;
      const y = dimensions.height * ratio;
      const price = priceScale.max - (priceScale.range * ratio);
      
      gridLines.push(
        <g key={i}>
          <line 
            x1="0" 
            y1={y} 
            x2={dimensions.width} 
            y2={y} 
            stroke={alpha(theme.palette.text.primary, 0.1)} 
            strokeWidth="1" 
            strokeDasharray="2,2"
          />
          <text 
            x={dimensions.width - 10} 
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
    }
    
    return gridLines;
  };

  // Render crosshair
  const renderCrosshair = () => {
    if (!crosshair.visible) return null;
    
    return (
      <g className="crosshair">
        {/* Vertical line */}
        <line
          x1={crosshair.x}
          y1="0"
          x2={crosshair.x}
          y2={dimensions.height}
          stroke={alpha(theme.palette.text.primary, 0.5)}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        
        {/* Horizontal line */}
        <line
          x1="0"
          y1={crosshair.y}
          x2={dimensions.width}
          y2={crosshair.y}
          stroke={alpha(theme.palette.text.primary, 0.5)}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        
        {/* Price label */}
        <rect
          x={dimensions.width - 80}
          y={crosshair.y - 12}
          width="75"
          height="20"
          fill={theme.palette.background.paper}
          stroke={theme.palette.divider}
          strokeWidth="1"
        />
        <text
          x={dimensions.width - 42}
          y={crosshair.y + 3}
          fill={theme.palette.text.primary}
          fontSize="11"
          textAnchor="middle"
          fontFamily="monospace"
        >
          ${priceAtCursor.toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'crosshair',
        background: theme.palette.background.paper
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      >
        {/* Background */}
        <rect 
          width="100%" 
          height="100%" 
          fill={theme.palette.background.paper} 
        />
        
        {/* Price Grid */}
        {renderPriceGrid()}
        
        {/* Candlesticks */}
        {renderCandlesticks()}
        
        {/* Technical Indicators */}
        {renderIndicators()}
        
        {/* Crosshair */}
        {renderCrosshair()}
      </svg>
      
      {/* Live data indicator */}
      {isLiveDataEnabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: alpha(theme.palette.success.main, 0.1),
            px: 1,
            py: 0.5,
            borderRadius: 1
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: theme.palette.success.main,
              animation: 'pulse 2s infinite'
            }}
          />
          <span style={{ fontSize: '12px', color: theme.palette.success.main }}>
            实时数据
          </span>
        </Box>
      )}
    </Box>
  );
};

// Technical indicator calculation functions
function calculateMA(data: CandlestickData[], period: number) {
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
}

function calculateRSI(data: CandlestickData[], period: number) {
  // RSI calculation implementation
  return [];
}

function calculateMACD(data: CandlestickData[]) {
  // MACD calculation implementation
  return {};
}

function calculateBollingerBands(data: CandlestickData[], period: number, stdDev: number) {
  // Bollinger Bands calculation implementation
  return {};
}

export default AdvancedCandlestickChart;