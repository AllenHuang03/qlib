/**
 * Technical Indicators Overlay System
 * Professional-grade technical analysis indicators for trading
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  ShowChart,
  BarChart,
  Analytics,
  Settings,
  Visibility,
  VisibilityOff,
  Delete,
  Add,
  Tune,
} from '@mui/icons-material';
import { CandlestickData, TechnicalIndicator } from '../../types/market';

export interface IndicatorConfig {
  id: string;
  name: string;
  type: 'overlay' | 'oscillator' | 'volume';
  enabled: boolean;
  visible: boolean;
  color: string;
  parameters: { [key: string]: number | string };
  style: {
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    opacity: number;
  };
}

export interface IndicatorGroup {
  id: string;
  name: string;
  indicators: IndicatorConfig[];
  expanded: boolean;
}

interface TechnicalIndicatorsProps {
  data: CandlestickData[];
  onIndicatorChange?: (indicators: IndicatorConfig[]) => void;
  onCalculatedData?: (indicatorData: TechnicalIndicator[]) => void;
  className?: string;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  data,
  onIndicatorChange,
  onCalculatedData,
  className = '',
}) => {
  const theme = useTheme();

  // Default indicator configurations
  const defaultIndicatorGroups: IndicatorGroup[] = [
    {
      id: 'trend',
      name: 'Trend Indicators',
      expanded: true,
      indicators: [
        {
          id: 'sma_20',
          name: 'SMA (20)',
          type: 'overlay',
          enabled: true,
          visible: true,
          color: theme.palette.primary.main,
          parameters: { period: 20 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
        {
          id: 'sma_50',
          name: 'SMA (50)',
          type: 'overlay',
          enabled: true,
          visible: true,
          color: theme.palette.secondary.main,
          parameters: { period: 50 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
        {
          id: 'ema_12',
          name: 'EMA (12)',
          type: 'overlay',
          enabled: false,
          visible: true,
          color: theme.palette.success.main,
          parameters: { period: 12 },
          style: { lineWidth: 2, lineStyle: 'dashed', opacity: 0.8 },
        },
        {
          id: 'ema_26',
          name: 'EMA (26)',
          type: 'overlay',
          enabled: false,
          visible: true,
          color: theme.palette.warning.main,
          parameters: { period: 26 },
          style: { lineWidth: 2, lineStyle: 'dashed', opacity: 0.8 },
        },
      ],
    },
    {
      id: 'momentum',
      name: 'Momentum Oscillators',
      expanded: false,
      indicators: [
        {
          id: 'rsi_14',
          name: 'RSI (14)',
          type: 'oscillator',
          enabled: false,
          visible: true,
          color: theme.palette.warning.main,
          parameters: { period: 14, overbought: 70, oversold: 30 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
        {
          id: 'macd',
          name: 'MACD',
          type: 'oscillator',
          enabled: false,
          visible: true,
          color: theme.palette.info.main,
          parameters: { fast: 12, slow: 26, signal: 9 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
        {
          id: 'stochastic',
          name: 'Stochastic',
          type: 'oscillator',
          enabled: false,
          visible: true,
          color: theme.palette.error.main,
          parameters: { k_period: 14, d_period: 3, smooth: 3 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
      ],
    },
    {
      id: 'volatility',
      name: 'Volatility Indicators',
      expanded: false,
      indicators: [
        {
          id: 'bollinger',
          name: 'Bollinger Bands',
          type: 'overlay',
          enabled: false,
          visible: true,
          color: theme.palette.grey[500],
          parameters: { period: 20, deviation: 2 },
          style: { lineWidth: 1, lineStyle: 'solid', opacity: 0.6 },
        },
        {
          id: 'atr',
          name: 'ATR (14)',
          type: 'oscillator',
          enabled: false,
          visible: true,
          color: theme.palette.info.main,
          parameters: { period: 14 },
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
      ],
    },
    {
      id: 'volume',
      name: 'Volume Indicators',
      expanded: false,
      indicators: [
        {
          id: 'volume_sma',
          name: 'Volume SMA',
          type: 'volume',
          enabled: false,
          visible: true,
          color: theme.palette.primary.light,
          parameters: { period: 20 },
          style: { lineWidth: 1, lineStyle: 'solid', opacity: 0.6 },
        },
        {
          id: 'obv',
          name: 'On Balance Volume',
          type: 'oscillator',
          enabled: false,
          visible: true,
          color: theme.palette.secondary.light,
          parameters: {},
          style: { lineWidth: 2, lineStyle: 'solid', opacity: 0.8 },
        },
      ],
    },
  ];

  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroup[]>(defaultIndicatorGroups);
  const [calculatedIndicators, setCalculatedIndicators] = useState<TechnicalIndicator[]>([]);

  // Calculate technical indicators
  const calculateIndicators = useMemo(() => {
    if (!data || data.length < 2) return [];

    const results: TechnicalIndicator[] = [];
    const enabledIndicators = indicatorGroups.flatMap(group => 
      group.indicators.filter(indicator => indicator.enabled)
    );

    enabledIndicators.forEach(indicator => {
      switch (indicator.id.split('_')[0]) {
        case 'sma':
          results.push(...calculateSMA(data, indicator.parameters.period as number, indicator.id));
          break;
        case 'ema':
          results.push(...calculateEMA(data, indicator.parameters.period as number, indicator.id));
          break;
        case 'rsi':
          results.push(...calculateRSI(data, indicator.parameters.period as number, indicator.id));
          break;
        case 'macd':
          results.push(...calculateMACD(data, indicator));
          break;
        case 'bollinger':
          results.push(...calculateBollingerBands(data, indicator.parameters.period as number, indicator.parameters.deviation as number, indicator.id));
          break;
        case 'atr':
          results.push(...calculateATR(data, indicator.parameters.period as number, indicator.id));
          break;
        case 'stochastic':
          results.push(...calculateStochastic(data, indicator.parameters.k_period as number, indicator.parameters.d_period as number, indicator.id));
          break;
        case 'obv':
          results.push(...calculateOBV(data, indicator.id));
          break;
        case 'volume':
          if (indicator.id === 'volume_sma') {
            results.push(...calculateVolumeSMA(data, indicator.parameters.period as number, indicator.id));
          }
          break;
      }
    });

    return results;
  }, [data, indicatorGroups]);

  // Update calculated indicators when they change
  useEffect(() => {
    setCalculatedIndicators(calculateIndicators);
    onCalculatedData?.(calculateIndicators);
  }, [calculateIndicators, onCalculatedData]);

  // Notify parent of indicator changes
  useEffect(() => {
    const allIndicators = indicatorGroups.flatMap(group => group.indicators);
    onIndicatorChange?.(allIndicators);
  }, [indicatorGroups, onIndicatorChange]);

  // Indicator calculation functions
  function calculateSMA(data: CandlestickData[], period: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
      const value = sum / period;
      
      results.push({
        timestamp: data[i].timestamp,
        value,
        type: 'SMA',
      });
    }

    return results;
  }

  function calculateEMA(data: CandlestickData[], period: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let ema = data.slice(0, period).reduce((acc, candle) => acc + candle.close, 0) / period;
    results.push({
      timestamp: data[period - 1].timestamp,
      value: ema,
      type: 'EMA',
    });

    for (let i = period; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
      results.push({
        timestamp: data[i].timestamp,
        value: ema,
        type: 'EMA',
      });
    }

    return results;
  }

  function calculateRSI(data: CandlestickData[], period: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);

      if (i >= period) {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
        
        const rs = avgGain / (avgLoss || 1);
        const rsi = 100 - (100 / (1 + rs));

        results.push({
          timestamp: data[i].timestamp,
          value: rsi,
          type: 'RSI',
        });
      }
    }

    return results;
  }

  function calculateMACD(data: CandlestickData[], config: IndicatorConfig): TechnicalIndicator[] {
    const fast = config.parameters.fast as number;
    const slow = config.parameters.slow as number;
    const signal = config.parameters.signal as number;

    const emaFast = calculateEMA(data, fast, 'temp_fast');
    const emaSlow = calculateEMA(data, slow, 'temp_slow');
    
    const macdLine: TechnicalIndicator[] = [];
    const minLength = Math.min(emaFast.length, emaSlow.length);

    for (let i = 0; i < minLength; i++) {
      const macdValue = emaFast[i].value - emaSlow[i].value;
      macdLine.push({
        timestamp: emaFast[i].timestamp,
        value: macdValue,
        type: 'MACD',
      });
    }

    return macdLine;
  }

  function calculateBollingerBands(data: CandlestickData[], period: number, stdDev: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sma = slice.reduce((acc, candle) => acc + candle.close, 0) / period;
      
      const variance = slice.reduce((acc, candle) => acc + Math.pow(candle.close - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upper = sma + (standardDeviation * stdDev);
      const lower = sma - (standardDeviation * stdDev);
      
      results.push(
        { timestamp: data[i].timestamp, value: upper, type: 'BOLLINGER_UPPER' },
        { timestamp: data[i].timestamp, value: sma, type: 'BOLLINGER_MIDDLE' },
        { timestamp: data[i].timestamp, value: lower, type: 'BOLLINGER_LOWER' }
      );
    }

    return results;
  }

  function calculateATR(data: CandlestickData[], period: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const trueRanges: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const highLow = data[i].high - data[i].low;
      const highClose = Math.abs(data[i].high - data[i - 1].close);
      const lowClose = Math.abs(data[i].low - data[i - 1].close);
      
      const trueRange = Math.max(highLow, highClose, lowClose);
      trueRanges.push(trueRange);

      if (i >= period) {
        const atr = trueRanges.slice(-period).reduce((a, b) => a + b) / period;
        results.push({
          timestamp: data[i].timestamp,
          value: atr,
          type: 'RSI', // Using RSI type as oscillator
        });
      }
    }

    return results;
  }

  function calculateStochastic(data: CandlestickData[], kPeriod: number, dPeriod: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const kValues: number[] = [];

    for (let i = kPeriod - 1; i < data.length; i++) {
      const slice = data.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map(c => c.high));
      const lowest = Math.min(...slice.map(c => c.low));
      
      const k = ((data[i].close - lowest) / (highest - lowest)) * 100;
      kValues.push(k);

      if (kValues.length >= dPeriod) {
        const d = kValues.slice(-dPeriod).reduce((a, b) => a + b) / dPeriod;
        results.push({
          timestamp: data[i].timestamp,
          value: d,
          type: 'RSI', // Using RSI type as oscillator
        });
      }
    }

    return results;
  }

  function calculateOBV(data: CandlestickData[], id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    let obv = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }

      results.push({
        timestamp: data[i].timestamp,
        value: obv,
        type: 'RSI', // Using RSI type as oscillator
      });
    }

    return results;
  }

  function calculateVolumeSMA(data: CandlestickData[], period: number, id: string): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.volume, 0);
      const value = sum / period;
      
      results.push({
        timestamp: data[i].timestamp,
        value,
        type: 'SMA',
      });
    }

    return results;
  }

  // Event handlers
  const handleIndicatorToggle = (groupId: string, indicatorId: string) => {
    setIndicatorGroups(prev => prev.map(group => 
      group.id === groupId ? {
        ...group,
        indicators: group.indicators.map(indicator => 
          indicator.id === indicatorId ? {
            ...indicator,
            enabled: !indicator.enabled
          } : indicator
        )
      } : group
    ));
  };

  const handleVisibilityToggle = (groupId: string, indicatorId: string) => {
    setIndicatorGroups(prev => prev.map(group => 
      group.id === groupId ? {
        ...group,
        indicators: group.indicators.map(indicator => 
          indicator.id === indicatorId ? {
            ...indicator,
            visible: !indicator.visible
          } : indicator
        )
      } : group
    ));
  };

  const handleParameterChange = (groupId: string, indicatorId: string, paramKey: string, value: number | string) => {
    setIndicatorGroups(prev => prev.map(group => 
      group.id === groupId ? {
        ...group,
        indicators: group.indicators.map(indicator => 
          indicator.id === indicatorId ? {
            ...indicator,
            parameters: { ...indicator.parameters, [paramKey]: value }
          } : indicator
        )
      } : group
    ));
  };

  const handleStyleChange = (groupId: string, indicatorId: string, styleKey: string, value: any) => {
    setIndicatorGroups(prev => prev.map(group => 
      group.id === groupId ? {
        ...group,
        indicators: group.indicators.map(indicator => 
          indicator.id === indicatorId ? {
            ...indicator,
            style: { ...indicator.style, [styleKey]: value }
          } : indicator
        )
      } : group
    ));
  };

  const handleGroupToggle = (groupId: string) => {
    setIndicatorGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    ));
  };

  return (
    <Card className={className} sx={{ maxHeight: 600, overflow: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics color="primary" />
            Technical Indicators
          </Typography>
          
          <Chip 
            label={`${calculatedIndicators.length} Active`} 
            color="primary" 
            size="small" 
          />
        </Box>

        {indicatorGroups.map((group) => (
          <Accordion 
            key={group.id}
            expanded={group.expanded}
            onChange={() => handleGroupToggle(group.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {group.name}
                </Typography>
                <Chip 
                  label={group.indicators.filter(i => i.enabled).length} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              {group.indicators.map((indicator) => (
                <Paper key={indicator.id} sx={{ p: 2, mb: 2, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={indicator.enabled}
                            onChange={() => handleIndicatorToggle(group.id, indicator.id)}
                            size="small"
                          />
                        }
                        label={indicator.name}
                      />
                      
                      <Chip
                        label={indicator.type.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color={indicator.type === 'overlay' ? 'primary' : indicator.type === 'oscillator' ? 'secondary' : 'default'}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={indicator.visible ? "Hide" : "Show"}>
                        <IconButton
                          size="small"
                          onClick={() => handleVisibilityToggle(group.id, indicator.id)}
                          disabled={!indicator.enabled}
                        >
                          {indicator.visible ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {indicator.enabled && (
                    <Grid container spacing={2}>
                      {/* Parameters */}
                      {Object.entries(indicator.parameters).map(([key, value]) => (
                        <Grid item xs={6} key={key}>
                          <TextField
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            type="number"
                            size="small"
                            value={value}
                            onChange={(e) => handleParameterChange(group.id, indicator.id, key, Number(e.target.value))}
                            fullWidth
                          />
                        </Grid>
                      ))}

                      {/* Style Options */}
                      <Grid item xs={6}>
                        <Typography variant="caption" display="block" gutterBottom>
                          Line Width
                        </Typography>
                        <Slider
                          value={indicator.style.lineWidth}
                          onChange={(_, value) => handleStyleChange(group.id, indicator.id, 'lineWidth', value)}
                          min={1}
                          max={5}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" display="block" gutterBottom>
                          Opacity
                        </Typography>
                        <Slider
                          value={indicator.style.opacity}
                          onChange={(_, value) => handleStyleChange(group.id, indicator.id, 'opacity', value)}
                          min={0.1}
                          max={1}
                          step={0.1}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        {calculatedIndicators.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
            <Analytics sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">
              Enable indicators to see technical analysis
            </Typography>
            <Typography variant="body2">
              Start with moving averages for trend analysis
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicators;