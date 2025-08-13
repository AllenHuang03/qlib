import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Save,
  RestartAlt,
  Tune,
  DataUsage,
  Memory,
  Speed,
  TrendingUp,
  Info,
  Warning,
  Close
} from '@mui/icons-material';
import { Model } from '../../services/api';

interface ModelEditorProps {
  open: boolean;
  onClose: () => void;
  model: Model | null;
  onSave: (model: Model, config: ModelConfiguration) => void;
}

interface ModelConfiguration {
  // Architecture parameters
  layers: {
    hidden_size: number;
    num_layers: number;
    dropout: number;
  };
  
  // Training parameters
  training: {
    learning_rate: number;
    batch_size: number;
    epochs: number;
    early_stopping: boolean;
    patience: number;
    optimizer: 'adam' | 'sgd' | 'rmsprop';
  };
  
  // Data parameters
  data: {
    lookback_window: number;
    features: string[];
    target: string;
    validation_split: number;
  };
  
  // Advanced settings
  advanced: {
    use_gpu: boolean;
    mixed_precision: boolean;
    gradient_clipping: boolean;
    max_grad_norm: number;
    weight_decay: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function ModelEditorModal({ open, onClose, model, onSave }: ModelEditorProps) {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<ModelConfiguration>({
    layers: {
      hidden_size: 128,
      num_layers: 2,
      dropout: 0.1
    },
    training: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 100,
      early_stopping: true,
      patience: 10,
      optimizer: 'adam'
    },
    data: {
      lookback_window: 20,
      features: ['close', 'volume', 'high', 'low', 'open'],
      target: 'close_next',
      validation_split: 0.2
    },
    advanced: {
      use_gpu: true,
      mixed_precision: false,
      gradient_clipping: true,
      max_grad_norm: 1.0,
      weight_decay: 0.0001
    }
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (model) {
      // Load model-specific configuration
      // In a real app, this would come from the backend
      setConfig(prev => ({
        ...prev,
        // Customize based on model type
        layers: {
          ...prev.layers,
          hidden_size: model.type === 'LSTM' ? 128 : model.type === 'Transformer' ? 256 : 64,
          num_layers: model.type === 'Transformer' ? 6 : 2
        }
      }));
    }
  }, [model]);

  const handleConfigChange = (section: keyof ModelConfiguration, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleFeatureToggle = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      data: {
        ...prev.data,
        features: prev.data.features.includes(feature)
          ? prev.data.features.filter(f => f !== feature)
          : [...prev.data.features, feature]
      }
    }));
    setHasChanges(true);
  };

  const validateConfiguration = (): string[] => {
    const errors: string[] = [];
    
    if (config.layers.hidden_size < 16 || config.layers.hidden_size > 1024) {
      errors.push('Hidden size must be between 16 and 1024');
    }
    
    if (config.layers.num_layers < 1 || config.layers.num_layers > 10) {
      errors.push('Number of layers must be between 1 and 10');
    }
    
    if (config.training.learning_rate <= 0 || config.training.learning_rate > 1) {
      errors.push('Learning rate must be between 0 and 1');
    }
    
    if (config.training.batch_size < 1 || config.training.batch_size > 1024) {
      errors.push('Batch size must be between 1 and 1024');
    }
    
    if (config.data.features.length === 0) {
      errors.push('At least one feature must be selected');
    }
    
    return errors;
  };

  const handleSave = () => {
    const validationErrors = validateConfiguration();
    setErrors(validationErrors);
    
    if (validationErrors.length === 0 && model) {
      onSave(model, config);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    // Reset to default configuration
    setConfig({
      layers: {
        hidden_size: 128,
        num_layers: 2,
        dropout: 0.1
      },
      training: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100,
        early_stopping: true,
        patience: 10,
        optimizer: 'adam'
      },
      data: {
        lookback_window: 20,
        features: ['close', 'volume', 'high', 'low', 'open'],
        target: 'close_next',
        validation_split: 0.2
      },
      advanced: {
        use_gpu: true,
        mixed_precision: false,
        gradient_clipping: true,
        max_grad_norm: 1.0,
        weight_decay: 0.0001
      }
    });
    setHasChanges(false);
    setErrors([]);
  };

  const availableFeatures = [
    'open', 'high', 'low', 'close', 'volume',
    'sma_5', 'sma_20', 'ema_12', 'ema_26',
    'rsi', 'macd', 'bollinger_upper', 'bollinger_lower',
    'atr', 'adx', 'stochastic', 'williams_r'
  ];

  if (!model) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🔧 Model Editor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {model.name} ({model.type})
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {hasChanges && (
              <Chip 
                size="small"
                label="Unsaved Changes"
                color="warning"
                variant="outlined"
              />
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Configuration Errors:</Typography>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab icon={<Memory />} label="Architecture" />
          <Tab icon={<Speed />} label="Training" />
          <Tab icon={<DataUsage />} label="Data" />
          <Tab icon={<Tune />} label="Advanced" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Model Architecture
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Layer Configuration
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Hidden Size: {config.layers.hidden_size}
                    </Typography>
                    <Slider
                      value={config.layers.hidden_size}
                      onChange={(_, value) => handleConfigChange('layers', 'hidden_size', value)}
                      min={16}
                      max={512}
                      step={16}
                      marks={[
                        { value: 32, label: '32' },
                        { value: 128, label: '128' },
                        { value: 256, label: '256' },
                        { value: 512, label: '512' }
                      ]}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Number of Layers: {config.layers.num_layers}
                    </Typography>
                    <Slider
                      value={config.layers.num_layers}
                      onChange={(_, value) => handleConfigChange('layers', 'num_layers', value)}
                      min={1}
                      max={8}
                      step={1}
                      marks
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Dropout Rate: {config.layers.dropout.toFixed(2)}
                    </Typography>
                    <Slider
                      value={config.layers.dropout}
                      onChange={(_, value) => handleConfigChange('layers', 'dropout', value)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 0.1, label: '0.1' },
                        { value: 0.3, label: '0.3' },
                        { value: 0.5, label: '0.5' }
                      ]}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Model Information
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Model Type: {model.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Status: {model.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accuracy: {model.accuracy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio: {model.sharpe}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary">
                    Estimated Parameters: ~{((config.layers.hidden_size * config.layers.hidden_size * config.layers.num_layers) / 1000).toFixed(1)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Memory Usage: ~{(config.layers.hidden_size * config.training.batch_size * 4 / 1024 / 1024).toFixed(1)}MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Training Parameters
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Learning Rate"
                type="number"
                value={config.training.learning_rate}
                onChange={(e) => handleConfigChange('training', 'learning_rate', parseFloat(e.target.value))}
                inputProps={{ step: 0.0001, min: 0.0001, max: 1 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Batch Size"
                type="number"
                value={config.training.batch_size}
                onChange={(e) => handleConfigChange('training', 'batch_size', parseInt(e.target.value))}
                inputProps={{ step: 1, min: 1, max: 1024 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Epochs"
                type="number"
                value={config.training.epochs}
                onChange={(e) => handleConfigChange('training', 'epochs', parseInt(e.target.value))}
                inputProps={{ step: 1, min: 1, max: 1000 }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Optimizer</InputLabel>
                <Select
                  value={config.training.optimizer}
                  label="Optimizer"
                  onChange={(e) => handleConfigChange('training', 'optimizer', e.target.value)}
                >
                  <MenuItem value="adam">Adam</MenuItem>
                  <MenuItem value="sgd">SGD</MenuItem>
                  <MenuItem value="rmsprop">RMSprop</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.training.early_stopping}
                    onChange={(e) => handleConfigChange('training', 'early_stopping', e.target.checked)}
                  />
                }
                label="Early Stopping"
                sx={{ mb: 2, display: 'block' }}
              />

              {config.training.early_stopping && (
                <TextField
                  fullWidth
                  label="Patience (epochs)"
                  type="number"
                  value={config.training.patience}
                  onChange={(e) => handleConfigChange('training', 'patience', parseInt(e.target.value))}
                  inputProps={{ step: 1, min: 1, max: 100 }}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Data Configuration
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lookback Window"
                type="number"
                value={config.data.lookback_window}
                onChange={(e) => handleConfigChange('data', 'lookback_window', parseInt(e.target.value))}
                inputProps={{ step: 1, min: 1, max: 100 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Target Variable"
                value={config.data.target}
                onChange={(e) => handleConfigChange('data', 'target', e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Validation Split: {(config.data.validation_split * 100).toFixed(0)}%
                </Typography>
                <Slider
                  value={config.data.validation_split}
                  onChange={(_, value) => handleConfigChange('data', 'validation_split', value)}
                  min={0.1}
                  max={0.4}
                  step={0.05}
                  marks={[
                    { value: 0.1, label: '10%' },
                    { value: 0.2, label: '20%' },
                    { value: 0.3, label: '30%' }
                  ]}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Features ({config.data.features.length} selected)
              </Typography>
              
              <Card sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {availableFeatures.map((feature) => (
                    <ListItem key={feature}>
                      <ListItemText 
                        primary={feature}
                        secondary={feature.includes('_') ? 'Technical Indicator' : 'Price Data'}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={config.data.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Performance Optimization</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.advanced.use_gpu}
                            onChange={(e) => handleConfigChange('advanced', 'use_gpu', e.target.checked)}
                          />
                        }
                        label="Use GPU"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.advanced.mixed_precision}
                            onChange={(e) => handleConfigChange('advanced', 'mixed_precision', e.target.checked)}
                          />
                        }
                        label="Mixed Precision"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Regularization</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.advanced.gradient_clipping}
                            onChange={(e) => handleConfigChange('advanced', 'gradient_clipping', e.target.checked)}
                          />
                        }
                        label="Gradient Clipping"
                      />
                      
                      {config.advanced.gradient_clipping && (
                        <TextField
                          fullWidth
                          label="Max Gradient Norm"
                          type="number"
                          value={config.advanced.max_grad_norm}
                          onChange={(e) => handleConfigChange('advanced', 'max_grad_norm', parseFloat(e.target.value))}
                          inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Weight Decay"
                        type="number"
                        value={config.advanced.weight_decay}
                        onChange={(e) => handleConfigChange('advanced', 'weight_decay', parseFloat(e.target.value))}
                        inputProps={{ step: 0.0001, min: 0, max: 1 }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<RestartAlt />}
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={errors.length > 0}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModelEditorModal;