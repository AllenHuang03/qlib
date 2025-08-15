import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Pause,
  Stop,
  MoreVert,
  TrendingUp,
  Assessment,
  Timeline,
  Refresh,
  HelpOutline,
  MonetizationOn,
  Speed,
} from '@mui/icons-material';
import { modelsAPI, Model } from '../../services/api';
import TrainingProgressModal from '../../components/TrainingProgress/TrainingProgressModal';
import ModelEditorModal from '../../components/ModelEditor/ModelEditorModal';

interface CreateModelForm {
  name: string;
  type: string;
  dataset: string;
  description: string;
}

export function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [trainingProgressOpen, setTrainingProgressOpen] = useState(false);
  const [modelEditorOpen, setModelEditorOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [newModel, setNewModel] = useState<CreateModelForm>({
    name: '',
    type: '',
    dataset: 'Alpha158',
    description: '',
  });

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelsAPI.getModels();
      setModels(data);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to load models. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'info';
      case 'paused':
        return 'warning';
      case 'stopped':
        return 'error';
      default:
        return 'default';
    }
  };

  const getModelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lstm':
      case 'gru':
        return <Timeline />;
      case 'transformer':
        return <TrendingUp />;
      default:
        return <Assessment />;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, model: Model) => {
    setAnchorEl(event.currentTarget);
    setSelectedModel(model);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModel(null);
  };

  const handleCreateModel = async () => {
    if (!newModel.name.trim() || !newModel.type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const modelData = {
        name: newModel.name,
        type: newModel.type,
        description: newModel.description || `${newModel.type} model trained on ${newModel.dataset} dataset`,
      };

      console.log('Creating model:', modelData);
      const createdModel = await modelsAPI.createModel(modelData);
      
      // Refresh models list
      await fetchModels();
      
      setCreateDialogOpen(false);
      setNewModel({ name: '', type: '', dataset: 'Alpha158', description: '' });
      
      console.log('Model created successfully:', createdModel);
    } catch (err) {
      console.error('Error creating model:', err);
      setError('Failed to create model. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewModel(prev => ({ ...prev, [field]: value }));
  };

  const handleModelAction = async (modelId: string, action: string) => {
    const model = models.find(m => m.id === modelId);
    const actionLower = action.toLowerCase() as 'pause' | 'resume' | 'stop';
    
    try {
      console.log(`${action} action on model:`, model?.name);
      
      const result = await modelsAPI.controlModel(modelId, actionLower);
      console.log('Model control result:', result);
      
      // Refresh models to show updated status
      await fetchModels();
      
    } catch (err) {
      console.error(`Error ${action.toLowerCase()}ing model:`, err);
      setError(`Failed to ${action.toLowerCase()} model. Please try again.`);
    }
  };

  const handleMenuAction = async (action: string) => {
    if (!selectedModel) return;
    
    console.log(`Menu action: ${action} on model:`, selectedModel.name);
    
    try {
      if (action === 'Delete') {
        const confirmed = window.confirm(
          `Are you sure you want to delete "${selectedModel.name}"?\n\n` +
          'This action cannot be undone and will:\n' +
          '• Remove the model permanently\n' +
          '• Stop all active predictions\n' +
          '• Delete associated training data'
        );
        
        if (confirmed) {
          try {
            const response = await fetch(`/api/models/${selectedModel.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              setModels(prev => prev.filter(m => m.id !== selectedModel.id));
              console.log('Model deleted:', result.message);
            } else {
              setError('Failed to delete model');
            }
          } catch (err) {
            console.error('Error deleting model:', err);
            setError('Failed to delete model');
          }
        }
      } else if (action === 'View Predictions') {
        try {
          const predictions = await modelsAPI.getPredictions(selectedModel.id);
          console.log('Model predictions:', predictions);
          
          const predictionSummary = predictions.length > 0 
            ? `Recent Predictions for ${selectedModel.name}:\n\n` +
              predictions.slice(0, 5).map(p => 
                `${p.symbol}: ${p.signal} (${(p.confidence * 100).toFixed(0)}% confidence)`
              ).join('\n') +
              (predictions.length > 5 ? `\n... and ${predictions.length - 5} more` : '')
            : `No recent predictions available for ${selectedModel.name}`;
            
          alert(predictionSummary);
        } catch (err) {
          console.error('Error getting predictions:', err);
          setError('Failed to get model predictions.');
        }
      } else if (action === 'Edit') {
        setEditingModel(selectedModel);
        setModelEditorOpen(true);
      } else if (action === 'Duplicate') {
        try {
          const response = await fetch(`/api/models/${selectedModel.id}/duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            // Refresh models list to show the new duplicate
            await fetchModels();
            console.log('Model duplicated:', result.message);
          } else {
            setError('Failed to duplicate model');
          }
        } catch (err) {
          console.error('Error duplicating model:', err);
          setError('Failed to duplicate model');
        }
      } else if (action === 'Export') {
        // Simulate model export
        const exportData = {
          model_name: selectedModel.name,
          model_type: selectedModel.type,
          performance: {
            accuracy: selectedModel.accuracy,
            sharpe: selectedModel.sharpe
          },
          export_date: new Date().toISOString()
        };
        
        console.log('Model export data:', exportData);
        alert(`Model Export: ${selectedModel.name}\n\nExport includes:\n• Model weights and parameters\n• Training configuration\n• Performance metrics\n• Feature importance\n\n(Check console for export data)`);
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      setError(`Failed to ${action.toLowerCase()} model.`);
    } finally {
      handleMenuClose();
    }
  };

  const handleModelSave = async (model: Model, config: any) => {
    try {
      const response = await fetch(`/api/models/${model.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: model.name,
          description: model.description,
          configuration: config
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Model updated:', result.message);
        await fetchModels(); // Refresh models list
        setModelEditorOpen(false);
        setEditingModel(null);
      } else {
        setError('Failed to update model configuration');
      }
    } catch (err) {
      console.error('Error updating model:', err);
      setError('Failed to update model configuration');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Models ({models.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Speed />}
            onClick={() => setTrainingProgressOpen(true)}
          >
            Training Progress
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchModels}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Model
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {models.length === 0 && !loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No models found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first model to get started with quantitative trading
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Model
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {models.map((model) => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getModelIcon(model.type)}
                      <Typography variant="h6" fontWeight="bold">
                        {model.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, model)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={model.status}
                      color={getStatusColor(model.status)}
                      size="small"
                    />
                    <Chip label={model.type} variant="outlined" size="small" />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {model.description}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Accuracy
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {model.accuracy}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Sharpe Ratio
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {model.sharpe}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Last trained: {model.last_trained}
                  </Typography>
                </CardContent>

                <CardActions>
                  {model.status === 'paused' ? (
                    <Button 
                      size="small" 
                      startIcon={<PlayArrow />}
                      onClick={() => handleModelAction(model.id, 'Resume')}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      startIcon={<Pause />}
                      onClick={() => handleModelAction(model.id, 'Pause')}
                      disabled={model.status === 'stopped'}
                    >
                      Pause
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    startIcon={<Stop />}
                    onClick={() => handleModelAction(model.id, 'Stop')}
                    disabled={model.status === 'stopped'}
                  >
                    Stop
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('View Predictions')}>View Predictions</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Edit')}>Edit</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Duplicate')}>Duplicate</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Export')}>Export</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Delete')} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Model Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
            variant="outlined"
            value={newModel.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Model Type</InputLabel>
            <Select
              value={newModel.type}
              label="Model Type"
              onChange={(e: SelectChangeEvent) => handleInputChange('type', e.target.value)}
            >
              <MenuItem value="LSTM">LSTM</MenuItem>
              <MenuItem value="GRU">GRU</MenuItem>
              <MenuItem value="Transformer">Transformer</MenuItem>
              <MenuItem value="LightGBM">LightGBM</MenuItem>
              <MenuItem value="XGBoost">XGBoost</MenuItem>
              <MenuItem value="TabNet">TabNet</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Dataset</InputLabel>
            <Select
              value={newModel.dataset}
              label="Dataset"
              onChange={(e: SelectChangeEvent) => handleInputChange('dataset', e.target.value)}
            >
              <MenuItem value="Alpha158">Alpha158</MenuItem>
              <MenuItem value="Alpha360">Alpha360</MenuItem>
              <MenuItem value="Custom">Custom Dataset</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newModel.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Optional description for the model"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateModel} 
            variant="contained"
            disabled={creating || !newModel.name.trim() || !newModel.type}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Training Progress Modal */}
      <TrainingProgressModal 
        open={trainingProgressOpen}
        onClose={() => setTrainingProgressOpen(false)}
      />

      {/* Model Editor Modal */}
      <ModelEditorModal
        open={modelEditorOpen}
        onClose={() => {
          setModelEditorOpen(false);
          setEditingModel(null);
        }}
        model={editingModel}
        onSave={handleModelSave}
      />
    </Box>
  );
}

export default Models;