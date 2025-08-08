import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'trader' | 'analyst';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,

  login: async (email: string, password: string) => {
    try {
      // Simple demo login - supports both user and admin
      if (email === 'demo@qlib.com' && password === 'demo123') {
        const user: User = {
          id: '1',
          email: 'demo@qlib.com',
          name: 'Demo User',
          role: 'trader',
        };
        
        // Store token
        localStorage.setItem('auth-token', 'demo-token-123');
        
        set({
          user,
          isAuthenticated: true,
          token: 'demo-token-123',
        });
        
        return true;
      }
      
      // Admin login
      if (email === 'admin@qlib.ai' && password === 'admin123') {
        const user: User = {
          id: '2',
          email: 'admin@qlib.ai',
          name: 'Admin User',
          role: 'admin',
        };
        
        // Store token
        localStorage.setItem('auth-token', 'demo-token-123');
        
        set({
          user,
          isAuthenticated: true,
          token: 'demo-token-123',
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    set({
      user: null,
      isAuthenticated: false,
      token: null,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));