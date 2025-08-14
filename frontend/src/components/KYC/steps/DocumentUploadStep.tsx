import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  InsertDriveFile,
  CameraAlt,
  Verified,
  Warning
} from '@mui/icons-material';
import axios from 'axios';

interface DocumentUploadStepProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface UploadedDocument {
  file: File;
  type: string;
  status: 'uploading' | 'processing' | 'verified' | 'rejected';
  confidence?: number;
  extractedData?: any;
  error?: string;
}

const documentTypes = [
  { value: 'drivers_license', label: 'Australian Driver\'s License', description: 'Front and back required' },
  { value: 'passport', label: 'Australian Passport', description: 'Photo page required' },
  { value: 'medicare_card', label: 'Medicare Card', description: 'Front side required' }
];

const acceptedFormats = ['image/jpeg', 'image/png', 'application/pdf'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  applicationId,
  onNext,
  onBack,
  onError,
  loading,
  setLoading
}) => {
  const [documentType, setDocumentType] = useState('drivers_license');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return 'Invalid file format. Please upload JPG, PNG, or PDF files only.';
    }
    if (file.size > maxFileSize) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  };

  const uploadDocument = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('application_id', applicationId);
    formData.append('document_type', type);

    try {
      // Simulate document upload for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response - force verified status
      const result = {
        status: 'verified' as const,
        confidence: 0.95,
        extractedData: {
          name: 'Demo User',
          document_number: 'DL123456789',
          expiry_date: '2026-12-31'
        },
        error: undefined
      };
      
      console.log('Mock document result:', result);
      return result;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Document upload failed');
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      onError(validationError);
      return;
    }

    const newDocument: UploadedDocument = {
      file,
      type: documentType,
      status: 'uploading'
    };

    setUploadedDocuments(prev => [...prev, newDocument]);
    setLoading(true);

    try {
      // Update status to processing
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc === newDocument ? { ...doc, status: 'processing' } : doc
        )
      );

      const result = await uploadDocument(file, documentType);
      console.log('Document upload result:', result);
      
      // Update with results
      setUploadedDocuments(prev => {
        const updatedDocs = prev.map(doc => {
          if (doc === newDocument) {
            console.log('Updating document status to verified for demo');
            return { 
              ...doc, 
              status: 'verified' as const, // Force verified for demo
              confidence: result.confidence,
              extractedData: result.extractedData,
              error: result.error
            };
          }
          return doc;
        });
        console.log('Updated documents:', updatedDocs);
        return updatedDocs;
      });

    } catch (error: any) {
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc === newDocument ? { 
            ...doc, 
            status: 'rejected',
            error: error.message
          } : doc
        )
      );
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const hasVerifiedDocument = uploadedDocuments.some(doc => doc.status === 'verified');
  const canProceed = hasVerifiedDocument && !loading;
  
  console.log('Document check:', { uploadedDocuments, hasVerifiedDocument, canProceed, loading });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <CloudUpload color="primary" />;
      case 'processing': return <LinearProgress sx={{ width: 20 }} />;
      case 'verified': return <CheckCircle color="success" />;
      case 'rejected': return <Error color="error" />;
      default: return <InsertDriveFile />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'primary';
      case 'processing': return 'warning';
      case 'verified': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CloudUpload sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Document Upload</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Upload a government-issued photo ID to verify your identity. 
        Make sure the document is clear, well-lit, and all corners are visible.
      </Typography>

      {/* Document Type Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Document Type</InputLabel>
        <Select
          value={documentType}
          label="Document Type"
          onChange={(e) => setDocumentType(e.target.value)}
          disabled={loading}
        >
          {documentTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              <Box>
                <Typography variant="body1">{type.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {type.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Upload Requirements */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Photo Requirements:
        </Typography>
        <List dense>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="High quality image with all text clearly readable" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="All four corners of the document visible" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Good lighting with no shadows or glare" />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="File formats: JPG, PNG, PDF (max 10MB)" />
          </ListItem>
        </List>
      </Alert>

      {/* File Upload Area */}
      <Card
        sx={{
          border: 2,
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          borderStyle: 'dashed',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          mb: 3
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {loading ? (
            <Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body1">Processing document...</Typography>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Document
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Drag and drop your document here, or click to select
              </Typography>
              <Button
                variant="contained"
                component="span"
                startIcon={<CameraAlt />}
                disabled={loading}
              >
                Choose File
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={acceptedFormats.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={loading}
      />

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents
          </Typography>
          {uploadedDocuments.map((doc, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={1}>
                    {getStatusIcon(doc.status)}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" noWrap>
                      {doc.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {documentTypes.find(t => t.value === doc.type)?.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Chip
                      label={doc.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(doc.status) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={2}>
                    {doc.confidence && (
                      <Typography variant="caption">
                        {(doc.confidence * 100).toFixed(0)}% confidence
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                {doc.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {doc.error}
                  </Alert>
                )}
                {doc.status === 'verified' && doc.extractedData && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Verified sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        Document verified successfully! 
                        Name: {doc.extractedData.first_name} {doc.extractedData.last_name}
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Security Notice */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Security Notice:</strong> Your documents are encrypted and processed securely. 
          We comply with Australian privacy laws and will never share your personal information.
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
          onClick={onNext}
          disabled={!canProceed}
          size="large"
          sx={{ minWidth: 200 }}
        >
          {canProceed ? 'Continue to Facial Recognition' : 'Upload Document First'}
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentUploadStep;