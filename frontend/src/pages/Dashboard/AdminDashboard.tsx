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
  FormControlLabel
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
  Storage,
  Api,
  NetworkCheck
} from '@mui/icons-material';

interface AdminDashboardProps {
  user: any;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [apiMetrics, setApiMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Mock data - in production, fetch from monitoring APIs
    setSystemHealth({
      overall: 98.5,
      api: 99.2,
      database: 97.8,
      webSocket: 98.9,
      storage: 99.5
    });

    setUserStats({
      totalUsers: 1247,
      activeUsers: 892,
      newRegistrations: 23,
      kycPending: 45,
      kycApproved: 1156,
      kycRejected: 15
    });

    setSecurityAlerts([
      {
        id: 'sec_001',
        type: 'warning',
        title: 'Multiple failed login attempts',
        description: 'IP 192.168.1.100 - 5 failed attempts in 10 minutes',
        timestamp: '2024-01-12 14:23:45',
        status: 'investigating'
      },
      {
        id: 'sec_002',
        type: 'info',
        title: 'New device login',
        description: 'User trader@example.com logged in from new device',
        timestamp: '2024-01-12 13:45:12',
        status: 'resolved'
      },
      {
        id: 'sec_003',
        type: 'critical',
        title: 'Unusual API access pattern',
        description: 'High frequency requests detected from API key xxx-yyy-zzz',
        timestamp: '2024-01-12 12:15:30',
        status: 'blocked'
      }
    ]);

    setApiMetrics([
      { endpoint: '/api/auth/login', requests: 1245, avgResponse: 120, errors: 2 },
      { endpoint: '/api/customer/portfolio', requests: 8932, avgResponse: 85, errors: 12 },
      { endpoint: '/api/models/train', requests: 156, avgResponse: 2340, errors: 1 },
      { endpoint: '/api/trading/signals', requests: 4567, avgResponse: 95, errors: 8 },
      { endpoint: '/api/kyc/verify', requests: 234, avgResponse: 450, errors: 3 }
    ]);
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
      case 'critical': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <CheckCircle color="info" />;
      default: return <CheckCircle />;
    }
  };

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Administration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Platform monitoring, user management, and security oversight
        </Typography>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color={getHealthColor(systemHealth.overall)}>
                {systemHealth.overall}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Health
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Api sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{systemHealth.api}%</Typography>
              <Typography variant="body2" color="text.secondary">
                API Services
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{systemHealth.database}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Database
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NetworkCheck sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{systemHealth.webSocket}%</Typography>
              <Typography variant="body2" color="text.secondary">
                WebSocket
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{systemHealth.storage}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Storage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <IconButton color="primary" onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Refresh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="User Management" />
            <Tab label="Security & Alerts" />
            <Tab label="API Monitoring" />
            <Tab label="System Settings" />
          </Tabs>
        </Box>

        {/* User Management Tab */}
        <TabPanel value={tabValue} index={0}>
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
                      {userStats.newRegistrations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Today
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                KYC Verification Status
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="warning.main">
                        {userStats.kycPending}
                      </Typography>
                      <Typography variant="body2">Pending Review</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="success.main">
                        {userStats.kycApproved}
                      </Typography>
                      <Typography variant="body2">Approved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="error.main">
                        {userStats.kycRejected}
                      </Typography>
                      <Typography variant="body2">Rejected</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Button variant="contained" sx={{ mr: 2 }}>
                Review Pending KYC
              </Button>
              <Button variant="outlined">
                Export User Data
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security & Alerts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Security Alerts & Events
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Alert</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {getAlertIcon(alert.type)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {alert.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {alert.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alert.timestamp}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.status}
                        color={
                          alert.status === 'resolved' ? 'success' :
                          alert.status === 'blocked' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Investigate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* API Monitoring Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            API Performance Metrics
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Requests (24h)</TableCell>
                  <TableCell align="right">Avg Response (ms)</TableCell>
                  <TableCell align="right">Errors</TableCell>
                  <TableCell align="right">Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiMetrics.map((metric, index) => {
                  const successRate = ((metric.requests - metric.errors) / metric.requests * 100).toFixed(1);
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Feature Toggles
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Enhanced KYC Verification"
                        secondary="Require additional documents for high-risk applications"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Analytics />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Real-time Monitoring"
                        secondary="Enable advanced system monitoring and alerts"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CloudUpload />
                      </ListItemIcon>
                      <ListItemText 
                        primary="API Rate Limiting"
                        secondary="Enforce strict rate limits on public APIs"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Maintenance
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Button variant="contained" fullWidth sx={{ mb: 1 }}>
                      Backup Database
                    </Button>
                    <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
                      Clear Cache
                    </Button>
                    <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
                      Restart Services
                    </Button>
                    <Button variant="outlined" fullWidth color="warning">
                      Enable Maintenance Mode
                    </Button>
                  </Box>
                  
                  <Alert severity="info">
                    <Typography variant="body2">
                      Last backup: 2024-01-12 02:00:00 UTC
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AdminDashboard;