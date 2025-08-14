import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Star,
  TrendingUp,
  Security,
  Analytics,
  School,
  Support,
  AccountBalance,
  Speed,
  ModelTraining
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  text: string;
  available: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  modules: string[];
  benefits: string[];
}

const PlanSelection: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free Explorer',
      price: 'Free',
      description: 'Perfect for learning and paper trading',
      features: [
        { text: 'Paper trading with $100k virtual portfolio', available: true },
        { text: 'Basic AI insights and market analysis', available: true },
        { text: 'Educational content and tutorials', available: true },
        { text: 'Community access and discussions', available: true },
        { text: 'Basic portfolio tracking', available: true },
        { text: 'Real money trading', available: false },
        { text: 'Advanced AI models', available: false },
        { text: 'Professional backtesting', available: false },
        { text: 'Priority support', available: false }
      ],
      modules: [
        'Basic Momentum Indicator',
        'Simple Portfolio Tracker',
        'Educational AI Insights',
        'Paper Trading Simulator'
      ],
      benefits: [
        'Learn quantitative trading risk-free',
        'Understand AI-powered insights',
        'Build confidence with virtual money',
        'Access educational resources'
      ]
    },
    {
      id: 'pro',
      name: 'Professional Trader',
      price: '$99/month',
      description: 'Full-featured platform for serious investors',
      popular: true,
      features: [
        { text: 'Everything in Free plan', available: true },
        { text: 'Real money trading with live execution', available: true },
        { text: 'Advanced multi-factor AI models', available: true },
        { text: 'Professional backtesting engine', available: true },
        { text: 'Risk management tools', available: true },
        { text: 'Real-time market data', available: true },
        { text: 'Custom model development', available: true },
        { text: 'Priority customer support', available: true },
        { text: 'Advanced analytics dashboard', available: true }
      ],
      modules: [
        'Multi-Factor Momentum Model',
        'Value & Quality Analyzer',
        'Volatility Arbitrage Engine',
        'Risk Management System',
        'Advanced Portfolio Optimizer',
        'Real-time Signal Generator',
        'Professional Backtesting Suite',
        'Market Sentiment Analyzer'
      ],
      benefits: [
        'Execute real trades with AI guidance',
        'Access institutional-grade models',
        'Minimize risk with advanced controls',
        'Maximize returns with optimization'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'White-label solutions for institutions',
      features: [
        { text: 'Everything in Professional plan', available: true },
        { text: 'White-label platform customization', available: true },
        { text: 'API access for custom integrations', available: true },
        { text: 'Dedicated account manager', available: true },
        { text: 'Custom model development', available: true },
        { text: 'Enhanced security & compliance', available: true },
        { text: 'Priority phone support', available: true },
        { text: 'Training and onboarding', available: true },
        { text: 'SLA guarantees', available: true }
      ],
      modules: [
        'All Professional modules',
        'Custom Algorithm Development',
        'White-label Dashboard',
        'API Integration Suite',
        'Advanced Security Controls',
        'Custom Reporting Engine'
      ],
      benefits: [
        'Branded platform for your clients',
        'Enterprise-grade security',
        'Dedicated technical support',
        'Custom feature development'
      ]
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);

    try {
      // Update user with selected plan
      const updatedUser = {
        ...user,
        subscription_tier: planId,
        portfolio_initialized: planId === 'free', // Initialize portfolio for free users
        plan_selected_at: new Date().toISOString()
      };

      updateUser(updatedUser);

      // Navigate to dashboard with plan-specific setup
      if (planId === 'free') {
        navigate('/dashboard');
      } else {
        // For paid plans, redirect to payment flow (simplified for demo)
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Plan selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleOutput = (moduleName: string): string => {
    const outputs: Record<string, string> = {
      'Basic Momentum Indicator': 'Buy/Sell signals based on price momentum trends',
      'Multi-Factor Momentum Model': 'Quantified momentum scores (0-100) with confidence levels',
      'Value & Quality Analyzer': 'Stock ratings based on fundamental analysis metrics',
      'Volatility Arbitrage Engine': 'Options trading opportunities with expected returns',
      'Risk Management System': 'Portfolio risk metrics and automated stop-loss triggers',
      'Advanced Portfolio Optimizer': 'Optimal asset allocation recommendations',
      'Real-time Signal Generator': 'Live trading alerts with entry/exit points',
      'Market Sentiment Analyzer': 'News sentiment scores affecting stock prices'
    };
    return outputs[moduleName] || 'Actionable insights and trading recommendations';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Choose Your Trading Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Welcome {user?.name}! Your verification is complete. Select the plan that fits your trading goals.
        </Typography>
        <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto' }}>
          ✅ Account verified! You're ready to start your quantitative trading journey.
        </Alert>
      </Box>

      {/* Plan Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                border: plan.popular ? 3 : 1,
                borderColor: plan.popular ? 'primary.main' : 'grey.300',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {plan.popular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Plan Header */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                    {plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.description}
                  </Typography>
                </Box>

                {/* Features List */}
                <Box sx={{ mb: 3, flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Features:
                  </Typography>
                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckCircle 
                            fontSize="small" 
                            color={feature.available ? 'success' : 'disabled'} 
                          />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: feature.available ? 'text.primary' : 'text.disabled'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Modules Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Modules Included:
                  </Typography>
                  {plan.modules.map((module, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        • {module}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        Output: {getModuleOutput(module)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Benefits */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Key Benefits:
                  </Typography>
                  {plan.benefits.map((benefit, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      ✓ {benefit}
                    </Typography>
                  ))}
                </Box>

                {/* Action Button */}
                <Button
                  variant={plan.popular ? 'contained' : 'outlined'}
                  size="large"
                  fullWidth
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                  sx={{ mt: 'auto' }}
                >
                  {loading && selectedPlan === plan.id ? 'Setting up...' : 
                   plan.id === 'enterprise' ? 'Contact Sales' : 
                   plan.id === 'free' ? 'Start Free' : 'Start 7-Day Trial'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Module Explanations */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            How Our AI Modules Work
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                  Signal Generation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI analyzes market data in real-time to generate buy/sell signals. 
                  Each signal includes confidence levels, expected returns, and risk assessments.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics sx={{ mr: 1, color: 'primary.main' }} />
                  Portfolio Optimization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Automatically suggests optimal asset allocation based on your risk tolerance 
                  and market conditions. Rebalancing recommendations updated daily.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ mr: 1, color: 'primary.main' }} />
                  Risk Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Continuous monitoring of portfolio risk with automatic alerts. 
                  Stop-loss orders and position sizing recommendations to protect capital.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ModelTraining sx={{ mr: 1, color: 'primary.main' }} />
                  Model Performance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track how each AI model performs over time. Models are continuously 
                  retrained on new data to maintain accuracy and adapt to market changes.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Need help choosing?</strong> Our team is here to help you select the right plan. 
          Contact us at support@qlibpro.com or start with the free plan and upgrade anytime.
        </Typography>
      </Alert>
    </Container>
  );
};

export default PlanSelection;