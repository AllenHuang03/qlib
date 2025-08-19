#!/usr/bin/env python3
"""
Test Account Service for Qlib Pro
Manages specialized test accounts for comprehensive platform testing
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import hashlib

class TestAccount(BaseModel):
    id: str
    email: str
    password_hash: str
    name: str
    user_type: str
    role: str
    kyc_status: str
    subscription_tier: str
    portfolio_value: Optional[float] = None
    account_balance: Optional[float] = None
    trading_experience: Optional[str] = None
    risk_tolerance: Optional[str] = None
    investment_goals: Optional[List[str]] = None
    permissions: Optional[List[str]] = None
    department: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    test_scenarios: List[str]
    description: str

class TestAccountService:
    def __init__(self):
        self.accounts = self._initialize_test_accounts()
        
    def _hash_password(self, password: str) -> str:
        """Simple password hashing for test accounts"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _initialize_test_accounts(self) -> Dict[str, TestAccount]:
        """Initialize the test account matrix"""
        accounts = {}
        
        # CUSTOMER ACCOUNTS
        accounts['test-new-customer-001'] = TestAccount(
            id='test-new-customer-001',
            email='newcustomer@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Emma Wilson',
            user_type='retail_customer',
            role='customer',
            kyc_status='not_started',
            subscription_tier='basic',
            portfolio_value=0,
            account_balance=5000,
            trading_experience='beginner',
            risk_tolerance='low',
            investment_goals=['retirement', 'growth'],
            created_at=datetime(2024, 8, 15, 10, 0, 0),
            test_scenarios=[
                'KYC onboarding process',
                'First-time platform navigation',
                'Educational content engagement',
                'Basic portfolio setup',
                'Paper trading introduction'
            ],
            description='New customer who has just signed up and needs to complete KYC verification. Perfect for testing the onboarding flow and beginner experience.'
        )
        
        accounts['test-verified-customer-002'] = TestAccount(
            id='test-verified-customer-002',
            email='verified@test.com',
            password_hash=self._hash_password('Test123!'),
            name='David Chen',
            user_type='retail_customer',
            role='customer',
            kyc_status='approved',
            subscription_tier='pro',
            portfolio_value=25000,
            account_balance=8000,
            trading_experience='intermediate',
            risk_tolerance='medium',
            investment_goals=['growth', 'income'],
            created_at=datetime(2024, 6, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 18, 14, 30, 0),
            test_scenarios=[
                'AI insights utilization',
                'Portfolio management tools',
                'Live trading simulations',
                'Performance analytics review',
                'Subscription upgrade evaluation'
            ],
            description='Established customer with approved KYC status and active portfolio. Ideal for testing standard customer workflows and features.'
        )
        
        accounts['test-premium-customer-003'] = TestAccount(
            id='test-premium-customer-003',
            email='premium@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Sarah Martinez',
            user_type='premium_customer',
            role='customer',
            kyc_status='approved',
            subscription_tier='enterprise',
            portfolio_value=150000,
            account_balance=25000,
            trading_experience='expert',
            risk_tolerance='high',
            investment_goals=['aggressive_growth', 'alternative_investments'],
            created_at=datetime(2024, 1, 15, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 9, 15, 0),
            test_scenarios=[
                'Advanced AI model customization',
                'Professional trading interface',
                'Complex portfolio strategies',
                'Real-time market analysis',
                'Premium support access'
            ],
            description='High-value premium customer with extensive trading experience. Perfect for testing advanced features and professional-grade tools.'
        )
        
        accounts['test-institutional-004'] = TestAccount(
            id='test-institutional-004',
            email='institution@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Michael Thompson (Pension Fund Manager)',
            user_type='institutional',
            role='trader',
            kyc_status='approved',
            subscription_tier='enterprise',
            portfolio_value=2500000,
            account_balance=500000,
            trading_experience='expert',
            risk_tolerance='medium',
            investment_goals=['risk_management', 'diversification', 'stable_returns'],
            created_at=datetime(2024, 3, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 8, 0, 0),
            test_scenarios=[
                'Multi-asset portfolio management',
                'Risk management tools',
                'Compliance reporting',
                'Bulk trade execution',
                'API integration testing'
            ],
            description='Institutional client managing large portfolios with strict compliance requirements. Essential for testing enterprise-level features.'
        )
        
        # STAFF ACCOUNTS
        accounts['test-kyc-staff-005'] = TestAccount(
            id='test-kyc-staff-005',
            email='kyc.staff@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Jennifer Kim (KYC Specialist)',
            user_type='kyc_staff',
            role='staff',
            kyc_status='approved',
            subscription_tier='enterprise',
            department='Compliance',
            permissions=['review_kyc', 'approve_accounts', 'access_customer_data', 'generate_compliance_reports'],
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 7, 45, 0),
            test_scenarios=[
                'KYC document review process',
                'Customer verification workflow',
                'Compliance status monitoring',
                'Risk assessment tools',
                'Audit trail review'
            ],
            description='KYC compliance specialist responsible for customer verification and risk assessment. Critical for testing compliance workflows.'
        )
        
        accounts['test-trading-agent-006'] = TestAccount(
            id='test-trading-agent-006',
            email='agent@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Alex Rodriguez (Senior Trader)',
            user_type='trading_agent',
            role='trader',
            kyc_status='approved',
            subscription_tier='enterprise',
            department='Trading Operations',
            permissions=['execute_trades', 'access_advanced_tools', 'manage_client_portfolios', 'view_market_data'],
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 6, 30, 0),
            test_scenarios=[
                'Advanced model development',
                'Multi-client portfolio management',
                'Real-time trading execution',
                'Performance optimization',
                'Client communication tools'
            ],
            description='Professional trading agent managing client portfolios and developing quantitative strategies. Perfect for testing advanced trading features.'
        )
        
        accounts['test-admin-007'] = TestAccount(
            id='test-admin-007',
            email='admin@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Chris Park (IT Administrator)',
            user_type='admin',
            role='admin',
            kyc_status='approved',
            subscription_tier='enterprise',
            department='Information Technology',
            permissions=['system_admin', 'user_management', 'security_monitoring', 'platform_configuration', 'audit_access'],
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 7, 0, 0),
            test_scenarios=[
                'System health monitoring',
                'User account management',
                'Security alert handling',
                'Platform configuration',
                'Performance metrics review'
            ],
            description='IT administrator responsible for platform infrastructure and security. Essential for testing system administration features.'
        )
        
        accounts['test-support-008'] = TestAccount(
            id='test-support-008',
            email='support@test.com',
            password_hash=self._hash_password('Test123!'),
            name='Lisa Wang (Customer Support)',
            user_type='support_staff',
            role='staff',
            kyc_status='approved',
            subscription_tier='enterprise',
            department='Customer Success',
            permissions=['access_customer_accounts', 'view_support_tickets', 'escalate_issues', 'access_knowledge_base'],
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            last_login=datetime(2024, 8, 19, 8, 30, 0),
            test_scenarios=[
                'Customer support ticket handling',
                'Account troubleshooting',
                'Feature explanation and guidance',
                'Escalation procedures',
                'Knowledge base management'
            ],
            description='Customer support specialist helping users with platform issues and questions. Important for testing support workflows.'
        )
        
        return accounts
    
    def authenticate_test_account(self, email: str, password: str) -> Optional[TestAccount]:
        """Authenticate a test account"""
        password_hash = self._hash_password(password)
        for account in self.accounts.values():
            if account.email == email and account.password_hash == password_hash:
                # Update last login
                account.last_login = datetime.now()
                return account
        return None
    
    def get_account_by_email(self, email: str) -> Optional[TestAccount]:
        """Get account by email"""
        for account in self.accounts.values():
            if account.email == email:
                return account
        return None
    
    def get_account_by_id(self, account_id: str) -> Optional[TestAccount]:
        """Get account by ID"""
        return self.accounts.get(account_id)
    
    def get_all_accounts(self) -> List[TestAccount]:
        """Get all test accounts"""
        return list(self.accounts.values())
    
    def get_accounts_by_role(self, role: str) -> List[TestAccount]:
        """Get accounts by role"""
        return [acc for acc in self.accounts.values() if acc.role == role]
    
    def get_accounts_by_user_type(self, user_type: str) -> List[TestAccount]:
        """Get accounts by user type"""
        return [acc for acc in self.accounts.values() if acc.user_type == user_type]
    
    def get_accounts_by_kyc_status(self, kyc_status: str) -> List[TestAccount]:
        """Get accounts by KYC status"""
        return [acc for acc in self.accounts.values() if acc.kyc_status == kyc_status]
    
    def update_account_kyc_status(self, account_id: str, new_status: str) -> bool:
        """Update account KYC status"""
        account = self.get_account_by_id(account_id)
        if account:
            account.kyc_status = new_status
            return True
        return False
    
    def generate_account_summary(self) -> Dict[str, Any]:
        """Generate summary of test accounts"""
        accounts = self.get_all_accounts()
        
        summary = {
            'total_accounts': len(accounts),
            'by_role': {},
            'by_user_type': {},
            'by_kyc_status': {},
            'by_subscription_tier': {},
            'total_portfolio_value': 0,
            'total_account_balance': 0
        }
        
        for account in accounts:
            # Count by role
            role = account.role
            summary['by_role'][role] = summary['by_role'].get(role, 0) + 1
            
            # Count by user type
            user_type = account.user_type
            summary['by_user_type'][user_type] = summary['by_user_type'].get(user_type, 0) + 1
            
            # Count by KYC status
            kyc_status = account.kyc_status
            summary['by_kyc_status'][kyc_status] = summary['by_kyc_status'].get(kyc_status, 0) + 1
            
            # Count by subscription tier
            tier = account.subscription_tier
            summary['by_subscription_tier'][tier] = summary['by_subscription_tier'].get(tier, 0) + 1
            
            # Sum portfolio values
            if account.portfolio_value:
                summary['total_portfolio_value'] += account.portfolio_value
            if account.account_balance:
                summary['total_account_balance'] += account.account_balance
        
        return summary

# Global instance
test_account_service = TestAccountService()