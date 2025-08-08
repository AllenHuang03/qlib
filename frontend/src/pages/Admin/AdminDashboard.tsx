import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
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
  Alert,
  Tabs,
  Tab,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Delete,
  Add,
  Refresh,
  Settings,
  TrendingUp,
  People,
  Computer,
  Storage,
  Warning,
  CheckCircle,
  Error,
  Timeline,
} from '@mui/icons-material';

interface ModelStats {
  id: string;
  name: string;
  displayName: string;
  type: string;
  status: 'training' | 'active' | 'paused' | 'stopped' | 'failed';
  accuracy: number;
  sharpeRatio: number;
  subscribers: number;
  signalsGenerated: number;
  lastUpdated: string;
  trainingProgress?: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  paperTradingUsers: number;
  realTradingUsers: number;
  newUsersToday: number;
}

interface SystemStats {
  totalModels: number;
  activeModels: number;
  failedModels: number;
  totalSignals: number;
  signalsToday: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [createModelOpen, setCreateModelOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    displayName: '',
    type: 'LightGBM',
    description: '',
  });

  // Mock data - replace with real API calls
  const [models, setModels] = useState<ModelStats[]>([
    {
      id: '1',
      name: 'lstm_alpha158_v1',
      displayName: 'AI Stock Picker #1',
      type: 'LSTM',
      status: 'active',
      accuracy: 89.2,
      sharpeRatio: 1.67,
      subscribers: 234,
      signalsGenerated: 1547,
      lastUpdated: '2024-01-15 14:30:00',
    },
    {
      id: '2', 
      name: 'lightgbm_multifactor_v2',
      displayName: 'AI Value Hunter',
      type: 'LightGBM',
      status: 'training',
      accuracy: 0,
      sharpeRatio: 0,
      subscribers: 156,
      signalsGenerated: 0,
      lastUpdated: '2024-01-15 09:15:00',
      trainingProgress: 67,
    },
    {
      id: '3',
      name: 'transformer_momentum_v1',
      displayName: 'AI Momentum Trader',
      type: 'Transformer',
      status: 'failed',
      accuracy: 0,
      sharpeRatio: 0,
      subscribers: 0,
      signalsGenerated: 0,
      lastUpdated: '2024-01-14 16:45:00',
    },
  ]);

  const userStats: UserStats = {
    totalUsers: 15247,
    activeUsers: 12834,
    paperTradingUsers: 8945,
    realTradingUsers: 3889,
    newUsersToday: 89,
  };

  const systemStats: SystemStats = {
    totalModels: 8,
    activeModels: 3,
    failedModels: 1,
    totalSignals: 15247,
    signalsToday: 234,
    systemHealth: 'healthy',
  };

  const handleModelAction = (modelId: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    console.log(`${action} model ${modelId}`);
    // In production, this would make API calls to control model training/execution
    setModels(prevModels =>
      prevModels.map(model => {
        if (model.id === modelId) {
          switch (action) {
            case 'start':
              return { ...model, status: 'active' as const };
            case 'pause':
              return { ...model, status: 'paused' as const };
            case 'stop':
              return { ...model, status: 'stopped' as const };
            default:
              return model;
          }
        }
        return model;
      })
    );
  };

  const handleCreateModel = () => {
    if (!newModel.name || !newModel.displayName) return;
    
    const model: ModelStats = {
      id: String(Date.now()),
      name: newModel.name,
      displayName: newModel.displayName,
      type: newModel.type,
      status: 'training',
      accuracy: 0,
      sharpeRatio: 0,
      subscribers: 0,
      signalsGenerated: 0,
      lastUpdated: new Date().toISOString(),
      trainingProgress: 0,
    };
    
    setModels(prev => [...prev, model]);
    setCreateModelOpen(false);
    setNewModel({ name: '', displayName: '', type: 'LightGBM', description: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'training': return '#2196F3'; 
      case 'paused': return '#FF9800';
      case 'stopped': return '#757575';
      case 'failed': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle sx={{ color: '#4CAF50' }} />;
      case 'training': return <Timeline sx={{ color: '#2196F3' }} />;
      case 'paused': return <Pause sx={{ color: '#FF9800' }} />;
      case 'stopped': return <Stop sx={{ color: '#757575' }} />;
      case 'failed': return <Error sx={{ color: '#F44336' }} />;
      default: return null;
    }
  };

  const renderModelManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          AI Models Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateModelOpen(true)}
          sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}
        >
          Create New Model
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Model</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Performance</strong></TableCell>
              <TableCell><strong>Users</strong></TableCell>
              <TableCell><strong>Signals</strong></TableCell>
              <TableCell><strong>Last Updated</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {model.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={model.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(model.status)}
                    <Typography variant="body2" sx={{ color: getStatusColor(model.status), fontWeight: 600 }}>
                      {model.status.toUpperCase()}
                    </Typography>
                  </Box>
                  {model.status === 'training' && model.trainingProgress && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={model.trainingProgress}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {model.trainingProgress}% complete
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {model.accuracy > 0 ? (
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {model.accuracy}% accuracy
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sharpe: {model.sharpeRatio}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not trained
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {model.subscribers.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {model.signalsGenerated.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(model.lastUpdated).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {model.status === 'paused' && (
                      <IconButton
                        size="small"
                        onClick={() => handleModelAction(model.id, 'start')}
                        sx={{ color: '#4CAF50' }}
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                    {model.status === 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handleModelAction(model.id, 'pause')}
                        sx={{ color: '#FF9800' }}
                      >
                        <Pause />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleModelAction(model.id, 'stop')}
                      sx={{ color: '#757575' }}
                    >
                      <Stop />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleModelAction(model.id, 'delete')}
                      sx={{ color: '#F44336' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSystemOverview = () => (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        System Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ color: '#2196F3', mr: 1 }} />
                <Typography variant="h6" color="#2196F3">Users</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {userStats.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userStats.newUsersToday} new today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Computer sx={{ color: '#4CAF50', mr: 1 }} />
                <Typography variant="h6" color="#4CAF50">Models</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {systemStats.activeModels}/{systemStats.totalModels}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {systemStats.failedModels} failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: '#FF9800', mr: 1 }} />
                <Typography variant="h6" color="#FF9800">Signals</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {systemStats.signalsToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today ({systemStats.totalSignals.toLocaleString()} total)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Storage sx={{ color: systemStats.systemHealth === 'healthy' ? '#4CAF50' : '#F44336', mr: 1 }} />
                <Typography variant="h6" color={systemStats.systemHealth === 'healthy' ? '#4CAF50' : '#F44336'}>
                  System
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                {systemStats.systemHealth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All services online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                User Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>Paper Trading Users</Typography>
                  <Typography fontWeight={600}>{userStats.paperTradingUsers.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>Real Money Users</Typography>
                  <Typography fontWeight={600} color="#4CAF50">{userStats.realTradingUsers.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>Active Users (7d)</Typography>
                  <Typography fontWeight={600}>{userStats.activeUsers.toLocaleString()}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" startIcon={<Refresh />} fullWidth>
                  Refresh Market Data
                </Button>
                <Button variant="outlined" startIcon={<Computer />} fullWidth>
                  Retrain All Models
                </Button>
                <Button variant="outlined" startIcon={<Storage />} fullWidth>
                  System Backup
                </Button>
                <Button variant="outlined" startIcon={<Settings />} fullWidth>
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage AI models, users, and system operations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {systemStats.systemHealth === 'warning' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>System Warning:</strong> Some models are experiencing performance issues. Check model status below.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="System Overview" />
          <Tab label="Model Management" />
          <Tab label="User Analytics" />
          <Tab label="Data Pipeline" />
        </Tabs>
      </Card>

      {activeTab === 0 && renderSystemOverview()}
      {activeTab === 1 && renderModelManagement()}
      {activeTab === 2 && (
        <Typography variant="h6">User Analytics - Coming Soon</Typography>
      )}
      {activeTab === 3 && (
        <Typography variant="h6">Data Pipeline - Coming Soon</Typography>
      )}

      {/* Create Model Dialog */}
      <Dialog open={createModelOpen} onClose={() => setCreateModelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New AI Model</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Technical Name"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              placeholder="e.g., lstm_momentum_v3"
              fullWidth
            />
            <TextField
              label="Display Name (Consumer-Friendly)"
              value={newModel.displayName}
              onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
              placeholder="e.g., AI Momentum Trader"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={newModel.type}
                onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                label="Model Type"
              >
                <MenuItem value="LSTM">LSTM</MenuItem>
                <MenuItem value="LightGBM">LightGBM</MenuItem>
                <MenuItem value="Transformer">Transformer</MenuItem>
                <MenuItem value="GATs">Graph Attention Networks</MenuItem>
                <MenuItem value="HIST">HIST</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={newModel.description}
              onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModelOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateModel} variant="contained">
            Create & Start Training
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;