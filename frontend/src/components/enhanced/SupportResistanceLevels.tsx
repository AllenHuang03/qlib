/**
 * Support & Resistance Level Detection and Visualization
 * Advanced algorithmic level detection for professional trading
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  HorizontalRule,
  Analytics,
  Speed,
  Visibility,
  VisibilityOff,
  Settings,
  AutoGraph,
  Timeline,
  ShowChart,
} from '@mui/icons-material';
import { CandlestickData, SupportResistanceLevel } from '../../types/market';

export interface LevelDetectionConfig {
  enabled: boolean;
  sensitivity: number; // 1-10, higher = more levels detected
  minTouches: number; // Minimum number of price touches to confirm level
  maxLevels: number; // Maximum number of levels to display
  lookbackPeriods: number; // How many candles to analyze
  strengthThreshold: number; // Minimum strength to display level
  showHistoricalBreaks: boolean;
  showProjectedLevels: boolean;
  autoAdjustLevels: boolean;
}

interface SupportResistanceLevelsProps {
  data: CandlestickData[];
  chartWidth: number;
  chartHeight: number;
  onLevelsDetected?: (levels: SupportResistanceLevel[]) => void;
  config?: Partial<LevelDetectionConfig>;
  className?: string;
}

interface DetectedLevel extends SupportResistanceLevel {
  id: string;
  lastTouchTimestamp: number;
  firstTouchTimestamp: number;
  breakouts: number;
  bounces: number;
  volume: number;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'STRENGTHENING' | 'WEAKENING' | 'STABLE';
  proximity: number; // Distance from current price as percentage
}

const SupportResistanceLevels: React.FC<SupportResistanceLevelsProps> = ({
  data,
  chartWidth,
  chartHeight,
  onLevelsDetected,
  config: configProp,
  className = '',
}) => {
  const theme = useTheme();

  // Default configuration
  const defaultConfig: LevelDetectionConfig = {
    enabled: true,
    sensitivity: 6,
    minTouches: 2,
    maxLevels: 10,
    lookbackPeriods: 100,
    strengthThreshold: 0.3,
    showHistoricalBreaks: true,
    showProjectedLevels: true,
    autoAdjustLevels: true,
  };

  const [config, setConfig] = useState<LevelDetectionConfig>({ ...defaultConfig, ...configProp });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levelStats, setLevelStats] = useState<{ [key: string]: any }>({});

  // Detect support and resistance levels
  const detectedLevels = useMemo((): DetectedLevel[] => {
    if (!data || data.length < config.lookbackPeriods || !config.enabled) {
      return [];
    }

    const recentData = data.slice(-config.lookbackPeriods);
    const levels: Map<string, DetectedLevel> = new Map();
    
    // Calculate price tolerance based on volatility
    const priceRange = Math.max(...recentData.map(c => c.high)) - Math.min(...recentData.map(c => c.low));
    const tolerance = (priceRange * (0.5 / config.sensitivity)) / 100; // Dynamic tolerance based on sensitivity

    // Find potential levels using pivot points and clustering
    const potentialLevels: { price: number; type: 'SUPPORT' | 'RESISTANCE'; timestamp: number; volume: number }[] = [];

    // Detect swing highs and lows
    for (let i = 2; i < recentData.length - 2; i++) {
      const candle = recentData[i];
      const prevCandle1 = recentData[i - 1];
      const prevCandle2 = recentData[i - 2];
      const nextCandle1 = recentData[i + 1];
      const nextCandle2 = recentData[i + 2];

      // Swing High (Resistance)
      if (candle.high > prevCandle1.high && 
          candle.high > prevCandle2.high && 
          candle.high > nextCandle1.high && 
          candle.high > nextCandle2.high) {
        potentialLevels.push({
          price: candle.high,
          type: 'RESISTANCE',
          timestamp: candle.timestamp,
          volume: candle.volume,
        });
      }

      // Swing Low (Support)
      if (candle.low < prevCandle1.low && 
          candle.low < prevCandle2.low && 
          candle.low < nextCandle1.low && 
          candle.low < nextCandle2.low) {
        potentialLevels.push({
          price: candle.low,
          type: 'SUPPORT',
          timestamp: candle.timestamp,
          volume: candle.volume,
        });
      }
    }

    // Cluster nearby levels and calculate strength
    const levelClusters: Map<string, {
      price: number;
      type: 'SUPPORT' | 'RESISTANCE';
      touches: Array<{ timestamp: number; volume: number }>;
      totalVolume: number;
    }> = new Map();

    potentialLevels.forEach(level => {
      let clustered = false;
      
      for (const [key, cluster] of levelClusters) {
        const clusterPrice = cluster.price;
        if (Math.abs(level.price - clusterPrice) <= tolerance && cluster.type === level.type) {
          // Add to existing cluster
          cluster.touches.push({ timestamp: level.timestamp, volume: level.volume });
          cluster.totalVolume += level.volume;
          cluster.price = (cluster.price * (cluster.touches.length - 1) + level.price) / cluster.touches.length; // Weighted average
          clustered = true;
          break;
        }
      }

      if (!clustered) {
        // Create new cluster
        const clusterId = `${level.type}_${level.price.toFixed(4)}`;
        levelClusters.set(clusterId, {
          price: level.price,
          type: level.type,
          touches: [{ timestamp: level.timestamp, volume: level.volume }],
          totalVolume: level.volume,
        });
      }
    });

    // Convert clusters to detected levels with strength calculation
    const currentPrice = recentData[recentData.length - 1]?.close || 0;
    
    Array.from(levelClusters.values()).forEach(cluster => {
      if (cluster.touches.length >= config.minTouches) {
        const touches = cluster.touches.length;
        const volumeWeight = cluster.totalVolume / (touches * 1000000); // Normalize volume
        const recency = Math.max(...cluster.touches.map(t => t.timestamp));
        const age = (Date.now() - recency) / (24 * 60 * 60 * 1000); // Days since last touch
        const ageWeight = Math.exp(-age / 30); // Exponential decay over 30 days

        // Calculate strength (0-1)
        let strength = (touches / 10) * 0.4 + // Touch component (max 40%)
                      Math.min(volumeWeight, 1) * 0.3 + // Volume component (max 30%)
                      ageWeight * 0.3; // Recency component (max 30%)
        
        strength = Math.min(strength, 1);

        if (strength >= config.strengthThreshold) {
          // Calculate additional metrics
          const breakouts = countBreakouts(recentData, cluster.price, cluster.type, tolerance);
          const bounces = touches - breakouts;
          const proximity = Math.abs((currentPrice - cluster.price) / currentPrice) * 100;

          // Determine significance
          let significance: DetectedLevel['significance'] = 'LOW';
          if (strength > 0.8 && touches >= 4) significance = 'CRITICAL';
          else if (strength > 0.6 && touches >= 3) significance = 'HIGH';
          else if (strength > 0.4) significance = 'MEDIUM';

          // Determine trend
          const recentTouches = cluster.touches.filter(t => t.timestamp > Date.now() - (30 * 24 * 60 * 60 * 1000));
          let trend: DetectedLevel['trend'] = 'STABLE';
          if (recentTouches.length > touches / 2) trend = 'STRENGTHENING';
          else if (recentTouches.length < touches / 4) trend = 'WEAKENING';

          const detectedLevel: DetectedLevel = {
            id: `${cluster.type}_${cluster.price.toFixed(2)}_${touches}`,
            price: cluster.price,
            type: cluster.type,
            strength,
            touches,
            lastTouchTimestamp: Math.max(...cluster.touches.map(t => t.timestamp)),
            firstTouchTimestamp: Math.min(...cluster.touches.map(t => t.timestamp)),
            breakouts,
            bounces,
            volume: cluster.totalVolume,
            significance,
            trend,
            proximity,
          };

          levels.set(detectedLevel.id, detectedLevel);
        }
      }
    });

    // Sort by strength and limit results
    const sortedLevels = Array.from(levels.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, config.maxLevels);

    return sortedLevels;
  }, [data, config]);

  // Count breakouts through a level
  const countBreakouts = (data: CandlestickData[], levelPrice: number, levelType: 'SUPPORT' | 'RESISTANCE', tolerance: number): number => {
    let breakouts = 0;
    let wasAbove = levelType === 'SUPPORT';
    
    for (const candle of data) {
      const currentlyAbove = candle.close > levelPrice + tolerance;
      const currentlyBelow = candle.close < levelPrice - tolerance;
      
      if (levelType === 'SUPPORT') {
        if (wasAbove && currentlyBelow) {
          breakouts++;
          wasAbove = false;
        } else if (!wasAbove && currentlyAbove) {
          wasAbove = true;
        }
      } else { // RESISTANCE
        if (!wasAbove && currentlyAbove) {
          breakouts++;
          wasAbove = true;
        } else if (wasAbove && currentlyBelow) {
          wasAbove = false;
        }
      }
    }
    
    return breakouts;
  };

  // Calculate level position on chart
  const getLevelPosition = (price: number): number => {
    if (!data.length) return 0;
    
    const minPrice = Math.min(...data.map(c => c.low));
    const maxPrice = Math.max(...data.map(c => c.high));
    const priceRange = maxPrice - minPrice;
    
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Get level color based on type and strength
  const getLevelColor = (level: DetectedLevel): string => {
    const alpha_value = 0.3 + (level.strength * 0.7); // 30-100% opacity based on strength
    
    if (level.type === 'SUPPORT') {
      return alpha(theme.palette.success.main, alpha_value);
    } else {
      return alpha(theme.palette.error.main, alpha_value);
    }
  };

  // Get significance color
  const getSignificanceColor = (significance: DetectedLevel['significance']): string => {
    switch (significance) {
      case 'CRITICAL': return theme.palette.error.dark;
      case 'HIGH': return theme.palette.warning.main;
      case 'MEDIUM': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  // Notify parent of level changes
  useEffect(() => {
    onLevelsDetected?.(detectedLevels);
  }, [detectedLevels, onLevelsDetected]);

  // Calculate statistics
  useEffect(() => {
    const stats = {
      totalLevels: detectedLevels.length,
      supportLevels: detectedLevels.filter(l => l.type === 'SUPPORT').length,
      resistanceLevels: detectedLevels.filter(l => l.type === 'RESISTANCE').length,
      criticalLevels: detectedLevels.filter(l => l.significance === 'CRITICAL').length,
      avgStrength: detectedLevels.length > 0 
        ? detectedLevels.reduce((sum, l) => sum + l.strength, 0) / detectedLevels.length 
        : 0,
      nearestSupport: detectedLevels
        .filter(l => l.type === 'SUPPORT')
        .sort((a, b) => a.proximity - b.proximity)[0] || null,
      nearestResistance: detectedLevels
        .filter(l => l.type === 'RESISTANCE')
        .sort((a, b) => a.proximity - b.proximity)[0] || null,
    };
    setLevelStats(stats);
  }, [detectedLevels]);

  const currentPrice = data[data.length - 1]?.close || 0;

  return (
    <Box className={className}>
      {/* Level Overlay on Chart */}
      {config.enabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: chartWidth,
            height: chartHeight,
            pointerEvents: 'none',
            zIndex: 8,
          }}
        >
          {detectedLevels.map((level) => {
            const y = getLevelPosition(level.price);
            const isSelected = selectedLevel === level.id;
            
            return (
              <Box key={level.id}>
                {/* Level Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: y,
                    width: '100%',
                    height: 2,
                    backgroundColor: getLevelColor(level),
                    borderTop: `2px ${level.trend === 'STRENGTHENING' ? 'solid' : 'dashed'} ${getLevelColor(level)}`,
                    opacity: isSelected ? 1 : 0.7,
                    transform: isSelected ? 'scaleY(2)' : 'scaleY(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedLevel(isSelected ? null : level.id)}
                />

                {/* Level Label */}
                <Paper
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: y - 12,
                    px: 1,
                    py: 0.5,
                    backgroundColor: getLevelColor(level),
                    backdropFilter: 'blur(4px)',
                    borderRadius: 1,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedLevel(isSelected ? null : level.id)}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
                    ${level.price.toFixed(2)}
                  </Typography>
                </Paper>

                {/* Strength Indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: y - 8,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: getSignificanceColor(level.significance),
                    border: '2px solid white',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedLevel(isSelected ? null : level.id)}
                />

                {/* Extended Info on Selection */}
                {isSelected && (
                  <Paper
                    sx={{
                      position: 'absolute',
                      left: 40,
                      top: y - 60,
                      p: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.95),
                      backdropFilter: 'blur(8px)',
                      minWidth: 200,
                      zIndex: 10,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {level.type} Level - {level.significance}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Strength</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {(level.strength * 100).toFixed(0)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Touches</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {level.touches}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Bounces</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {level.bounces}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Breaks</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {level.breakouts}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={level.trend} 
                        size="small" 
                        color={level.trend === 'STRENGTHENING' ? 'success' : level.trend === 'WEAKENING' ? 'error' : 'default'}
                      />
                    </Box>
                    
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Distance: {level.proximity.toFixed(2)}% from current price
                    </Typography>
                  </Paper>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Control Panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 300,
          p: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          zIndex: 9,
          minWidth: 280,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HorizontalRule color="primary" />
            S&R Levels
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={config.enabled ? "Hide Levels" : "Show Levels"}>
              <IconButton
                size="small"
                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                color={config.enabled ? "primary" : "default"}
              >
                {config.enabled ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton
                size="small"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Statistics */}
        {config.enabled && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {levelStats.totalLevels || 0}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="success.main">Support</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                {levelStats.supportLevels || 0}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="error.main">Resistance</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {levelStats.resistanceLevels || 0}
              </Typography>
            </Grid>
          </Grid>
        )}

        {/* Settings */}
        {showSettings && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" gutterBottom display="block">
                Sensitivity: {config.sensitivity}
              </Typography>
              <Slider
                value={config.sensitivity}
                onChange={(_, value) => setConfig(prev => ({ ...prev, sensitivity: value as number }))}
                min={1}
                max={10}
                size="small"
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
              />
            </Box>
            
            <FormControl size="small">
              <InputLabel>Min Touches</InputLabel>
              <Select
                value={config.minTouches}
                onChange={(e) => setConfig(prev => ({ ...prev, minTouches: e.target.value as number }))}
              >
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Nearest Levels */}
        {config.enabled && (levelStats.nearestSupport || levelStats.nearestResistance) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>Nearest Levels</Typography>
            
            {levelStats.nearestSupport && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="success.main">
                  Support: ${levelStats.nearestSupport.price.toFixed(2)} 
                  ({levelStats.nearestSupport.proximity.toFixed(1)}% away)
                </Typography>
              </Box>
            )}
            
            {levelStats.nearestResistance && (
              <Box>
                <Typography variant="body2" color="error.main">
                  Resistance: ${levelStats.nearestResistance.price.toFixed(2)} 
                  ({levelStats.nearestResistance.proximity.toFixed(1)}% away)
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SupportResistanceLevels;