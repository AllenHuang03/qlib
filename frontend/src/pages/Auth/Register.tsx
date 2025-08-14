import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import KYCModal from '../../components/KYC/KYCModal';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKYC, setShowKYC] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Create new user account (simplified - in production use real API)
      const newUser = {
        id: `user_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: 'customer', // Default role
        kyc_status: 'pending',
        created_at: new Date().toISOString(),
        subscription_tier: null,
        portfolio_initialized: false
      };

      setRegisteredUser(newUser);
      setLoading(false);
      setShowKYC(true); // Start KYC immediately after successful registration
    } catch (error) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleKYCComplete = (userRole: 'customer' | 'trader') => {
    // Update user with KYC completion and selected role
    const completedUser = {
      ...registeredUser,
      role: userRole,
      kyc_status: 'approved'
    };
    
    setUser(completedUser);
    setShowKYC(false);
    
    // Store auth token for the session
    localStorage.setItem('auth-token', 'verified-user-token');
    
    // Navigate to plan selection instead of dashboard
    navigate('/plan-selection');
  };

  const handleKYCClose = () => {
    // If user closes KYC without completing, they can't proceed
    setShowKYC(false);
    setError('Account verification is required to access the platform. Please complete the verification process.');
  };

  if (showKYC) {
    return (
      <KYCModal
        open={showKYC}
        onClose={handleKYCClose}
        onComplete={handleKYCComplete}
      />
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
            <Typography component="h1" variant="h4" color="primary" fontWeight="bold">
              Qlib Pro
            </Typography>
          </Box>
          
          <Typography component="h2" variant="h5" sx={{ mb: 1 }}>
            Create Your Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Join thousands of investors using AI-powered quantitative trading
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              helperText="Minimum 8 characters"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating Account...
                </Box>
              ) : (
                'Create Account & Start Verification'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
            <Typography variant="body2">
              <strong>Next Step:</strong> After creating your account, you'll immediately begin 
              our secure verification process (12-15 minutes) to access trading features.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
              Demo tip: Use verification code "123456" in step 2
            </Typography>
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
}