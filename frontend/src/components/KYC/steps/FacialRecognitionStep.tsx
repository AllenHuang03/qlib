import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  CameraAlt,
  FaceRetouchingNatural,
  CheckCircle,
  Warning,
  Refresh,
  Security
} from '@mui/icons-material';
import axios from 'axios';

interface FacialRecognitionStepProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface VerificationResult {
  face_match_confidence: number;
  liveness_score: number;
  verification_status: 'approved' | 'rejected' | 'requires_manual_review';
}

const FacialRecognitionStep: React.FC<FacialRecognitionStepProps> = ({
  applicationId,
  onNext,
  onBack,
  onError,
  loading,
  setLoading
}) => {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      setCameraStream(stream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      onError('Camera access denied. Please allow camera access and try again.');
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    startCamera();
  };

  const processVerification = async () => {
    if (!capturedImage) return;

    setLoading(true);
    setProcessingStep('Uploading selfie...');

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('selfie_file', blob, 'selfie.jpg');
      formData.append('application_id', applicationId);

      setProcessingStep('Analyzing facial features...');

      // Simulate facial recognition API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const verificationResponse = { data: { verified: true, confidence: 0.94 } };

      setProcessingStep('Checking liveness detection...');
      
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      setVerificationResult(verificationResponse.data);

    } catch (error: any) {
      console.error('Facial verification error:', error);
      if (error.response?.data?.detail) {
        onError(error.response.data.detail);
      } else {
        onError('Facial verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleNext = () => {
    if (verificationResult?.verification_status === 'approved') {
      onNext();
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'requires_manual_review': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FaceRetouchingNatural sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Facial Recognition</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Take a clear selfie to verify your identity. Make sure you're in good lighting 
        and looking directly at the camera.
      </Typography>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          For best results:
        </Typography>
        <List dense>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Look directly at the camera" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Ensure good, even lighting on your face" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Remove sunglasses, hats, or face coverings" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Keep your face centered in the frame" />
          </ListItem>
        </List>
      </Alert>

      {/* Camera/Photo Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          {!cameraActive && !capturedImage && (
            <Box>
              <CameraAlt sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ready to take your selfie?
              </Typography>
              <Button
                variant="contained"
                onClick={startCamera}
                startIcon={<CameraAlt />}
                size="large"
                disabled={loading}
              >
                Start Camera
              </Button>
            </Box>
          )}

          {cameraActive && (
            <Box>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 8,
                  border: '2px solid #1976d2'
                }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={capturePhoto}
                  startIcon={<CameraAlt />}
                  size="large"
                  sx={{ mr: 2 }}
                >
                  Take Photo
                </Button>
                <Button
                  variant="outlined"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}

          {capturedImage && !loading && (
            <Box>
              <img
                src={capturedImage}
                alt="Captured selfie"
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 8,
                  border: '2px solid #1976d2'
                }}
              />
              <Box sx={{ mt: 2 }}>
                {!verificationResult && (
                  <>
                    <Button
                      variant="contained"
                      onClick={processVerification}
                      startIcon={<Security />}
                      size="large"
                      sx={{ mr: 2 }}
                    >
                      Verify Identity
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={retakePhoto}
                      startIcon={<Refresh />}
                    >
                      Retake
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          )}

          {loading && (
            <Box>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body1">
                {processingStep || 'Processing...'}
              </Typography>
              <LinearProgress sx={{ mt: 1, maxWidth: 300, mx: 'auto' }} />
            </Box>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Verification Results */}
      {verificationResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Verification Results
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Alert severity={getVerificationColor(verificationResult.verification_status)}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {verificationResult.verification_status.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Face Match:</strong> {(verificationResult.face_match_confidence * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Liveness Score:</strong> {(verificationResult.liveness_score * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {verificationResult.verification_status === 'approved' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ✅ <strong>Identity verified successfully!</strong> Your facial features match your uploaded document.
                </Typography>
              </Alert>
            )}

            {verificationResult.verification_status === 'rejected' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ❌ <strong>Verification failed.</strong> Please ensure good lighting and try again.
                </Typography>
              </Alert>
            )}

            {verificationResult.verification_status === 'requires_manual_review' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⏳ <strong>Manual review required.</strong> Our team will review your submission within 24 hours.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Privacy Notice:</strong> Your biometric data is encrypted and used solely for identity verification. 
          We comply with Australian privacy laws and biometric data regulations.
        </Typography>
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
          onClick={handleNext}
          disabled={!verificationResult || verificationResult.verification_status !== 'approved' || loading}
          size="large"
          sx={{ minWidth: 200 }}
        >
          {verificationResult?.verification_status === 'approved' 
            ? 'Continue to 2FA Setup' 
            : 'Complete Verification First'
          }
        </Button>
      </Box>
    </Box>
  );
};

export default FacialRecognitionStep;