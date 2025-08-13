import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Check,
  Star,
  Security,
  TrendingUp,
  AccountBalance,
  Phone,
  Email,
  CreditCard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Portfolio tracking (read-only)',
      'Basic AI recommendations',
      '15-minute delayed market data',
      '1 AI model (suggestions only)',
      'Email support'
    ],
    limitations: [
      'No automatic trading',
      'Limited market data',
      'Basic analytics only'
    ],
    current: true
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'month',
    description: 'AI trading with tax optimization',
    features: [
      'Active AI trading (3 models)',
      'Real-time market data',
      'Tax-loss harvesting',
      'Portfolio rebalancing',
      'Advanced analytics',
      'Priority support',
      'Mobile app access'
    ],
    popular: true,
    roi: 'Avg user saves $1,200/year in taxes'
  },
  {
    name: 'Premium',
    price: '$99',
    period: 'month',
    description: 'Professional trading suite',
    features: [
      'Everything in Pro',
      '10+ AI models running simultaneously',
      'Options trading capabilities',
      'Institutional-grade data feeds',
      'Personal advisor consultations',
      'SMSF optimization',
      'White-glove onboarding'
    ],
    roi: 'Avg user outperforms market by 8%'
  }
];

const steps = ['Choose Plan', 'Account Verification', 'Fund Account', 'Start Trading'];

export default function Upgrade() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    occupation: '',
    investmentExperience: '',
    riskTolerance: '',
  });

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    if (planName === 'Free') {
      navigate('/dashboard');
      return;
    }
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Complete upgrade process
      localStorage.setItem('subscription_tier', selectedPlan.toLowerCase());
      navigate('/dashboard?upgraded=true');
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
          Upgrade to Unlock AI Trading
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Join thousands of Australian investors earning superior returns with AI
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  border: plan.popular ? '2px solid' : '1px solid',
                  borderColor: plan.popular ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => handlePlanSelect(plan.name)}
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
                {plan.current && (
                  <Chip 
                    label="Current Plan" 
                    color="secondary" 
                    sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: 16,
                      fontWeight: 'bold'
                    }} 
                  />
                )}
                
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color="primary.main">
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per {plan.period}
                    </Typography>
                  </Box>

                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  {plan.roi && (
                    <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight="bold">
                        💰 {plan.roi}
                      </Typography>
                    </Alert>
                  )}

                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Check color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button 
                    variant={plan.current ? "outlined" : plan.popular ? "contained" : "outlined"}
                    size="large"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeStep === 1 && (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Account Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We need to verify your identity to comply with Australian financial regulations (AML/CTF).
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+61 4XX XXX XXX"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Investment Experience</InputLabel>
                  <Select
                    value={formData.investmentExperience}
                    label="Investment Experience"
                    onChange={(e) => handleInputChange('investmentExperience', e.target.value)}
                  >
                    <MenuItem value="beginner">Beginner (0-1 years)</MenuItem>
                    <MenuItem value="intermediate">Intermediate (2-5 years)</MenuItem>
                    <MenuItem value="experienced">Experienced (5+ years)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Risk Tolerance</InputLabel>
                  <Select
                    value={formData.riskTolerance}
                    label="Risk Tolerance"
                    onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                  >
                    <MenuItem value="conservative">Conservative</MenuItem>
                    <MenuItem value="moderate">Moderate</MenuItem>
                    <MenuItem value="aggressive">Aggressive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                🔒 Your information is encrypted and stored securely. We comply with Australian Privacy Principles.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button onClick={() => setActiveStep(0)} sx={{ flex: 1 }}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={handleNext}
                sx={{ flex: 1 }}
                disabled={!formData.fullName || !formData.phone || !formData.investmentExperience}
              >
                Continue
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Fund Your Account
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                Minimum deposit: $1,000 AUD for {selectedPlan} plan
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <AccountBalance sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Bank Transfer (Recommended)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Free • 1-2 business days • Most secure
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Get Bank Details
                  </Button>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <CreditCard sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Card Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    1.5% fee • Instant • Visa/Mastercard accepted
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Pay with Card
                  </Button>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button onClick={() => setActiveStep(1)} sx={{ flex: 1 }}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={handleNext}
                sx={{ flex: 1 }}
              >
                I've Made the Deposit
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Star sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
              Welcome to {selectedPlan}!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your account has been upgraded and AI trading is now active.
            </Typography>

            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                🤖 AI models are analyzing the market and will start making optimized trades within 24 hours.
              </Typography>
            </Alert>

            <Button 
              variant="contained" 
              size="large"
              onClick={handleNext}
              sx={{ minWidth: 200 }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}