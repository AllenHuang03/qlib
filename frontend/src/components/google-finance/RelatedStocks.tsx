/**
 * Related Stocks Component
 * Google Finance style stock comparison section
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart
} from '@mui/icons-material';
import { safeNumber } from '../../utils/safeguards';

interface RelatedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
}

interface RelatedStocksProps {
  stock: string;
}

const RelatedStocks: React.FC<RelatedStocksProps> = ({ stock }) => {
  const theme = useTheme();
  const [relatedStocks, setRelatedStocks] = useState<RelatedStock[]>([
    {
      symbol: 'BHP.AX',
      name: 'BHP Group Ltd',
      price: 41.73,
      change: -0.060,
      changePercent: -0.14,
      sector: 'Mining'
    },
    {
      symbol: 'MQG.AX',
      name: 'Macquarie Group Ltd',
      price: 224.89,
      change: 2.46,
      changePercent: 1.10,
      sector: 'Finance'
    },
    {
      symbol: 'CSL.AX',
      name: 'CSL Ltd',
      price: 225.95,
      change: 2.36,
      changePercent: 1.05,
      sector: 'Healthcare'
    },
    {
      symbol: 'WBC.AX',
      name: 'Westpac Banking Corp',
      price: 28.42,
      change: 0.15,
      changePercent: 0.53,
      sector: 'Finance'
    },
    {
      symbol: 'ANZ.AX',
      name: 'Australia & New Zealand Banking Group Ltd',
      price: 31.28,
      change: -0.22,
      changePercent: -0.70,
      sector: 'Finance'
    },
    {
      symbol: 'FMG.AX',
      name: 'Fortescue Ltd',
      price: 19.58,
      change: 1.01,
      changePercent: 5.44,
      sector: 'Mining'
    }
  ]);

  // Update stock prices with simulated real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      setRelatedStocks(prev => prev.map(stock => {
        const changeAmount = (Math.random() - 0.5) * 0.02;
        const newPrice = stock.price * (1 + changeAmount);
        const newChange = newPrice - stock.price;
        const newChangePercent = (newChange / stock.price) * 100;
        
        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent
        };
      }));
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const StockCard: React.FC<{ stock: RelatedStock; onClick?: () => void }> = ({ 
    stock, 
    onClick 
  }) => {
    const isPositive = safeNumber(stock.changePercent, 0) >= 0;

    return (
      <Card
        elevation={0}
        sx={{
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.3),
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[2]
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '14px',
                  mb: 0.5
                }}
              >
                {stock.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {stock.symbol}
                </Typography>
                
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '11px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5
                  }}
                >
                  {stock.sector}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'right', minWidth: 80 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  mb: 0.5
                }}
              >
                ${safeNumber(stock.price, 0).toFixed(2)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                {isPositive ? (
                  <TrendingUp 
                    sx={{ 
                      fontSize: 12, 
                      color: 'success.main' 
                    }} 
                  />
                ) : (
                  <TrendingDown 
                    sx={{ 
                      fontSize: 12, 
                      color: 'error.main' 
                    }} 
                  />
                )}
                
                <Typography
                  variant="caption"
                  sx={{
                    color: isPositive ? 'success.main' : 'error.main',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {Math.abs(safeNumber(stock.changePercent, 0)).toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2
        }}
      >
        <ShowChart 
          sx={{ 
            color: 'primary.main',
            fontSize: 20
          }} 
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            fontSize: '18px'
          }}
        >
          Compare to
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {relatedStocks.map((relatedStock, index) => (
          <Grid item xs={12} sm={6} md={4} lg={6} key={index}>
            <StockCard
              stock={relatedStock}
              onClick={() => {
                // Handle stock selection
                console.log(`Selected stock: ${relatedStock.symbol}`);
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Performance Summary */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'info.main',
            fontWeight: 600,
            mb: 1
          }}
        >
          Market Performance
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Winners
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight={600}>
              {relatedStocks.filter(s => s.changePercent >= 0).length}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Losers
            </Typography>
            <Typography variant="body2" color="error.main" fontWeight={600}>
              {relatedStocks.filter(s => s.changePercent < 0).length}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Avg Change
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600}
              color={relatedStocks.reduce((sum, s) => sum + s.changePercent, 0) >= 0 ? 'success.main' : 'error.main'}
            >
              {(relatedStocks.reduce((sum, s) => sum + s.changePercent, 0) / relatedStocks.length).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RelatedStocks;