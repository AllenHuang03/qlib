import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardAPI.getMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    staleTime: 10000, // Data is fresh for 10 seconds
  });
};

export const useDashboardPerformance = () => {
  return useQuery({
    queryKey: ['dashboard', 'performance'],
    queryFn: dashboardAPI.getPerformanceData,
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    staleTime: 30000, // Data is fresh for 30 seconds
  });
};