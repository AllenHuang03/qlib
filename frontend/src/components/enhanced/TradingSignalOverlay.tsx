/**
 * Trading Signal Visualization System
 * AI-powered trading signal overlays and performance tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Paper,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  useTheme,
  alpha,
  Fade,
  Zoom,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Speed,
  Visibility,
  VisibilityOff,
  NotificationsActive,
  PlayArrow,
  Pause,
  FilterList,
  Analytics,
  Timeline,
  AutoGraph,
  SignalCellularAlt,
} from '@mui/icons-material';
import { TradingSignal } from '../../types/market';

export interface SignalOverlayConfig {
  showSignals: boolean;
  showConfidenceBars: boolean;
  showPerformanceLines: boolean;
  showAlerts: boolean;
  minConfidence: number;
  signalTypes: ('BUY' | 'SELL' | 'HOLD')[];
  autoHide: boolean;
  animateSignals: boolean;
}

interface TradingSignalOverlayProps {
  signals: TradingSignal[];
  chartWidth: number;
  chartHeight: number;
  onSignalClick?: (signal: TradingSignal) => void;
  onSignalAction?: (signal: TradingSignal, action: 'execute' | 'ignore' | 'watchlist') => void;
  config?: Partial<SignalOverlayConfig>;
  className?: string;
}

const TradingSignalOverlay: React.FC<TradingSignalOverlayProps> = ({
  signals,
  chartWidth,
  chartHeight,
  onSignalClick,
  onSignalAction,
  config: configProp,
  className = '',
}) => {
  const theme = useTheme();

  // Default configuration
  const defaultConfig: SignalOverlayConfig = {
    showSignals: true,
    showConfidenceBars: true,
    showPerformanceLines: true,
    showAlerts: true,
    minConfidence: 0.6,
    signalTypes: ['BUY', 'SELL', 'HOLD'],
    autoHide: false,
    animateSignals: true,
  };

  const [config, setConfig] = useState<SignalOverlayConfig>({ ...defaultConfig, ...configProp });
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<Map<string, number>>(new Map());

  // Filter signals based on configuration
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => 
      config.showSignals &&
      signal.confidence >= config.minConfidence &&
      config.signalTypes.includes(signal.signal)
    );
  }, [signals, config]);

  // Calculate signal performance
  const calculateSignalPerformance = (signal: TradingSignal): number => {
    // Mock performance calculation - in real app, this would track actual performance
    const timePassed = Date.now() - signal.timestamp;
    const daysPassed = timePassed / (24 * 60 * 60 * 1000);
    
    // Simulate performance based on confidence and time
    const baseReturn = signal.signal === 'BUY' ? 0.02 : signal.signal === 'SELL' ? -0.015 : 0;
    const confidenceBonus = (signal.confidence - 0.5) * 0.04;
    const timeDecay = Math.exp(-daysPassed / 10); // Performance decays over time
    
    return (baseReturn + confidenceBonus) * timeDecay + (Math.random() - 0.5) * 0.01;
  };

  // Update performance data
  useEffect(() => {
    const newPerformanceData = new Map();
    filteredSignals.forEach(signal => {
      newPerformanceData.set(signal.id, calculateSignalPerformance(signal));
    });
    setPerformanceData(newPerformanceData);
  }, [filteredSignals]);

  // Get signal color based on type and performance
  const getSignalColor = (signal: TradingSignal): string => {
    const performance = performanceData.get(signal.id) || 0;
    
    if (signal.signal === 'BUY') {
      return performance >= 0 ? theme.palette.success.main : theme.palette.success.light;
    } else if (signal.signal === 'SELL') {
      return performance >= 0 ? theme.palette.error.main : theme.palette.error.light;
    } else {
      return theme.palette.warning.main;
    }
  };

  // Get signal icon
  const getSignalIcon = (signal: TradingSignal) => {
    switch (signal.signal) {
      case 'BUY': return <TrendingUp />;
      case 'SELL': return <TrendingDown />;
      default: return <Timeline />;
    }
  };

  // Get strength indicator
  const getStrengthColor = (strength: string): string => {
    switch (strength) {
      case 'VERY_STRONG': return theme.palette.success.dark;
      case 'STRONG': return theme.palette.success.main;
      case 'MODERATE': return theme.palette.warning.main;
      default: return theme.palette.error.main;
    }
  };

  // Handle signal interaction
  const handleSignalClick = (signal: TradingSignal) => {
    setSelectedSignal(signal.id);
    onSignalClick?.(signal);
  };

  // Handle signal action
  const handleSignalAction = (signal: TradingSignal, action: 'execute' | 'ignore' | 'watchlist') => {
    onSignalAction?.(signal, action);
  };

  // Signal positioning (mock positioning - would integrate with chart coordinates)
  const getSignalPosition = (signal: TradingSignal, index: number) => {
    // Mock positioning based on timestamp and price
    const x = (index / filteredSignals.length) * chartWidth;
    const y = chartHeight * 0.2 + (Math.random() * chartHeight * 0.6);
    
    return { x, y };
  };

  return (
    <Box className={className} sx={{ position: 'relative', width: chartWidth, height: chartHeight }}>
      {/* Signal Controls */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          minWidth: 280,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            AI Trading Signals
            <Badge badgeContent={filteredSignals.length} color="error">
              <NotificationsActive />
            </Badge>
          </Typography>
          
          <IconButton
            size="small"
            onClick={() => setConfig(prev => ({ ...prev, showSignals: !prev.showSignals }))}
          >
            {config.showSignals ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </Box>

        {/* Configuration Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.showConfidenceBars}
                onChange={(e) => setConfig(prev => ({ ...prev, showConfidenceBars: e.target.checked }))}
                size="small"
              />
            }
            label="Confidence Bars"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={config.showPerformanceLines}
                onChange={(e) => setConfig(prev => ({ ...prev, showPerformanceLines: e.target.checked }))}
                size="small"
              />
            }
            label="Performance Lines"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={config.animateSignals}
                onChange={(e) => setConfig(prev => ({ ...prev, animateSignals: e.target.checked }))}
                size="small"
              />
            }
            label="Animate Signals"
          />

          <Box>
            <Typography variant="caption" gutterBottom>
              Minimum Confidence: {(config.minConfidence * 100).toFixed(0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={config.minConfidence * 100}
              sx={{ mb: 1 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Signal Overlays */}
      {config.showSignals && filteredSignals.map((signal, index) => {
        const position = getSignalPosition(signal, index);
        const isHovered = hoveredSignal === signal.id;
        const isSelected = selectedSignal === signal.id;
        const performance = performanceData.get(signal.id) || 0;
        
        return (
          <Zoom
            key={signal.id}
            in={true}
            timeout={config.animateSignals ? 500 + index * 100 : 0}
          >
            <Box
              sx={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 12 : isHovered ? 11 : 9,
              }}
            >
              {/* Signal Marker */}
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: alpha(getSignalColor(signal), isSelected ? 1 : isHovered ? 0.9 : 0.8),
                  border: `2px solid ${getSignalColor(signal)}`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'scale(1.3)' : isHovered ? 'scale(1.2)' : 'scale(1)',
                  animation: signal.strength === 'VERY_STRONG' ? 'pulse 2s infinite' : 'none',
                  '&:hover': {
                    boxShadow: `0 0 20px ${alpha(getSignalColor(signal), 0.6)}`,
                  },
                  '@keyframes pulse': {
                    '0%': { opacity: 0.8 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.8 },
                  },
                }}
                onMouseEnter={() => setHoveredSignal(signal.id)}
                onMouseLeave={() => setHoveredSignal(null)}
                onClick={() => handleSignalClick(signal)}
              >
                <Avatar
                  sx={{
                    bgcolor: 'transparent',
                    color: 'white',
                    width: 24,
                    height: 24,
                  }}
                >
                  {getSignalIcon(signal)}
                </Avatar>
              </Paper>

              {/* Confidence Bar */}
              {config.showConfidenceBars && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 60,
                    height: 4,
                    backgroundColor: alpha(theme.palette.background.paper, 0.3),
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${signal.confidence * 100}%`,
                      height: '100%',
                      backgroundColor: getSignalColor(signal),
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              )}

              {/* Performance Line */}
              {config.showPerformanceLines && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 40,
                    height: 2,
                    backgroundColor: performance >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    opacity: 0.7,
                  }}
                />
              )}

              {/* Detailed Signal Info (on hover/select) */}
              <Fade in={isHovered || isSelected}>
                <Paper
                  sx={{
                    position: 'absolute',
                    top: signal.signal === 'BUY' ? 40 : -200,
                    left: signal.signal === 'BUY' ? 20 : -180,
                    p: 2,
                    minWidth: 200,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${getSignalColor(signal)}`,
                    zIndex: 15,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {signal.symbol}
                    </Typography>
                    <Chip
                      label={signal.strength}
                      size="small"
                      sx={{
                        backgroundColor: getStrengthColor(signal.strength),
                        color: 'white',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: getSignalColor(signal), mb: 1 }}>
                      {signal.signal}
                    </Typography>
                    
                    <Typography variant="body2">
                      Confidence: <strong>{(signal.confidence * 100).toFixed(0)}%</strong>
                    </Typography>
                    
                    <Typography variant="body2">
                      Current: <strong>${signal.currentPrice.toFixed(2)}</strong>
                    </Typography>
                    
                    <Typography variant="body2">
                      Target: <strong>${signal.priceTarget.toFixed(2)}</strong>
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: performance >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                      Performance: <strong>{(performance * 100).toFixed(1)}%</strong>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      AI Reasoning:
                    </Typography>
                    {signal.reasoning.map((reason, idx) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                        • {reason}
                      </Typography>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color={signal.signal === 'BUY' ? 'success' : 'error'}
                      onClick={() => handleSignalAction(signal, 'execute')}
                    >
                      Execute
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSignalAction(signal, 'watchlist')}
                    >
                      Watch
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleSignalAction(signal, 'ignore')}
                    >
                      Ignore
                    </Button>
                  </Box>
                </Paper>
              </Fade>
            </Box>
          </Zoom>
        );
      })}

      {/* Signal Statistics Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          p: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Analytics />
          Signal Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Total Signals:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{filteredSignals.length}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Buy Signals:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
              {filteredSignals.filter(s => s.signal === 'BUY').length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Sell Signals:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
              {filteredSignals.filter(s => s.signal === 'SELL').length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Avg Confidence:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {filteredSignals.length > 0 
                ? (filteredSignals.reduce((acc, s) => acc + s.confidence, 0) / filteredSignals.length * 100).toFixed(0)
                : 0}%
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Avg Performance:</Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold',
                color: Array.from(performanceData.values()).reduce((acc, p) => acc + p, 0) >= 0 
                  ? theme.palette.success.main 
                  : theme.palette.error.main
              }}
            >
              {performanceData.size > 0
                ? (Array.from(performanceData.values()).reduce((acc, p) => acc + p, 0) / performanceData.size * 100).toFixed(1)
                : 0}%
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* No Signals Message */}
      {filteredSignals.length === 0 && config.showSignals && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: theme.palette.text.secondary,
            zIndex: 5,
          }}
        >
          <SignalCellularAlt sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No Active Signals
          </Typography>
          <Typography variant="body2">
            AI is analyzing market conditions for new opportunities
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TradingSignalOverlay;