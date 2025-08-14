import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import {
  VerifiedUser,
  CheckCircle,
  Schedule,
  Error,
  TrendingUp,
  Security,
  AccountBalance,
  Support
} from '@mui/icons-material';
import axios from 'axios';

interface CompletionStepProps {
  applicationId: string;
  application: any;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface FinalResult {
  application_id: string;
  status: 'approved' | 'rejected' | 'requires_manual_review';
  risk_level: 'low' | 'medium' | 'high' | 'prohibited';
  message: string;
  trading_enabled: boolean;
  compliance_notes: string[];
  next_steps: string[];
}

const CompletionStep: React.FC<CompletionStepProps> = ({
  applicationId,
  application,
  onNext,
  onBack,
  onError,
  loading,
  setLoading
}) => {
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  useEffect(() => {
    finalizeApplication();
  }, []);

  const finalizeApplication = async () => {
    setLoading(true);
    setProcessingStep('Performing AML screening...');

    try {
      // Simulate AML screening
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep('Finalizing application...');
      
      // Simulate finalization delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful completion
      const mockResult = {
        status: 'approved',
        risk_level: 'low',
        approved_at: new Date().toISOString(),
        message: 'Congratulations! Your account has been successfully verified.'
      };

      setFinalResult(mockResult);
    } catch (error: any) {
      console.error('Application finalization error:', error);
      onError('Failed to finalize application. Please contact support.');
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />;
      case 'requires_manual_review':
        return <Schedule sx={{ fontSize: 64, color: 'warning.main' }} />;
      case 'rejected':
        return <Error sx={{ fontSize: 64, color: 'error.main' }} />;
      default:
        return <VerifiedUser sx={{ fontSize: 64, color: 'primary.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'requires_manual_review': return 'warning';
      case 'rejected': return 'error';
      default: return 'primary';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'prohibited': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress size={64} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Finalizing Your Application
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {processingStep || 'Processing final verification steps...'}
        </Typography>
        <Alert severity="info">
          <Typography variant="body2">
            We're completing your AML screening and finalizing your application. 
            This usually takes just a few moments.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!finalResult) {
    return (
      <Alert severity="error">
        Unable to complete application finalization. Please contact support.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Status Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        {getStatusIcon(finalResult.status)}
        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
          {finalResult.status === 'approved' && '🎉 Congratulations!'}
          {finalResult.status === 'requires_manual_review' && '⏳ Under Review'}
          {finalResult.status === 'rejected' && '❌ Application Declined'}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {finalResult.message}
        </Typography>
      </Box>

      {/* Application Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Application Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Application ID:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {finalResult.application_id}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Status:</Typography>
                <Chip 
                  label={finalResult.status.replace('_', ' ').toUpperCase()} 
                  color={getStatusColor(finalResult.status)} 
                  size="small" 
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Risk Level:</Typography>
                <Chip 
                  label={finalResult.risk_level.toUpperCase()} 
                  color={getRiskLevelColor(finalResult.risk_level)} 
                  size="small" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Trading Enabled:</Typography>
                <Chip 
                  label={finalResult.trading_enabled ? 'YES' : 'NO'} 
                  color={finalResult.trading_enabled ? 'success' : 'default'} 
                  size="small" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Status-Specific Content */}
      {finalResult.status === 'approved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ✅ Account Approved for Trading!
          </Typography>
          <Typography variant="body2">
            Your identity has been verified and your account is now active. 
            You can start trading immediately after funding your account.
          </Typography>
        </Alert>
      )}

      {finalResult.status === 'requires_manual_review' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⏳ Manual Review Required
          </Typography>
          <Typography variant="body2">
            Your application requires additional review by our compliance team. 
            We'll contact you within 24-48 hours with an update.
          </Typography>
        </Alert>
      )}

      {finalResult.status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ❌ Application Declined
          </Typography>
          <Typography variant="body2">
            Unfortunately, we cannot approve your application at this time. 
            You may contact support for more information.
          </Typography>
        </Alert>
      )}

      {/* Next Steps */}
      {finalResult.next_steps && finalResult.next_steps.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Next Steps
            </Typography>
            <List>
              {finalResult.next_steps.map((step, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Compliance Notes */}
      {finalResult.compliance_notes && finalResult.compliance_notes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Security sx={{ mr: 1 }} />
              Compliance Information
            </Typography>
            <List dense>
              {finalResult.compliance_notes.map((note, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={note}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Additional Resources */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Funding Guide</Typography>
                <Typography variant="body2" color="text.secondary">
                  Learn how to deposit funds
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Trading Tutorial</Typography>
                <Typography variant="body2" color="text.secondary">
                  Get started with trading
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Support sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Contact Support</Typography>
                <Typography variant="body2" color="text.secondary">
                  support@qlibpro.com
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={finalResult.status === 'approved'}
        >
          {finalResult.status === 'approved' ? 'Process Complete' : 'Back'}
        </Button>
        
        {finalResult.status === 'approved' && (
          <Button
            variant="contained"
            size="large"
            sx={{ minWidth: 200 }}
            onClick={onNext}
          >
            Continue to Funding
          </Button>
        )}

        {finalResult.status === 'requires_manual_review' && (
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/support'}
          >
            Contact Support
          </Button>
        )}

        {finalResult.status === 'rejected' && (
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/support'}
          >
            Appeal Decision
          </Button>
        )}
      </Box>

      {/* Final Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Important:</strong> Save your application ID ({finalResult.application_id}) for your records. 
          You'll need it for any future correspondence about your application.
        </Typography>
      </Alert>
    </Box>
  );
};

export default CompletionStep;