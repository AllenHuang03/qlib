import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PersonAdd,
  Target,
  Security,
  TrendingUp,
  CheckCircle,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface UserData {
  email: string;
  name: string;
  password: string;
  goal: string;
  goalAmount: number;
  timeline: string;
  riskLevel: number;
  experience: string;
}

const Register: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    name: '',
    password: '',
    goal: '',
    goalAmount: 10000,
    timeline: '',
    riskLevel: 3,
    experience: '',
  });

  const steps = ['Account', 'Goals', 'Risk Profile', 'Complete'];

  const goals = [
    { value: 'retirement', label: 'Retirement', icon: '🏖️', amount: 100000 },
    { value: 'house', label: 'Buy a House', icon: '🏠', amount: 50000 },
    { value: 'vacation', label: 'Dream Vacation', icon: '✈️', amount: 5000 },
    { value: 'emergency', label: 'Emergency Fund', icon: '🛡️', amount: 10000 },
    { value: 'wealth', label: 'Build Wealth', icon: '💰', amount: 25000 },
  ];

  const timelines = [
    { value: '1year', label: '1 Year', description: 'Short-term goal' },
    { value: '3years', label: '3 Years', description: 'Medium-term goal' },
    { value: '5years', label: '5+ Years', description: 'Long-term goal' },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Complete Beginner', description: 'Never invested before' },
    { value: 'some', label: 'Some Experience', description: 'Invested a little bit' },
    { value: 'experienced', label: 'Experienced', description: 'Regular investor' },
  ];

  const getRiskDescription = (value: number) => {
    if (value <= 2) return { text: 'Conservative', color: '#4CAF50', desc: 'Lower risk, steady growth' };
    if (value <= 4) return { text: 'Moderate', color: '#FF9800', desc: 'Balanced risk and reward' };
    return { text: 'Aggressive', color: '#F44336', desc: 'Higher risk, higher potential' };
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleComplete = () => {
    // Store user data and navigate to paper trading
    localStorage.setItem('userData', JSON.stringify(userData));
    navigate('/dashboard?mode=paper');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
              Create Your Account
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
              Join thousands of successful investors
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                variant="outlined"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Security sx={{ color: '#4CAF50' }} />
                <Typography variant="body2" color="text.secondary">
                  Your data is protected with bank-level security
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
              What's Your Goal?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
              This helps our AI pick the right investments for you
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
              {goals.map((goal) => (
                <Card
                  key={goal.value}
                  sx={{
                    cursor: 'pointer',
                    border: userData.goal === goal.value ? 2 : 1,
                    borderColor: userData.goal === goal.value ? '#4CAF50' : 'divider',
                    '&:hover': { borderColor: '#4CAF50' },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setUserData({ ...userData, goal: goal.value, goalAmount: goal.amount })}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {goal.icon}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {goal.label}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            {userData.goal && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  How much do you want to save?
                </Typography>
                <TextField
                  fullWidth
                  label="Goal Amount"
                  type="number"
                  value={userData.goalAmount}
                  onChange={(e) => setUserData({ ...userData, goalAmount: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                  sx={{ mb: 3 }}
                />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  When do you want to reach this goal?
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {timelines.map((timeline) => (
                    <Card
                      key={timeline.value}
                      sx={{
                        cursor: 'pointer',
                        border: userData.timeline === timeline.value ? 2 : 1,
                        borderColor: userData.timeline === timeline.value ? '#4CAF50' : 'divider',
                        '&:hover': { borderColor: '#4CAF50' },
                      }}
                      onClick={() => setUserData({ ...userData, timeline: timeline.value })}
                    >
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {timeline.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {timeline.description}
                          </Typography>
                        </Box>
                        {userData.timeline === timeline.value && (
                          <CheckCircle sx={{ color: '#4CAF50' }} />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );

      case 2:
        const riskInfo = getRiskDescription(userData.riskLevel);
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
              Risk Preferences
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
              Help us understand your comfort level with market ups and downs
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                How much risk are you comfortable with?
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={userData.riskLevel}
                  onChange={(_, value) => setUserData({ ...userData, riskLevel: value as number })}
                  min={1}
                  max={5}
                  marks
                  valueLabelDisplay="off"
                  sx={{
                    '& .MuiSlider-thumb': {
                      bgcolor: riskInfo.color,
                    },
                    '& .MuiSlider-track': {
                      bgcolor: riskInfo.color,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">Conservative</Typography>
                  <Typography variant="caption">Aggressive</Typography>
                </Box>
              </Box>
              <Card sx={{ mt: 2, bgcolor: alpha(riskInfo.color, 0.1) }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: riskInfo.color, fontWeight: 600 }}>
                    {riskInfo.text} Risk Level
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {riskInfo.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              What's your investing experience?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {experienceLevels.map((level) => (
                <Card
                  key={level.value}
                  sx={{
                    cursor: 'pointer',
                    border: userData.experience === level.value ? 2 : 1,
                    borderColor: userData.experience === level.value ? '#4CAF50' : 'divider',
                    '&:hover': { borderColor: '#4CAF50' },
                  }}
                  onClick={() => setUserData({ ...userData, experience: level.value })}
                >
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {level.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Box>
                    {userData.experience === level.value && (
                      <CheckCircle sx={{ color: '#4CAF50' }} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              You're All Set!
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Your AI-powered portfolio is ready. Let's start with paper trading to show you how it works.
            </Typography>
            
            <Card sx={{ mb: 4, bgcolor: alpha('#4CAF50', 0.1) }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Your Profile Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Goal:</Typography>
                    <Typography fontWeight={600}>
                      {goals.find(g => g.value === userData.goal)?.label} (${userData.goalAmount.toLocaleString()})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Timeline:</Typography>
                    <Typography fontWeight={600}>
                      {timelines.find(t => t.value === userData.timeline)?.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Risk Level:</Typography>
                    <Typography fontWeight={600} sx={{ color: getRiskDescription(userData.riskLevel).color }}>
                      {getRiskDescription(userData.riskLevel).text}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Experience:</Typography>
                    <Typography fontWeight={600}>
                      {experienceLevels.find(e => e.value === userData.experience)?.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 4, bgcolor: alpha('#2196F3', 0.1) }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2196F3' }}>
                  🎯 What Happens Next?
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}>1</Avatar>
                    <Typography>Start with $100,000 virtual money (no risk!)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}>2</Avatar>
                    <Typography>Watch AI pick stocks based on your profile</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}>3</Avatar>
                    <Typography>Learn how it works, then invest real money when ready</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              size="large"
              onClick={handleComplete}
              sx={{
                bgcolor: '#4CAF50',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
              endIcon={<TrendingUp />}
            >
              Start Paper Trading
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepComplete = () => {
    switch (activeStep) {
      case 0:
        return userData.email && userData.name && userData.password;
      case 1:
        return userData.goal && userData.timeline;
      case 2:
        return userData.experience;
      default:
        return true;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              {activeStep < steps.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete()}
                  endIcon={<ArrowForward />}
                  sx={{ bgcolor: '#4CAF50' }}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;