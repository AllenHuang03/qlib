import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Info,
  Security,
  Business,
  Person
} from '@mui/icons-material';

interface FundingStepProps {
  userRole: 'customer' | 'trader';
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const FundingStep: React.FC<FundingStepProps> = ({
  userRole,
  onNext,
  onBack,
  onComplete,
  loading,
  setLoading
}) => {
  const [fundingMethod, setFundingMethod] = useState<'bank' | 'broker' | 'demo'>('bank');
  const [skipToDemo, setSkipToDemo] = useState(false);

  const handleFundingMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFundingMethod(event.target.value as 'bank' | 'broker' | 'demo');
  };

  const handleProceed = () => {
    if (fundingMethod === 'demo' || skipToDemo) {
      // Proceed to dashboard with demo mode
      onComplete();
    } else {
      // In real implementation, integrate with funding providers
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 2000);
    }
  };

  const getRoleSpecificContent = () => {
    if (userRole === 'customer') {
      return {
        title: 'Fund Your Investment Account',
        subtitle: 'Add funds to start investing with AI-powered insights',
        minAmount: '$500',
        recommendedAmount: '$5,000',
        features: [
          'AI-generated investment recommendations',
          'Automated portfolio rebalancing',
          'Real-time market insights',
          'Risk-adjusted returns tracking'
        ]
      };
    } else {
      return {
        title: 'Connect Your Trading Infrastructure',
        subtitle: 'Link funding sources and broker APIs for algorithm execution',
        minAmount: '$10,000',
        recommendedAmount: '$50,000',
        features: [
          'Multi-factor algorithm development',
          'Live execution with risk controls',
          'Advanced backtesting capabilities',
          'Professional portfolio management tools'
        ]
      };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <AccountBalance sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {content.title}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {content.subtitle}
        </Typography>
      </Box>

      {/* Account Type Indicator */}
      <Alert 
        severity="info" 
        sx={{ mb: 3 }}
        icon={userRole === 'customer' ? <Person /> : <Business />}
      >
        <Typography variant="body2">
          <strong>{userRole === 'customer' ? 'Retail Investor' : 'Trading Agent'} Account</strong> - 
          You'll be directed to your specialized dashboard after setup
        </Typography>
      </Alert>

      {/* Funding Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Choose Funding Method
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              value={fundingMethod}
              onChange={handleFundingMethodChange}
            >
              {/* Bank Transfer */}
              <Card 
                sx={{ 
                  mb: 2, 
                  border: fundingMethod === 'bank' ? 2 : 1,
                  borderColor: fundingMethod === 'bank' ? 'primary.main' : 'grey.300',
                  cursor: 'pointer'
                }}
                onClick={() => setFundingMethod('bank')}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      value="bank"
                      control={<Radio />}
                      label=""
                      sx={{ m: 0, mr: 2 }}
                    />
                    <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Bank Transfer (Recommended)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Direct deposit from Australian bank account
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label="Instant" color="success" size="small" />
                      <Typography variant="caption" display="block">
                        Min: {content.minAmount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Broker Connection (for traders) */}
              {userRole === 'trader' && (
                <Card 
                  sx={{ 
                    mb: 2, 
                    border: fundingMethod === 'broker' ? 2 : 1,
                    borderColor: fundingMethod === 'broker' ? 'primary.main' : 'grey.300',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFundingMethod('broker')}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="broker"
                        control={<Radio />}
                        label=""
                        sx={{ m: 0, mr: 2 }}
                      />
                      <Business sx={{ mr: 2, color: 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Broker API Connection
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Connect existing brokerage account for algorithm execution
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip label="Professional" color="secondary" size="small" />
                        <Typography variant="caption" display="block">
                          Min: {content.minAmount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Demo Mode */}
              <Card 
                sx={{ 
                  mb: 2, 
                  border: fundingMethod === 'demo' ? 2 : 1,
                  borderColor: fundingMethod === 'demo' ? 'primary.main' : 'grey.300',
                  cursor: 'pointer'
                }}
                onClick={() => setFundingMethod('demo')}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      value="demo"
                      control={<Radio />}
                      label=""
                      sx={{ m: 0, mr: 2 }}
                    />
                    <TrendingUp sx={{ mr: 2, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Start with Demo Mode
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Explore features with virtual portfolio (no real money)
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label="Risk-Free" color="info" size="small" />
                      <Typography variant="caption" display="block">
                        $100k virtual
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Features You'll Get */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            What You'll Get Access To
          </Typography>
          
          <List>
            {content.features.map((feature, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🔒 Secure Transactions:</strong> All deposits are protected by bank-level encryption. 
          Funds are held in segregated accounts with Australian ADI-authorized institutions.
        </Typography>
      </Alert>

      {/* Recommended Amount */}
      {fundingMethod !== 'demo' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>💡 Recommended:</strong> Start with {content.recommendedAmount} for optimal 
            diversification and algorithm performance.
          </Typography>
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {fundingMethod !== 'demo' && (
            <Button
              variant="text"
              onClick={() => {
                setSkipToDemo(true);
                setFundingMethod('demo');
              }}
              disabled={loading}
            >
              Skip - Try Demo First
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleProceed}
            disabled={loading}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Setting up...' : 
             fundingMethod === 'demo' ? 'Enter Demo Mode' :
             fundingMethod === 'bank' ? 'Connect Bank Account' :
             'Connect Broker API'}
          </Button>
        </Box>
      </Box>

      {/* Final Notice */}
      <Typography variant="caption" display="block" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
        You can always add funding methods later from your dashboard settings
      </Typography>
    </Box>
  );
};

export default FundingStep;