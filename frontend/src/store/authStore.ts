import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  subscription_tier?: string;
  paper_trading?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      // Use real API for authentication
      const response = await authAPI.login(email, password);
      
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role || 'user',
        status: response.user.status,
        subscription_tier: response.user.subscription_tier,
        paper_trading: response.user.paper_trading
      };
      
      // Store token
      localStorage.setItem('auth-token', response.access_token);
      
      set({
        user,
        isAuthenticated: true,
        token: response.access_token,
        loading: false
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ loading: false });
      
      // Fallback to demo login for testing
      if (email === 'demo@qlib.com' && password === 'demo123') {
        const user: User = {
          id: 'demo-user-1',
          email: 'demo@qlib.com',
          name: 'Demo User',
          role: 'user',
          subscription_tier: 'free',
          paper_trading: true
        };
        
        localStorage.setItem('auth-token', 'demo-token-123');
        
        set({
          user,
          isAuthenticated: true,
          token: 'demo-token-123',
          loading: false
        });
        
        return true;
      }
      
      return false;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true });
    try {
      await authAPI.register(email, password, name);
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    set({
      user: null,
      isAuthenticated: false,
      token: null,
      loading: false
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  updateUser: (user: User) => {
    set({ user });
  },

  initializeAuth: async () => {
    set({ loading: true });
    const token = localStorage.getItem('auth-token');
    if (token) {
      try {
        // Try to get user profile with stored token
        const userProfile = await authAPI.getProfile();
        set({
          user: userProfile,
          isAuthenticated: true,
          token,
          loading: false
        });
      } catch (error) {
        console.log('Profile fetch failed, checking for demo token...');
        // If it's the demo token, keep the demo user authenticated
        if (token === 'demo-token-123') {
          const user: User = {
            id: 'demo-user-1',
            email: 'demo@qlib.com',
            name: 'Demo User',
            role: 'user',
            subscription_tier: 'free',
            paper_trading: true
          };
          
          set({
            user,
            isAuthenticated: true,
            token,
            loading: false
          });
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth-token');
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            loading: false
          });
        }
      }
    } else {
      set({ loading: false });
    }
  },
}));