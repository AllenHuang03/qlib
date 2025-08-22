/**
 * Value Proposition Component
 * Clear explanations of feature benefits for users
 */

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Grid,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Psychology,
  Security,
  Analytics,
  School,
  MonetizationOn,
  Timeline,
  CheckCircle,
  Star,
  Lightbulb,
  Assessment
} from '@mui/icons-material';

export interface ValuePropositionData {
  title: string;
  subtitle: string;
  mainBenefit: string;
  keyFeatures: string[];
  userTypes: ('beginner' | 'intermediate' | 'professional' | 'institutional')[];
  timeToValue: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  category: 'analysis' | 'trading' | 'learning' | 'data' | 'automation';
}

interface ValuePropositionProps {
  featureId: string;
  variant?: 'card' | 'inline' | 'detailed';
  showCTA?: boolean;
  onActionClick?: () => void;
}

const ValueProposition: React.FC<ValuePropositionProps> = ({
  featureId,
  variant = 'card',
  showCTA = true,
  onActionClick
}) => {
  const theme = useTheme();

  const getFeatureData = (id: string): ValuePropositionData => {
    const features: Record<string, ValuePropositionData> = {
      'google-finance': {
        title: 'Professional Market Analysis',
        subtitle: 'Google Finance Style Interface',
        mainBenefit: 'Make informed investment decisions with professional-grade market analysis tools',
        keyFeatures: [
          'Real-time stock prices and charts with technical indicators',
          'Company fundamentals and financial statements analysis',
          'Market sentiment analysis from news and social media',
          'Professional portfolio tracking and performance metrics',
          'Automated alerts for price movements and market events'
        ],
        userTypes: ['beginner', 'intermediate', 'professional'],
        timeToValue: '5 minutes to start analyzing stocks',
        difficulty: 'Easy',
        category: 'analysis'
      },
      'ai-insights': {
        title: 'AI-Powered Trading Intelligence',
        subtitle: 'Machine Learning Market Predictions',
        mainBenefit: 'Leverage artificial intelligence to identify profitable trading opportunities',
        keyFeatures: [
          'ML-powered price prediction and trend analysis',
          'Automated pattern recognition in market data',
          'Risk assessment and portfolio optimization',
          'Sentiment analysis from news and social signals',
          'Custom AI model training on your trading strategy'
        ],
        userTypes: ['intermediate', 'professional', 'institutional'],
        timeToValue: '15 minutes to see first AI insights',
        difficulty: 'Medium',
        category: 'automation'
      },
      'paper-trading': {
        title: 'Risk-Free Learning Environment',
        subtitle: 'Practice Trading with Virtual Money',
        mainBenefit: 'Master trading strategies without risking real capital',
        keyFeatures: [
          'Virtual $100,000 starting portfolio for practice',
          'Real market data for authentic trading experience',
          'Performance tracking and strategy analysis',
          'Competition with other learners and leaderboards',
          'Detailed trade history and learning insights'
        ],
        userTypes: ['beginner', 'intermediate'],
        timeToValue: 'Start trading immediately',
        difficulty: 'Easy',
        category: 'learning'
      },
      'live-trading': {
        title: 'Professional Trading Execution',
        subtitle: 'Real Money Trading Platform',
        mainBenefit: 'Execute trades with institutional-grade tools and real-time data',
        keyFeatures: [
          'Sub-second order execution and real-time data feeds',
          'Advanced order types (stop-loss, take-profit, trailing)',
          'Professional charting with 100+ technical indicators',
          'Risk management and position sizing tools',
          'Direct market access and low-latency execution'
        ],
        userTypes: ['professional', 'institutional'],
        timeToValue: '24-48 hours after KYC verification',
        difficulty: 'Advanced',
        category: 'trading'
      },
      'portfolio-management': {
        title: 'Intelligent Portfolio Tracking',
        subtitle: 'Comprehensive Investment Oversight',
        mainBenefit: 'Optimize your investment performance with advanced portfolio analytics',
        keyFeatures: [
          'Real-time portfolio valuation and performance tracking',
          'Asset allocation analysis and rebalancing suggestions',
          'Risk metrics and diversification analysis',
          'Tax-loss harvesting optimization',
          'Benchmark comparison and performance attribution'
        ],
        userTypes: ['beginner', 'intermediate', 'professional'],
        timeToValue: 'Instant portfolio overview',
        difficulty: 'Easy',
        category: 'analysis'
      },
      'data-management': {
        title: 'Financial Data Intelligence',
        subtitle: 'Market Data & Research Platform',
        mainBenefit: 'Access professional-grade market data and research tools',
        keyFeatures: [
          'Real-time and historical market data for global markets',
          'Company financials, earnings, and analyst estimates',
          'Economic indicators and macro-economic data',
          'Custom data visualization and export capabilities',
          'API access for algorithmic trading strategies'
        ],
        userTypes: ['intermediate', 'professional', 'institutional'],
        timeToValue: '10 minutes to access comprehensive data',
        difficulty: 'Medium',
        category: 'data'
      }
    };

    return features[id] || {
      title: 'Feature Coming Soon',
      subtitle: 'In Development',
      mainBenefit: 'This feature is being developed to enhance your trading experience',
      keyFeatures: ['Enhanced functionality', 'Professional tools', 'Better user experience'],
      userTypes: ['beginner'],
      timeToValue: 'Coming soon',
      difficulty: 'Easy' as const,
      category: 'learning' as const
    };
  };

  const data = getFeatureData(featureId);

  const getCategoryIcon = () => {
    switch (data.category) {
      case 'analysis': return <Analytics color="primary" />;
      case 'trading': return <TrendingUp color="success" />;
      case 'learning': return <School color="info" />;
      case 'data': return <Assessment color="warning" />;
      case 'automation': return <Psychology color="secondary" />;
      default: return <Star color="primary" />;
    }
  };

  const getDifficultyColor = () => {
    switch (data.difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Advanced': return 'error';
      default: return 'default';
    }
  };

  const renderInlineVariant = () => (
    <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {getCategoryIcon()}
        <Typography variant="subtitle1" fontWeight={600}>
          {data.title}
        </Typography>
        <Chip 
          label={data.difficulty} 
          size="small" 
          color={getDifficultyColor() as any}
          variant="outlined"
        />
      </Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {data.mainBenefit}
      </Typography>
      <Typography variant="caption" color="primary.main">
        ⏱️ {data.timeToValue}
      </Typography>
    </Box>
  );

  const renderDetailedVariant = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          {getCategoryIcon()}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {data.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {data.subtitle}
            </Typography>
          </Box>
          <Chip 
            label={data.difficulty} 
            color={getDifficultyColor() as any}
            variant="filled"
          />
        </Box>

        {/* Main Benefit */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Star color="success" />
            <Typography variant="subtitle2" color="success.main" fontWeight={600}>
              Key Benefit
            </Typography>
          </Box>
          <Typography variant="body1" color="success.dark">
            {data.mainBenefit}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Features */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb color="primary" />
              What You Get
            </Typography>
            <List dense>
              {data.keyFeatures.map((feature, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Meta Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="info" />
              Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Time to Value
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight={500}>
                ⏱️ {data.timeToValue}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Perfect For
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {data.userTypes.map((type) => (
                  <Chip 
                    key={type} 
                    label={type} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* CTA */}
        {showCTA && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onActionClick}
                sx={{ minWidth: 200 }}
              >
                Get Started Now
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderCardVariant = () => (
    <Card 
      elevation={1} 
      sx={{ 
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {getCategoryIcon()}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {data.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.subtitle}
            </Typography>
          </Box>
          <Chip 
            label={data.difficulty} 
            size="small" 
            color={getDifficultyColor() as any}
            variant="outlined"
          />
        </Box>

        {/* Main Benefit */}
        <Typography variant="body1" sx={{ mb: 2, flex: 1 }}>
          {data.mainBenefit}
        </Typography>

        {/* Key Features (first 3) */}
        <List dense sx={{ mb: 2 }}>
          {data.keyFeatures.slice(0, 3).map((feature, index) => (
            <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={feature} 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>

        {/* Time to Value */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="primary.main" fontWeight={500}>
            ⏱️ {data.timeToValue}
          </Typography>
        </Box>

        {/* CTA */}
        {showCTA && (
          <Button
            variant="outlined"
            fullWidth
            onClick={onActionClick}
            sx={{ mt: 'auto' }}
          >
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );

  switch (variant) {
    case 'inline':
      return renderInlineVariant();
    case 'detailed':
      return renderDetailedVariant();
    default:
      return renderCardVariant();
  }
};

export default ValueProposition;