/**
 * Chart Performance Monitor
 * Real-time performance metrics and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Grid,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Speed,
  Memory,
  Timeline,
  Warning,
  ExpandMore,
  ExpandLess,
  Visibility,
  VisibilityOff,
  TuneOutlined,
  Analytics,
} from '@mui/icons-material';

interface ChartPerformanceMonitorProps {
  metrics: {
    memoryUsage: number;
    renderTime: number;
    dataPoints: number;
    compressionRatio: number;
    fps: number;
  };
  warnings: string[];
  suggestions: string[];
  originalDataLength: number;
  onConfigChange?: (config: any) => void;
  className?: string;
}

const ChartPerformanceMonitor: React.FC<ChartPerformanceMonitorProps> = ({
  metrics,
  warnings,
  suggestions,
  originalDataLength,
  onConfigChange,
  className = '',
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(false);

  // Performance status indicators
  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }): {
    status: 'good' | 'warning' | 'error';
    color: string;
  } => {
    if (value <= thresholds.good) {
      return { status: 'good', color: theme.palette.success.main };
    } else if (value <= thresholds.warning) {
      return { status: 'warning', color: theme.palette.warning.main };
    } else {
      return { status: 'error', color: theme.palette.error.main };
    }
  };

  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, { good: 20, warning: 40 });
  const fpsStatus = getPerformanceStatus(60 - metrics.fps, { good: 10, warning: 30 });
  const renderStatus = getPerformanceStatus(metrics.renderTime, { good: 16, warning: 50 });

  // Auto-optimization logic
  useEffect(() => {
    if (autoOptimize && onConfigChange) {
      const optimizations: any = {};
      
      // Enable compression for large datasets
      if (originalDataLength > 5000) {
        optimizations.enableDataCompression = true;
        optimizations.compressionThreshold = 2000;
      }
      
      // Enable virtualization for memory issues
      if (metrics.memoryUsage > 30) {
        optimizations.enableVirtualization = true;
        optimizations.maxDataPoints = Math.max(500, Math.floor(originalDataLength / 4));
      }
      
      // Reduce animation duration for performance issues
      if (metrics.fps < 45 || metrics.renderTime > 50) {
        optimizations.animationDuration = Math.max(100, 300 - (50 - metrics.fps) * 5);
      }
      
      if (Object.keys(optimizations).length > 0) {
        onConfigChange(optimizations);
      }
    }
  }, [autoOptimize, metrics, originalDataLength, onConfigChange]);

  if (!visible) {
    return (
      <IconButton
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
        onClick={() => setVisible(true)}
      >
        <Analytics />
      </IconButton>
    );
  }

  return (
    <Paper
      className={className}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        p: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        minWidth: 300,
        maxWidth: 400,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Speed color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Chart Performance
          </Typography>
          
          {warnings.length > 0 && (
            <Chip
              icon={<Warning />}
              label={warnings.length}
              size="small"
              color="warning"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Auto Optimize">
            <FormControlLabel
              control={
                <Switch
                  checked={autoOptimize}
                  onChange={(e) => setAutoOptimize(e.target.checked)}
                  size="small"
                />
              }
              label={<TuneOutlined fontSize="small" />}
              sx={{ margin: 0 }}
            />
          </Tooltip>

          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>

          <IconButton size="small" onClick={() => setVisible(false)}>
            <VisibilityOff />
          </IconButton>
        </Box>
      </Box>

      {/* Core Metrics */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              FPS
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: fpsStatus.color }}
            >
              {metrics.fps}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Memory
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: memoryStatus.color }}
            >
              {metrics.memoryUsage}MB
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Render
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: renderStatus.color }}
            >
              {metrics.renderTime}ms
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Performance Bars */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption">Memory Usage</Typography>
            <Typography variant="caption" color={memoryStatus.color}>
              {((metrics.memoryUsage / 100) * 100).toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(metrics.memoryUsage * 2, 100)} // Scale for 50MB max
            sx={{
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: memoryStatus.color,
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption">Frame Rate</Typography>
            <Typography variant="caption" color={fpsStatus.color}>
              {metrics.fps}/60 FPS
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(metrics.fps / 60) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: fpsStatus.color,
              },
            }}
          />
        </Box>
      </Box>

      {/* Data Compression Info */}
      {metrics.compressionRatio > 1 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<Timeline />}
            label={`Data compressed ${metrics.compressionRatio}x`}
            size="small"
            color="info"
            variant="outlined"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {originalDataLength.toLocaleString()} → {metrics.dataPoints.toLocaleString()} points
          </Typography>
        </Box>
      )}

      {/* Expanded Details */}
      <Collapse in={expanded}>
        {/* Warnings */}
        {warnings.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              Performance Warnings
            </Typography>
            {warnings.map((warning, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1, py: 0.5 }}>
                <Typography variant="caption">{warning}</Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              Optimization Suggestions
            </Typography>
            {suggestions.map((suggestion, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1, py: 0.5 }}>
                <Typography variant="caption">{suggestion}</Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* Detailed Metrics */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Detailed Metrics
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Data Points
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {metrics.dataPoints.toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Original Size
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {originalDataLength.toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Compression
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {metrics.compressionRatio.toFixed(2)}x
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Render Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {metrics.renderTime}ms
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Performance Tips */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Performance Tips
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Use virtualization for large datasets
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Enable compression for historical data
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Reduce animation duration if FPS drops
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Monitor memory usage in long sessions
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ChartPerformanceMonitor;