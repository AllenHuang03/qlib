/**
 * Professional Volume Chart Component
 * AGENT 6: VOLUME AND MARKET DEPTH SPECIALIST
 */

import React, { useMemo, useCallback } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { CandlestickData } from '../../types/market';

interface VolumeChartProps {
  data: CandlestickData[];
  width: number;
  height: number;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ data, width, height }) => {
  const theme = useTheme();

  const volumeMetrics = useMemo(() => {
    if (data.length === 0) return { maxVolume: 1, avgVolume: 0, totalVolume: 0 };

    const volumes = data.map(d => d.volume);
    const maxVolume = Math.max(...volumes);
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const avgVolume = totalVolume / volumes.length;

    return { maxVolume, avgVolume, totalVolume };
  }, [data]);

  const indexToX = useCallback((index: number) => {
    return (index / (data.length - 1)) * width;
  }, [width, data.length]);

  const volumeToHeight = useCallback((volume: number) => {
    return (volume / volumeMetrics.maxVolume) * (height - 30); // Reserve space for labels
  }, [volumeMetrics.maxVolume, height]);

  if (data.length === 0) {
    return (
      <Box 
        sx={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
        }}
      >
        <Typography variant="caption" color="text.secondary">Volume data loading...</Typography>
      </Box>
    );
  }

  const barWidth = Math.max(1, width / data.length * 0.8);

  return (
    <Box sx={{ position: 'relative', width, height, background: theme.palette.background.paper }}>
      {/* Volume Chart Header */}
      <Box sx={{ position: 'absolute', top: 5, left: 10, zIndex: 10 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontFamily: 'monospace', 
            fontWeight: 'bold',
            color: theme.palette.text.primary
          }}
        >
          成交量 Volume
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            fontFamily: 'monospace', 
            ml: 2,
            color: theme.palette.text.secondary
          }}
        >
          Max: {(volumeMetrics.maxVolume / 1000000).toFixed(1)}M
        </Typography>
      </Box>

      <svg
        width={width}
        height={height}
        style={{ display: 'block' }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="volume-grid" width="50" height="20" patternUnits="userSpaceOnUse">
            <path 
              d="M 50 0 L 0 0 0 20" 
              fill="none" 
              stroke={alpha(theme.palette.text.primary, 0.05)} 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#volume-grid)" />

        {/* Horizontal Volume Lines */}
        {[0.25, 0.5, 0.75].map((ratio, index) => {
          const y = height - (height * ratio);
          const volume = volumeMetrics.maxVolume * ratio;
          return (
            <g key={index}>
              <line 
                x1="0" 
                y1={y} 
                x2={width} 
                y2={y} 
                stroke={alpha(theme.palette.text.primary, 0.1)} 
                strokeWidth="1" 
                strokeDasharray="2,2"
              />
              <text 
                x="5" 
                y={y - 2} 
                fill={theme.palette.text.secondary} 
                fontSize="9" 
                fontFamily="monospace"
              >
                {(volume / 1000000).toFixed(1)}M
              </text>
            </g>
          );
        })}

        {/* Volume Bars */}
        {data.map((candle, index) => {
          const x = indexToX(index);
          const barHeight = volumeToHeight(candle.volume);
          const barY = height - barHeight;
          
          const isBullish = candle.close > candle.open;
          const isHighVolume = candle.volume > volumeMetrics.avgVolume * 1.5;

          // Color coding based on price movement and volume
          let fillColor = theme.palette.primary.main;
          let opacity = 0.6;

          if (isHighVolume) {
            fillColor = isBullish ? theme.palette.success.main : theme.palette.error.main;
            opacity = 0.8;
          } else {
            fillColor = isBullish ? theme.palette.success.light : theme.palette.error.light;
            opacity = 0.5;
          }

          return (
            <g key={index}>
              <rect
                x={x - barWidth/2}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={alpha(fillColor, opacity)}
                stroke={alpha(fillColor, opacity + 0.2)}
                strokeWidth="0.5"
              />
              
              {/* High volume indicator */}
              {isHighVolume && (
                <circle
                  cx={x}
                  cy={barY - 2}
                  r="1"
                  fill={theme.palette.warning.main}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Volume Statistics Panel */}
      <Box
        sx={{
          position: 'absolute',
          right: 10,
          top: 5,
          background: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          borderRadius: 1,
          p: 1,
          minWidth: 120,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          Volume Stats
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
          Total: {(volumeMetrics.totalVolume / 1000000).toFixed(1)}M
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
          Avg: {(volumeMetrics.avgVolume / 1000000).toFixed(1)}M
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
          Max: {(volumeMetrics.maxVolume / 1000000).toFixed(1)}M
        </Typography>
      </Box>
    </Box>
  );
};

export default VolumeChart;