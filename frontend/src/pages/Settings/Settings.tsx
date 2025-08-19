import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { TestingScenarioRunner } from '../../components/TestingScenarios';
import { useAuthStore } from '../../store/authStore';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const { isTestAccount } = useAuthStore();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Platform Settings" />
          {isTestAccount && <Tab label="Testing Scenarios" />}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                General Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Organization Name"
                defaultValue="Qlib Pro Organization"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Default Currency"
                defaultValue="USD"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable real-time notifications"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Auto-save configurations"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch />}
                label="Dark mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Data Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Data Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Data Update Frequency"
                defaultValue="5 minutes"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Data Retention Period"
                defaultValue="5 years"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Auto data synchronization"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Data quality checks"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch />}
                label="Compress historical data"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Trading Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Trading Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Default Position Size"
                defaultValue="10000"
                type="number"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Risk Limit (%)"
                defaultValue="2"
                type="number"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable stop-loss orders"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable take-profit orders"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch />}
                label="Paper trading mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Security Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                defaultValue="60"
                type="number"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Two-factor authentication"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="API access logging"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch />}
                label="Allow external API access"
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Button variant="outlined" color="error" fullWidth>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Performance Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Models"
                    defaultValue="5"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Memory Limit (GB)"
                    defaultValue="16"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="CPU Cores"
                    defaultValue="8"
                    type="number"
                  />
                </Grid>
              </Grid>
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable GPU acceleration"
                sx={{ mt: 2, mb: 1 }}
              />
              
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Optimize for speed over accuracy"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              System Information
            </Typography>
            <Typography variant="body2">
              Qlib Frontend v1.0.0 • Backend API v2.1.3 • Last updated: January 15, 2024
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined">
              Reset to Defaults
            </Button>
            <Button variant="contained">
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
      </TabPanel>

      {isTestAccount && (
        <TabPanel value={tabValue} index={1}>
          <TestingScenarioRunner />
        </TabPanel>
      )}
    </Box>
  );
}