/**
 * Features Overview Page
 * Comprehensive explanation of platform features and their value
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  School,
  Assessment,
  Psychology,
  Speed
} from '@mui/icons-material';
import ValueProposition from '../../components/common/ValueProposition';
import { navigationController } from '../../services/NavigationController';

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const FeaturesOverview: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const categories: FeatureCategory[] = [
    {
      id: 'all',
      name: 'All Features',
      description: 'Complete overview of the trading platform capabilities',
      icon: <Analytics />,
      features: ['google-finance', 'ai-insights', 'paper-trading', 'live-trading', 'portfolio-management', 'data-management']
    },
    {
      id: 'analysis',
      name: 'Market Analysis',
      description: 'Professional tools for market research and analysis',
      icon: <Analytics />,
      features: ['google-finance', 'portfolio-management', 'data-management']
    },
    {
      id: 'trading',
      name: 'Trading Tools',
      description: 'Execute trades and manage positions professionally',
      icon: <TrendingUp />,
      features: ['live-trading', 'paper-trading']
    },
    {
      id: 'automation',
      name: 'AI & Automation',
      description: 'Leverage artificial intelligence for trading insights',
      icon: <Psychology />,
      features: ['ai-insights']
    }
  ];

  const handleFeatureAction = (featureId: string) => {
    // Navigate to the appropriate feature based on the featureId
    const navigationMap: Record<string, string> = {
      'google-finance': 'nav.google-finance',
      'ai-insights': 'nav.insights',
      'paper-trading': 'nav.paper-trading',
      'live-trading': 'trading.live-trading',
      'portfolio-management': 'nav.portfolio',
      'data-management': 'data.overview'
    };

    const actionId = navigationMap[featureId] || 'nav.dashboard';
    navigationController.navigate(actionId);
  };

  const currentCategory = categories[activeTab];
  const featuresToShow = currentCategory.features;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 2
          }}
        >
          Professional Trading Platform
        </Typography>
        
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}
        >
          Discover powerful features designed to enhance your trading journey, 
          from beginner-friendly learning tools to professional-grade analytics
        </Typography>

        {/* Value Proposition Banner */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 4, 
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <CardContent sx={{ py: 3 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>
              🚀 Why Choose Our Platform?
            </Typography>
            <Grid container spacing={3} sx={{ textAlign: 'left' }}>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="success" />
                  <Typography variant="body2" fontWeight={500}>
                    Learn Risk-Free
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Practice with virtual money before investing real capital
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="primary" />
                  <Typography variant="body2" fontWeight={500}>
                    AI-Powered Insights
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Machine learning algorithms analyze markets 24/7
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed color="warning" />
                  <Typography variant="body2" fontWeight={500}>
                    Professional Tools
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Institutional-grade trading and analysis platform
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment color="info" />
                  <Typography variant="body2" fontWeight={500}>
                    Comprehensive Data
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Real-time market data and historical analysis
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Category Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
              fontWeight: 500
            }
          }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon}
                  {category.name}
                </Box>
              }
            />
          ))}
        </Tabs>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {currentCategory.description}
        </Typography>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={4}>
        {featuresToShow.map((featureId) => (
          <Grid item xs={12} md={6} lg={4} key={featureId}>
            <ValueProposition
              featureId={featureId}
              variant="card"
              showCTA={true}
              onActionClick={() => handleFeatureAction(featureId)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Getting Started Section */}
      <Card 
        elevation={3}
        sx={{ 
          mt: 6, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Ready to Get Started?
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Join thousands of traders who are already using our platform to make smarter investment decisions. 
            Start with paper trading to practice risk-free, then upgrade to live trading when you're ready.
          </Typography>

          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigationController.navigate('nav.paper-trading')}
                sx={{ py: 1.5 }}
              >
                Start Paper Trading
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigationController.navigate('nav.google-finance')}
                sx={{ py: 1.5 }}
              >
                Explore Market Data
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigationController.navigate('help.tutorial')}
                sx={{ py: 1.5 }}
              >
                Watch Tutorial
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigationController.navigate('help.contact')}
                sx={{ py: 1.5 }}
              >
                Get Help
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="✓ No Credit Card Required" color="success" variant="outlined" size="small" />
            <Chip label="✓ Start with $100k Virtual Money" color="success" variant="outlined" size="small" />
            <Chip label="✓ Full Platform Access" color="success" variant="outlined" size="small" />
            <Chip label="✓ Professional Support" color="success" variant="outlined" size="small" />
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default FeaturesOverview;