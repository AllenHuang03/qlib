import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  PersonAdd,
  Email,
  Verified,
  School,
  TrendingUp,
  Security,
  AccountBalance,
  CheckCircle,
  Warning,
  Info,
  PlayArrow,
  Visibility,
  VisibilityOff,
  Send,
  PhoneAndroid,
  CloudUpload
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';

interface NewCustomerOnboardingProps {
  user: any;
  onStartKYC: () => void;
}

const NewCustomerOnboarding: React.FC<NewCustomerOnboardingProps> = ({ user, onStartKYC }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.email_verified || false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Initialize completed steps based on user status
    const completed = new Set<number>();
    if (user?.email_verified || emailVerified) {
      completed.add(0);
    }
    if (user?.kyc_status === 'pending' || user?.kyc_status === 'approved') {
      completed.add(1);
    }
    if (user?.tutorial_completed) {
      completed.add(2);
    }
    setCompletedSteps(completed);

    // Set active step based on completion
    if (!emailVerified && !user?.email_verified) {
      setActiveStep(0);
    } else if (user?.kyc_status === 'not_started') {
      setActiveStep(1);
    } else if (!user?.tutorial_completed) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  }, [user, emailVerified]);

  const handleEmailVerification = () => {
    setShowEmailDialog(true);
    setEmailVerificationSent(true);
    
    // Simulate sending verification email
    setTimeout(() => {
      console.log('Verification email sent to:', user?.email);
    }, 1000);
  };

  const handleVerificationCodeSubmit = () => {
    // Simulate verification process
    if (verificationCode.length === 6) {
      setEmailVerified(true);
      setShowEmailDialog(false);
      setCompletedSteps(prev => new Set([...prev, 0]));
      setActiveStep(1);
      
      // In real implementation, would update user status via API
      console.log('Email verified successfully');
    }
  };

  const handleStartKYC = () => {
    setCompletedSteps(prev => new Set([...prev, 1]));
    setActiveStep(2);
    onStartKYC();
  };

  const handleStartTutorial = () => {
    setShowWelcomeVideo(true);
    setCompletedSteps(prev => new Set([...prev, 2]));
    setActiveStep(3);
  };

  const onboardingSteps = [
    {
      label: 'Verify Email',
      description: 'Confirm your email address to secure your account',
      icon: <Email />,
      completed: completedSteps.has(0)
    },
    {
      label: 'Identity Verification',
      description: 'Complete KYC verification to enable trading',
      icon: <PersonAdd />,
      completed: completedSteps.has(1)
    },
    {
      label: 'Tutorial & Education',
      description: 'Learn how to use our AI-powered platform',
      icon: <School />,
      completed: completedSteps.has(2)
    },
    {
      label: 'Start Trading',
      description: 'Begin your investment journey',
      icon: <TrendingUp />,
      completed: completedSteps.has(3)
    }
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              To secure your account and enable all features, please verify your email address: <strong>{user?.email}</strong>
            </Typography>
            
            {!emailVerificationSent ? (
              <Button
                variant="contained"
                onClick={handleEmailVerification}
                startIcon={<Send />}
                size="large"
              >
                Send Verification Email
              </Button>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    We've sent a verification code to your email. Please check your inbox and spam folder.
                  </Typography>
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => setShowEmailDialog(true)}
                  startIcon={<Verified />}
                >
                  Enter Verification Code
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Why verify your email?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Secure password reset and account recovery" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Info fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Important account and trading notifications" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Regulatory compliance requirements" />
                </ListItem>
              </List>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              To comply with Australian regulations and enable trading, we need to verify your identity. 
              This process typically takes 5-10 minutes and includes:
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle1">Document Upload</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Driver's license or passport
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <PhoneAndroid sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle1">Selfie Verification</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quick photo for face matching
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>ASIC Requirement:</strong> All Australian trading platforms must verify customer identity 
                under Anti-Money Laundering and Counter-Terrorism Financing regulations.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              onClick={handleStartKYC}
              startIcon={<PersonAdd />}
              size="large"
              fullWidth
            >
              Start Identity Verification
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Verification typically takes 15 minutes to 2 business days
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Learn how to maximize your investment potential with our AI-powered platform. 
              Our interactive tutorial covers:
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle2">AI Insights</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Understanding AI recommendations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="subtitle2">Portfolio Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Building balanced portfolios
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Security sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2">Risk Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Protecting your investments
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={handleStartTutorial}
              startIcon={<PlayArrow />}
              size="large"
              fullWidth
              sx={{ mb: 2 }}
            >
              Start Interactive Tutorial (15 minutes)
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setActiveStep(3)}
            >
              Skip Tutorial (Not Recommended)
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Welcome to Qlib Pro!
            </Typography>
            <Typography variant="body1" paragraph>
              Your account setup is complete. You're now ready to start your AI-powered investment journey.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Account Status:</strong> Basic Plan • Email Verified • KYC {user?.kyc_status === 'approved' ? 'Approved' : 'Pending'}
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AccountBalance />}
                  size="large"
                >
                  Add Funds to Start
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<TrendingUp />}
                  size="large"
                >
                  Explore Paper Trading
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
              <PersonAdd sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to Qlib Pro, {user?.name || 'New Investor'}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Let's get your account set up in just a few steps
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={(completedSteps.size / onboardingSteps.length) * 100}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'rgba(255,255,255,0.8)'
              }
            }}
          />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            {completedSteps.size} of {onboardingSteps.length} steps completed
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Onboarding Steps */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {onboardingSteps.map((step, index) => (
                  <Step key={step.label} completed={step.completed}>
                    <StepLabel
                      icon={
                        step.completed ? (
                          <CheckCircle sx={{ color: 'success.main' }} />
                        ) : (
                          step.icon
                        )
                      }
                    >
                      <Typography variant="h6">
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        {getStepContent(index)}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Information Panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Why Choose Qlib Pro?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="AI-Powered Insights"
                    secondary="Professional-grade quantitative analysis"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Security fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Bank-Level Security"
                    secondary="Your data and funds are protected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AccountBalance fontSize="small" color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Australian Regulated"
                    secondary="ASIC-compliant trading platform"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" paragraph>
                Our support team is here to help you get started. Contact us anytime if you have questions.
              </Typography>
              <Button variant="outlined" fullWidth>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Email Verification Dialog */}
      <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Email sx={{ mr: 1 }} />
            Email Verification
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            We've sent a 6-digit verification code to <strong>{user?.email}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputProps={{ 
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
              maxLength: 6
            }}
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            <Typography variant="body2">
              Didn't receive the code? Check your spam folder or click "Resend" below.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEmailVerificationSent(true)}>
            Resend Code
          </Button>
          <Button 
            onClick={handleVerificationCodeSubmit}
            variant="contained"
            disabled={verificationCode.length !== 6}
          >
            Verify Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Welcome Video Dialog */}
      <Dialog open={showWelcomeVideo} onClose={() => setShowWelcomeVideo(false)} maxWidth="md" fullWidth>
        <DialogTitle>Welcome to Qlib Pro Tutorial</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: 400, 
            bgcolor: 'grey.100', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <PlayArrow sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6">Interactive Tutorial</Typography>
              <Typography variant="body2" color="text.secondary">
                15-minute guided tour of our platform
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWelcomeVideo(false)}>Skip</Button>
          <Button variant="contained" onClick={() => {
            setShowWelcomeVideo(false);
            setActiveStep(3);
          }}>
            Complete Tutorial
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewCustomerOnboarding;