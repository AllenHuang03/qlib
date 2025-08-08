import axios, { AxiosResponse } from 'axios';

// Use environment variable or fallback to mock mode
const API_BASE_URL = import.meta.env.VITE_API_URL;
const USE_MOCK_MODE = !API_BASE_URL || API_BASE_URL.includes('your-backend.railway.app');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors - ENABLED for real backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Backend server is not running. Please start the backend server.');
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Model {
  id: string;
  name: string;
  type: string;
  status: 'training' | 'active' | 'paused' | 'stopped';
  accuracy: string;
  sharpe: string;
  last_trained: string;
  description: string;
  created_at: string;
}

export interface Backtest {
  id: string;
  name: string;
  model_id: string;
  start_date: string;
  end_date: string;
  returns: number;
  sharpe: number;
  max_drawdown: number;
  volatility: number;
  win_rate: number;
  status: 'completed' | 'running' | 'failed';
  created_at: string;
}

export interface PerformanceData {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface DashboardMetrics {
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  portfolio_value: number;
  active_models: number;
  total_models: number;
  last_update: string;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  pnl: number;
  pnl_percent: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_pnl: number;
  pnl_percent: number;
  num_holdings: number;
  cash: number;
  last_update: string;
}

export interface Dataset {
  id: string;
  name: string;
  type: string;
  size: string;
  last_update: string;
  status: 'active' | 'syncing' | 'error';
  records: string;
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/auth/profile');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response: AxiosResponse<DashboardMetrics> = await api.get('/dashboard/metrics');
    return response.data;
  },

  getPerformanceData: async (): Promise<PerformanceData[]> => {
    const response: AxiosResponse<PerformanceData[]> = await api.get('/dashboard/performance');
    return response.data;
  },
};

// Mock data for fallback
const MOCK_MODELS: Model[] = [
  {
    id: '1',
    name: 'LSTM-Alpha158-v2.1',
    type: 'LSTM',
    status: 'active',
    accuracy: '89.2%',
    sharpe: '1.67',
    last_trained: '2024-01-15',
    description: 'Long Short-Term Memory model trained on Alpha158 features',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'LightGBM-Multi-Factor',
    type: 'LightGBM', 
    status: 'active',
    accuracy: '85.7%',
    sharpe: '1.43',
    last_trained: '2024-01-12',
    description: 'Gradient boosting model with multi-factor alpha features',
    created_at: '2024-01-02T14:30:00Z'
  }
];

// Models API
export const modelsAPI = {
  getModels: async (): Promise<Model[]> => {
    if (USE_MOCK_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_MODELS;
    }
    const response: AxiosResponse<Model[]> = await api.get('/models');
    return response.data;
  },

  createModel: async (modelData: {
    name: string;
    type: string;
    description: string;
  }): Promise<Model> => {
    if (USE_MOCK_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newModel: Model = {
        id: String(Date.now()),
        name: modelData.name,
        type: modelData.type,
        status: 'training',
        accuracy: '0%',
        sharpe: '0.0',
        last_trained: new Date().toISOString().split('T')[0],
        description: modelData.description,
        created_at: new Date().toISOString()
      };
      MOCK_MODELS.push(newModel);
      return newModel;
    }
    const response: AxiosResponse<Model> = await api.post('/models', modelData);
    return response.data;
  },

  getModel: async (id: string): Promise<Model> => {
    const response: AxiosResponse<Model> = await api.get(`/models/${id}`);
    return response.data;
  },

  controlModel: async (id: string, action: 'pause' | 'resume' | 'stop'): Promise<{
    message: string;
    status: string;
  }> => {
    if (USE_MOCK_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const model = MOCK_MODELS.find(m => m.id === id);
      if (model) {
        if (action === 'pause') model.status = 'paused';
        else if (action === 'resume') model.status = 'active';
        else if (action === 'stop') model.status = 'stopped';
      }
      return {
        message: `Model ${action}ed successfully`,
        status: model?.status || 'unknown'
      };
    }
    const response = await api.post(`/models/${id}/control`, { action });
    return response.data;
  },

  getPredictions: async (id: string, startDate?: string, endDate?: string): Promise<{
    date: string;
    symbol: string;
    prediction: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
  }[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/models/${id}/predictions?${params}`);
    return response.data;
  },
};

// Backtests API
export const backtestsAPI = {
  getBacktests: async (): Promise<Backtest[]> => {
    const response: AxiosResponse<Backtest[]> = await api.get('/backtests');
    return response.data;
  },

  createBacktest: async (backtestData: {
    name: string;
    model_id: string;
    start_date: string;
    end_date: string;
    benchmark: string;
    initial_capital: string;
  }): Promise<Backtest> => {
    const response: AxiosResponse<Backtest> = await api.post('/backtests', backtestData);
    return response.data;
  },

  getBacktest: async (id: string): Promise<Backtest> => {
    const response: AxiosResponse<Backtest> = await api.get(`/backtests/${id}`);
    return response.data;
  },
};

// Portfolio API
export const portfolioAPI = {
  getHoldings: async (): Promise<Holding[]> => {
    const response: AxiosResponse<Holding[]> = await api.get('/portfolio/holdings');
    return response.data;
  },

  getSummary: async (): Promise<PortfolioSummary> => {
    const response: AxiosResponse<PortfolioSummary> = await api.get('/portfolio/summary');
    return response.data;
  },
};

// Data API
export const dataAPI = {
  getDatasets: async (): Promise<Dataset[]> => {
    const response: AxiosResponse<Dataset[]> = await api.get('/data/datasets');
    return response.data;
  },

  refreshData: async (): Promise<{
    message: string;
    status: string;
  }> => {
    const response = await api.post('/data/refresh');
    return response.data;
  },
};

// Qlib-specific API
export const qlibAPI = {
  getData: async (): Promise<any[]> => {
    const response: AxiosResponse<any[]> = await api.get('/qlib/data');
    return response.data;
  },

  trainModel: async (modelData: {
    name: string;
    type: string;
  }): Promise<Model> => {
    const response: AxiosResponse<Model> = await api.post('/qlib/train', modelData);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<{
    status: string;
    qlib_available: boolean;
    timestamp: string;
  }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;