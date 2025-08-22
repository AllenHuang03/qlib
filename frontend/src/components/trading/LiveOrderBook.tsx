/**
 * Live Order Book Component
 * Real-time order book display with depth visualization
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  lastUpdate: number;
}

interface LiveOrderBookProps {
  symbol: string;
}

const LiveOrderBook: React.FC<LiveOrderBookProps> = ({ symbol }) => {
  const theme = useTheme();
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
    spread: 0,
    lastUpdate: Date.now()
  });

  // Generate realistic order book data
  useEffect(() => {
    const generateOrderBook = () => {
      const midPrice = getBasePriceForSymbol(symbol);
      const spread = midPrice * 0.001; // 0.1% spread
      
      const bids: OrderBookLevel[] = [];
      const asks: OrderBookLevel[] = [];
      
      let totalBidQuantity = 0;
      let totalAskQuantity = 0;
      
      // Generate 10 levels each side
      for (let i = 0; i < 10; i++) {
        // Bids (below mid price)
        const bidPrice = midPrice - spread/2 - (i * spread * 0.2);
        const bidQuantity = Math.floor(Math.random() * 5000) + 1000;
        totalBidQuantity += bidQuantity;
        
        bids.push({
          price: bidPrice,
          quantity: bidQuantity,
          total: totalBidQuantity
        });
        
        // Asks (above mid price)
        const askPrice = midPrice + spread/2 + (i * spread * 0.2);
        const askQuantity = Math.floor(Math.random() * 5000) + 1000;
        totalAskQuantity += askQuantity;
        
        asks.unshift({ // Insert at beginning for correct order
          price: askPrice,
          quantity: askQuantity,
          total: totalAskQuantity
        });
      }
      
      const calculatedSpread = asks[asks.length - 1]?.price - bids[0]?.price;
      
      setOrderBook({
        bids,
        asks,
        spread: calculatedSpread || 0,
        lastUpdate: Date.now()
      });
    };

    // Initial generation
    generateOrderBook();
    
    // Update every 1-3 seconds
    const interval = setInterval(() => {
      generateOrderBook();
    }, 1000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [symbol]);

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

  const getMaxQuantity = () => {
    const allQuantities = [...orderBook.bids, ...orderBook.asks].map(level => level.quantity);
    return Math.max(...allQuantities, 1);
  };

  const maxQuantity = getMaxQuantity();

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
        background: alpha(theme.palette.info.main, 0.05)
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          市场深度
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {symbol}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            价差: ${orderBook.spread.toFixed(3)}
          </Typography>
        </Box>
      </Box>

      {/* Order Book Table */}
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', py: 1 }}>
                价格
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 'bold', py: 1 }}>
                数量
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 'bold', py: 1 }}>
                深度
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Asks (Sell Orders) - Higher prices first */}
            {orderBook.asks.map((level, index) => (
              <TableRow 
                key={`ask-${index}`}
                sx={{ 
                  '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.05) },
                  position: 'relative'
                }}
              >
                <TableCell 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5,
                    color: theme.palette.error.main,
                    fontWeight: 'bold',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: `${(level.quantity / maxQuantity) * 100}%`,
                      background: alpha(theme.palette.error.main, 0.1),
                      zIndex: 0
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    ${level.price.toFixed(2)}
                  </Box>
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5
                  }}
                >
                  {level.quantity.toLocaleString()}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5,
                    color: 'text.secondary'
                  }}
                >
                  {level.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Spread Indicator */}
            <TableRow sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
              <TableCell 
                colSpan={3} 
                sx={{ 
                  textAlign: 'center', 
                  py: 1,
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: theme.palette.warning.main
                }}
              >
                --- 价差 ${orderBook.spread.toFixed(3)} ---
              </TableCell>
            </TableRow>
            
            {/* Bids (Buy Orders) - Highest prices first */}
            {orderBook.bids.map((level, index) => (
              <TableRow 
                key={`bid-${index}`}
                sx={{ 
                  '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.05) },
                  position: 'relative'
                }}
              >
                <TableCell 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5,
                    color: theme.palette.success.main,
                    fontWeight: 'bold',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: `${(level.quantity / maxQuantity) * 100}%`,
                      background: alpha(theme.palette.success.main, 0.1),
                      zIndex: 0
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    ${level.price.toFixed(2)}
                  </Box>
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5
                  }}
                >
                  {level.quantity.toLocaleString()}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '11px',
                    py: 0.5,
                    color: 'text.secondary'
                  }}
                >
                  {level.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: alpha(theme.palette.background.default, 0.5)
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>深度数据</span>
          <span>更新时间: {new Date(orderBook.lastUpdate).toLocaleTimeString()}</span>
        </Typography>
      </Box>
    </Paper>
  );
};

export default LiveOrderBook;