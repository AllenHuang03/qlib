import React from 'react';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Security,
  VerifiedUser,
  AccountBalance,
  Analytics,
  Person,
  Business
} from '@mui/icons-material';

interface WelcomeStepProps {
  onNext: () => void;
  onRoleSelect: (role: 'customer' | 'trader') => void;
  selectedRole: 'customer' | 'trader';
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  onRoleSelect,
  selectedRole
}) => {
  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRoleSelect(event.target.value as 'customer' | 'trader');
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <VerifiedUser sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Welcome to Qlib Pro
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Professional quantitative trading platform for Australian investors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete our secure verification process to access advanced trading tools and AI-powered market insights.
        </Typography>
      </Box>

      {/* Account Type Selection */}
      <Card sx={{ mb: 4, textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            Choose Your Account Type
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              value={selectedRole}
              onChange={handleRoleChange}
            >
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Customer Account */}
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRole === 'customer' ? 2 : 1,
                      borderColor: selectedRole === 'customer' ? 'primary.main' : 'grey.300',
                      backgroundColor: selectedRole === 'customer' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50'
                      }
                    }}
                    onClick={() => onRoleSelect('customer')}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel
                          value="customer"
                          control={<Radio />}
                          label=""
                          sx={{ m: 0 }}
                        />
                        <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                          Retail Investor
                        </Typography>
                        <Chip label="Popular" color="primary" size="small" sx={{ ml: 'auto' }} />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Individual investor seeking AI-powered portfolio management and market insights
                      </Typography>
                      
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <TrendingUp fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Simplified portfolio dashboard"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Analytics fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="AI market insights & recommendations"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Security fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Paper trading & risk-free simulations"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Trader Account */}
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedRole === 'trader' ? 2 : 1,
                      borderColor: selectedRole === 'trader' ? 'primary.main' : 'grey.300',
                      backgroundColor: selectedRole === 'trader' ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50'
                      }
                    }}
                    onClick={() => onRoleSelect('trader')}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel
                          value="trader"
                          control={<Radio />}
                          label=""
                          sx={{ m: 0 }}
                        />
                        <Business sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                          Trading Agent
                        </Typography>
                        <Chip label="Professional" color="secondary" size="small" sx={{ ml: 'auto' }} />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Financial expert requiring advanced quantitative tools and model development
                      </Typography>
                      
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <TrendingUp fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Advanced model training & backtesting"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Analytics fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Multi-factor algorithm development"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Security fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Live execution & risk management"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Verification Process (12-15 minutes):
        </Typography>
        <Typography variant="body2">
          • Personal details & contact verification
          <br />
          • Government ID document upload & scanning
          <br />
          • Facial recognition & biometric verification
          <br />
          • Two-factor authentication setup
          <br />
          • AML compliance screening & approval
        </Typography>
      </Alert>

      {/* Security Notice */}
      <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="body2">
          <strong>🔒 Bank-Level Security:</strong> Your data is encrypted end-to-end and we comply with 
          Australian AML/CTF regulations and AUSTRAC requirements for financial services.
        </Typography>
      </Alert>

      {/* Action Button */}
      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        sx={{ 
          minWidth: 300,
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
      >
        Start Verification Process
      </Button>

      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Typography>
    </Box>
  );
};

export default WelcomeStep;