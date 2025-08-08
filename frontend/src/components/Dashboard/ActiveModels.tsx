import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import { PlayArrow, Pause, MoreVert } from '@mui/icons-material';

const mockModels = [
  {
    id: '1',
    name: 'LSTM-Alpha158',
    status: 'active',
    accuracy: '89.2%',
    sharpe: '1.67',
  },
  {
    id: '2',
    name: 'LightGBM-CSI300',
    status: 'active',
    accuracy: '85.7%',
    sharpe: '1.43',
  },
  {
    id: '3',
    name: 'Transformer-Multi',
    status: 'training',
    accuracy: '92.1%',
    sharpe: '1.89',
  },
  {
    id: '4',
    name: 'GRU-HFT',
    status: 'paused',
    accuracy: '87.4%',
    sharpe: '1.52',
  },
];

export default function ActiveModels() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'info';
      case 'paused':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'paused' ? <PlayArrow /> : <Pause />;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Active Models
        </Typography>
        <List dense>
          {mockModels.map((model) => (
            <ListItem
              key={model.id}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small">
                    {getStatusIcon(model.status)}
                  </IconButton>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
              }
              sx={{ px: 0 }}
            >
              <ListItemText
                primary={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Typography variant="subtitle2" fontWeight="medium" component="span">
                      {model.name}
                    </Typography>
                    <Chip
                      label={model.status}
                      size="small"
                      color={getStatusColor(model.status)}
                      variant="outlined"
                    />
                  </div>
                }
                secondary={
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <Typography variant="caption" color="text.secondary" component="span">
                      Acc: {model.accuracy}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="span">
                      Sharpe: {model.sharpe}
                    </Typography>
                  </div>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}