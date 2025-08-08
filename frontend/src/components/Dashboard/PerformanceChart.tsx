import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    date: string;
    portfolio: number;
    benchmark: number;
  }>;
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [
            `$${Number(value).toLocaleString()}`,
            name === 'portfolio' ? 'Portfolio' : 'Benchmark'
          ]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="portfolio"
          stroke="#1976d2"
          strokeWidth={3}
          name="Portfolio"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="benchmark"
          stroke="#dc004e"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Benchmark"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}