import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Timeline,
  Speed,
  TrendingUp,
  School,
  Pause,
  PlayArrow,
  Stop,
  Close
} from '@mui/icons-material';
import { trainingWebSocket } from '../../services/websocketService';

interface TrainingProgress {
  model_id: string;
  model_name: string;
  progress: number;
  status: 'training' | 'paused' | 'completed' | 'stopped';
  metrics: {
    loss: number;
    accuracy: number;
    epoch: number;
    total_epochs: number;
    learning_rate?: number;
  };
  timestamp: string;
}

interface TrainingProgressModalProps {
  open: boolean;
  onClose: () => void;
}

export function TrainingProgressModal({ open, onClose }: TrainingProgressModalProps) {
  const [trainings, setTrainings] = useState<Map<string, TrainingProgress>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!open) return;

    const unsubscribe = trainingWebSocket.subscribe((message) => {
      console.log('Training WebSocket message:', message);
      
      switch (message.type) {
        case 'training_progress':
          setTrainings(prev => new Map(prev.set(message.model_id, {
            model_id: message.model_id,
            model_name: message.model_name,
            progress: message.progress,
            status: message.status,
            metrics: message.metrics,
            timestamp: message.timestamp
          })));
          break;
          
        case 'training_complete':
          setTrainings(prev => {
            const updated = new Map(prev);
            if (updated.has(message.model_id)) {
              updated.set(message.model_id, {
                ...updated.get(message.model_id)!,
                progress: 100,
                status: 'completed',
                timestamp: message.timestamp
              });
            }
            return updated;
          });
          break;
          
        case 'training_stopped':
        case 'training_paused':
        case 'training_resumed':
          setTrainings(prev => {
            const updated = new Map(prev);
            if (updated.has(message.model_id)) {
              updated.set(message.model_id, {
                ...updated.get(message.model_id)!,
                status: message.status,
                timestamp: message.timestamp
              });
            }
            return updated;
          });
          break;
      }
      
      setConnected(trainingWebSocket.isConnected());
    });

    // Check initial connection status
    setConnected(trainingWebSocket.isConnected());

    return () => {
      unsubscribe();
    };
  }, [open]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'training': return 'info';
      case 'completed': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'training': return <School />;
      case 'completed': return <TrendingUp />;
      case 'paused': return <Pause />;
      case 'stopped': return <Stop />;
      default: return <Timeline />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const activeTrainings = Array.from(trainings.values()).filter(t => t.status === 'training');
  const completedTrainings = Array.from(trainings.values()).filter(t => t.status === 'completed');
  const allTrainings = Array.from(trainings.values()).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            🤖 Real-time Training Progress
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip 
              size="small"
              label={connected ? "Connected" : "Disconnected"}
              color={connected ? "success" : "error"}
              variant="outlined"
            />
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <School color="info" />
                    <Typography variant="h4" fontWeight="bold">
                      {activeTrainings.length}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Training
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="success" />
                    <Typography variant="h4" fontWeight="bold">
                      {completedTrainings.length}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Timeline color="primary" />
                    <Typography variant="h4" fontWeight="bold">
                      {trainings.size}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Models
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {allTrainings.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Timeline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No training sessions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new model to start training and see real-time progress here
            </Typography>
          </Box>
        ) : (
          <List>
            {allTrainings.map((training) => (
              <Box key={training.model_id}>
                <ListItem sx={{ px: 0 }}>
                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {getStatusIcon(training.status)}
                            <Typography variant="h6" fontWeight="bold">
                              {training.model_name}
                            </Typography>
                            <Chip 
                              size="small"
                              label={training.status.toUpperCase()}
                              color={getStatusColor(training.status)}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Model ID: {training.model_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last update: {formatTime(training.timestamp)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">
                            Progress: {training.progress}%
                          </Typography>
                          <Typography variant="body2">
                            Epoch {training.metrics.epoch}/{training.metrics.total_epochs}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={training.progress}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="error">
                              {training.metrics.loss.toFixed(4)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Loss
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="success.main">
                              {training.metrics.accuracy.toFixed(2)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Accuracy
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {training.metrics.epoch}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Epoch
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {training.metrics.learning_rate?.toExponential(2) || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Learning Rate
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </ListItem>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TrainingProgressModal;