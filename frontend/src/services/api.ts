import axios, { AxiosResponse } from 'axios';

// Use environment variable or fallback to mock mode
const API_BASE_URL = import.meta.env.VITE_API_URL;
const USE_MOCK_MODE = !API_BASE_URL;

// Debug logging for troubleshooting
console.log('🔍 API Configuration Debug:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  USE_MOCK_MODE,
  NODE_ENV: import.meta.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Create axios instance  
const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : 'http://localhost:8001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token && token !== 'null' && token.trim() !== '') {
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
  (response) => {
    // Ensure response data exists and is valid
    if (!response.data) {
      console.warn('API response missing data:', response);
      response.data = {};
    }
    
    // Handle common API response patterns and prevent null errors
    if (response.data) {
      // Ensure arrays exist for list endpoints - with comprehensive null safety
      const url = response.config?.url;
      if (url && typeof url === 'string' && url.length > 0) {
        try {
          if (url.includes('/quotes') && !response.data.quotes) {
            response.data.quotes = [];
          }
          if (url.includes('/datasets') && !response.data.datasets) {
            response.data.datasets = [];
          }
          if (url.includes('/signals') && !response.data.signals) {
            response.data.signals = [];
          }
          if (url.includes('/trading/agents') && !response.data.agents) {
            response.data.agents = [];
          }
          if (url.includes('/trading/activity') && !response.data.activity) {
            response.data.activity = [];
          }
        } catch (error) {
          console.warn('Error processing response data structure:', error);
        }
      }
      
      // Ensure strings are never null - with comprehensive null safety
      if (response.data && typeof response.data === 'object' && response.data !== null) {
        try {
          Object.keys(response.data).forEach(key => {
            if (response.data[key] === null || response.data[key] === undefined) {
              response.data[key] = '';
            }
          });
        } catch (error) {
          console.warn('Error sanitizing response data:', error);
        }
      }
    }
    
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on login/register pages
      const currentPath = window.location?.pathname || '';
      if (currentPath && typeof currentPath === 'string' && currentPath.length > 0) {
        try {
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            localStorage.removeItem('auth-token');
            console.log('🔐 Auth token expired, redirecting to login');
            window.location.href = '/login';
          }
        } catch (pathError) {
          console.warn('Error checking current path:', pathError);
        }
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Backend server connection failed');
    }
    console.error('API Error:', error);
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

  register: async (email: string, password: string, name: string): Promise<{
    message: string;
    user?: any;
    requires_verification?: boolean;
  }> => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
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
    const response: AxiosResponse<any> = await api.post('/models', modelData);
    // Backend returns {message, model, status, estimated_completion}
    // Extract the model object from the response
    return response.data.model || response.data;
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

  rebalance: async (): Promise<{
    status: string;
    message: string;
    changes: Array<{
      action: string;
      symbol: string;
      quantity: number;
      reason: string;
    }>;
    estimated_benefit: string;
  }> => {
    const response = await api.post('/portfolio/rebalance');
    return response.data;
  },
};

// Data API
export const dataAPI = {
  getDatasets: async (): Promise<Dataset[]> => {
    try {
      const response = await api.get('/data/datasets');
      const data = response.data;
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        return data;
      } else if (data && data.datasets && Array.isArray(data.datasets)) {
        return data.datasets;
      } else {
        console.warn('Unexpected datasets response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      // Return fallback ASX datasets
      return [
        {
          id: "asx-daily",
          name: "ASX Daily Prices",
          type: "Stock Prices",
          size: "2.1 GB",
          last_update: "2025-08-12T10:00:00Z",
          status: "active" as const,
          records: "1,247,583"
        },
        {
          id: "asx-fundamental", 
          name: "ASX Fundamental Data",
          type: "Company Financials",
          size: "892 MB",
          last_update: "2025-08-11T18:00:00Z",
          status: "active" as const,
          records: "45,891"
        }
      ];
    }
  },

  refreshData: async (): Promise<{
    message: string;
    status: string;
  }> => {
    try {
      const response = await api.post('/data/refresh');
      return response.data || { message: "Refresh initiated", status: "processing" };
    } catch (error) {
      console.error('Error refreshing data:', error);
      return { 
        message: "Refresh failed - using cached data", 
        status: "error" 
      };
    }
  },

  downloadDataset: async (datasetId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/data/datasets/${datasetId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading dataset:', error);
      throw error;
    }
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

// Market Data API
export const marketAPI = {
  getQuote: async (symbol: string) => {
    const response = await api.get(`/market/quote/${symbol}`);
    return response.data;
  },

  getQuotes: async (symbols: string = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,TLS.AX") => {
    try {
      const response = await api.get(`/market/quotes?symbols=${symbols}`);
      return response.data || { quotes: [], total: 0, market: "ASX" };
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Return fallback ASX data
      return {
        quotes: [
          { symbol: "CBA.AX", price: 110.50, change: 0, change_percent: "0.00", company_name: "Commonwealth Bank" },
          { symbol: "BHP.AX", price: 45.20, change: 0, change_percent: "0.00", company_name: "BHP Group" },
          { symbol: "CSL.AX", price: 285.40, change: 0, change_percent: "0.00", company_name: "CSL Limited" }
        ],
        total: 3,
        market: "ASX",
        status: "fallback"
      };
    }
  },

  getHistoricalData: async (symbol: string, days: number = 30) => {
    const response = await api.get(`/market/historical/${symbol}?days=${days}`);
    return response.data;
  },

  getMarketNews: async (query: string = "ASX Australian stock market", limit: number = 10) => {
    const response = await api.get(`/market/news?query=${query}&limit=${limit}`);
    return response.data;
  },

  // 🇦🇺 Australian Market Endpoints (Sprint 1)
  getMarketStatus: async () => {
    const response = await api.get('/market/status');
    return response.data;
  },

  getCurrencyRates: async () => {
    const response = await api.get('/market/currency');
    return response.data;
  },

  convertCurrency: async (amount: number, from: string = "USD", to: string = "AUD") => {
    const response = await api.get(`/market/convert?amount=${amount}&from_currency=${from}&to_currency=${to}`);
    return response.data;
  },

  getASXIndices: async () => {
    const response = await api.get('/market/indices');
    return response.data;
  },

  getASXSectors: async () => {
    const response = await api.get('/market/asx-sectors');
    return response.data;
  }
};

// AI Trading API
export const aiAPI = {
  getSignals: async (symbols: string = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,RIO.AX") => {
    try {
      const response = await api.get(`/ai/signals?symbols=${symbols}`);
      return response.data || { signals: [], total: 0 };
    } catch (error) {
      console.error('Error fetching AI signals:', error);
      // Return fallback ASX signals
      return {
        signals: [
          { symbol: "CBA.AX", signal: "HOLD", confidence: 0.75, target_price: 115.00 },
          { symbol: "BHP.AX", signal: "BUY", confidence: 0.82, target_price: 48.00 },
          { symbol: "CSL.AX", signal: "HOLD", confidence: 0.68, target_price: 290.00 }
        ],
        total: 3,
        status: "fallback"
      };
    }
  },

  getAnalysis: async (symbol: string) => {
    const response = await api.get(`/ai/analysis/${symbol}`);
    return response.data;
  }
};

// Trading Environment API
export const tradingAPI = {
  getAgents: async () => {
    try {
      const response = await api.get('/trading/agents');
      return response.data || { agents: [], total: 0 };
    } catch (error) {
      console.error('Error fetching trading agents:', error);
      return { agents: [], total: 0 };
    }
  },

  controlAgent: async (agentId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      const response = await api.post(`/trading/agents/${agentId}/control`, { action });
      return response.data;
    } catch (error) {
      console.error('Error controlling agent:', error);
      throw error;
    }
  },

  getActivity: async () => {
    try {
      const response = await api.get('/trading/activity');
      return response.data || { activity: [], total: 0 };
    } catch (error) {
      console.error('Error fetching trading activity:', error);
      return { activity: [], total: 0 };
    }
  }
};

export default api;