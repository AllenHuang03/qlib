import { create } from 'zustand';
import { authAPI } from '../services/api';
import { TestAccountService, TestAccount } from '../services/testAccountService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  userType?: string;
  kyc_status?: string;
  status?: string;
  subscription_tier?: string;
  portfolio_initialized?: boolean;
  paper_trading?: boolean;
  portfolio_value?: number;
  account_balance?: number;
  trading_experience?: string;
  risk_tolerance?: string;
  investment_goals?: string[];
  permissions?: string[];
  department?: string;
  test_scenarios?: string[];
  description?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  isTestAccount: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
  initializeAuth: () => Promise<void>;
  loginWithTestAccount: (email: string, password: string) => Promise<boolean>;
  getAllTestAccounts: () => TestAccount[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  isTestAccount: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    
    // First, try test accounts
    const testAccount = TestAccountService.validateTestLogin(email, password);
    if (testAccount) {
      const user: User = {
        id: testAccount.id,
        email: testAccount.email,
        name: testAccount.name,
        role: testAccount.role,
        userType: testAccount.userType,
        kyc_status: testAccount.kycStatus,
        subscription_tier: testAccount.subscription_tier,
        portfolio_initialized: testAccount.portfolio_value ? true : false,
        paper_trading: true,
        portfolio_value: testAccount.portfolio_value,
        account_balance: testAccount.account_balance,
        trading_experience: testAccount.trading_experience,
        risk_tolerance: testAccount.risk_tolerance,
        investment_goals: testAccount.investment_goals,
        permissions: testAccount.permissions,
        department: testAccount.department,
        test_scenarios: testAccount.test_scenarios,
        description: testAccount.description
      };
      
      localStorage.setItem('auth-token', `test-token-${testAccount.id}`);
      
      set({
        user,
        isAuthenticated: true,
        token: `test-token-${testAccount.id}`,
        loading: false,
        isTestAccount: true
      });
      
      return true;
    }

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
        loading: false,
        isTestAccount: false
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ loading: false });
      
      // Fallback to demo login for legacy testing
      if (email === 'demo@qlib.com' && password === 'demo123') {
        const user: User = {
          id: 'demo-user-1',
          email: 'demo@qlib.com',
          name: 'Demo User',
          role: 'customer',
          kyc_status: 'approved',
          subscription_tier: 'pro',
          portfolio_initialized: false,
          paper_trading: true
        };
        
        localStorage.setItem('auth-token', 'demo-token-123');
        
        set({
          user,
          isAuthenticated: true,
          token: 'demo-token-123',
          loading: false,
          isTestAccount: false
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
      loading: false,
      isTestAccount: false
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
      // Check if it's a test token
      if (token.startsWith('test-token-')) {
        const accountId = token.replace('test-token-', '');
        const testAccount = Object.values(TestAccountService.getAllAccounts()).find(acc => acc.id === accountId);
        
        if (testAccount) {
          const user: User = {
            id: testAccount.id,
            email: testAccount.email,
            name: testAccount.name,
            role: testAccount.role,
            userType: testAccount.userType,
            kyc_status: testAccount.kycStatus,
            subscription_tier: testAccount.subscription_tier,
            portfolio_initialized: testAccount.portfolio_value ? true : false,
            paper_trading: true,
            portfolio_value: testAccount.portfolio_value,
            account_balance: testAccount.account_balance,
            trading_experience: testAccount.trading_experience,
            risk_tolerance: testAccount.risk_tolerance,
            investment_goals: testAccount.investment_goals,
            permissions: testAccount.permissions,
            department: testAccount.department,
            test_scenarios: testAccount.test_scenarios,
            description: testAccount.description
          };
          
          set({
            user,
            isAuthenticated: true,
            token,
            loading: false,
            isTestAccount: true
          });
          return;
        }
      }

      try {
        // Try to get user profile with stored token
        const userProfile = await authAPI.getProfile();
        set({
          user: userProfile,
          isAuthenticated: true,
          token,
          loading: false,
          isTestAccount: false
        });
      } catch (error) {
        console.log('Profile fetch failed, checking for demo token...');
        // If it's the demo token, keep the demo user authenticated
        if (token === 'demo-token-123') {
          const user: User = {
            id: 'demo-user-1',
            email: 'demo@qlib.com',
            name: 'Demo User',
            role: 'customer',
            kyc_status: 'approved',
            subscription_tier: 'pro',
            portfolio_initialized: false,
            paper_trading: true
          };
          
          set({
            user,
            isAuthenticated: true,
            token,
            loading: false,
            isTestAccount: false
          });
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth-token');
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            loading: false,
            isTestAccount: false
          });
        }
      }
    } else {
      set({ loading: false });
    }
  },

  loginWithTestAccount: async (email: string, password: string) => {
    const testAccount = TestAccountService.validateTestLogin(email, password);
    if (testAccount) {
      const user: User = {
        id: testAccount.id,
        email: testAccount.email,
        name: testAccount.name,
        role: testAccount.role,
        userType: testAccount.userType,
        kyc_status: testAccount.kycStatus,
        subscription_tier: testAccount.subscription_tier,
        portfolio_initialized: testAccount.portfolio_value ? true : false,
        paper_trading: true,
        portfolio_value: testAccount.portfolio_value,
        account_balance: testAccount.account_balance,
        trading_experience: testAccount.trading_experience,
        risk_tolerance: testAccount.risk_tolerance,
        investment_goals: testAccount.investment_goals,
        permissions: testAccount.permissions,
        department: testAccount.department,
        test_scenarios: testAccount.test_scenarios,
        description: testAccount.description
      };
      
      localStorage.setItem('auth-token', `test-token-${testAccount.id}`);
      
      set({
        user,
        isAuthenticated: true,
        token: `test-token-${testAccount.id}`,
        loading: false,
        isTestAccount: true
      });
      
      return true;
    }
    return false;
  },

  getAllTestAccounts: () => {
    return TestAccountService.getAllAccounts();
  },
}));