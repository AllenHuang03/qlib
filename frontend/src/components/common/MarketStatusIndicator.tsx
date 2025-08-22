/**
 * Market Status Indicator
 * Professional market hours and data explanation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import {
  Schedule,
  Info,
  TrendingUp,
  CheckCircle,
  Error,
  Upgrade
} from '@mui/icons-material';
import { dataSourceManager } from '../../services/DataSourceManager';

interface MarketHours {
  name: string;
  timezone: string;
  open: string;
  close: string;
  isOpen: boolean;
  nextOpen?: string;
}

const MarketStatusIndicator: React.FC = () => {
  const theme = useTheme();
  const [showExplanation, setShowExplanation] = useState(false);
  const [marketHours, setMarketHours] = useState<MarketHours[]>([]);
  const [dataMode, setDataMode] = useState<'live' | 'delayed' | 'demo'>('demo');

  useEffect(() => {
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const checkMarketStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // ASX Hours: 10:00 AM - 4:00 PM AEST
    const asxOpen = currentHour > 10 || (currentHour === 10 && currentMinute >= 0);
    const asxClose = currentHour < 16;
    const asxIsOpen = !isWeekend && asxOpen && asxClose;

    // US Market Hours: 9:30 AM - 4:00 PM EST (convert to local time)
    const usIsOpen = false; // Simplified for demo

    const markets: MarketHours[] = [
      {
        name: 'ASX',
        timezone: 'AEST',
        open: '10:00 AM',
        close: '4:00 PM',
        isOpen: asxIsOpen,
        nextOpen: asxIsOpen ? undefined : 'Tomorrow 10:00 AM'
      },
      {
        name: 'NYSE/NASDAQ',
        timezone: 'EST',
        open: '9:30 AM',
        close: '4:00 PM',
        isOpen: usIsOpen,
        nextOpen: usIsOpen ? undefined : 'Tonight 11:30 PM AEST'
      }
    ];

    setMarketHours(markets);
    
    const anyMarketOpen = markets.some(m => m.isOpen);
    setDataMode(anyMarketOpen ? 'live' : 'demo');
  };

  const getStatusColor = () => {
    switch (dataMode) {
      case 'live': return 'success';
      case 'delayed': return 'warning';
      case 'demo': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (dataMode) {
      case 'live': return <CheckCircle />;
      case 'delayed': return <Schedule />;
      case 'demo': return <Info />;
      default: return <Error />;
    }
  };

  const getStatusText = () => {
    switch (dataMode) {
      case 'live': return 'Live Market Data';
      case 'delayed': return 'Delayed Data (15min)';
      case 'demo': return 'Demo Mode Active';
      default: return 'Data Unavailable';
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor() as any}
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {dataMode === 'demo' ? (
              'Markets closed - Showing realistic demo data for learning'
            ) : dataMode === 'live' ? (
              'Real-time market data active'
            ) : (
              'Delayed market data (15 minute delay)'
            )}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Info />}
          onClick={() => setShowExplanation(true)}
        >
          Learn More
        </Button>

        {dataMode === 'demo' && (
          <Button
            size="small"
            variant="contained"
            startIcon={<Upgrade />}
            color="primary"
          >
            Upgrade to Live Data
          </Button>
        )}
      </Box>

      {/* Detailed Explanation Modal */}
      <Dialog
        open={showExplanation}
        onClose={() => setShowExplanation(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Market Data Information
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Market Status
            </Typography>
            
            <List>
              {marketHours.map((market) => (
                <ListItem key={market.name}>
                  <ListItemIcon>
                    {market.isOpen ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Schedule color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${market.name} - ${market.isOpen ? 'OPEN' : 'CLOSED'}`}
                    secondary={
                      market.isOpen
                        ? `Trading until ${market.close} ${market.timezone}`
                        : `Next session: ${market.nextOpen}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color={dataMode === 'demo' ? 'warning.main' : 'success.main'}>
              {dataMode === 'demo' ? '🎭 Demo Mode Active' : '📈 Live Data Active'}
            </Typography>
            
            {dataMode === 'demo' ? (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Why Demo Data?</strong>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="🕐 Markets are currently closed" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="💰 Real-time data costs $100-500+ per month per user" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="📊 Demo data is realistic and perfect for learning" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="🎯 All platform features work exactly the same" />
                  </ListItem>
                </List>

                <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                  <strong>What You Get in Demo Mode:</strong>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Last real market closing prices" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Realistic price movements based on market patterns" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Full platform functionality for learning" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Paper trading with realistic scenarios" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="AI model training and backtesting" />
                  </ListItem>
                </List>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Live Data Benefits:</strong>
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                    <ListItemText primary="Real-time price feeds (sub-second updates)" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                    <ListItemText primary="Instant trade execution" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                    <ListItemText primary="Professional trading edge" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                    <ListItemText primary="Level 2 market depth data" />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>

          {dataMode === 'demo' && (
            <Box
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <Typography variant="subtitle1" color="primary.main" fontWeight={600} gutterBottom>
                Ready to Upgrade?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Get real-time market data for professional trading:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Professional Plan: $50/month"
                    secondary="Real-time ASX + US markets data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Institutional Plan: $150/month"
                    secondary="Multi-market data + API access + Level 2"
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowExplanation(false)}>
            Close
          </Button>
          {dataSourceManager.getUpgradeOptions().length > 0 && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Upgrade />}
            >
              Upgrade Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarketStatusIndicator;