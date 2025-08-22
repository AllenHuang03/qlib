/**
 * Modal System
 * Centralized modal management for NavigationController actions
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  alpha
} from '@mui/material';
import {
  Share,
  Article,
  Info,
  Close,
  Download,
  TrendingUp,
  Schedule,
  LinkOff
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ModalData {
  modalId: string;
  context?: any;
}

const ModalSystem: React.FC = () => {
  const theme = useTheme();
  const [currentModal, setCurrentModal] = useState<ModalData | null>(null);

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      const { modalId, context } = event.detail;
      setCurrentModal({ modalId, context });
    };

    window.addEventListener('open-modal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('open-modal', handleOpenModal as EventListener);
    };
  }, []);

  const handleClose = () => {
    setCurrentModal(null);
  };

  const renderModalContent = () => {
    if (!currentModal) return null;

    switch (currentModal.modalId) {
      case 'share-dialog':
        return renderShareDialog();
      case 'news-reader':
        return renderNewsReader();
      case 'disclaimer-dialog':
        return renderDisclaimerDialog();
      case 'tutorial-dialog':
        return renderTutorialDialog();
      case 'data-export-dialog':
        return renderDataExportDialog();
      case 'buy-order-dialog':
      case 'sell-order-dialog':
        return renderTradingDialog();
      case 'price-alerts-dialog':
        return renderPriceAlertsDialog();
      default:
        return renderGenericDialog();
    }
  };

  const renderShareDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Share Stock Information
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            {currentModal.context?.name || 'Stock Information'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Share this stock information with others:
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              fullWidth
              value={`${window.location.origin}/google-finance?stock=${currentModal.context?.stock || 'CBA.AX'}`}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button 
                    size="small" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/google-finance?stock=${currentModal.context?.stock || 'CBA.AX'}`);
                    }}
                  >
                    Copy
                  </Button>
                )
              }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {['Email', 'Twitter', 'LinkedIn', 'WhatsApp'].map((platform) => (
              <Grid item xs={6} key={platform}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Share />}
                  size="small"
                >
                  {platform}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderNewsReader = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Article />
          News Article
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h5" gutterBottom>
            {currentModal.context?.article?.title || 'News Article'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={currentModal.context?.article?.source || 'News Source'} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={currentModal.context?.article?.time || 'Recently'} 
              variant="outlined" 
              size="small" 
              icon={<Schedule />}
            />
          </Box>

          <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 3 }}>
            {currentModal.context?.article?.snippet || 'Article content would be displayed here. This demonstrates the news reading functionality.'}
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                📊 Article Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is a {currentModal.context?.article?.sentiment || 'neutral'} news article 
                in the {currentModal.context?.article?.category || 'general'} category.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<Share />}>Share Article</Button>
        <Button startIcon={<Download />}>Save for Later</Button>
      </DialogActions>
    </Dialog>
  );

  const renderDisclaimerDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Data & Trading Disclaimers</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            ⚠️ Important Disclaimers
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><Info color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Market Data"
                secondary="All market data is for informational purposes only and may be delayed. Real-time data requires premium subscription."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><TrendingUp color="warning" /></ListItemIcon>
              <ListItemText 
                primary="Investment Risk"
                secondary="All investments carry risk of capital loss. Past performance does not guarantee future results."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Schedule color="info" /></ListItemIcon>
              <ListItemText 
                primary="Data Accuracy"
                secondary="While we strive for accuracy, we cannot guarantee the completeness or timeliness of market data."
              />
            </ListItem>
          </List>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            This platform is for educational and demonstration purposes. Always consult with qualified financial advisors before making investment decisions.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderTutorialDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Platform Tutorial</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Welcome to the Professional Trading Platform! This tutorial will help you get started.
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemText primary="🏠 Dashboard: Overview of your portfolio and market data" />
          </ListItem>
          <ListItem>
            <ListItemText primary="📈 Google Finance: Professional stock analysis interface" />
          </ListItem>
          <ListItem>
            <ListItemText primary="💼 Trading: Execute trades and manage positions" />
          </ListItem>
          <ListItem>
            <ListItemText primary="🤖 AI Models: Access machine learning trading insights" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Got It</Button>
        <Button variant="contained">Take Full Tour</Button>
      </DialogActions>
    </Dialog>
  );

  const renderDataExportDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Market Data</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Export historical and current market data in various formats:
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {['CSV', 'JSON', 'Excel', 'PDF Report'].map((format) => (
            <Grid item xs={6} key={format}>
              <Button variant="outlined" fullWidth startIcon={<Download />}>
                {format}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const renderTradingDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentModal.modalId === 'buy-order-dialog' ? 'Place Buy Order' : 'Place Sell Order'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="warning.main" gutterBottom>
          🎭 Demo Mode: This is a simulated trading interface for learning purposes.
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <TextField fullWidth label="Quantity" type="number" margin="normal" />
          <TextField fullWidth label="Price" type="number" margin="normal" />
          <TextField fullWidth label="Order Type" select margin="normal" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color={currentModal.modalId === 'buy-order-dialog' ? 'success' : 'error'}>
          {currentModal.modalId === 'buy-order-dialog' ? 'Place Buy Order' : 'Place Sell Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderPriceAlertsDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Price Alerts</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Get notified when stock prices reach your target levels.
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <TextField fullWidth label="Alert Price" type="number" margin="normal" />
          <TextField fullWidth label="Alert Type" select margin="normal" />
          <TextField fullWidth label="Notification Method" select margin="normal" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained">Set Alert</Button>
      </DialogActions>
    </Dialog>
  );

  const renderGenericDialog = () => (
    <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkOff />
        Feature Not Yet Implemented
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          This feature is coming soon! We're working on implementing:
        </Typography>
        <Typography variant="h6" color="primary.main" gutterBottom>
          {currentModal.modalId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stay tuned for updates as we continue to enhance the platform.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );

  return <>{renderModalContent()}</>;
};

export default ModalSystem;