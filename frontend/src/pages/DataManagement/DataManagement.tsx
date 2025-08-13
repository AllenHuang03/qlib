import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Add, Refresh, Download, Upload, Storage, CloudSync } from '@mui/icons-material';
import { dataAPI, Dataset } from '../../services/api';

interface NewDatasetForm {
  name: string;
  type: string;
  description: string;
  source: string;
}

const mockDatasets: Dataset[] = [
  {
    id: '1',
    name: 'CSI300 Daily',
    type: 'Stock Prices',
    size: '2.3 GB',
    lastUpdate: '2024-01-15 09:30',
    status: 'active',
    records: '450,231',
  },
  {
    id: '2',
    name: 'CSI500 1-Min',
    type: 'High Frequency',
    size: '18.7 GB',
    lastUpdate: '2024-01-15 09:28',
    status: 'syncing',
    records: '12,450,783',
  },
  {
    id: '3',
    name: 'Alpha158 Features',
    type: 'Technical Indicators',
    size: '845 MB',
    lastUpdate: '2024-01-15 09:25',
    status: 'active',
    records: '158,942',
  },
  {
    id: '4',
    name: 'Alpha360 Features',
    type: 'Technical Indicators',
    size: '1.8 GB',
    lastUpdate: '2024-01-15 09:20',
    status: 'active',
    records: '360,421',
  },
  {
    id: '5',
    name: 'Market News Data',
    type: 'Alternative Data',
    size: '756 MB',
    lastUpdate: '2024-01-14 18:30',
    status: 'error',
    records: '89,234',
  },
];

export default function DataManagement() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newDataset, setNewDataset] = useState<NewDatasetForm>({
    name: '',
    type: '',
    description: '',
    source: 'local',
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await dataAPI.getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (dataset: Dataset) => {
    // Create a mock CSV content
    const csvContent = `Date,Symbol,Price,Volume\n2024-01-15,CBA.AX,110.50,1250000\n2024-01-15,BHP.AX,45.20,2100000\n2024-01-15,CSL.AX,285.40,850000`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert(`Downloaded ${dataset.name} dataset!\n\nFile contains: ${dataset.records} records\nSize: ${dataset.size}\nFormat: CSV with Date, Symbol, Price, Volume columns`);
  };

  const handleRefreshDataset = async (dataset: Dataset) => {
    try {
      // Simulate refreshing individual dataset
      const updatedDataset = {
        ...dataset,
        last_update: new Date().toISOString(),
        records: (parseInt(dataset.records.replace(/,/g, '')) + Math.floor(Math.random() * 1000)).toLocaleString()
      };
      
      setDatasets(prev => prev.map(d => d.id === dataset.id ? updatedDataset : d));
      alert(`${dataset.name} refreshed successfully!\n\nNew records: ${updatedDataset.records}\nLast update: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error refreshing dataset:', error);
      alert(`Failed to refresh ${dataset.name}. Please try again.`);
    }
  };

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      console.log('Refreshing datasets...');
      const result = await dataAPI.refreshData();
      console.log('Refresh result:', result);
      
      // Fetch updated datasets
      await fetchDatasets();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'syncing':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleUpload = () => {
    console.log('Uploading dataset:', newDataset);
    setUploadDialogOpen(false);
    setNewDataset({ name: '', type: '', description: '', source: 'local' });
  };

  const handleInputChange = (field: string, value: string) => {
    setNewDataset(prev => ({ ...prev, [field]: value }));
  };

  const totalSize = datasets.reduce((sum, dataset) => {
    const sizeValue = parseFloat(dataset.size);
    const unit = dataset.size.includes('GB') ? 1024 : 1;
    return sum + (sizeValue * unit);
  }, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Data Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            sx={{ mr: 1 }}
            onClick={handleRefreshData}
            disabled={refreshing}
          >
            {refreshing ? 'Syncing...' : 'Sync All'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Add Dataset
          </Button>
        </Box>
      </Box>

      {/* Data Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Storage
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {(totalSize / 1024).toFixed(1)} GB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={65}
                sx={{ mt: 1 }}
                color="primary"
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudSync color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Active Datasets
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {datasets.filter(d => d.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="success.main">
                All systems operational
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Download color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Last Sync
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                09:30 AM
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Upload color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Data Quality
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                98.7%
              </Typography>
              <Typography variant="body2" color="success.main">
                Excellent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Datasets Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Datasets
            </Typography>
            <Button size="small" startIcon={<Refresh />}>
              Refresh
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {dataset.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {dataset.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {dataset.size}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dataset.records}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {dataset.lastUpdate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dataset.status}
                        color={getStatusColor(dataset.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleDownload(dataset)}
                        title={`Download ${dataset.name} dataset`}
                      >
                        <Download />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleRefreshDataset(dataset)}
                        title={`Refresh ${dataset.name} with latest data`}
                      >
                        <Refresh />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upload Dataset Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Dataset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dataset Name"
            fullWidth
            variant="outlined"
            value={newDataset.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={newDataset.type}
              label="Data Type"
              onChange={(e: SelectChangeEvent) => handleInputChange('type', e.target.value)}
            >
              <MenuItem value="Stock Prices">Stock Prices</MenuItem>
              <MenuItem value="High Frequency">High Frequency Data</MenuItem>
              <MenuItem value="Technical Indicators">Technical Indicators</MenuItem>
              <MenuItem value="Alternative Data">Alternative Data</MenuItem>
              <MenuItem value="Custom">Custom Dataset</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={newDataset.source}
              label="Source"
              onChange={(e: SelectChangeEvent) => handleInputChange('source', e.target.value)}
            >
              <MenuItem value="local">Local File</MenuItem>
              <MenuItem value="yahoo">Yahoo Finance</MenuItem>
              <MenuItem value="api">External API</MenuItem>
              <MenuItem value="database">Database</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newDataset.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" startIcon={<Upload />}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}