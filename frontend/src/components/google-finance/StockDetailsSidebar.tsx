/**
 * Stock Details Sidebar Component
 * Google Finance style right sidebar with key metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { safeNumber } from '../../utils/safeguards';

interface StockMetrics {
  previousClose: number;
  dayRange: { low: number; high: number };
  yearRange: { low: number; high: number };
  marketCap: string;
  avgVolume: string;
  peRatio: number;
  dividendYield: number;
  beta: number;
  eps: number;
  primaryExchange: string;
  shares: string;
  revenue: string;
}

interface StockDetailsSidebarProps {
  stock: string;
}

const StockDetailsSidebar: React.FC<StockDetailsSidebarProps> = ({ stock }) => {
  const theme = useTheme();
  const [activeView, setActiveView] = useState<'stock' | 'security'>('stock');
  const [stockMetrics, setStockMetrics] = useState<StockMetrics>({
    previousClose: 172.40,
    dayRange: { low: 172.03, high: 174.40 },
    yearRange: { low: 132.10, high: 192.00 },
    marketCap: '289.44B AUD',
    avgVolume: '1.79M',
    peRatio: 28.56,
    dividendYield: 2.81,
    beta: 1.23,
    eps: 6.04,
    primaryExchange: 'ASX',
    shares: '1.68B',
    revenue: '25.69B AUD'
  });

  // Update metrics based on selected stock
  useEffect(() => {
    const metricsMapping: Record<string, StockMetrics> = {
      'CBA.AX': {
        previousClose: 172.40,
        dayRange: { low: 172.03, high: 174.40 },
        yearRange: { low: 132.10, high: 192.00 },
        marketCap: '289.44B AUD',
        avgVolume: '1.79M',
        peRatio: 28.56,
        dividendYield: 2.81,
        beta: 1.23,
        eps: 6.04,
        primaryExchange: 'ASX',
        shares: '1.68B',
        revenue: '25.69B AUD'
      },
      'BHP.AX': {
        previousClose: 42.30,
        dayRange: { low: 41.85, high: 42.95 },
        yearRange: { low: 38.20, high: 54.90 },
        marketCap: '213.7B AUD',
        avgVolume: '2.1M',
        peRatio: 12.8,
        dividendYield: 5.4,
        beta: 1.45,
        eps: 3.31,
        primaryExchange: 'ASX',
        shares: '5.05B',
        revenue: '65.1B AUD'
      }
    };

    setStockMetrics(metricsMapping[stock] || metricsMapping['CBA.AX']);
  }, [stock]);

  const MetricRow: React.FC<{ label: string; value: string | number; isLast?: boolean }> = ({
    label,
    value,
    isLast = false
  }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: isLast ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '11px',
          fontWeight: 500
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.primary',
          fontWeight: 500,
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );

  const RangeRow: React.FC<{ 
    label: string; 
    range: { low: number; high: number }; 
    isLast?: boolean 
  }> = ({ label, range, isLast = false }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: isLast ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '11px',
          fontWeight: 500
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.primary',
          fontWeight: 500,
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      >
        ${range.low.toFixed(2)} - ${range.high.toFixed(2)}
      </Typography>
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.default, 0.3),
        borderRadius: 2,
        overflow: 'hidden',
        height: 'fit-content'
      }}
    >
      {/* View Toggle */}
      <Box sx={{ p: 2, pb: 1 }}>
        <ButtonGroup
          size="small"
          fullWidth
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            '& .MuiButton-root': {
              border: 'none',
              '&:not(:last-child)': {
                borderRight: 'none'
              }
            }
          }}
        >
          <Button
            variant={activeView === 'stock' ? 'contained' : 'text'}
            onClick={() => setActiveView('stock')}
            sx={{
              backgroundColor: activeView === 'stock' 
                ? alpha(theme.palette.primary.main, 0.1) 
                : 'transparent',
              color: activeView === 'stock' ? 'primary.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            Stock
          </Button>
          <Button
            variant={activeView === 'security' ? 'contained' : 'text'}
            onClick={() => setActiveView('security')}
            sx={{
              backgroundColor: activeView === 'security' 
                ? alpha(theme.palette.primary.main, 0.1) 
                : 'transparent',
              color: activeView === 'security' ? 'primary.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
          >
            All listed security
          </Button>
        </ButtonGroup>
      </Box>

      {/* Stock Metrics */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          m: 2,
          mt: 1,
          p: 2
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
            mb: 2,
            fontSize: '14px'
          }}
        >
          Key Statistics
        </Typography>

        <MetricRow 
          label="PREVIOUS CLOSE" 
          value={`$${stockMetrics.previousClose.toFixed(2)}`} 
        />
        
        <RangeRow 
          label="DAY RANGE" 
          range={stockMetrics.dayRange}
        />
        
        <RangeRow 
          label="52 WEEK RANGE" 
          range={stockMetrics.yearRange}
        />
        
        <MetricRow 
          label="MARKET CAP" 
          value={stockMetrics.marketCap}
        />
        
        <MetricRow 
          label="AVG VOLUME (3M)" 
          value={stockMetrics.avgVolume}
        />
        
        <MetricRow 
          label="P/E RATIO (TTM)" 
          value={safeNumber(stockMetrics.peRatio, 0).toFixed(2)}
        />
        
        <MetricRow 
          label="DIVIDEND YIELD" 
          value={`${stockMetrics.dividendYield}%`}
        />

        <Divider sx={{ my: 2 }} />

        <MetricRow 
          label="BETA (5Y MONTHLY)" 
          value={safeNumber(stockMetrics.beta, 0).toFixed(2)}
        />
        
        <MetricRow 
          label="EPS (TTM)" 
          value={`$${stockMetrics.eps.toFixed(2)}`}
        />
        
        <MetricRow 
          label="SHARES OUTSTANDING" 
          value={stockMetrics.shares}
        />
        
        <MetricRow 
          label="REVENUE (TTM)" 
          value={stockMetrics.revenue}
        />
        
        <MetricRow 
          label="PRIMARY EXCHANGE" 
          value={stockMetrics.primaryExchange}
          isLast={true}
        />
      </Box>

      {/* Additional Information */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '11px',
            lineHeight: 1.4,
            display: 'block'
          }}
        >
          Data provided by financial exchanges and may be delayed. 
          This information is for educational purposes only and should 
          not be considered as investment advice.
        </Typography>
      </Box>
    </Paper>
  );
};

export default StockDetailsSidebar;