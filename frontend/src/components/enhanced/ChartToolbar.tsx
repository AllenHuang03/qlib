/**
 * Professional Chart Toolbar
 * Comprehensive trading chart controls and utilities
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  ButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Slider,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ShowChart,
  CandlestickChart,
  BarChart,
  Timeline,
  ZoomIn,
  ZoomOut,
  PanTool,
  Refresh,
  Fullscreen,
  Settings,
  Download,
  Share,
  Print,
  Compare,
  Notifications,
  AutoGraph,
  Speed,
  VolumeUp,
  Analytics,
  GridOn,
  Crosshairs,
  Screenshot,
  BookmarkBorder,
  More,
} from '@mui/icons-material';

export interface ChartToolbarConfig {
  symbol: string;
  timeframe: string;
  chartType: 'candlestick' | 'line' | 'area' | 'bar';
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
}

interface ChartToolbarProps {
  config: ChartToolbarConfig;
  onConfigChange: (config: Partial<ChartToolbarConfig>) => void;
  onAction?: (action: string, params?: any) => void;
  availableSymbols?: string[];
  isFullscreen?: boolean;
  isLoading?: boolean;
  className?: string;
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({
  config,
  onConfigChange,
  onAction,
  availableSymbols = ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'TLS.AX', 'RIO.AX'],
  isFullscreen = false,
  isLoading = false,
  className = '',
}) => {
  const theme = useTheme();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);

  // Available timeframes for Australian market
  const timeframes = [
    { value: '1m', label: '1M', shortcut: '1' },
    { value: '5m', label: '5M', shortcut: '2' },
    { value: '15m', label: '15M', shortcut: '3' },
    { value: '1h', label: '1H', shortcut: '4' },
    { value: '4h', label: '4H', shortcut: '5' },
    { value: '1d', label: '1D', shortcut: '6' },
    { value: '1w', label: '1W', shortcut: '7' },
    { value: '1M', label: '1M', shortcut: '8' },
  ];

  // Chart type options
  const chartTypes = [
    { value: 'candlestick', icon: CandlestickChart, label: 'Candlesticks', shortcut: 'C' },
    { value: 'line', icon: ShowChart, label: 'Line Chart', shortcut: 'L' },
    { value: 'area', icon: Timeline, label: 'Area Chart', shortcut: 'A' },
    { value: 'bar', icon: BarChart, label: 'Bar Chart', shortcut: 'B' },
  ];

  // Refresh intervals
  const refreshIntervals = [
    { value: 1000, label: '1s' },
    { value: 5000, label: '5s' },
    { value: 10000, label: '10s' },
    { value: 30000, label: '30s' },
    { value: 60000, label: '1m' },
    { value: 300000, label: '5m' },
  ];

  // Handle actions
  const handleAction = (action: string, params?: any) => {
    onAction?.(action, params);
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  return (
    <Paper 
      className={className}
      sx={{ 
        p: 2, 
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        
        {/* Left Section - Symbol and Timeframes */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Symbol Selector */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Symbol</InputLabel>
            <Select
              value={config.symbol}
              onChange={(e) => onConfigChange({ symbol: e.target.value })}
              label="Symbol"
            >
              {availableSymbols.map((symbol) => (
                <MenuItem key={symbol} value={symbol}>
                  {symbol}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />

          {/* Timeframe Buttons */}
          <ButtonGroup variant="outlined" size="small">
            {timeframes.slice(0, 7).map((tf) => (
              <Tooltip key={tf.value} title={`${tf.label} (${tf.shortcut})`}>
                <Button
                  variant={config.timeframe === tf.value ? 'contained' : 'outlined'}
                  onClick={() => onConfigChange({ timeframe: tf.value })}
                  sx={{ minWidth: 40 }}
                >
                  {tf.label}
                </Button>
              </Tooltip>
            ))}
          </ButtonGroup>
        </Box>

        {/* Center Section - Chart Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Chart Type */}
          <ButtonGroup variant="outlined" size="small">
            {chartTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Tooltip key={type.value} title={`${type.label} (${type.shortcut})`}>
                  <Button
                    variant={config.chartType === type.value ? 'contained' : 'outlined'}
                    onClick={() => onConfigChange({ chartType: type.value as any })}
                  >
                    <IconComponent />
                  </Button>
                </Tooltip>
              );
            })}
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* View Options */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.showVolume}
                  onChange={(e) => onConfigChange({ showVolume: e.target.checked })}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VolumeUp fontSize="small" />
                  <Typography variant="caption">Volume</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showGrid}
                  onChange={(e) => onConfigChange({ showGrid: e.target.checked })}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GridOn fontSize="small" />
                  <Typography variant="caption">Grid</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showCrosshair}
                  onChange={(e) => onConfigChange({ showCrosshair: e.target.checked })}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Crosshairs fontSize="small" />
                  <Typography variant="caption">Crosshair</Typography>
                </Box>
              }
            />
          </Box>
        </Box>

        {/* Right Section - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Navigation Tools */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Pan (P)">
              <IconButton onClick={() => handleAction('pan')}>
                <PanTool />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zoom In (+)">
              <IconButton onClick={() => handleAction('zoom_in')}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zoom Out (-)">
              <IconButton onClick={() => handleAction('zoom_out')}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Auto Refresh */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge
              color="success"
              variant="dot"
              invisible={!config.autoRefresh}
            >
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={() => handleAction('refresh')}
                  disabled={isLoading}
                  sx={{
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Badge>

            <FormControlLabel
              control={
                <Switch
                  checked={config.autoRefresh}
                  onChange={(e) => onConfigChange({ autoRefresh: e.target.checked })}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Speed fontSize="small" />
                  Auto
                </Typography>
              }
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Utility Actions */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Compare Symbols">
              <IconButton onClick={() => handleAction('compare')}>
                <Compare />
              </IconButton>
            </Tooltip>

            <Tooltip title="Technical Analysis">
              <IconButton onClick={() => handleAction('indicators')}>
                <Analytics />
              </IconButton>
            </Tooltip>

            <Tooltip title="Screenshot">
              <IconButton onClick={() => handleAction('screenshot')}>
                <Screenshot />
              </IconButton>
            </Tooltip>

            <Tooltip title="Bookmark">
              <IconButton onClick={() => handleAction('bookmark')}>
                <BookmarkBorder />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Settings and More */}
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Fullscreen (F11)">
              <IconButton onClick={() => handleAction('fullscreen')}>
                <Fullscreen />
              </IconButton>
            </Tooltip>

            <Tooltip title="Chart Settings">
              <IconButton onClick={handleSettingsMenuOpen}>
                <Settings />
              </IconButton>
            </Tooltip>

            <Tooltip title="More Actions">
              <IconButton onClick={handleMoreMenuOpen}>
                <More />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Market Status Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<AutoGraph />}
            label="ASX Market Open"
            color="success"
            size="small"
            variant="outlined"
          />
          
          <Typography variant="caption" color="text.secondary">
            Last Update: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>

        {config.autoRefresh && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Auto-refresh: {refreshIntervals.find(r => r.value === config.refreshInterval)?.label || '5s'}
            </Typography>
            <Badge color="success" variant="dot" />
          </Box>
        )}
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Chart Settings
          </Typography>
          
          {config.autoRefresh && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" gutterBottom display="block">
                Refresh Interval
              </Typography>
              <Select
                value={config.refreshInterval}
                onChange={(e) => onConfigChange({ refreshInterval: e.target.value as number })}
                size="small"
                fullWidth
              >
                {refreshIntervals.map((interval) => (
                  <MenuItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom display="block">
              Theme
            </Typography>
            <Select
              value={config.theme}
              onChange={(e) => onConfigChange({ theme: e.target.value as any })}
              size="small"
              fullWidth
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="auto">Auto</MenuItem>
            </Select>
          </Box>
        </Box>
      </Menu>

      {/* More Actions Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { handleAction('export'); handleMoreMenuClose(); }}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Data</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { handleAction('share'); handleMoreMenuClose(); }}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Chart</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { handleAction('print'); handleMoreMenuClose(); }}>
          <ListItemIcon>
            <Print fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Chart</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => { handleAction('alerts'); handleMoreMenuClose(); }}>
          <ListItemIcon>
            <Notifications fontSize="small" />
          </ListItemIcon>
          <ListItemText>Price Alerts</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ChartToolbar;