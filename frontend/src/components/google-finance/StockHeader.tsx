/**
 * Stock Header Component
 * Google Finance style stock information header
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add,
  Share,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { safeNumber } from '../../utils/safeguards';
import { navigationController } from '../../services/NavigationController';

interface StockInfo {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  lastUpdate: string;
}

interface StockHeaderProps {
  stock: string;
}

const StockHeader: React.FC<StockHeaderProps> = ({ stock }) => {
  const theme = useTheme();
  const [stockInfo, setStockInfo] = useState<StockInfo>({
    name: 'Commonwealth Bank of Australia',
    symbol: 'CBA.AX',
    price: 172.74,
    change: 0.34,
    changePercent: 0.20,
    currency: 'AUD',
    exchange: 'ASX',
    lastUpdate: new Date().toLocaleString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  });

  const [isFollowing, setIsFollowing] = useState(false);

  // Update stock info based on selected stock
  useEffect(() => {
    const stockMapping: Record<string, StockInfo> = {
      'CBA.AX': {
        name: 'Commonwealth Bank of Australia',
        symbol: 'CBA.AX',
        price: 172.74,
        change: 0.34,
        changePercent: 0.20,
        currency: 'AUD',
        exchange: 'ASX',
        lastUpdate: new Date().toLocaleString('en-AU', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })
      },
      'BHP.AX': {
        name: 'BHP Group Limited',
        symbol: 'BHP.AX',
        price: 42.30,
        change: -0.15,
        changePercent: -0.35,
        currency: 'AUD',
        exchange: 'ASX',
        lastUpdate: new Date().toLocaleString('en-AU', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })
      }
    };

    setStockInfo(stockMapping[stock] || stockMapping['CBA.AX']);
  }, [stock]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStockInfo(prev => {
        const changeAmount = (Math.random() - 0.5) * 0.02;
        const newPrice = prev.price * (1 + changeAmount);
        const newChange = newPrice - prev.price;
        const newChangePercent = (newChange / prev.price) * 100;
        
        return {
          ...prev,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          lastUpdate: new Date().toLocaleString('en-AU', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const isPositive = safeNumber(stockInfo.changePercent, 0) >= 0;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Stock Title and Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 400,
            color: 'text.primary',
            fontSize: { xs: '24px', sm: '32px' },
            lineHeight: 1.2
          }}
        >
          {stockInfo.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => {
              setIsFollowing(!isFollowing);
              navigationController.navigate('gf.follow-stock', { stock: stockInfo.symbol, action: isFollowing ? 'unfollow' : 'follow' });
            }}
            sx={{
              borderColor: isFollowing ? 'primary.main' : 'divider',
              color: isFollowing ? 'primary.main' : 'text.secondary',
              backgroundColor: isFollowing ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          
          <IconButton
            size="small"
            onClick={() => navigationController.navigate('gf.share-stock', { stock: stockInfo.symbol, name: stockInfo.name })}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.8)
              }
            }}
          >
            <Share fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {/* Stock Price Information */}
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            mb: 1,
            flexWrap: 'wrap'
          }}
        >
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontWeight: 400,
              color: 'text.primary',
              fontFamily: 'monospace',
              fontSize: { xs: '36px', sm: '48px' },
              lineHeight: 1
            }}
          >
            ${safeNumber(stockInfo.price, 0).toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPositive ? (
              <TrendingUp 
                sx={{ 
                  fontSize: 20, 
                  color: 'success.main' 
                }} 
              />
            ) : (
              <TrendingDown 
                sx={{ 
                  fontSize: 20, 
                  color: 'error.main' 
                }} 
              />
            )}
            
            <Typography
              variant="h6"
              sx={{
                color: isPositive ? 'success.main' : 'error.main',
                fontWeight: 400,
                fontFamily: 'monospace',
                fontSize: { xs: '18px', sm: '20px' }
              }}
            >
              {isPositive ? '+' : ''}{safeNumber(stockInfo.changePercent, 0).toFixed(2)}%
              {' '}
              {isPositive ? '+' : ''}{safeNumber(stockInfo.change, 0).toFixed(2)} Today
            </Typography>
          </Box>
        </Box>
        
        {/* Stock Metadata */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            color: 'text.secondary',
            fontSize: '14px',
            flexWrap: 'wrap'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {stockInfo.lastUpdate}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {stockInfo.currency} • {stockInfo.exchange}
          </Typography>
          
          <Button
            variant="text"
            size="small"
            onClick={() => navigationController.navigate('help.disclaimer', { context: 'stock-data' })}
            sx={{
              minWidth: 'auto',
              p: 0,
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '14px',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            Disclaimer
          </Button>
        </Box>
      </Box>
      
      {/* Real-time Status Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'success.main',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }}
        />
        <Typography variant="caption" color="success.main" fontWeight={500}>
          Real-time data
        </Typography>
        
        <Chip
          label="MARKET OPEN"
          size="small"
          sx={{
            ml: 1,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: 'success.main',
            fontWeight: 500,
            fontSize: '11px',
            height: 20
          }}
        />
      </Box>
    </Box>
  );
};

export default StockHeader;