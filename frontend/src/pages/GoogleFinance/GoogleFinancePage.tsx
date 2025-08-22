/**
 * Google Finance Page
 * Main page for Google Finance style interface
 */

import React from 'react';
import { Box, Container } from '@mui/material';
import GoogleFinanceLayout from '../../components/google-finance/GoogleFinanceLayout';
import MarketStatusIndicator from '../../components/common/MarketStatusIndicator';

const GoogleFinancePage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', overflow: 'auto' }}>
      {/* Market Status Banner */}
      <Container maxWidth="xl" sx={{ pt: 2, pb: 1 }}>
        <MarketStatusIndicator />
      </Container>
      
      <GoogleFinanceLayout initialStock="CBA.AX" />
    </Box>
  );
};

export default GoogleFinancePage;