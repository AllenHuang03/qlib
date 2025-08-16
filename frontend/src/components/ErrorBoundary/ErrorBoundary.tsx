import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: errorReportingService.logError(error, errorInfo);
  }

  handleReload = () => {
    // Clear error state and reload the component
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handlePageReload = () => {
    // Reload the entire page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BugReport color="error" sx={{ mr: 1 }} />
                <Typography variant="h5" color="error">
                  Something went wrong
                </Typography>
              </Box>
              
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  An unexpected error occurred. This has been logged and our team has been notified.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please try refreshing the component or reloading the page.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={this.handlePageReload}
                >
                  Reload Page
                </Button>
              </Box>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Error Details (Development Only):
                  </Typography>
                  <Box 
                    sx={{ 
                      backgroundColor: 'grey.100', 
                      p: 2, 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    <Typography variant="body2" component="pre">
                      {this.state.error.toString()}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;