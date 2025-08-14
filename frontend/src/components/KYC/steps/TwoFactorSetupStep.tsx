import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  TextField,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Security,
  QrCode,
  CheckCircle,
  PhoneAndroid,
  Download,
  Timer
} from '@mui/icons-material';
import axios from 'axios';

interface TwoFactorSetupStepProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface TwoFactorSetup {
  secret_key: string;
  qr_code_uri: string;
  qr_image_base64?: string;
  instructions: string[];
}

const TwoFactorSetupStep: React.FC<TwoFactorSetupStepProps> = ({
  applicationId,
  onNext,
  onBack,
  onError,
  loading,
  setLoading
}) => {
  const [tfaSetup, setTfaSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    initiateTwoFactorSetup();
  }, []);

  const initiateTwoFactorSetup = async () => {
    setSetupLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8081/api/customer/kyc/setup-2fa',
        { application_id: applicationId }
      );

      setTfaSetup(response.data);
    } catch (error: any) {
      console.error('2FA setup error:', error);
      onError('Failed to set up two-factor authentication. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyTwoFactorCode = async () => {
    if (verificationCode.length !== 6) {
      setVerifyError('Please enter a 6-digit code from your authenticator app');
      return;
    }

    setLoading(true);
    setVerifyError(null);

    try {
      const response = await axios.post(
        'http://localhost:8081/api/customer/kyc/verify-2fa',
        {
          application_id: applicationId,
          totp_code: verificationCode
        }
      );

      if (response.data.verified) {
        setSetupComplete(true);
        setTimeout(() => {
          onNext();
        }, 2000);
      } else {
        setVerifyError(response.data.message || 'Invalid authenticator code');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      if (error.response?.data?.detail) {
        setVerifyError(error.response.data.detail);
      } else {
        setVerifyError('Verification failed. Please try again.');
      }
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
      verifyTwoFactorCode();
    }
  };

  if (setupLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body1">Setting up two-factor authentication...</Typography>
      </Box>
    );
  }

  if (setupComplete) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Two-Factor Authentication Enabled!
        </Typography>
        <Typography variant="body1">
          Your account is now secured with 2FA. Proceeding to final step...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Security sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Two-Factor Authentication</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Set up Google Authenticator to secure your account with two-factor authentication.
        You'll use this app to generate login codes for enhanced security.
      </Typography>

      {/* Download Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Step 1: Download Google Authenticator
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => window.open(tfaSetup?.app_store_links?.ios || 'https://apps.apple.com/app/google-authenticator/id388497605', '_blank')}
          >
            iOS App Store
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => window.open(tfaSetup?.app_store_links?.android || 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2', '_blank')}
          >
            Google Play
          </Button>
        </Box>
      </Alert>

      {tfaSetup && (
        <Grid container spacing={3}>
          {/* QR Code Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode sx={{ mr: 1 }} />
                  Scan QR Code
                </Typography>
                
                {tfaSetup.qr_image_base64 ? (
                  <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, display: 'inline-block' }}>
                    <img
                      src={`data:image/png;base64,${tfaSetup.qr_image_base64}`}
                      alt="2FA QR Code"
                      style={{ width: 200, height: 200 }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ p: 4, border: '2px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                    <QrCode sx={{ fontSize: 64, color: 'grey.400' }} />
                    <Typography variant="body2" color="text.secondary">
                      QR Code not available
                    </Typography>
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Open Google Authenticator and scan this QR code
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Manual Setup Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneAndroid sx={{ mr: 1 }} />
                  Manual Setup
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Can't scan the QR code? Manually enter this key in Google Authenticator:
                </Typography>

                <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {tfaSetup.secret_key}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigator.clipboard.writeText(tfaSetup.secret_key)}
                >
                  Copy Key
                </Button>

                <List dense sx={{ mt: 2 }}>
                  {tfaSetup.instructions.map((instruction, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <Chip label={index + 1} size="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={instruction}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Verification Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Timer sx={{ mr: 1 }} />
            Verify Setup
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            Enter the 6-digit code from your Google Authenticator app to complete setup:
          </Typography>

          {verifyError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {verifyError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Authenticator Code"
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
            error={!!verifyError}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Tip:</strong> The code changes every 30 seconds. 
              Enter the current code shown in your Google Authenticator app.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Security Benefits */}
      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Enhanced Security Benefits:
        </Typography>
        <List dense>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Protects against unauthorized access" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Required for trading account access" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Works offline - no internet required" />
          </ListItem>
        </List>
      </Alert>

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
          onClick={verifyTwoFactorCode}
          disabled={verificationCode.length !== 6 || loading}
          size="large"
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Button>
      </Box>
    </Box>
  );
};

export default TwoFactorSetupStep;