import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

const mockBacktests = [
  {
    id: '1',
    name: 'LSTM Strategy v2.1',
    model: 'LSTM-Alpha158',
    period: '2023-01 to 2024-01',
    returns: '+18.5%',
    sharpe: '1.67',
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: '2',
    name: 'Multi-Factor Analysis',
    model: 'LightGBM-Multi',
    period: '2023-06 to 2024-06',
    returns: '+22.1%',
    sharpe: '1.89',
    status: 'completed',
    date: '2024-01-12',
  },
  {
    id: '3',
    name: 'High-Freq Strategy',
    model: 'GRU-HFT',
    period: '2024-01 to 2024-06',
    returns: '+12.8%',
    sharpe: '1.43',
    status: 'running',
    date: '2024-01-10',
  },
];

export default function RecentBacktests() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Recent Backtests
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Returns</TableCell>
                <TableCell align="right">Sharpe</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockBacktests.map((backtest) => (
                <TableRow key={backtest.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {backtest.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {backtest.date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {backtest.model}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {backtest.period}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={backtest.returns.startsWith('+') ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {backtest.returns}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {backtest.sharpe}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={backtest.status}
                      size="small"
                      color={getStatusColor(backtest.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      variant="outlined"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}