/**
 * Watchlist Component
 * Real-time stock watchlist with live prices and alerts
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  Star,
  StarBorder
} from '@mui/icons-material';

interface SymbolInfo {
  value: string;
  label: string;
  sector: string;
}

interface WatchlistProps {
  symbols: SymbolInfo[];
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  isFavorite: boolean;
}

const Watchlist: React.FC<WatchlistProps> = ({
  symbols,
  selectedSymbol,
  onSymbolSelect
}) => {
  const theme = useTheme();
  const [watchlistData, setWatchlistData] = useState<Map<string, WatchlistItem>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['CBA.AX', 'BHP.AX']));

  // Initialize watchlist data
  useEffect(() => {
    const initialData = new Map<string, WatchlistItem>();
    
    symbols.forEach(symbol => {
      // Generate initial realistic data
      const basePrice = getBasePriceForSymbol(symbol.value);
      const change = (Math.random() - 0.5) * basePrice * 0.04; // ±2% change
      const changePercent = (change / basePrice) * 100;
      
      initialData.set(symbol.value, {
        symbol: symbol.value,
        price: basePrice + change,
        change,
        changePercent,
        volume: Math.floor(Math.random() * 2000000) + 500000,
        isFavorite: favorites.has(symbol.value)
      });
    });
    
    setWatchlistData(initialData);
  }, [symbols, favorites]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlistData(prev => {
        const updated = new Map(prev);
        
        // Update each symbol with realistic price movements
        symbols.forEach(symbol => {
          const current = updated.get(symbol.value);
          if (current) {
            // Generate realistic price movement
            const volatility = getVolatilityForSymbol(symbol.value);
            const priceChange = (Math.random() - 0.5) * volatility;
            const newPrice = Math.max(0.01, current.price * (1 + priceChange));
            const change = newPrice - getBasePriceForSymbol(symbol.value);
            const changePercent = (change / getBasePriceForSymbol(symbol.value)) * 100;
            
            updated.set(symbol.value, {
              ...current,
              price: newPrice,
              change,
              changePercent,
              volume: current.volume + Math.floor(Math.random() * 10000)
            });
          }
        });
        
        return updated;
      });
    }, 2000 + Math.random() * 3000); // Update every 2-5 seconds

    return () => clearInterval(interval);
  }, [symbols]);

  const getBasePriceForSymbol = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'CBA.AX': 94.50,
      'BHP.AX': 42.30,
      'CSL.AX': 295.80,
      'WBC.AX': 23.45,
      'ANZ.AX': 25.67,
      'NAB.AX': 32.10,
      'WES.AX': 52.30,
      'TLS.AX': 4.15
    };
    return basePrices[symbol] || 50.00;
  };

  const getVolatilityForSymbol = (symbol: string): number => {
    const volatilities: { [key: string]: number } = {
      'CBA.AX': 0.008,  // Banks - lower volatility
      'BHP.AX': 0.015,  // Mining - higher volatility
      'CSL.AX': 0.012,  // Healthcare
      'WBC.AX': 0.008,  // Banking
      'ANZ.AX': 0.008,  // Banking
      'NAB.AX': 0.008,  // Banking
      'WES.AX': 0.006,  // Retail - very stable
      'TLS.AX': 0.010   // Telecommunications
    };
    return volatilities[symbol] || 0.010;
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const updated = new Set(prev);
      if (updated.has(symbol)) {
        updated.delete(symbol);
      } else {
        updated.add(symbol);
      }
      return updated;
    });
  };

  const getSectorColor = (sector: string): string => {
    const colors: { [key: string]: string } = {
      'Finance': theme.palette.primary.main,
      'Mining': theme.palette.warning.main,
      'Healthcare': theme.palette.success.main,
      'Retail': theme.palette.info.main,
      'Telecommunications': theme.palette.secondary.main
    };
    return colors[sector] || theme.palette.text.secondary;
  };

  // Sort symbols: favorites first, then by change percentage
  const sortedSymbols = [...symbols].sort((a, b) => {
    const aData = watchlistData.get(a.value);
    const bData = watchlistData.get(b.value);
    
    // Favorites first
    if (favorites.has(a.value) && !favorites.has(b.value)) return -1;
    if (!favorites.has(a.value) && favorites.has(b.value)) return 1;
    
    // Then by absolute change percentage (biggest movers first)
    if (aData && bData) {
      return Math.abs(bData.changePercent) - Math.abs(aData.changePercent);
    }
    
    return 0;
  });

  return (
    <Paper
      elevation={1}
      sx={{
        height: '50%',
        display: 'flex',
        flexDirection: 'column',
        background: alpha(theme.palette.background.paper, 0.95)
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: alpha(theme.palette.primary.main, 0.05)
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          市场观察
        </Typography>
        <Typography variant="caption" color="text.secondary">
          实时股价监控
        </Typography>
      </Box>

      {/* Watchlist */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List dense sx={{ p: 0 }}>
          {sortedSymbols.map((symbol) => {
            const data = watchlistData.get(symbol.value);
            if (!data) return null;

            const isSelected = selectedSymbol === symbol.value;
            const isPositive = data.changePercent >= 0;

            return (
              <ListItem
                key={symbol.value}
                disablePadding
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSymbolSelect(symbol.value)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderLeft: `3px solid ${theme.palette.primary.main}`
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Symbol and Favorite */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {symbol.value}
                        </Typography>
                        <Chip
                          label={symbol.sector}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '10px',
                            height: 18,
                            color: getSectorColor(symbol.sector),
                            borderColor: getSectorColor(symbol.sector)
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(symbol.value);
                        }}
                        sx={{ p: 0.5 }}
                      >
                        {favorites.has(symbol.value) ? 
                          <Star fontSize="small" color="warning" /> : 
                          <StarBorder fontSize="small" />
                        }
                      </IconButton>
                    </Box>

                    {/* Price and Change */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        ${data.price.toFixed(2)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isPositive ? 
                          <TrendingUp fontSize="small" color="success" /> : 
                          <TrendingDown fontSize="small" color="error" />
                        }
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                            fontFamily: 'monospace',
                            fontWeight: 'bold'
                          }}
                        >
                          {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Volume */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        成交量: {(data.volume / 1000000).toFixed(1)}M
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                          fontFamily: 'monospace'
                        }}
                      >
                        ${Math.abs(data.change).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: alpha(theme.palette.background.default, 0.5)
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: theme.palette.success.main,
              animation: 'pulse 2s infinite'
            }}
          />
          实时数据更新中...
        </Typography>
      </Box>
    </Paper>
  );
};

export default Watchlist;