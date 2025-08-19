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
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Dashboard,
  Security,
  People,
  Storage,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Settings,
  Refresh,
  CloudUpload,
  Api,
  NetworkCheck,
  Memory,
  Computer,
  Cloud,
  VpnKey,
  Build,
  Backup,
  Schedule,
  NotificationImportant,
  BugReport,
  Speed,
  Lock,
  ExpandMore,
  Visibility,
  Block,
  AdminPanelSettings,
  Layers,
  Shield,
  Gavel,
  VerifiedUser,
  ContactSupport
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { StaffUser, SystemAlert, AuditLog } from '../../types/staff';

interface EnterpriseAdminDashboardProps {
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const EnterpriseAdminDashboard: React.FC<EnterpriseAdminDashboardProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiMetrics, setApiMetrics] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>({});
  const [userManagementDialog, setUserManagementDialog] = useState(false);

  useEffect(() => {
    // Enhanced system health metrics
    setSystemHealth({
      overall: 98.5,
      api: 99.2,
      database: 97.8,
      webSocket: 98.9,
      storage: 99.5,
      authentication: 99.8,
      tradingEngine: 96.2,
      dataProcessor: 98.1,
      mlInference: 95.7,
      riskEngine: 99.1
    });

    // Enhanced user statistics
    setUserStats({
      totalUsers: 1247,
      activeUsers: 892,
      newRegistrations: 23,
      kycPending: 45,
      kycApproved: 1156,
      kycRejected: 15,
      staffMembers: 15,
      adminUsers: 3,
      tradingAgents: 4,
      supportStaff: 5,
      kycStaff: 3,
      bannedUsers: 8,
      suspendedUsers: 12
    });

    // System alerts with enhanced categories
    setSystemAlerts([
      {
        id: 'alert_001',
        type: 'security',
        severity: 'warning',
        title: 'Multiple failed login attempts',
        description: 'IP 192.168.1.100 - 5 failed attempts in 10 minutes',
        affectedSystems: ['authentication'],
        status: 'investigating',
        createdDate: '2024-08-19T14:23:45Z',
        assignedTo: 'security-team'
      },
      {
        id: 'alert_002',
        type: 'performance',
        severity: 'error',
        title: 'High database latency detected',
        description: 'Query response time exceeding 2 seconds for user portfolios',
        affectedSystems: ['database', 'api'],
        status: 'new',
        createdDate: '2024-08-19T13:45:12Z'
      },
      {
        id: 'alert_003',
        type: 'trading',
        severity: 'critical',
        title: 'Trading engine circuit breaker triggered',
        description: 'Unusual market volatility detected, automatic safety protocols activated',
        affectedSystems: ['tradingEngine', 'riskEngine'],
        status: 'acknowledged',
        createdDate: '2024-08-19T12:15:30Z',
        assignedTo: 'trading-ops'
      },
      {
        id: 'alert_004',
        type: 'compliance',
        severity: 'warning',
        title: 'KYC processing backlog',
        description: 'Verification queue exceeding SLA threshold of 48 hours',
        affectedSystems: ['kyc', 'compliance'],
        status: 'investigating',
        createdDate: '2024-08-19T11:30:00Z',
        assignedTo: 'compliance-team'
      }
    ]);

    // Enhanced audit logs
    setAuditLogs([
      {
        id: 'audit_001',
        userId: 'admin_001',
        userName: 'Chris Park',
        action: 'USER_ROLE_MODIFIED',
        resource: 'user_management',
        resourceId: 'user_789',
        details: { oldRole: 'customer', newRole: 'trader', reason: 'Professional verification completed' },
        timestamp: '2024-08-19T14:30:00Z',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        success: true
      },
      {
        id: 'audit_002',
        userId: 'kyc_001',
        userName: 'Jennifer Kim',
        action: 'KYC_APPROVED',
        resource: 'kyc_application',
        resourceId: 'kyc_123',
        details: { customerId: 'cust_456', riskScore: 25, reviewTime: '2.5 hours' },
        timestamp: '2024-08-19T13:45:00Z',
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        success: true
      },
      {
        id: 'audit_003',
        userId: 'trader_001',
        userName: 'Alex Rodriguez',
        action: 'MODEL_DEPLOYED',
        resource: 'trading_model',
        resourceId: 'model_ml_alpha_v2',
        details: { allocatedCapital: 750000, riskLimits: { maxDrawdown: 0.12 } },
        timestamp: '2024-08-19T12:20:00Z',
        ipAddress: '192.168.1.60',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        success: true
      }
    ]);

    // Enhanced API metrics
    setApiMetrics([
      { endpoint: '/api/auth/login', requests: 1245, avgResponse: 120, errors: 2, p99: 450 },
      { endpoint: '/api/customer/portfolio', requests: 8932, avgResponse: 85, errors: 12, p99: 280 },
      { endpoint: '/api/models/train', requests: 156, avgResponse: 2340, errors: 1, p99: 5200 },
      { endpoint: '/api/trading/signals', requests: 4567, avgResponse: 95, errors: 8, p99: 320 },
      { endpoint: '/api/kyc/verify', requests: 234, avgResponse: 450, errors: 3, p99: 850 },
      { endpoint: '/api/risk/calculate', requests: 3421, avgResponse: 180, errors: 5, p99: 480 },
      { endpoint: '/api/market/data', requests: 12450, avgResponse: 45, errors: 15, p99: 120 }
    ]);

    // Performance metrics over time
    setPerformanceMetrics([
      { time: '08:00', cpu: 45, memory: 68, api_latency: 120, active_users: 234 },
      { time: '10:00', cpu: 52, memory: 72, api_latency: 135, active_users: 456 },
      { time: '12:00', cpu: 68, memory: 75, api_latency: 145, active_users: 678 },
      { time: '14:00', cpu: 71, memory: 78, api_latency: 155, active_users: 892 },
      { time: '16:00', cpu: 58, memory: 74, api_latency: 140, active_users: 765 }
    ]);

    // Security statistics
    setSecurityStats({
      threatsBlocked: 147,
      vulnerabilitiesPatched: 8,
      securityScore: 94.5,
      lastSecurityScan: '2024-08-19T02:00:00Z',
      activeMfaUsers: 1156,
      sslCertificateExpiry: '2025-03-15',
      firewallRules: 234,
      encryptionStatus: 'AES-256'
    });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getHealthColor = (value: number) => {
    if (value >= 99) return 'success';
    if (value >= 95) return 'warning';
    return 'error';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'security': return <Security color="error" />;
      case 'performance': return <Speed color="warning" />;
      case 'trading': return <Analytics color="error" />;
      case 'compliance': return <Gavel color="warning" />;
      default: return <Warning />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const systemMetrics = [
    { name: 'CPU Usage', value: 68, color: '#8884d8' },
    { name: 'Memory', value: 75, color: '#82ca9d' },
    { name: 'Storage', value: 42, color: '#ffc658' },
    { name: 'Network', value: 35, color: '#ff7300' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enterprise System Administration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced platform monitoring, security, and infrastructure management
        </Typography>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color={getHealthColor(systemHealth.overall)}>
                {systemHealth.overall}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Health
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Api sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.api}%</Typography>
              <Typography variant="caption" color="text.secondary">API</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Storage sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.database}%</Typography>
              <Typography variant="caption" color="text.secondary">Database</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Security sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.authentication}%</Typography>
              <Typography variant="caption" color="text.secondary">Auth</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Analytics sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.tradingEngine}%</Typography>
              <Typography variant="caption" color="text.secondary">Trading</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Computer sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.mlInference}%</Typography>
              <Typography variant="caption" color="text.secondary">ML</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Shield sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6">{systemHealth.riskEngine}%</Typography>
              <Typography variant="caption" color="text.secondary">Risk</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={1}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconButton color="primary" onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                Refresh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alerts Banner */}
      {systemAlerts.filter(alert => alert.severity === 'critical').length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <NotificationImportant sx={{ mr: 1, verticalAlign: 'middle' }} />
            Critical System Alerts Require Immediate Attention
          </Typography>
          {systemAlerts.filter(alert => alert.severity === 'critical').map(alert => (
            <Typography key={alert.id} variant="body2">
              • {alert.title}: {alert.description}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab 
              label={
                <Badge badgeContent={systemAlerts.filter(a => a.status === 'new').length} color="error">
                  System Health
                </Badge>
              } 
            />
            <Tab label="User Management" />
            <Tab label="Security Center" />
            <Tab label="API Monitoring" />
            <Tab label="Performance" />
            <Tab label="Audit Logs" />
            <Tab label="Infrastructure" />
            <Tab label="Deployment" />
          </Tabs>
        </Box>

        {/* System Health Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                System Performance Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  <Line type="monotone" dataKey="api_latency" stroke="#ffc658" name="API Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Resource Utilization
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={systemMetrics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {systemMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Active System Alerts
          </Typography>
          {systemAlerts.map((alert) => (
            <Accordion key={alert.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {getAlertIcon(alert.type)}
                  <Chip 
                    label={alert.severity.toUpperCase()}
                    color={getSeverityColor(alert.severity) as any}
                    size="small"
                    sx={{ mx: 2 }}
                  />
                  <Typography sx={{ flexGrow: 1 }}>
                    {alert.title}
                  </Typography>
                  <Chip 
                    label={alert.status.replace('_', ' ')}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {alert.description}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Affected Systems:</strong> {alert.affectedSystems.join(', ')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Created:</strong> {new Date(alert.createdDate).toLocaleString()}
                  {alert.assignedTo && (
                    <>
                      <br />
                      <strong>Assigned to:</strong> {alert.assignedTo}
                    </>
                  )}
                </Typography>
                <Box>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                    Investigate
                  </Button>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                    Acknowledge
                  </Button>
                  <Button variant="outlined" size="small" color="success">
                    Resolve
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ mr: 1 }} />
                    User Statistics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" color="primary">
                      {userStats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Registered Users
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="success.main">
                      {userStats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users (30 days)
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="info.main">
                      {userStats.staffMembers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Staff Members
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                User Role Distribution
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AdminPanelSettings sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                      <Typography variant="h5">{userStats.adminUsers}</Typography>
                      <Typography variant="body2">Administrators</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Analytics sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h5">{userStats.tradingAgents}</Typography>
                      <Typography variant="body2">Trading Agents</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <ContactSupport sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="h5">{userStats.supportStaff}</Typography>
                      <Typography variant="body2">Support Staff</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <VerifiedUser sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="h5">{userStats.kycStaff}</Typography>
                      <Typography variant="body2">KYC Staff</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<People />}
                  onClick={() => setUserManagementDialog(true)}
                >
                  Manage Users
                </Button>
                <Button variant="outlined" startIcon={<AdminPanelSettings />}>
                  Role Management
                </Button>
                <Button variant="outlined" startIcon={<Block />}>
                  Suspended Users ({userStats.suspendedUsers})
                </Button>
              </Box>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Action Required:</strong> {userStats.kycPending} KYC applications pending review
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Center Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Security Dashboard
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {securityStats.securityScore}%
                    </Typography>
                    <Chip label="SECURE" color="success" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Overall Security Posture Score
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <VpnKey color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Multi-Factor Authentication"
                        secondary={`${securityStats.activeMfaUsers} users enabled (92.7%)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Lock color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="SSL Certificate"
                        secondary={`Valid until ${new Date(securityStats.sslCertificateExpiry).toLocaleDateString()}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Security color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Firewall Rules"
                        secondary={`${securityStats.firewallRules} active rules`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Threat Intelligence
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {securityStats.threatsBlocked}
                      </Typography>
                      <Typography variant="body2">Threats Blocked (24h)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {securityStats.vulnerabilitiesPatched}
                      </Typography>
                      <Typography variant="body2">Vulnerabilities Patched</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Last Security Scan:</strong> {new Date(securityStats.lastSecurityScan).toLocaleString()}
                </Typography>
              </Alert>

              <Box>
                <Button variant="contained" color="warning" sx={{ mr: 1 }}>
                  Run Security Scan
                </Button>
                <Button variant="outlined">
                  View Threat Log
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Monitoring Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            API Performance & Health Metrics
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Requests (24h)</TableCell>
                  <TableCell align="right">Avg Response (ms)</TableCell>
                  <TableCell align="right">P99 (ms)</TableCell>
                  <TableCell align="right">Errors</TableCell>
                  <TableCell align="right">Success Rate</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiMetrics.map((metric, index) => {
                  const successRate = ((metric.requests - metric.errors) / metric.requests * 100).toFixed(1);
                  const isHealthy = parseFloat(successRate) > 99 && metric.avgResponse < 1000;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {metric.endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{metric.requests.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={metric.avgResponse > 1000 ? 'error.main' : 'text.primary'}
                        >
                          {metric.avgResponse}ms
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={metric.p99 > 2000 ? 'error.main' : 'text.primary'}
                        >
                          {metric.p99}ms
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={metric.errors > 10 ? 'error.main' : 'text.primary'}
                        >
                          {metric.errors}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={parseFloat(successRate) < 99 ? 'warning.main' : 'success.main'}
                        >
                          {successRate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isHealthy ? 'HEALTHY' : 'DEGRADED'}
                          color={isHealthy ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                System Performance Trends (24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU Usage %" />
                  <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory Usage %" />
                  <Line type="monotone" dataKey="active_users" stroke="#ffc658" name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Performance Alerts
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Memory Usage High:</strong> 78% utilization detected at 14:00
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Peak Load:</strong> 892 concurrent users at 14:00
                </Typography>
              </Alert>
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Performance Optimal:</strong> All systems within normal parameters
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Audit Logs Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            System Audit Trail
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                          {log.userName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{log.userName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action.replace('_', ' ')}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.resource}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {JSON.stringify(log.details)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.success ? 'SUCCESS' : 'FAILED'}
                        color={log.success ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Infrastructure Tab */}
        <TabPanel value={tabValue} index={6}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Infrastructure Overview
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Cloud color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cloud Provider"
                    secondary="AWS ap-southeast-2 (Sydney)"
                  />
                  <Chip label="ACTIVE" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Layers color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Container Orchestration"
                    secondary="Kubernetes v1.28.0"
                  />
                  <Chip label="HEALTHY" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Storage color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Database Cluster"
                    secondary="PostgreSQL 15.4 (3 nodes)"
                  />
                  <Chip label="REPLICATED" color="success" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Memory color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cache Layer"
                    secondary="Redis 7.0.5 (Cluster mode)"
                  />
                  <Chip label="OPTIMIZED" color="success" size="small" />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Resource Scaling
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Auto-scaling Configuration
                  </Typography>
                  <FormControlLabel
                    control={<Switch checked />}
                    label="Enable auto-scaling"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Current instances: 3/10 (target CPU: 70%)
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={30} 
                    sx={{ mt: 1, mb: 2 }}
                  />
                  <Button variant="outlined" size="small">
                    Configure Scaling
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Deployment Tab */}
        <TabPanel value={tabValue} index={7}>
          <Typography variant="h6" gutterBottom>
            Deployment Pipeline
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Deployment
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Version: v2.4.1 (Production)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Deployed: 2024-08-18 14:30:00 UTC
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    Commit: abc123def456 (main branch)
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button variant="contained" sx={{ mr: 1 }}>
                      Deploy to Staging
                    </Button>
                    <Button variant="outlined" color="warning">
                      Rollback
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Maintenance
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Backup />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Database Backup"
                        secondary="Last: 2024-08-19 02:00:00 UTC"
                      />
                      <Button size="small" variant="outlined">
                        Backup Now
                      </Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Build />
                      </ListItemIcon>
                      <ListItemText 
                        primary="System Update"
                        secondary="5 security patches available"
                      />
                      <Button size="small" variant="outlined" color="warning">
                        Update
                      </Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* User Management Dialog */}
      <Dialog 
        open={userManagementDialog} 
        onClose={() => setUserManagementDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Management</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" startIcon={<People />}>
                  Create New User
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" startIcon={<Block />}>
                  Suspend User
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" startIcon={<AdminPanelSettings />}>
                  Modify Permissions
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" startIcon={<Security />}>
                  Reset 2FA
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserManagementDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseAdminDashboard;