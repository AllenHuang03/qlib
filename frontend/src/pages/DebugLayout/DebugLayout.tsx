import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DebugLayout: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Layout Debug Test
      </Typography>
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: 'primary.light',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6">
          This box should be centered with max-width 1200px
        </Typography>
        <Typography variant="body1">
          If you see equal margins on left and right (on screens wider than 1200px), 
          the centering is working correctly.
        </Typography>
      </Paper>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Paper sx={{ flex: 1, p: 2, backgroundColor: 'success.light' }}>
          <Typography variant="h6" color="white">Left Content</Typography>
          <Typography variant="body2" color="white">
            This should be on the left side of the centered container
          </Typography>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 2, backgroundColor: 'warning.light' }}>
          <Typography variant="h6" color="white">Center Content</Typography>
          <Typography variant="body2" color="white">
            This should be in the center
          </Typography>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 2, backgroundColor: 'error.light' }}>
          <Typography variant="h6" color="white">Right Content</Typography>
          <Typography variant="body2" color="white">
            This should be on the right side of the centered container
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Layout Analysis:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Container Max Width:</strong> Should be 1200px<br/>
          • <strong>Centering Method:</strong> Flexbox with justifyContent: center<br/>
          • <strong>Expected Behavior:</strong> Content centered with equal margins on wide screens<br/>
          • <strong>Current URL:</strong> {window.location.href}<br/>
          • <strong>Screen Width:</strong> {window.innerWidth}px<br/>
          • <strong>Test:</strong> Resize browser to see if content stays centered
        </Typography>
      </Box>
    </Box>
  );
};

export default DebugLayout;