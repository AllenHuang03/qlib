import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { healthAPI } from '../../services/api';

interface ConnectionStatusProps {
  onPortUpdate?: (port: string) => void;
}

export default function ConnectionStatus({ onPortUpdate }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const info = await healthAPI.check();
      setBackendInfo(info);
      setStatus('connected');
      setLastCheck(new Date());
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
      setBackendInfo(null);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8001';
  };

  const testPorts = async () => {
    const ports = [8001, 8002, 8003, 8004, 8005];
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/api/health`);
        if (response.ok) {
          const data = await response.json();
          console.log(`Backend found on port ${port}:`, data);
          onPortUpdate?.(port.toString());
          return;
        }
      } catch (error) {
        // Port not available, continue
      }
    }
    console.log('Backend not found on any common port');
  };

  return (
    <Box sx={{ mb: 2 }}>
      {status === 'checking' && (
        <Alert severity="info">
          Checking backend connection...
        </Alert>
      )}
      
      {status === 'connected' && (
        <Alert severity="success">
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Backend Connected ✓
            </Typography>
            <Typography variant="caption" display="block">
              API URL: {getApiUrl()}
            </Typography>
            <Typography variant="caption" display="block">
              Status: {backendInfo?.status} | Qlib: {backendInfo?.qlib_available ? 'Available' : 'Demo Mode'}
            </Typography>
            <Typography variant="caption" display="block">
              Last check: {lastCheck.toLocaleTimeString()}
            </Typography>
          </Box>
        </Alert>
      )}
      
      {status === 'disconnected' && (
        <Alert severity="error">
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Backend Disconnected ✗
            </Typography>
            <Typography variant="caption" display="block">
              API URL: {getApiUrl()}
            </Typography>
            <Typography variant="caption" display="block">
              Last attempt: {lastCheck.toLocaleTimeString()}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button size="small" onClick={checkConnection} variant="outlined">
                Retry
              </Button>
              <Button size="small" onClick={testPorts} variant="outlined">
                Scan Ports
              </Button>
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Make sure backend is running: cd backend && python app.py
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
}