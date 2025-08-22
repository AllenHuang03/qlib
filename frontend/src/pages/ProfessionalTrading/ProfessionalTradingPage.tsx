/**
 * Professional Trading Page
 * Full-screen professional trading platform with advanced charts, live data, and sandbox trading
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close,
  Settings,
  Help
} from '@mui/icons-material';

import ProfessionalTradingInterface from '../../components/trading/ProfessionalTradingInterface';
import { SafeWrapper } from '../../utils/safeguards';

const ProfessionalTradingPage: React.FC = () => {
  const theme = useTheme();
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle any errors that might occur
  const handleError = (error: Error) => {
    console.error('Professional Trading Platform Error:', error);
    setError(`Trading platform error: ${error.message}`);
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <SafeWrapper errorMessage="专业交易平台暂时不可用">
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.background.default,
          overflow: 'hidden'
        }}
      >
        {/* Welcome Message */}
        {showWelcome && (
          <Alert
            severity="info"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowWelcome(false)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            sx={{ 
              borderRadius: 0, 
              background: theme.palette.info.main,
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' }
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              🚀 欢迎使用专业交易平台 • 实时数据 • 沙盒交易 • AI模型集成
            </Typography>
          </Alert>
        )}

        {/* Main Trading Interface */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <ProfessionalTradingInterface
            initialSymbol="CBA.AX"
            height={showWelcome ? 'calc(100vh - 60px)' : '100vh'}
          />
        </Box>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Help Button */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          <Tooltip title="帮助和文档">
            <IconButton
              sx={{
                background: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  background: theme.palette.primary.dark
                }
              }}
              onClick={() => {
                window.open('https://github.com/microsoft/qlib/blob/main/docs/README.md', '_blank');
              }}
            >
              <Help />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </SafeWrapper>
  );
};

export default ProfessionalTradingPage;