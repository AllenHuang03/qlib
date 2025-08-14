import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Backdrop,
  Fade,
  Paper
} from '@mui/material';
import { Close } from '@mui/icons-material';

import PersonalDetailsStep from './steps/PersonalDetailsStep';
import EmailVerificationStep from './steps/EmailVerificationStep';
import PhoneVerificationStep from './steps/PhoneVerificationStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import FacialRecognitionStep from './steps/FacialRecognitionStep';
import TwoFactorSetupStep from './steps/TwoFactorSetupStep';
import CompletionStep from './steps/CompletionStep';
import WelcomeStep from './steps/WelcomeStep';
import FundingStep from './steps/FundingStep';

interface KYCModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (userRole: 'customer' | 'trader') => void;
}

interface KYCApplication {
  id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_manual_review';
  risk_level: 'low' | 'medium' | 'high' | 'prohibited';
}

const steps = [
  'Welcome',
  'Personal Details', 
  'Email Verification',
  'Phone Verification',
  'Document Upload',
  'Facial Recognition',
  'Two-Factor Auth',
  'Complete Verification',
  'Fund Account'
];

const KYCModal: React.FC<KYCModalProps> = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [kycApplication, setKycApplication] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'trader'>('customer');

  const handleNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // Complete onboarding
      onComplete(userRole);
      onClose();
    }
  }, [activeStep, userRole, onComplete, onClose]);

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

  const handleClose = () => {
    if (activeStep === 0 || (kycApplication && kycApplication.status === 'approved')) {
      onClose();
    }
    // Prevent closing during verification process
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <WelcomeStep
            onNext={handleNext}
            onRoleSelect={setUserRole}
            selectedRole={userRole}
          />
        );
      case 1:
        return (
          <PersonalDetailsStep
            onNext={handleNext}
            onApplicationCreate={handleApplicationCreate}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 2:
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
      case 3:
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
      case 4:
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
      case 5:
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
      case 6:
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
      case 7:
        return (
          <CompletionStep
            applicationId={kycApplication?.id || ''}
            application={kycApplication}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 8:
        return (
          <FundingStep
            userRole={userRole}
            onNext={handleNext}
            onBack={handleBack}
            onComplete={() => onComplete(userRole)}
            loading={loading}
            setLoading={setLoading}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh',
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }
      }}
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        pb: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'primary.main',
        color: 'white'
      }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Account Verification
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
          </Typography>
        </Box>
        
        {activeStep === 0 && (
          <IconButton 
            onClick={handleClose}
            sx={{ color: 'white' }}
            size="large"
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ px: 3, pt: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100}
          sx={{ 
            height: 6, 
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3
            }
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {Math.round((activeStep / (steps.length - 1)) * 100)}% Complete
        </Typography>
      </Box>

      {/* Step Indicator (Simplified for modal) */}
      <Box sx={{ px: 3, py: 2 }}>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': {
              fontSize: '0.75rem'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ 
        p: 4, 
        flex: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: 8
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 4
        }
      }}>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          {getStepContent(activeStep)}
        </Box>
      </DialogContent>

      {/* Loading Overlay */}
      {loading && (
        <Backdrop
          open={loading}
          sx={{ 
            position: 'absolute',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <LinearProgress sx={{ width: 200 }} />
            <Typography variant="body1">
              Processing verification...
            </Typography>
          </Paper>
        </Backdrop>
      )}
    </Dialog>
  );
};

export default KYCModal;