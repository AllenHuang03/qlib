import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
  Switch,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Business,
  CloudUpload,
  Security,
  Analytics,
  People,
  Assessment,
  Timeline,
  Api,
  Shield,
  Download,
  Upload,
  Visibility,
  Edit,
  Delete,
  Add,
  CheckCircle,
  Warning,
  Error,
  Info,
  VerifiedUser,
  AdminPanelSettings,
  DataObject,
  IntegrationInstructions,
  PolicyIcon,
  ReportIcon,
  AccountTree,
  SupervisorAccount,
  ComplianceIcon,
  GroupWork,
  Storage,
  Speed,
  TrendingUp,
  BarChart
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface InstitutionalClientFlowProps {
  user: any;
}

interface BulkImportJob {
  id: string;
  filename: string;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  errorRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  errors: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trader' | 'analyst' | 'readonly';
  permissions: string[];
  lastLogin: string;
  status: 'active' | 'pending' | 'disabled';
}

interface ComplianceReport {
  id: string;
  type: 'risk_assessment' | 'position_limits' | 'exposure_analysis' | 'audit_trail';
  name: string;
  generatedDate: string;
  status: 'generating' | 'ready' | 'expired';
  size: string;
}

const InstitutionalClientFlow: React.FC<InstitutionalClientFlowProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [bulkImportJobs, setBulkImportJobs] = useState<BulkImportJob[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
  const [showApiSetupDialog, setShowApiSetupDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Initialize institutional data
    setBulkImportJobs([
      {
        id: 'job-1',
        filename: 'pension_fund_holdings_q3_2024.csv',
        totalRecords: 12547,
        processedRecords: 12547,
        validRecords: 12532,
        errorRecords: 15,
        status: 'completed',
        startTime: '2024-08-18T09:30:00Z',
        endTime: '2024-08-18T09:42:00Z',
        errors: ['Invalid symbol: UNKNOWN123', 'Missing quantity for position ABC456']
      },
      {
        id: 'job-2',
        filename: 'equity_positions_batch_2.csv',
        totalRecords: 8942,
        processedRecords: 3247,
        validRecords: 3247,
        errorRecords: 0,
        status: 'processing',
        startTime: '2024-08-19T08:15:00Z',
        errors: []
      }
    ]);

    setTeamMembers([
      {
        id: 'member-1',
        name: 'Michael Thompson',
        email: 'michael.thompson@pensionfund.com',
        role: 'admin',
        permissions: ['full_access', 'user_management', 'api_access', 'compliance_reports'],
        lastLogin: '2024-08-19T07:30:00Z',
        status: 'active'
      },
      {
        id: 'member-2',
        name: 'Sarah Chen',
        email: 'sarah.chen@pensionfund.com',
        role: 'trader',
        permissions: ['portfolio_management', 'trade_execution', 'risk_monitoring'],
        lastLogin: '2024-08-18T16:45:00Z',
        status: 'active'
      },
      {
        id: 'member-3',
        name: 'David Rodriguez',
        email: 'david.rodriguez@pensionfund.com',
        role: 'analyst',
        permissions: ['portfolio_analysis', 'reporting', 'research_tools'],
        lastLogin: '2024-08-17T14:20:00Z',
        status: 'active'
      }
    ]);

    setComplianceReports([
      {
        id: 'report-1',
        type: 'risk_assessment',
        name: 'Daily Risk Assessment - August 2024',
        generatedDate: '2024-08-19T06:00:00Z',
        status: 'ready',
        size: '2.4 MB'
      },
      {
        id: 'report-2',
        type: 'position_limits',
        name: 'Position Limits Monitoring',
        generatedDate: '2024-08-19T05:30:00Z',
        status: 'ready',
        size: '1.1 MB'
      },
      {
        id: 'report-3',
        type: 'audit_trail',
        name: 'Weekly Audit Trail Report',
        generatedDate: '2024-08-19T08:00:00Z',
        status: 'generating',
        size: 'Calculating...'
      }
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBulkImportUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate large file upload
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            
            // Create new import job
            const newJob: BulkImportJob = {
              id: `job-${Date.now()}`,
              filename: file.name,
              totalRecords: Math.floor(Math.random() * 50000) + 10000,
              processedRecords: 0,
              validRecords: 0,
              errorRecords: 0,
              status: 'pending',
              startTime: new Date().toISOString(),
              errors: []
            };
            
            setBulkImportJobs(prev => [newJob, ...prev]);
            setShowBulkImportDialog(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    }
  };

  const TabPanel = ({ children, value, index }: any) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const BulkImportTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Bulk Portfolio Import
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<CloudUpload />}
            onClick={() => setShowBulkImportDialog(true)}
          >
            Upload Portfolio Data
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Jobs History
            </Typography>
            
            {bulkImportJobs.map((job) => (
              <Paper key={job.id} variant="outlined" sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {job.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Started: {new Date(job.startTime).toLocaleString()}
                      {job.endTime && ` • Completed: ${new Date(job.endTime).toLocaleString()}`}
                    </Typography>
                  </Box>
                  <Chip 
                    label={job.status.toUpperCase()}
                    color={
                      job.status === 'completed' ? 'success' :
                      job.status === 'processing' ? 'info' :
                      job.status === 'failed' ? 'error' : 'default'
                    }
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Total Records</Typography>
                    <Typography variant="h6">{job.totalRecords.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Processed</Typography>
                    <Typography variant="h6">{job.processedRecords.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Valid</Typography>
                    <Typography variant="h6" color="success.main">{job.validRecords.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Errors</Typography>
                    <Typography variant="h6" color={job.errorRecords > 0 ? 'error.main' : 'success.main'}>
                      {job.errorRecords.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {job.status === 'processing' && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(job.processedRecords / job.totalRecords) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Processing {job.processedRecords.toLocaleString()} of {job.totalRecords.toLocaleString()} records...
                    </Typography>
                  </Box>
                )}

                {job.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Import Warnings:</strong>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        {job.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {job.errors.length > 3 && <li>... and {job.errors.length - 3} more errors</li>}
                      </ul>
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" startIcon={<Download />}>
                    Download Report
                  </Button>
                  {job.errorRecords > 0 && (
                    <Button size="small" startIcon={<Error />}>
                      View Errors
                    </Button>
                  )}
                  <Button size="small" startIcon={<Visibility />}>
                    View Details
                  </Button>
                </Box>
              </Paper>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Guidelines
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="CSV Format Required"
                  secondary="Headers: symbol, quantity, price, date"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Maximum File Size"
                  secondary="Up to 100MB (1M+ positions)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Validation & Processing"
                  secondary="Automatic symbol validation"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Info color="info" /></ListItemIcon>
                <ListItemText 
                  primary="Processing Time"
                  secondary="5-15 minutes for large files"
                />
              </ListItem>
            </List>

            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<Download />}
              sx={{ mt: 2 }}
            >
              Download CSV Template
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const TeamManagementTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Team & Access Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setShowTeamMemberDialog(true)}
          >
            Invite Team Member
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{member.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.role.toUpperCase()}
                          color={
                            member.role === 'admin' ? 'primary' :
                            member.role === 'trader' ? 'success' :
                            member.role === 'analyst' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(member.lastLogin).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.status.toUpperCase()}
                          color={member.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <Security fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Role Permissions
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Administrator</Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Full platform access" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="User management" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="API access" />
                </ListItem>
              </List>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Trader</Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Portfolio management" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Trade execution" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><Warning color="warning" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Limited reporting" />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Analyst</Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Research tools" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Reporting access" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon><Error color="error" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="No trading access" />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ComplianceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Compliance & Reporting Dashboard
        </Typography>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Compliance Reports
            </Typography>
            
            {complianceReports.map((report) => (
              <Paper key={report.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {report.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generated: {new Date(report.generatedDate).toLocaleString()} • Size: {report.size}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={report.status.toUpperCase()}
                      color={report.status === 'ready' ? 'success' : report.status === 'generating' ? 'info' : 'warning'}
                      size="small"
                    />
                    {report.status === 'ready' && (
                      <Button size="small" startIcon={<Download />}>
                        Download
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}

            <Button variant="outlined" startIcon={<Add />} sx={{ mt: 2 }}>
              Generate Custom Report
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Monitoring
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Portfolio VaR (1-day, 95%)</Typography>
              <Typography variant="h4" color="warning.main">$127,450</Typography>
              <Typography variant="body2" color="success.main">Within limits</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Maximum Position Size</Typography>
              <Typography variant="h4" color="success.main">4.8%</Typography>
              <Typography variant="body2" color="text.secondary">Limit: 5.0%</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Sector Concentration</Typography>
              <Typography variant="h4" color="success.main">28%</Typography>
              <Typography variant="body2" color="text.secondary">Banking sector</Typography>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                All risk limits are within acceptable ranges. Next review scheduled for tomorrow.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Portfolio Exposure Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { date: 'Aug 1', banking: 28, healthcare: 22, mining: 18, tech: 15, other: 17 },
                { date: 'Aug 5', banking: 29, healthcare: 21, mining: 19, tech: 16, other: 15 },
                { date: 'Aug 10', banking: 27, healthcare: 23, mining: 17, tech: 18, other: 15 },
                { date: 'Aug 15', banking: 28, healthcare: 22, mining: 18, tech: 17, other: 15 },
                { date: 'Aug 19', banking: 30, healthcare: 21, mining: 16, tech: 18, other: 15 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="banking" stackId="1" stroke="#2196f3" fill="#2196f3" />
                <Area type="monotone" dataKey="healthcare" stackId="1" stroke="#4caf50" fill="#4caf50" />
                <Area type="monotone" dataKey="mining" stackId="1" stroke="#ff9800" fill="#ff9800" />
                <Area type="monotone" dataKey="tech" stackId="1" stroke="#9c27b0" fill="#9c27b0" />
                <Area type="monotone" dataKey="other" stackId="1" stroke="#607d8b" fill="#607d8b" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ApiAccessTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            API Access & Integration
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Api />}
            onClick={() => setShowApiSetupDialog(true)}
          >
            Generate API Key
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Endpoints
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Portfolio Data</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ mb: 1 }}>
                GET /api/v1/portfolios/{'{portfolio_id}'}/positions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Retrieve current portfolio positions and valuations
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Trade Execution</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ mb: 1 }}>
                POST /api/v1/orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit trade orders programmatically
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Risk Analytics</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ mb: 1 }}>
                GET /api/v1/analytics/risk-metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access VaR, stress tests, and risk decomposition
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Market Data</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ mb: 1 }}>
                GET /api/v1/market-data/real-time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time and historical market data feeds
              </Typography>
            </Paper>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Rate Limits:</strong> 1000 requests/minute for data endpoints, 
                100 requests/minute for trading endpoints. Contact support for higher limits.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Usage Statistics
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">This Month</Typography>
              <Typography variant="h4" color="primary">247K</Typography>
              <Typography variant="body2" color="text.secondary">API calls</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Response Time (avg)</Typography>
              <Typography variant="h4" color="success.main">142ms</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Success Rate</Typography>
              <Typography variant="h4" color="success.main">99.8%</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Active API Keys
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Production Key"
                  secondary="pk_live_xxxx...4a7b • Last used: 2 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Staging Key"
                  secondary="pk_test_xxxx...9f3c • Last used: 1 day ago"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Documentation
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><IntegrationInstructions color="primary" /></ListItemIcon>
                <ListItemText primary="API Documentation" />
              </ListItem>
              <ListItem>
                <ListItemIcon><DataObject color="primary" /></ListItemIcon>
                <ListItemText primary="SDK Downloads" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Security color="primary" /></ListItemIcon>
                <ListItemText primary="Security Guidelines" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Institutional Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', color: 'white' }}>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
              <Business sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Institutional Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Enterprise portfolio management for {user?.name}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip 
                icon={<Shield />} 
                label="ENTERPRISE CLIENT" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total AUM</Typography>
              <Typography variant="h5" fontWeight="bold">
                ${user?.portfolio_value?.toLocaleString() || '2,500,000'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Daily P&L</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#4ade80' }}>
                +$12,470 (+0.5%)
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Positions</Typography>
              <Typography variant="h5" fontWeight="bold">
                12,547
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Team Members</Typography>
              <Typography variant="h5" fontWeight="bold">
                {teamMembers.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enterprise Features Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<CloudUpload />} label="Bulk Import" />
            <Tab icon={<People />} label="Team Management" />
            <Tab icon={<Shield />} label="Compliance" />
            <Tab icon={<Api />} label="API Access" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={activeTab} index={0}>
            <BulkImportTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <TeamManagementTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <ComplianceTab />
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <ApiAccessTab />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportDialog} onClose={() => setShowBulkImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Portfolio Import</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Upload large portfolio files with up to 1 million positions. Our system supports CSV files up to 100MB.
          </Typography>
          
          <Box sx={{ border: '2px dashed', borderColor: 'grey.300', borderRadius: 2, p: 4, textAlign: 'center', mb: 2 }}>
            <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & Drop or Click to Upload
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Supported formats: CSV (up to 100MB)
            </Typography>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkImportUpload}
              style={{ display: 'none' }}
              id="bulk-upload"
            />
            <label htmlFor="bulk-upload">
              <Button variant="contained" component="span">
                Select File
              </Button>
            </label>
          </Box>

          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Required columns:</strong> symbol, quantity, average_price, purchase_date<br />
              <strong>Processing time:</strong> Large files may take 5-15 minutes to process<br />
              <strong>Validation:</strong> All symbols will be validated against ASX database
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkImportDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Member Dialog */}
      <Dialog open={showTeamMemberDialog} onClose={() => setShowTeamMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email Address" type="email" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="First Name" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Last Name" />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role">
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="trader">Trader</MenuItem>
                  <MenuItem value="analyst">Analyst</MenuItem>
                  <MenuItem value="readonly">Read-only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Permissions
              </Typography>
              <FormControlLabel control={<Checkbox />} label="Portfolio Management" />
              <FormControlLabel control={<Checkbox />} label="Trade Execution" />
              <FormControlLabel control={<Checkbox />} label="Reporting Access" />
              <FormControlLabel control={<Checkbox />} label="API Access" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTeamMemberDialog(false)}>Cancel</Button>
          <Button variant="contained">Send Invitation</Button>
        </DialogActions>
      </Dialog>

      {/* API Setup Dialog */}
      <Dialog open={showApiSetupDialog} onClose={() => setShowApiSetupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate API Key</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Create a new API key for programmatic access to your portfolio data and trading functions.
          </Typography>
          <TextField fullWidth label="API Key Name" sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Environment</InputLabel>
            <Select label="Environment">
              <MenuItem value="production">Production</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="subtitle2" gutterBottom>
            Permissions
          </Typography>
          <FormControlLabel control={<Checkbox defaultChecked />} label="Read Portfolio Data" />
          <FormControlLabel control={<Checkbox />} label="Execute Trades" />
          <FormControlLabel control={<Checkbox defaultChecked />} label="Access Market Data" />
          <FormControlLabel control={<Checkbox />} label="Generate Reports" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiSetupDialog(false)}>Cancel</Button>
          <Button variant="contained">Generate Key</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutionalClientFlow;