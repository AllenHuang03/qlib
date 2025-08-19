export interface TestAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  userType: 'retail_customer' | 'premium_customer' | 'institutional' | 'kyc_staff' | 'trading_agent' | 'admin' | 'support_staff';
  role: 'customer' | 'trader' | 'admin' | 'staff';
  kycStatus: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  portfolio_value?: number;
  account_balance?: number;
  trading_experience?: 'beginner' | 'intermediate' | 'expert';
  risk_tolerance?: 'low' | 'medium' | 'high';
  investment_goals?: string[];
  permissions?: string[];
  department?: string;
  created_at: string;
  last_login?: string;
  test_scenarios: string[];
  description: string;
}

export const TestAccountMatrix: Record<string, TestAccount> = {
  // CUSTOMER ACCOUNTS
  newCustomer: {
    id: 'test-new-customer-001',
    email: 'newcustomer@test.com',
    password: 'Test123!',
    name: 'Emma Wilson',
    userType: 'retail_customer',
    role: 'customer',
    kycStatus: 'not_started',
    subscription_tier: 'basic',
    portfolio_value: 0,
    account_balance: 5000,
    trading_experience: 'beginner',
    risk_tolerance: 'low',
    investment_goals: ['retirement', 'growth'],
    created_at: '2024-08-15T10:00:00Z',
    test_scenarios: [
      'KYC onboarding process',
      'First-time platform navigation',
      'Educational content engagement',
      'Basic portfolio setup',
      'Paper trading introduction'
    ],
    description: 'New customer who has just signed up and needs to complete KYC verification. Perfect for testing the onboarding flow and beginner experience.'
  },

  verifiedCustomer: {
    id: 'test-verified-customer-002',
    email: 'verified@test.com',
    password: 'Test123!',
    name: 'David Chen',
    userType: 'retail_customer',
    role: 'customer',
    kycStatus: 'approved',
    subscription_tier: 'pro',
    portfolio_value: 25000,
    account_balance: 8000,
    trading_experience: 'intermediate',
    risk_tolerance: 'medium',
    investment_goals: ['growth', 'income'],
    created_at: '2024-06-01T10:00:00Z',
    last_login: '2024-08-18T14:30:00Z',
    test_scenarios: [
      'AI insights utilization',
      'Portfolio management tools',
      'Live trading simulations',
      'Performance analytics review',
      'Subscription upgrade evaluation'
    ],
    description: 'Established customer with approved KYC status and active portfolio. Ideal for testing standard customer workflows and features.'
  },

  premiumCustomer: {
    id: 'test-premium-customer-003',
    email: 'premium@test.com',
    password: 'Test123!',
    name: 'Sarah Martinez',
    userType: 'premium_customer',
    role: 'customer',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    portfolio_value: 150000,
    account_balance: 25000,
    trading_experience: 'expert',
    risk_tolerance: 'high',
    investment_goals: ['aggressive_growth', 'alternative_investments'],
    created_at: '2024-01-15T10:00:00Z',
    last_login: '2024-08-19T09:15:00Z',
    test_scenarios: [
      'Advanced AI model customization',
      'Professional trading interface',
      'Complex portfolio strategies',
      'Real-time market analysis',
      'Premium support access'
    ],
    description: 'High-value premium customer with extensive trading experience. Perfect for testing advanced features and professional-grade tools.'
  },

  institutionalClient: {
    id: 'test-institutional-004',
    email: 'institution@test.com',
    password: 'Test123!',
    name: 'Michael Thompson (Pension Fund Manager)',
    userType: 'institutional',
    role: 'trader',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    portfolio_value: 2500000,
    account_balance: 500000,
    trading_experience: 'expert',
    risk_tolerance: 'medium',
    investment_goals: ['risk_management', 'diversification', 'stable_returns'],
    created_at: '2024-03-01T10:00:00Z',
    last_login: '2024-08-19T08:00:00Z',
    test_scenarios: [
      'Multi-asset portfolio management',
      'Risk management tools',
      'Compliance reporting',
      'Bulk trade execution',
      'API integration testing'
    ],
    description: 'Institutional client managing large portfolios with strict compliance requirements. Essential for testing enterprise-level features.'
  },

  // STAFF ACCOUNTS
  kycReviewer: {
    id: 'test-kyc-staff-005',
    email: 'kyc.staff@test.com',
    password: 'Test123!',
    name: 'Jennifer Kim (KYC Specialist)',
    userType: 'kyc_staff',
    role: 'staff',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    department: 'Compliance',
    permissions: ['review_kyc', 'approve_accounts', 'access_customer_data', 'generate_compliance_reports'],
    created_at: '2024-01-01T10:00:00Z',
    last_login: '2024-08-19T07:45:00Z',
    test_scenarios: [
      'KYC document review process',
      'Customer verification workflow',
      'Compliance status monitoring',
      'Risk assessment tools',
      'Audit trail review'
    ],
    description: 'KYC compliance specialist responsible for customer verification and risk assessment. Critical for testing compliance workflows.'
  },

  tradingAgent: {
    id: 'test-trading-agent-006',
    email: 'agent@test.com',
    password: 'Test123!',
    name: 'Alex Rodriguez (Senior Trader)',
    userType: 'trading_agent',
    role: 'trader',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    department: 'Trading Operations',
    permissions: ['execute_trades', 'access_advanced_tools', 'manage_client_portfolios', 'view_market_data'],
    created_at: '2024-01-01T10:00:00Z',
    last_login: '2024-08-19T06:30:00Z',
    test_scenarios: [
      'Advanced model development',
      'Multi-client portfolio management',
      'Real-time trading execution',
      'Performance optimization',
      'Client communication tools'
    ],
    description: 'Professional trading agent managing client portfolios and developing quantitative strategies. Perfect for testing advanced trading features.'
  },

  itAdmin: {
    id: 'test-admin-007',
    email: 'admin@test.com',
    password: 'Test123!',
    name: 'Chris Park (IT Administrator)',
    userType: 'admin',
    role: 'admin',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    department: 'Information Technology',
    permissions: ['system_admin', 'user_management', 'security_monitoring', 'platform_configuration', 'audit_access'],
    created_at: '2024-01-01T10:00:00Z',
    last_login: '2024-08-19T07:00:00Z',
    test_scenarios: [
      'System health monitoring',
      'User account management',
      'Security alert handling',
      'Platform configuration',
      'Performance metrics review'
    ],
    description: 'IT administrator responsible for platform infrastructure and security. Essential for testing system administration features.'
  },

  supportStaff: {
    id: 'test-support-008',
    email: 'support@test.com',
    password: 'Test123!',
    name: 'Lisa Wang (Customer Support)',
    userType: 'support_staff',
    role: 'staff',
    kycStatus: 'approved',
    subscription_tier: 'enterprise',
    department: 'Customer Success',
    permissions: ['access_customer_accounts', 'view_support_tickets', 'escalate_issues', 'access_knowledge_base'],
    created_at: '2024-01-01T10:00:00Z',
    last_login: '2024-08-19T08:30:00Z',
    test_scenarios: [
      'Customer support ticket handling',
      'Account troubleshooting',
      'Feature explanation and guidance',
      'Escalation procedures',
      'Knowledge base management'
    ],
    description: 'Customer support specialist helping users with platform issues and questions. Important for testing support workflows.'
  }
};

export class TestAccountService {
  static getAllAccounts(): TestAccount[] {
    return Object.values(TestAccountMatrix);
  }

  static getAccountByEmail(email: string): TestAccount | undefined {
    return Object.values(TestAccountMatrix).find(account => account.email === email);
  }

  static getAccountsByRole(role: string): TestAccount[] {
    return Object.values(TestAccountMatrix).filter(account => account.role === role);
  }

  static getAccountsByUserType(userType: string): TestAccount[] {
    return Object.values(TestAccountMatrix).filter(account => account.userType === userType);
  }

  static getAccountsByKYCStatus(kycStatus: string): TestAccount[] {
    return Object.values(TestAccountMatrix).filter(account => account.kycStatus === kycStatus);
  }

  static validateTestLogin(email: string, password: string): TestAccount | null {
    const account = this.getAccountByEmail(email);
    if (account && account.password === password) {
      return account;
    }
    return null;
  }

  static getTestScenarios(accountId: string): string[] {
    const account = Object.values(TestAccountMatrix).find(acc => acc.id === accountId);
    return account?.test_scenarios || [];
  }

  static runTestScenario(accountId: string, scenarioName: string): boolean {
    // Log test scenario execution for tracking
    console.log(`Running test scenario: ${scenarioName} for account: ${accountId}`);
    
    // In a real implementation, this would trigger specific test flows
    // For now, we'll just return success
    return true;
  }
}