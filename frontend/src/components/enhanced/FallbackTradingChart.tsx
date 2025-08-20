import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  Area,
  BarChart,
  LineChart,
  AreaChart,
} from 'recharts';
import {
  Box,
  ButtonGroup,
  Button,
  Typography,
  Paper,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { CandlestickData, TechnicalIndicator } from '../../types/market';

interface FallbackTradingChartProps {
  symbol: string;
  data: CandlestickData[];
  indicators?: TechnicalIndicator[];
  height?: number;
}

// Custom Candlestick component for Recharts
const CustomCandlestick = (props: any) => {
  const { payload, x, y, width } = props;
  
  // Validate all required values
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  // Ensure numeric values and no NaN
  const open = Number(payload.open);
  const close = Number(payload.close);
  const high = Number(payload.high);
  const low = Number(payload.low);
  const xPos = Number(x);
  const candleWidth = Number(width);

  if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low) || isNaN(xPos) || isNaN(candleWidth)) {
    return null;
  }

  const isPositive = close > open;
  const color = isPositive ? '#4caf50' : '#f44336';
  
  // Calculate positions with validation
  const bodyHeight = Math.abs(close - open);
  const bodyY = Math.min(open, close);
  const wickX = xPos + candleWidth / 2;
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={wickX}
        y1={high}
        x2={wickX}
        y2={low}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={xPos + 1}
        y={bodyY}
        width={Math.max(candleWidth - 2, 1)}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const FallbackTradingChart: React.FC<FallbackTradingChartProps> = ({
  symbol,
  data,
  indicators = [],
  height = 600,
}) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');

  // Process data for chart
  const chartData = useMemo(() => {
    return data.map((candle, index) => ({
      ...candle,
      index,
      timestamp: new Date(candle.time).getTime(),
      volume: candle.volume || 0,
      // Add technical indicators
      sma20: indicators.find(i => i.type === 'SMA_20')?.values?.[index] || null,
      sma50: indicators.find(i => i.type === 'SMA_50')?.values?.[index] || null,
    }));
  }, [data, indicators]);

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
  ];

  const chartTypes = [
    { value: 'candlestick', label: 'Candles' },
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' },
  ];

  // Calculate price statistics
  const latestCandle = chartData[chartData.length - 1];
  const previousCandle = chartData[chartData.length - 2];
  const priceChange = latestCandle && previousCandle ? 
    latestCandle.close - previousCandle.close : 0;
  const priceChangePercent = previousCandle ? 
    (priceChange / previousCandle.close) * 100 : 0;

  return (
    <Box sx={{ width: '100%', height }}>
      {/* Chart Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {symbol}
          </Typography>
          {latestCandle && (
            <>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                ${latestCandle.close.toFixed(2)}
              </Typography>
              <Chip 
                label={`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)`}
                color={priceChange >= 0 ? 'success' : 'error'}
                variant="outlined"
                size="small"
              />
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Timeframe Selector */}
          <ButtonGroup size="small" variant="outlined">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'contained' : 'outlined'}
                onClick={() => setTimeframe(tf.value)}
                size="small"
              >
                {tf.label}
              </Button>
            ))}
          </ButtonGroup>

          {/* Chart Type Selector */}
          <ButtonGroup size="small" variant="outlined">
            {chartTypes.map((ct) => (
              <Button
                key={ct.value}
                variant={chartType === ct.value ? 'contained' : 'outlined'}
                onClick={() => setChartType(ct.value as any)}
                size="small"
              >
                {ct.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      {/* Main Chart Area */}
      <Box sx={{ height: '75%', p: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={alpha(theme.palette.text.primary, 0.1)}
              />
              <XAxis 
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(label).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">Close: ${data.close?.toFixed(2)}</Typography>
                        <Typography variant="body2">Volume: {data.volume?.toLocaleString()}</Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={theme.palette.primary.main}
                fill={alpha(theme.palette.primary.main, 0.3)}
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={alpha(theme.palette.text.primary, 0.1)}
              />
              <XAxis 
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(label).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">Open: ${data.open?.toFixed(2)}</Typography>
                        <Typography variant="body2">High: ${data.high?.toFixed(2)}</Typography>
                        <Typography variant="body2">Low: ${data.low?.toFixed(2)}</Typography>
                        <Typography variant="body2">Close: ${data.close?.toFixed(2)}</Typography>
                        <Typography variant="body2">Volume: {data.volume?.toLocaleString()}</Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />

              {/* Candlestick Chart */}
              {chartType === 'candlestick' && (
                <Bar 
                  dataKey="close" 
                  shape={<CustomCandlestick />}
                  fill="transparent"
                />
              )}

              {/* Price Line for Line Chart */}
              {chartType === 'line' && (
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              )}

              {/* Technical Indicators - Always show if available */}
              {indicators.find(i => i.type === 'SMA_20') && (
                <Line 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke={theme.palette.warning.main}
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                  name="SMA 20"
                />
              )}
              {indicators.find(i => i.type === 'SMA_50') && (
                <Line 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke={theme.palette.info.main}
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                  name="SMA 50"
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </Box>

      {/* Volume Chart */}
      <Box sx={{ height: '25%', p: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          Volume
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={alpha(theme.palette.text.primary, 0.1)}
            />
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              stroke={theme.palette.text.secondary}
              fontSize={10}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={10}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Bar 
              dataKey="volume" 
              fill={alpha(theme.palette.primary.main, 0.6)}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {/* Chart Footer */}
      <Box sx={{ 
        p: 1, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography variant="caption" color="text.secondary">
          Professional Trading Chart • {data.length} candles • Real-time data
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Powered by Qlib Pro
        </Typography>
      </Box>
    </Box>
  );
};

export default FallbackTradingChart;