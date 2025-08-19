import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import {
  Assignment,
  Person,
  Security,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  PriorityHigh,
  Visibility,
  ExpandMore,
  CloudUpload,
  Description,
  AccountBalance,
  Gavel,
  SmartToy,
  TrendingUp,
  Assessment,
  Flag,
  ContactSupport,
  VerifiedUser
} from '@mui/icons-material';
import { StaffUser, KYCApplication, KYCDocument, ComplianceFlag } from '../../types/staff';

interface KYCStaffDashboardProps {
  user: StaffUser;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kyc-tabpanel-${index}`}
      aria-labelledby={`kyc-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const KYCStaffDashboard: React.FC<KYCStaffDashboardProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'additional_info_required'>('approved');
  const [dailyStats, setDailyStats] = useState<any>({});

  useEffect(() => {
    // Mock KYC applications data
    setApplications([
      {
        id: 'kyc_001',
        customerId: 'cust_001',
        customerName: 'Emma Wilson',
        customerEmail: 'newcustomer@test.com',
        status: 'pending',
        priority: 'medium',
        submissionDate: '2024-08-19T09:30:00Z',
        riskScore: 25,
        documents: [
          {
            id: 'doc_001',
            type: 'passport',
            filename: 'passport_emma_wilson.pdf',
            uploadDate: '2024-08-19T09:30:00Z',
            status: 'pending',
            aiAnalysis: {
              confidence: 0.92,
              extractedData: {
                name: 'Emma Wilson',
                documentNumber: 'P123456789',
                issueDate: '2020-05-15',
                expiryDate: '2030-05-15',
                nationality: 'Australian'
              },
              anomalies: [],
              suggestions: ['Document appears authentic', 'High confidence match']
            }
          },
          {
            id: 'doc_002',
            type: 'proof_of_address',
            filename: 'utility_bill_emma.pdf',
            uploadDate: '2024-08-19T09:32:00Z',
            status: 'pending',
            aiAnalysis: {
              confidence: 0.88,
              extractedData: {
                name: 'Emma Wilson',
                address: '123 Collins Street, Melbourne VIC 3000',
                issueDate: '2024-07-15',
                provider: 'Origin Energy'
              },
              anomalies: ['Address format requires verification'],
              suggestions: ['Verify address against electoral roll']
            }
          }
        ],
        verificationNotes: [],
        complianceFlags: [
          {
            id: 'flag_001',
            type: 'sanctions_check',
            severity: 'low',
            description: 'Routine sanctions screening - no matches found',
            status: 'resolved',
            createdDate: '2024-08-19T09:35:00Z',
            resolvedDate: '2024-08-19T09:36:00Z'
          }
        ]
      },
      {
        id: 'kyc_002',
        customerId: 'cust_002',
        customerName: 'James Chen',
        customerEmail: 'jchen@example.com',
        status: 'under_review',
        priority: 'high',
        submissionDate: '2024-08-18T14:20:00Z',
        riskScore: 65,
        documents: [
          {
            id: 'doc_003',
            type: 'drivers_license',
            filename: 'license_james_chen.jpg',
            uploadDate: '2024-08-18T14:20:00Z',
            status: 'needs_clarification',
            aiAnalysis: {
              confidence: 0.67,
              extractedData: {
                name: 'James Chen',
                licenseNumber: 'DL987654321',
                state: 'NSW',
                expiryDate: '2026-03-20'
              },
              anomalies: ['Image quality low', 'Partial text obscured'],
              suggestions: ['Request higher quality image', 'Consider alternative documentation']
            }
          }
        ],
        verificationNotes: ['Image quality insufficient for verification', 'Requested new upload'],
        complianceFlags: [
          {
            id: 'flag_002',
            type: 'high_risk_country',
            severity: 'medium',
            description: 'Customer has connections to high-risk jurisdiction',
            status: 'investigating',
            createdDate: '2024-08-18T14:25:00Z'
          }
        ]
      },
      {
        id: 'kyc_003',
        customerId: 'cust_003',
        customerName: 'Sarah Martinez',
        customerEmail: 'smartinez@corp.com',
        status: 'pending',
        priority: 'urgent',
        submissionDate: '2024-08-19T11:15:00Z',
        riskScore: 85,
        documents: [
          {
            id: 'doc_004',
            type: 'passport',
            filename: 'passport_sarah_martinez.pdf',
            uploadDate: '2024-08-19T11:15:00Z',
            status: 'verified',
            aiAnalysis: {
              confidence: 0.95,
              extractedData: {
                name: 'Sarah Martinez',
                documentNumber: 'P987654321',
                nationality: 'Spanish'
              },
              anomalies: [],
              suggestions: ['Document verified successfully']
            }
          }
        ],
        verificationNotes: [],
        complianceFlags: [
          {
            id: 'flag_003',
            type: 'pep_check',
            severity: 'high',
            description: 'Potential politically exposed person match requires investigation',
            status: 'open',
            createdDate: '2024-08-19T11:20:00Z'
          }
        ]
      }
    ]);

    // Mock daily statistics
    setDailyStats({
      totalApplications: 23,
      pendingReview: 8,
      completedToday: 15,
      approvedToday: 12,
      rejectedToday: 2,
      additionalInfoRequested: 1,
      avgProcessingTime: 2.5,
      complianceFlags: 5,
      highRiskApplications: 3
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReviewApplication = (application: KYCApplication) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
    setReviewNotes('');
    setReviewDecision('approved');
  };

  const handleSubmitReview = () => {
    if (selectedApplication) {
      // Update application status
      const updatedApplications = applications.map(app => 
        app.id === selectedApplication.id 
          ? {
              ...app,
              status: reviewDecision,
              reviewDate: new Date().toISOString(),
              reviewerId: user.id,
              verificationNotes: [...app.verificationNotes, reviewNotes]
            }
          : app
      );
      setApplications(updatedApplications);
    }
    setReviewDialogOpen(false);
    setSelectedApplication(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'under_review': return 'warning';
      case 'pending': return 'info';
      case 'additional_info_required': return 'warning';
      default: return 'default';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'error.main';
    if (score >= 40) return 'warning.main';
    return 'success.main';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          KYC Compliance Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Customer verification and risk assessment dashboard
        </Typography>
      </Box>

      {/* Daily Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {dailyStats.totalApplications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={dailyStats.pendingReview} color="warning">
                <Schedule sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              </Badge>
              <Typography variant="h4" color="warning.main">
                {dailyStats.pendingReview}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {dailyStats.completedToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {dailyStats.avgProcessingTime}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Processing Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={applications.filter(app => app.status === 'pending').length} color="warning">
                  Application Queue
                </Badge>
              } 
            />
            <Tab label="Document Review" />
            <Tab label="Risk Assessment" />
            <Tab label="Compliance Flags" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Application Queue Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              KYC Application Queue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Applications sorted by priority and submission date
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {application.customerName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {application.customerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {application.customerEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={application.priority.toUpperCase()}
                        color={getPriorityColor(application.priority) as any}
                        size="small"
                        icon={application.priority === 'urgent' ? <PriorityHigh /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={application.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(application.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={getRiskScoreColor(application.riskScore)}
                        fontWeight="bold"
                      >
                        {application.riskScore}/100
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(application.submissionDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={application.documents.length} color="info">
                        <Description />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        badgeContent={application.complianceFlags.filter(f => f.status === 'open').length} 
                        color="error"
                      >
                        <Flag />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleReviewApplication(application)}
                        disabled={application.status === 'approved' || application.status === 'rejected'}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Document Review Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                AI-Assisted Document Analysis
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">AI Document Scanner</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Automatic document verification with 94% accuracy rate
                  </Typography>
                  <LinearProgress variant="determinate" value={94} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Processing confidence: 94%
                  </Typography>
                </CardContent>
              </Card>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>AI Recommendation:</strong> 3 documents require manual review due to image quality concerns
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Document Processing Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Verified Documents"
                    secondary="18 documents processed successfully"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Needs Review"
                    secondary="5 documents require manual verification"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Error color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Rejected"
                    secondary="2 documents failed verification"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Risk Assessment Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Risk Assessment Dashboard
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error.main">
                    High Risk Applications
                  </Typography>
                  <Typography variant="h3" color="error.main">
                    {dailyStats.highRiskApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Require enhanced due diligence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom>
                Risk Distribution
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Low Risk (0-30): 60% of applications
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={60} 
                  color="success" 
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Medium Risk (31-69): 27% of applications
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={27} 
                  color="warning" 
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  High Risk (70+): 13% of applications
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={13} 
                  color="error" 
                  sx={{ mb: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Compliance Flags Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Active Compliance Flags
          </Typography>
          {applications.map((application) => 
            application.complianceFlags.filter(flag => flag.status !== 'resolved').map((flag) => (
              <Accordion key={flag.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Chip 
                      label={flag.type.replace('_', ' ').toUpperCase()}
                      color={flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'info'}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Typography sx={{ flexGrow: 1 }}>
                      {application.customerName} - {flag.description}
                    </Typography>
                    <Chip 
                      label={flag.status.replace('_', ' ')}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(flag.createdDate).toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                      Investigate
                    </Button>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                      Mark Resolved
                    </Button>
                    <Button variant="outlined" size="small" color="error">
                      Escalate
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Assessment />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Average Processing Time"
                        secondary="2.5 hours (target: 4 hours)"
                      />
                      <Typography color="success.main">✓</Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedUser />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Approval Rate"
                        secondary="87% (industry average: 82%)"
                      />
                      <Typography color="success.main">✓</Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Compliance Score"
                        secondary="98.5% (target: 95%)"
                      />
                      <Typography color="success.main">✓</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Weekly Trends
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                Processing efficiency improved by 15% this week
              </Alert>
              <Alert severity="info">
                3 new high-risk patterns identified by AI system
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review KYC Application - {selectedApplication?.customerName}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Customer Information
                  </Typography>
                  <Typography variant="body2">
                    Name: {selectedApplication.customerName}
                  </Typography>
                  <Typography variant="body2">
                    Email: {selectedApplication.customerEmail}
                  </Typography>
                  <Typography variant="body2">
                    Risk Score: {selectedApplication.riskScore}/100
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Documents ({selectedApplication.documents.length})
                  </Typography>
                  {selectedApplication.documents.map((doc) => (
                    <Box key={doc.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {doc.type}: {doc.status}
                        {doc.aiAnalysis && (
                          <Chip 
                            label={`AI: ${(doc.aiAnalysis.confidence * 100).toFixed(0)}%`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>

              <FormControl fullWidth sx={{ mt: 3, mb: 2 }}>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={reviewDecision}
                  label="Decision"
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                >
                  <MenuItem value="approved">Approve Application</MenuItem>
                  <MenuItem value="rejected">Reject Application</MenuItem>
                  <MenuItem value="additional_info_required">Request Additional Information</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter your review notes and reasoning..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            disabled={!reviewNotes.trim()}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KYCStaffDashboard;