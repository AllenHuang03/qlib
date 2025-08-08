import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'positive' | 'negative';
}

export default function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  const trendColor = trend === 'positive' ? 'success' : 'error';
  const TrendIcon = trend === 'positive' ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ color: 'primary.main' }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h5" component="div" fontWeight="bold" sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Chip
          icon={<TrendIcon />}
          label={change}
          size="small"
          color={trendColor}
          variant="outlined"
        />
      </CardContent>
    </Card>
  );
}