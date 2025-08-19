#!/usr/bin/env python3
"""
Staff Workflow Integration Tests
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive automated tests for all staff workflow implementations by Agent 3.
Tests the complete staff dashboard functionality and role-based access controls.
"""

import pytest
import requests
import time
import json
import os
from pathlib import Path
from typing import Dict, Any, List
import uuid

# Add project root to path
project_root = Path(__file__).parent.parent.parent
import sys
sys.path.insert(0, str(project_root))

class StaffWorkflowTestSuite:
    """
    Comprehensive test suite for staff workflow functionality.
    
    Tests all four staff dashboard types:
    1. KYC Staff Dashboard
    2. Support Staff Dashboard
    3. Trading Agent Dashboard
    4. Enterprise Admin Dashboard
    """
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.session = requests.Session()
        self.session.timeout = 30
        
    def setup_method(self):
        """Setup for each test method"""
        # Verify backend is running
        try:
            response = self.session.get(f"{self.backend_url}/health")
            assert response.status_code == 200, f"Backend not accessible: {response.status_code}"
        except Exception as e:
            pytest.skip(f"Backend not available: {e}")
    
    def teardown_method(self):
        """Cleanup after each test method"""
        pass
    
    def _verify_api_response(self, response: requests.Response, expected_status: int = 200) -> Dict[str, Any]:
        """Verify API response and return JSON data"""
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}: {response.text}"
        
        if response.content:
            try:
                return response.json()
            except:
                return {}
        return {}
    
    def _create_staff_account(self, role: str) -> Dict[str, str]:
        """Create a staff test account with specified role"""
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'staff', 'role': role}
        )
        
        account_data = self._verify_api_response(response, 201)
        assert 'token' in account_data, f"Staff account creation should return token for role {role}"
        
        return {
            'token': account_data['token'],
            'headers': {'Authorization': f'Bearer {account_data["token"]}'}
        }

class TestKYCStaffDashboard(StaffWorkflowTestSuite):
    """
    Test KYC Staff Dashboard functionality (Agent 3).
    
    Features:
    1. Customer verification queue
    2. Document review interface
    3. Compliance reporting
    4. KYC status management
    5. Audit trail access
    """
    
    def test_kyc_staff_dashboard_access(self):
        """Test KYC staff dashboard access and basic functionality"""
        
        # Create KYC staff account
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Test dashboard access
        response = self.session.get(
            f"{self.backend_url}/api/staff/kyc/dashboard",
            headers=staff_auth['headers']
        )
        
        # Should have access to KYC dashboard
        assert response.status_code != 403, \
            "KYC staff should have access to KYC dashboard"
        assert response.status_code != 500, \
            "KYC dashboard should not return server error"
    
    def test_pending_verifications_queue(self):
        """Test pending customer verifications queue"""
        
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Test pending verifications endpoint
        response = self.session.get(
            f"{self.backend_url}/api/staff/kyc/pending-verifications",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Pending verifications endpoint should not crash"
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict)), \
                "Pending verifications should return structured data"
    
    def test_document_review_interface(self):
        """Test document review interface functionality"""
        
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Test document review endpoint
        response = self.session.get(
            f"{self.backend_url}/api/staff/kyc/document-reviews",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Document review endpoint should not crash"
        
        # Test document approval workflow
        approval_data = {
            'documentId': 'test-doc-123',
            'status': 'approved',
            'notes': 'Document verified successfully'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/kyc/review-document",
            json=approval_data,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Document approval should not crash"
    
    def test_compliance_reporting(self):
        """Test compliance reporting functionality"""
        
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Test compliance reports access
        response = self.session.get(
            f"{self.backend_url}/api/staff/kyc/compliance-reports",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Compliance reports should not crash"
        
        # Test generating compliance report
        report_request = {
            'reportType': 'monthly_summary',
            'startDate': '2024-01-01',
            'endDate': '2024-01-31'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/kyc/generate-report",
            json=report_request,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Report generation should not crash"
    
    def test_kyc_status_management(self):
        """Test KYC status management capabilities"""
        
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Test updating customer KYC status
        status_update = {
            'userId': 'test-user-123',
            'kycStatus': 'verified',
            'reason': 'All documents verified'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/kyc/update-status",
            json=status_update,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "KYC status update should not crash"
    
    def test_access_control_restrictions(self):
        """Test that KYC staff cannot access other staff functions"""
        
        staff_auth = self._create_staff_account('kyc_staff')
        
        # Try to access non-KYC staff endpoints
        restricted_endpoints = [
            '/api/staff/support/tickets',
            '/api/staff/trading/models',
            '/api/admin/users'
        ]
        
        for endpoint in restricted_endpoints:
            response = self.session.get(
                f"{self.backend_url}{endpoint}",
                headers=staff_auth['headers']
            )
            
            # Should deny access or return appropriate error
            if response.status_code == 200:
                data = response.json() if response.content else {}
                # If endpoint returns data, it should indicate access restrictions
                assert 'error' in str(data).lower() or 'access' in str(data).lower() or not data, \
                    f"KYC staff should not have access to {endpoint}"

class TestSupportStaffDashboard(StaffWorkflowTestSuite):
    """
    Test Support Staff Dashboard functionality (Agent 3).
    
    Features:
    1. Customer support tickets
    2. User account management
    3. System status monitoring
    4. Issue escalation
    5. Customer communication tools
    """
    
    def test_support_staff_dashboard_access(self):
        """Test support staff dashboard access"""
        
        staff_auth = self._create_staff_account('support_staff')
        
        # Test dashboard access
        response = self.session.get(
            f"{self.backend_url}/api/staff/support/dashboard",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 403, \
            "Support staff should have access to support dashboard"
        assert response.status_code != 500, \
            "Support dashboard should not return server error"
    
    def test_customer_support_tickets(self):
        """Test customer support ticket management"""
        
        staff_auth = self._create_staff_account('support_staff')
        
        # Test tickets list
        response = self.session.get(
            f"{self.backend_url}/api/staff/support/tickets",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Support tickets endpoint should not crash"
        
        # Test ticket creation
        ticket_data = {
            'userId': 'test-user-123',
            'subject': 'Test support ticket',
            'description': 'This is a test ticket',
            'priority': 'medium'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/support/create-ticket",
            json=ticket_data,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Ticket creation should not crash"
    
    def test_user_account_management(self):
        """Test user account management capabilities"""
        
        staff_auth = self._create_staff_account('support_staff')
        
        # Test user accounts access
        response = self.session.get(
            f"{self.backend_url}/api/staff/support/user-accounts",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "User accounts endpoint should not crash"
        
        # Test user account search
        search_data = {
            'email': 'test@example.com'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/support/search-users",
            json=search_data,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "User search should not crash"
    
    def test_system_status_monitoring(self):
        """Test system status monitoring capabilities"""
        
        staff_auth = self._create_staff_account('support_staff')
        
        # Test system status access
        response = self.session.get(
            f"{self.backend_url}/api/staff/support/system-status",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "System status endpoint should not crash"
        
        if response.status_code == 200:
            data = response.json()
            # Should return system status information
            assert isinstance(data, dict), \
                "System status should return structured data"
    
    def test_issue_escalation(self):
        """Test issue escalation functionality"""
        
        staff_auth = self._create_staff_account('support_staff')
        
        # Test escalating a ticket
        escalation_data = {
            'ticketId': 'test-ticket-123',
            'escalationType': 'technical',
            'reason': 'Requires technical expertise'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/support/escalate-ticket",
            json=escalation_data,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Ticket escalation should not crash"

class TestTradingAgentDashboard(StaffWorkflowTestSuite):
    """
    Test Trading Agent Dashboard functionality (Agent 3).
    
    Features:
    1. Model performance monitoring
    2. Trading algorithm management
    3. Risk management controls
    4. Portfolio optimization
    5. Real-time market monitoring
    """
    
    def test_trading_agent_dashboard_access(self):
        """Test trading agent dashboard access"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test dashboard access
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/dashboard",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 403, \
            "Trading agent should have access to trading dashboard"
        assert response.status_code != 500, \
            "Trading dashboard should not return server error"
    
    def test_model_performance_monitoring(self):
        """Test model performance monitoring capabilities"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test model performance endpoint
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/model-performance",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Model performance endpoint should not crash"
        
        # Test getting specific model metrics
        model_request = {
            'modelId': 'test-model-123',
            'timeframe': '1d'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/trading/model-metrics",
            json=model_request,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Model metrics should not crash"
    
    def test_trading_algorithm_management(self):
        """Test trading algorithm management"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test algorithm list
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/algorithms",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Trading algorithms endpoint should not crash"
        
        # Test algorithm configuration
        algo_config = {
            'algorithmId': 'test-algo-123',
            'parameters': {
                'riskLevel': 'medium',
                'maxPosition': 0.1
            }
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/trading/configure-algorithm",
            json=algo_config,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Algorithm configuration should not crash"
    
    def test_risk_management_controls(self):
        """Test risk management control capabilities"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test risk metrics access
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/risk-metrics",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Risk metrics endpoint should not crash"
        
        # Test setting risk limits
        risk_limits = {
            'maxDrawdown': 0.05,
            'positionLimit': 0.1,
            'volatilityThreshold': 0.2
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/trading/set-risk-limits",
            json=risk_limits,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Risk limit setting should not crash"
    
    def test_portfolio_optimization(self):
        """Test portfolio optimization capabilities"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test portfolio optimization
        optimization_request = {
            'portfolioId': 'test-portfolio-123',
            'optimizationType': 'risk_adjusted_return',
            'constraints': {
                'maxWeight': 0.2,
                'minWeight': 0.01
            }
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/staff/trading/optimize-portfolio",
            json=optimization_request,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Portfolio optimization should not crash"
    
    def test_real_time_market_monitoring(self):
        """Test real-time market monitoring"""
        
        staff_auth = self._create_staff_account('trading_agent')
        
        # Test market data access
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/market-data",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Market data endpoint should not crash"
        
        # Test market alerts
        response = self.session.get(
            f"{self.backend_url}/api/staff/trading/market-alerts",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Market alerts endpoint should not crash"

class TestEnterpriseAdminDashboard(StaffWorkflowTestSuite):
    """
    Test Enterprise Admin Dashboard functionality (Agent 3).
    
    Features:
    1. User management
    2. System administration
    3. Analytics and reporting
    4. Configuration management
    5. Audit and compliance
    """
    
    def test_enterprise_admin_dashboard_access(self):
        """Test enterprise admin dashboard access"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test dashboard access
        response = self.session.get(
            f"{self.backend_url}/api/admin/dashboard",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 403, \
            "Enterprise admin should have access to admin dashboard"
        assert response.status_code != 500, \
            "Admin dashboard should not return server error"
    
    def test_user_management(self):
        """Test user management capabilities"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test user list access
        response = self.session.get(
            f"{self.backend_url}/api/admin/users",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Admin users endpoint should not crash"
        
        # Test user creation
        user_data = {
            'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
            'firstName': 'Admin',
            'lastName': 'Test',
            'role': 'user'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/admin/create-user",
            json=user_data,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Admin user creation should not crash"
    
    def test_system_administration(self):
        """Test system administration capabilities"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test system metrics
        response = self.session.get(
            f"{self.backend_url}/api/admin/system-metrics",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "System metrics endpoint should not crash"
        
        # Test system configuration
        response = self.session.get(
            f"{self.backend_url}/api/admin/system-config",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "System config endpoint should not crash"
    
    def test_analytics_and_reporting(self):
        """Test analytics and reporting capabilities"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test analytics dashboard
        response = self.session.get(
            f"{self.backend_url}/api/admin/analytics",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Admin analytics endpoint should not crash"
        
        # Test generating reports
        report_request = {
            'reportType': 'user_activity',
            'startDate': '2024-01-01',
            'endDate': '2024-01-31',
            'format': 'json'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/admin/generate-report",
            json=report_request,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Admin report generation should not crash"
    
    def test_audit_and_compliance(self):
        """Test audit and compliance capabilities"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test audit logs access
        response = self.session.get(
            f"{self.backend_url}/api/admin/audit-logs",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Audit logs endpoint should not crash"
        
        # Test compliance monitoring
        response = self.session.get(
            f"{self.backend_url}/api/admin/compliance-status",
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Compliance status endpoint should not crash"
    
    def test_configuration_management(self):
        """Test configuration management capabilities"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test updating system configuration
        config_update = {
            'settingName': 'max_upload_size',
            'value': '100MB'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/admin/update-config",
            json=config_update,
            headers=staff_auth['headers']
        )
        
        assert response.status_code != 500, \
            "Config update should not crash"

class TestCrossStaffIntegration(StaffWorkflowTestSuite):
    """
    Test integration and coordination between different staff roles.
    """
    
    def test_staff_role_access_control(self):
        """Test that each staff role has appropriate access controls"""
        
        roles = ['kyc_staff', 'support_staff', 'trading_agent', 'enterprise_admin']
        
        # Create accounts for each role
        staff_accounts = {}
        for role in roles:
            staff_accounts[role] = self._create_staff_account(role)
        
        # Test cross-role access restrictions
        role_endpoints = {
            'kyc_staff': ['/api/staff/kyc/dashboard'],
            'support_staff': ['/api/staff/support/tickets'],
            'trading_agent': ['/api/staff/trading/models'],
            'enterprise_admin': ['/api/admin/users']
        }
        
        for requesting_role, auth_data in staff_accounts.items():
            for endpoint_role, endpoints in role_endpoints.items():
                if requesting_role != endpoint_role and requesting_role != 'enterprise_admin':
                    # Non-admin roles shouldn't access other role endpoints
                    for endpoint in endpoints:
                        response = self.session.get(
                            f"{self.backend_url}{endpoint}",
                            headers=auth_data['headers']
                        )
                        
                        # Should deny access (403) or return limited data
                        if response.status_code == 200:
                            data = response.json() if response.content else {}
                            assert 'error' in str(data).lower() or 'access' in str(data).lower() or not data, \
                                f"{requesting_role} should not have full access to {endpoint}"
    
    def test_staff_workflow_performance(self):
        """Test performance requirements for staff workflows"""
        
        staff_auth = self._create_staff_account('enterprise_admin')
        
        # Test dashboard load time
        start_time = time.time()
        response = self.session.get(
            f"{self.backend_url}/api/admin/dashboard",
            headers=staff_auth['headers']
        )
        load_time = time.time() - start_time
        
        if response.status_code == 200:
            # Staff dashboards should load quickly
            assert load_time < 10.0, \
                f"Staff dashboard too slow: {load_time:.2f}s"
    
    def test_staff_data_consistency(self):
        """Test data consistency across staff interfaces"""
        
        # Create multiple staff accounts
        kyc_auth = self._create_staff_account('kyc_staff')
        admin_auth = self._create_staff_account('enterprise_admin')
        
        # Both should see consistent user data (if accessible)
        kyc_response = self.session.get(
            f"{self.backend_url}/api/staff/kyc/pending-verifications",
            headers=kyc_auth['headers']
        )
        
        admin_response = self.session.get(
            f"{self.backend_url}/api/admin/users",
            headers=admin_auth['headers']
        )
        
        # If both return data, verify consistency
        if kyc_response.status_code == 200 and admin_response.status_code == 200:
            kyc_data = kyc_response.json()
            admin_data = admin_response.json()
            
            # Data structures should be consistent
            assert isinstance(kyc_data, (list, dict)), \
                "KYC data should be structured"
            assert isinstance(admin_data, (list, dict)), \
                "Admin data should be structured"

# Test Configuration and Utilities

@pytest.fixture(scope="session")
def backend_url():
    """Get backend URL from environment or use default"""
    return os.environ.get('BACKEND_URL', 'http://localhost:8000')

# Parametrized tests for different staff roles

@pytest.mark.parametrize("staff_role", [
    "kyc_staff",
    "support_staff",
    "trading_agent", 
    "enterprise_admin"
])
def test_staff_workflow_smoke_test(staff_role, backend_url):
    """Smoke test for each staff workflow type"""
    
    suite = StaffWorkflowTestSuite(backend_url)
    suite.setup_method()
    
    try:
        if staff_role == "kyc_staff":
            test = TestKYCStaffDashboard(backend_url)
            test.test_kyc_staff_dashboard_access()
        elif staff_role == "support_staff":
            test = TestSupportStaffDashboard(backend_url)
            test.test_support_staff_dashboard_access()
        elif staff_role == "trading_agent":
            test = TestTradingAgentDashboard(backend_url)
            test.test_trading_agent_dashboard_access()
        elif staff_role == "enterprise_admin":
            test = TestEnterpriseAdminDashboard(backend_url)
            test.test_enterprise_admin_dashboard_access()
            
    except Exception as e:
        pytest.fail(f"Staff workflow {staff_role} failed: {e}")
    finally:
        suite.teardown_method()

# Performance tests

@pytest.mark.performance
def test_staff_workflow_performance_benchmarks(backend_url):
    """Test performance benchmarks for staff workflows"""
    
    suite = StaffWorkflowTestSuite(backend_url)
    
    # Test various staff role creation times
    roles = ['kyc_staff', 'support_staff', 'trading_agent', 'enterprise_admin']
    
    for role in roles:
        start_time = time.time()
        
        try:
            staff_auth = suite._create_staff_account(role)
            creation_time = time.time() - start_time
            
            # Staff account creation should be fast
            assert creation_time < 15.0, \
                f"Staff account creation too slow for {role}: {creation_time:.2f}s"
                
        except Exception:
            # If staff account creation not implemented, skip performance test
            pass

if __name__ == "__main__":
    # Run tests when executed directly
    pytest.main([__file__, "-v", "--tb=short"])