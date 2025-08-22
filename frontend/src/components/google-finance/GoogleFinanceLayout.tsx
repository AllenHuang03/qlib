/**
 * Google Finance Layout Component
 * Main layout structure matching Google Finance design
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Breadcrumbs,
  Typography,
  Link,
  Grid,
  useTheme,
  useMediaQuery,
  Button,
  alpha
} from '@mui/material';
import {
  NavigateNext,
  Home
} from '@mui/icons-material';

import { navigationController } from '../../services/NavigationController';
import MarketOverviewBar from './MarketOverviewBar';
import WorkflowNavigator from '../common/WorkflowNavigator';
import { workflowOrchestrator } from '../../services/WorkflowOrchestrator';
import StockHeader from './StockHeader';
import GoogleFinanceChart from './GoogleFinanceChart';
import StockDetailsSidebar from './StockDetailsSidebar';
import RelatedStocks from './RelatedStocks';
import NewsSection from './NewsSection';

interface GoogleFinanceLayoutProps {
  initialStock?: string;
}

const GoogleFinanceLayout: React.FC<GoogleFinanceLayoutProps> = ({
  initialStock = 'CBA.AX'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [selectedStock, setSelectedStock] = useState(initialStock);
  const [timeRange, setTimeRange] = useState('1D');

  // Stock information mapping
  const stockInfo: Record<string, { name: string; exchange: string }> = {
    'CBA.AX': { name: 'Commonwealth Bank of Australia', exchange: 'ASX' },
    'BHP.AX': { name: 'BHP Group Limited', exchange: 'ASX' },
    'CSL.AX': { name: 'CSL Limited', exchange: 'ASX' },
    'WBC.AX': { name: 'Westpac Banking Corporation', exchange: 'ASX' },
    'ANZ.AX': { name: 'Australia and New Zealand Banking Group', exchange: 'ASX' }
  };

  const currentStockInfo = stockInfo[selectedStock] || stockInfo['CBA.AX'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        fontFamily: "'Google Sans', 'Roboto', Arial, sans-serif"
      }}
    >
      {/* Market Overview Bar */}
      <MarketOverviewBar />

      {/* Breadcrumb Navigation */}
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: 'text.secondary'
            }
          }}
        >
          <Link
            component="button"
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={() => {
              navigationController.navigate('nav.dashboard');
            }}
          >
            <Home fontSize="small" />
            HOME
          </Link>
          
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 500
            }}
          >
            {selectedStock} • {currentStockInfo.exchange}
          </Typography>
        </Breadcrumbs>
      </Container>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        <Grid container spacing={3}>
          {/* Left Section - Chart and Info */}
          <Grid item xs={12} lg={8}>
            {/* Stock Header */}
            <StockHeader stock={selectedStock} />

            {/* Chart Section */}
            <GoogleFinanceChart
              stock={selectedStock}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />

            {/* Related Stocks */}
            <RelatedStocks stock={selectedStock} />

            {/* News Section */}
            <NewsSection stock={selectedStock} />
            
            {/* Next Steps Workflow */}
            <Box sx={{ mt: 4 }}>
              <WorkflowNavigator 
                variant="inline"
                showRecommendations={true}
                showJourneyProgress={false}
              />
              
              {/* Feature Connections */}
              {(() => {
                const connections = workflowOrchestrator.getFeatureConnections('google-finance');
                return (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NavigateNext color="info" />
                      What's Next After Market Analysis?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                      {connections.after.map((connection, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          onClick={() => navigationController.navigate(connection.action)}
                          sx={{ textTransform: 'none' }}
                        >
                          {connection.name}
                        </Button>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      💡 Most users continue with Paper Trading to test their market analysis
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          </Grid>

          {/* Right Sidebar - Stock Details */}
          <Grid item xs={12} lg={4}>
            <Box
              sx={{
                position: isMobile ? 'static' : 'sticky',
                top: isMobile ? 'auto' : 100,
                maxHeight: isMobile ? 'none' : 'calc(100vh - 120px)',
                overflowY: isMobile ? 'visible' : 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.action.hover,
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme.palette.action.selected
                }
              }}
            >
              <StockDetailsSidebar stock={selectedStock} />

              {/* About Section */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 500,
                      fontSize: '18px'
                    }}
                  >
                    About
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontSize: '14px'
                  }}
                >
                  {selectedStock === 'CBA.AX' ? (
                    <>
                      The Commonwealth Bank of Australia, also known as Commonwealth Bank or simply CommBank, 
                      is an Australian multinational bank with business across New Zealand, Asia, the United States, 
                      and the United Kingdom. It provides a variety of financial services, including retail, 
                      business and institutional banking, funds management, superannuation, insurance, investment, 
                      and broking services. The Commonwealth Bank is the largest Australian listed company on the 
                      Australian Securities Exchange as of 2024, with brands including Bankwest, Colonial First State, 
                      ASB Bank, and CommSec securities trading.
                    </>
                  ) : selectedStock === 'BHP.AX' ? (
                    <>
                      BHP Group Limited is an Australian multinational mining, metals, and petroleum company 
                      headquartered in Melbourne, Australia. It is one of the world's largest mining companies 
                      by market capitalization and is dual-listed on the Australian Securities Exchange and 
                      London Stock Exchange. BHP operates large mines in Australia, the Americas, and has 
                      exploration activities on most continents.
                    </>
                  ) : (
                    <>
                      A major Australian company listed on the Australian Securities Exchange (ASX), 
                      providing various services and maintaining a strong market position in its sector.
                    </>
                  )}
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '11px',
                      lineHeight: 1.4
                    }}
                  >
                    Market data and company information provided by financial exchanges and data providers. 
                    Information is provided "as is" and solely for informational purposes, not for trading 
                    purposes or advice.
                  </Typography>
                </Box>
              </Box>

              {/* Additional Resources */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Additional Resources
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Link
                    component="button"
                    variant="body2"
                    sx={{
                      textAlign: 'left',
                      color: 'primary.main',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => navigationController.navigate('gf.company-website')}
                  >
                    Company Website
                  </Link>
                  
                  <Link
                    component="button"
                    variant="body2"
                    sx={{
                      textAlign: 'left',
                      color: 'primary.main',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => navigationController.navigate('gf.annual-reports')}
                  >
                    Annual Reports
                  </Link>
                  
                  <Link
                    component="button"
                    variant="body2"
                    sx={{
                      textAlign: 'left',
                      color: 'primary.main',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => navigationController.navigate('gf.sec-filings')}
                  >
                    SEC Filings
                  </Link>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default GoogleFinanceLayout;