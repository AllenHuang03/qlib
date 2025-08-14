import React, { useState, useCallback } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  PersonAdd, 
  Email, 
  Phone, 
  CloudUpload, 
  CameraAlt, 
  Security, 
  VerifiedUser 
} from '@mui/icons-material';

import PersonalDetailsStep from './steps/PersonalDetailsStep';
import EmailVerificationStep from './steps/EmailVerificationStep';
import PhoneVerificationStep from './steps/PhoneVerificationStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import FacialRecognitionStep from './steps/FacialRecognitionStep';
import TwoFactorSetupStep from './steps/TwoFactorSetupStep';
import CompletionStep from './steps/CompletionStep';

interface KYCApplication {
  id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_manual_review';
  risk_level: 'low' | 'medium' | 'high' | 'prohibited';
}

const steps = [
  { 
    label: 'Personal Details', 
    icon: <PersonAdd />,
    description: 'Provide your legal information',
    estimatedTime: '2 min'
  },
  { 
    label: 'Email Verification', 
    icon: <Email />,
    description: 'Verify your email address',
    estimatedTime: '1 min'
  },
  { 
    label: 'Phone Verification', 
    icon: <Phone />,
    description: 'Verify your phone number',
    estimatedTime: '1 min'
  },
  { 
    label: 'Document Upload', 
    icon: <CloudUpload />,
    description: 'Upload government-issued ID',
    estimatedTime: '3 min'
  },
  { 
    label: 'Facial Recognition', 
    icon: <CameraAlt />,
    description: 'Take a selfie for verification',
    estimatedTime: '2 min'
  },
  { 
    label: 'Two-Factor Auth', 
    icon: <Security />,
    description: 'Set up Google Authenticator',
    estimatedTime: '2 min'
  },
  { 
    label: 'Complete', 
    icon: <VerifiedUser />,
    description: 'Finalize your application',
    estimatedTime: '1 min'
  }
];

const KYCWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [kycApplication, setKycApplication] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  }, [activeStep]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  }, [activeStep]);

  const handleApplicationCreate = useCallback((application: KYCApplication) => {
    setKycApplication(application);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PersonalDetailsStep
            onNext={handleNext}
            onApplicationCreate={handleApplicationCreate}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 1:
        return (
          <EmailVerificationStep
            applicationId={kycApplication?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 2:
        return (
          <PhoneVerificationStep
            applicationId={kycApplication?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 3:
        return (
          <DocumentUploadStep
            applicationId={kycApplication?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 4:
        return (
          <FacialRecognitionStep
            applicationId={kycApplication?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 5:
        return (
          <TwoFactorSetupStep
            applicationId={kycApplication?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 6:
        return (
          <CompletionStep
            applicationId={kycApplication?.id || ''}
            application={kycApplication}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      default:
        return 'Unknown step';
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

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Account Verification
      </Typography>
      
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Complete our secure verification process to enable trading. This usually takes 12-15 minutes.
      </Typography>

      {/* Application Status */}
      {kycApplication && (
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Application ID: <strong>{kycApplication.id}</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={kycApplication.status.replace('_', ' ').toUpperCase()} 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label={`${kycApplication.risk_level.toUpperCase()} RISK`} 
                  color={getRiskLevelColor(kycApplication.risk_level)} 
                  size="small" 
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            Step {activeStep + 1} of {steps.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Est. {steps[activeStep]?.estimatedTime} remaining
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Progress Loading */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress color="secondary" />
        </Box>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              icon={step.icon}
              optional={
                <Typography variant="caption" align="center">
                  {step.description}
                </Typography>
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {getStepContent(activeStep)}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Privacy & Compliance:</strong> We comply with Australian AML/CTF regulations and AUSTRAC requirements. 
          Your information is encrypted and stored securely. For questions, contact support@qlibpro.com
        </Typography>
      </Alert>
    </Box>
  );
};

export default KYCWizard;