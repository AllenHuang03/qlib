import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Email, Timer } from '@mui/icons-material';
import axios from 'axios';

interface EmailVerificationStepProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  applicationId,
  onNext,
  onBack,
  onError,
  loading,
  setLoading
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      // Mock resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimeLeft(300);
      setCanResend(false);
      setVerifyError(null);
    } catch (error) {
      onError('Failed to resend verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setVerifyError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setVerifyError(null);

    try {
      // For demo purposes, accept any 6-digit code or simulate successful verification
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      // Accept demo codes or any valid 6-digit number for testing
      if (verificationCode === '123456' || verificationCode === '000000' || /^\d{6}$/.test(verificationCode)) {
        onNext();
      } else {
        setVerifyError('Invalid verification code. Try 123456 for demo.');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setVerifyError(null);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && verificationCode.length === 6 && !loading) {
      handleVerify();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Email sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Email Verification</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        We've sent a 6-digit verification code to your email address. 
        Please check your inbox and enter the code below.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Check your spam/junk folder if you don't see the email within a few minutes.
          The code expires in {formatTime(timeLeft)}.
        </Typography>
      </Alert>

      {verifyError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {verifyError}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Verification Code"
          value={verificationCode}
          onChange={handleCodeChange}
          onKeyPress={handleKeyPress}
          placeholder="123456"
          inputProps={{ 
            maxLength: 6,
            style: { 
              fontSize: '1.5rem', 
              letterSpacing: '0.5rem', 
              textAlign: 'center' 
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Timer color={timeLeft > 60 ? 'primary' : 'error'} />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
          error={!!verifyError}
          disabled={loading}
        />
        
        <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
          {timeLeft > 0 ? (
            `Code expires in ${formatTime(timeLeft)}`
          ) : (
            'Code has expired. Please request a new one.'
          )}
        </Typography>
      </Box>

      {/* Resend Option */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Didn't receive the code?
        </Typography>
        <Button
          variant="text"
          onClick={handleResendCode}
          disabled={!canResend || resendLoading}
          startIcon={resendLoading && <CircularProgress size={16} />}
        >
          {resendLoading ? 'Sending...' : 'Resend Code'}
        </Button>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={verificationCode.length !== 6 || loading}
          size="large"
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </Box>

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Security Notice:</strong> This verification step confirms your email address 
          for account security and important notifications. The code is valid for 5 minutes.
        </Typography>
      </Alert>
    </Box>
  );
};

export default EmailVerificationStep;