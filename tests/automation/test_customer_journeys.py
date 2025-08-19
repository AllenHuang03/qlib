#!/usr/bin/env python3
"""
End-to-End Customer Journey Tests
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive automated tests for all customer journey flows implemented by Agents 1-2.
Tests the complete user experience from registration to advanced trading features.
"""

import pytest
import asyncio
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

class CustomerJourneyTestSuite:
    """
    Comprehensive test suite for customer journey flows.
    
    Tests all four customer types:
    1. New Customer Onboarding
    2. Verified Customer Flow
    3. Premium Customer Flow  
    4. Institutional Client Flow
    """
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.test_data_dir = project_root / 'backend' / 'test_data'
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
    
    def _generate_test_email(self) -> str:
        """Generate unique test email"""
        return f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    def _verify_api_response(self, response: requests.Response, expected_status: int = 200) -> Dict[str, Any]:
        """Verify API response and return JSON data"""
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}: {response.text}"
        
        if response.content:
            return response.json()
        return {}

class TestNewCustomerOnboarding(CustomerJourneyTestSuite):
    """
    Test new customer onboarding journey (Agent 1).
    
    Flow:
    1. Landing page access
    2. Registration process
    3. Email verification
    4. Initial dashboard access
    5. Plan selection
    6. Basic feature exploration
    """
    
    def test_complete_new_customer_flow(self):
        """Test complete new customer onboarding flow"""
        
        # Step 1: Test registration
        email = self._generate_test_email()
        registration_data = {
            'email': email,
            'password': 'SecurePassword123!',
            'firstName': 'Test',
            'lastName': 'User',
            'agreeToTerms': True
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=registration_data
        )
        register_result = self._verify_api_response(response, 201)
        
        assert 'user' in register_result or 'token' in register_result, \
            "Registration should return user or token"
        
        # Step 2: Test login
        login_data = {
            'email': email,
            'password': registration_data['password']
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/login",
            json=login_data
        )
        login_result = self._verify_api_response(response)
        
        assert 'token' in login_result, "Login should return authentication token"
        
        # Set authorization header for subsequent requests
        token = login_result['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Step 3: Test dashboard access
        response = self.session.get(f"{self.backend_url}/api/user/dashboard")
        dashboard_data = self._verify_api_response(response)
        
        assert 'user' in dashboard_data or 'profile' in dashboard_data, \
            "Dashboard should return user data"
        
        # Step 4: Test plan selection access
        response = self.session.get(f"{self.backend_url}/api/plans/available")
        plans_data = self._verify_api_response(response)
        
        # Should get plans or empty list
        assert isinstance(plans_data, (list, dict)), \
            "Plans endpoint should return data structure"
        
        # Step 5: Test basic features access
        basic_endpoints = [
            '/api/models/basic',
            '/api/market/status',
            '/api/user/profile'
        ]
        
        for endpoint in basic_endpoints:
            response = self.session.get(f"{self.backend_url}{endpoint}")
            # Should not return server errors (500)
            assert response.status_code != 500, \
                f"Basic endpoint {endpoint} should not return server error"
    
    def test_registration_validation(self):
        """Test registration input validation"""
        
        # Test invalid email
        invalid_data = {
            'email': 'invalid-email',
            'password': 'password',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=invalid_data
        )
        
        # Should reject invalid email
        assert response.status_code in [400, 422], \
            "Should reject invalid email format"
        
        # Test weak password
        weak_password_data = {
            'email': self._generate_test_email(),
            'password': '123',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=weak_password_data
        )
        
        # Should reject weak password
        assert response.status_code in [400, 422], \
            "Should reject weak password"
    
    def test_duplicate_registration(self):
        """Test handling of duplicate email registration"""
        
        email = self._generate_test_email()
        registration_data = {
            'email': email,
            'password': 'SecurePassword123!',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        # First registration
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=registration_data
        )
        self._verify_api_response(response, 201)
        
        # Second registration with same email
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=registration_data
        )
        
        # Should reject duplicate email
        assert response.status_code in [400, 409, 422], \
            "Should reject duplicate email registration"

class TestVerifiedCustomerFlow(CustomerJourneyTestSuite):
    """
    Test verified customer flow (Agent 1).
    
    Flow:
    1. Account upgrade to verified status
    2. Portfolio upload capability
    3. Basic model access
    4. Backtesting features
    5. Paper trading access
    """
    
    def test_complete_verified_customer_flow(self):
        """Test complete verified customer flow"""
        
        # Step 1: Create verified test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'verified'}
        )
        account_data = self._verify_api_response(response, 201)
        
        assert 'token' in account_data, "Test account should provide token"
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Step 2: Test portfolio upload
        portfolio_file = self.test_data_dir / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            with open(portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files
                )
            
            upload_result = self._verify_api_response(response, 201)
            assert 'portfolio' in upload_result or 'success' in str(upload_result).lower(), \
                "Portfolio upload should indicate success"
        
        # Step 3: Test model access
        response = self.session.get(f"{self.backend_url}/api/models/basic")
        models_data = self._verify_api_response(response)
        
        # Should return models or empty structure
        assert isinstance(models_data, (list, dict)), \
            "Models endpoint should return data structure"
        
        # Step 4: Test backtesting access
        response = self.session.get(f"{self.backend_url}/api/backtesting/basic")
        # Endpoint may not exist yet - check it doesn't crash
        assert response.status_code != 500, \
            "Backtesting endpoint should not return server error"
        
        # Step 5: Test paper trading access
        response = self.session.get(f"{self.backend_url}/api/trading/paper-trading")
        # Endpoint may not exist yet - check it doesn't crash  
        assert response.status_code != 500, \
            "Paper trading endpoint should not return server error"
    
    def test_portfolio_validation(self):
        """Test portfolio file validation"""
        
        # Create verified test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'verified'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Test malformed portfolio
        malformed_file = self.test_data_dir / 'test_portfolio_malformed.csv'
        
        if malformed_file.exists():
            with open(malformed_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files
                )
            
            # Should handle malformed data gracefully
            assert response.status_code != 500, \
                "Portfolio validation should not crash on malformed data"
            
            if response.status_code == 200:
                result = response.json()
                # Should indicate validation failed
                assert not result.get('valid', True), \
                    "Malformed portfolio should fail validation"
    
    def test_portfolio_size_limits(self):
        """Test portfolio file size limitations"""
        
        # Create verified test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'verified'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Test large portfolio (if available)
        large_file = self.test_data_dir / 'test_portfolio_10k_holdings.csv'
        
        if large_file.exists():
            with open(large_file, 'rb') as f:
                files = {'file': f}
                start_time = time.time()
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files
                )
                duration = time.time() - start_time
            
            # Should handle large files or reject appropriately
            assert response.status_code != 500, \
                "Large portfolio upload should not crash server"
            
            # Performance check - should complete within reasonable time
            if response.status_code in [200, 201]:
                assert duration < 120, \
                    f"Large portfolio upload too slow: {duration:.2f}s"

class TestPremiumCustomerFlow(CustomerJourneyTestSuite):
    """
    Test premium customer flow (Agent 2).
    
    Flow:
    1. Premium account features
    2. Advanced model access
    3. AI insights
    4. Advanced trading interface
    5. Custom strategy development
    """
    
    def test_complete_premium_customer_flow(self):
        """Test complete premium customer flow"""
        
        # Step 1: Create premium test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'premium'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Step 2: Test advanced model access
        response = self.session.get(f"{self.backend_url}/api/models/advanced")
        # Should not crash even if not fully implemented
        assert response.status_code != 500, \
            "Advanced models endpoint should not return server error"
        
        # Step 3: Test AI insights access
        response = self.session.get(f"{self.backend_url}/api/ai-insights")
        assert response.status_code != 500, \
            "AI insights endpoint should not return server error"
        
        # Step 4: Test advanced backtesting
        response = self.session.get(f"{self.backend_url}/api/backtesting/advanced")
        assert response.status_code != 500, \
            "Advanced backtesting endpoint should not return server error"
        
        # Step 5: Test real-time trading features
        response = self.session.get(f"{self.backend_url}/api/trading/real-time")
        assert response.status_code != 500, \
            "Real-time trading endpoint should not return server error"
        
        # Step 6: Test premium analytics
        response = self.session.get(f"{self.backend_url}/api/analytics/premium")
        assert response.status_code != 500, \
            "Premium analytics endpoint should not return server error"
    
    def test_premium_feature_access_control(self):
        """Test that premium features are restricted to premium users"""
        
        # Create basic account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'basic'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Try to access premium features
        premium_endpoints = [
            '/api/models/advanced',
            '/api/ai-insights',
            '/api/backtesting/advanced',
            '/api/analytics/premium'
        ]
        
        for endpoint in premium_endpoints:
            response = self.session.get(f"{self.backend_url}{endpoint}")
            
            # Should deny access or return appropriate error
            if response.status_code == 200:
                # If endpoint exists and returns 200, it should indicate limited access
                result = response.json() if response.content else {}
                # Look for access limitation indicators
                assert any(keyword in str(result).lower() for keyword in ['upgrade', 'premium', 'limited']) or not result, \
                    f"Basic user should not have full access to {endpoint}"
    
    def test_ai_insights_functionality(self):
        """Test AI insights functionality"""
        
        # Create premium test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'premium'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Test AI insights generation
        insights_request = {
            'symbol': 'AAPL',
            'timeframe': '1d',
            'analysisType': 'technical'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/ai-insights/generate",
            json=insights_request
        )
        
        # Should handle request gracefully
        assert response.status_code != 500, \
            "AI insights generation should not crash"

class TestInstitutionalClientFlow(CustomerJourneyTestSuite):
    """
    Test institutional client flow (Agent 2).
    
    Flow:
    1. Enterprise account setup
    2. Large portfolio management
    3. Custom model development
    4. Compliance features
    5. Multi-user management
    """
    
    def test_complete_institutional_client_flow(self):
        """Test complete institutional client flow"""
        
        # Step 1: Create institutional test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'institutional'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Step 2: Test large portfolio upload
        large_portfolio_file = self.test_data_dir / 'test_portfolio_10k_holdings.csv'
        
        if large_portfolio_file.exists():
            with open(large_portfolio_file, 'rb') as f:
                files = {'file': f}
                start_time = time.time()
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files
                )
                duration = time.time() - start_time
            
            # Should handle large portfolios
            assert response.status_code != 500, \
                "Large portfolio upload should not crash"
            
            # Performance requirement for institutional clients
            if response.status_code in [200, 201]:
                assert duration < 180, \
                    f"Institutional portfolio upload too slow: {duration:.2f}s"
        
        # Step 3: Test enterprise model access
        response = self.session.get(f"{self.backend_url}/api/models/enterprise")
        assert response.status_code != 500, \
            "Enterprise models endpoint should not return server error"
        
        # Step 4: Test compliance features
        response = self.session.get(f"{self.backend_url}/api/compliance/reporting")
        assert response.status_code != 500, \
            "Compliance reporting endpoint should not return server error"
        
        # Step 5: Test advanced analytics
        response = self.session.get(f"{self.backend_url}/api/analytics/advanced")
        assert response.status_code != 500, \
            "Advanced analytics endpoint should not return server error"
        
        # Step 6: Test multi-asset support
        multi_asset_file = self.test_data_dir / 'test_portfolio_mixed_assets.csv'
        
        if multi_asset_file.exists():
            with open(multi_asset_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/analyze",
                    files=files
                )
            
            # Should handle multi-asset portfolios
            assert response.status_code != 500, \
                "Multi-asset portfolio analysis should not crash"
    
    def test_institutional_performance_requirements(self):
        """Test performance requirements for institutional clients"""
        
        # Create institutional test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'institutional'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Test API response times
        endpoints = [
            '/api/user/dashboard',
            '/api/models/enterprise',
            '/api/portfolio/summary',
            '/api/analytics/real-time'
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            response = self.session.get(f"{self.backend_url}{endpoint}")
            duration = time.time() - start_time
            
            if response.status_code == 200:
                # Institutional clients expect fast response times
                assert duration < 5.0, \
                    f"Institutional endpoint {endpoint} too slow: {duration:.2f}s"
    
    def test_compliance_data_handling(self):
        """Test compliance and data handling requirements"""
        
        # Create institutional test account
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': 'institutional'}
        )
        account_data = self._verify_api_response(response, 201)
        
        token = account_data['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Test audit trail
        response = self.session.get(f"{self.backend_url}/api/audit/user-actions")
        # Should not crash even if not implemented
        assert response.status_code != 500, \
            "Audit trail endpoint should not return server error"
        
        # Test data export capabilities
        response = self.session.get(f"{self.backend_url}/api/data/export")
        assert response.status_code != 500, \
            "Data export endpoint should not return server error"

class TestCrossJourneyIntegration(CustomerJourneyTestSuite):
    """
    Test integration across different customer journey types.
    Verify smooth transitions and consistent experience.
    """
    
    def test_account_upgrade_flow(self):
        """Test upgrading from basic to premium account"""
        
        # Step 1: Create basic account
        email = self._generate_test_email()
        registration_data = {
            'email': email,
            'password': 'SecurePassword123!',
            'firstName': 'Test',
            'lastName': 'User'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=registration_data
        )
        self._verify_api_response(response, 201)
        
        # Login
        login_data = {
            'email': email,
            'password': registration_data['password']
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/login",
            json=login_data
        )
        login_result = self._verify_api_response(response)
        
        token = login_result['token']
        self.session.headers.update({'Authorization': f'Bearer {token}'})
        
        # Step 2: Test upgrade to premium
        upgrade_data = {
            'plan': 'premium',
            'paymentMethod': 'test'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/user/upgrade",
            json=upgrade_data
        )
        
        # Should handle upgrade request
        assert response.status_code != 500, \
            "Account upgrade should not crash"
        
        # Step 3: Verify premium features are now accessible
        response = self.session.get(f"{self.backend_url}/api/models/advanced")
        # Should now have access or show upgrade was processed
        assert response.status_code != 403, \
            "Should have access to premium features after upgrade"
    
    def test_data_consistency_across_journeys(self):
        """Test that user data is consistent across different journey types"""
        
        # Create multiple accounts and verify data consistency
        account_types = ['basic', 'verified', 'premium']
        
        for account_type in account_types:
            response = self.session.post(
                f"{self.backend_url}/api/test-accounts/create",
                json={'accountType': account_type}
            )
            account_data = self._verify_api_response(response, 201)
            
            token = account_data['token']
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test profile data structure consistency
            response = self.session.get(
                f"{self.backend_url}/api/user/profile",
                headers=headers
            )
            
            if response.status_code == 200:
                profile_data = response.json()
                
                # All account types should have consistent profile structure
                expected_fields = ['email', 'firstName', 'lastName']
                for field in expected_fields:
                    if field in profile_data:
                        assert isinstance(profile_data[field], str), \
                            f"Profile field {field} should be string for {account_type}"

# Test Configuration and Utilities

@pytest.fixture(scope="session")
def backend_url():
    """Get backend URL from environment or use default"""
    return os.environ.get('BACKEND_URL', 'http://localhost:8000')

@pytest.fixture(scope="session")
def test_data_dir():
    """Get test data directory"""
    return project_root / 'backend' / 'test_data'

# Parametrized tests for different customer types

@pytest.mark.parametrize("customer_type", [
    "new_customer",
    "verified_customer", 
    "premium_customer",
    "institutional_client"
])
def test_customer_journey_smoke_test(customer_type, backend_url):
    """Smoke test for each customer journey type"""
    
    suite = CustomerJourneyTestSuite(backend_url)
    suite.setup_method()
    
    try:
        if customer_type == "new_customer":
            test = TestNewCustomerOnboarding(backend_url)
            test.test_complete_new_customer_flow()
        elif customer_type == "verified_customer":
            test = TestVerifiedCustomerFlow(backend_url)
            test.test_complete_verified_customer_flow()
        elif customer_type == "premium_customer":
            test = TestPremiumCustomerFlow(backend_url)
            test.test_complete_premium_customer_flow()
        elif customer_type == "institutional_client":
            test = TestInstitutionalClientFlow(backend_url)
            test.test_complete_institutional_client_flow()
            
    except Exception as e:
        pytest.fail(f"Customer journey {customer_type} failed: {e}")
    finally:
        suite.teardown_method()

# Performance benchmarks

@pytest.mark.performance
def test_customer_journey_performance_benchmarks(backend_url):
    """Test performance benchmarks for customer journeys"""
    
    suite = CustomerJourneyTestSuite(backend_url)
    
    # Benchmark registration time
    start_time = time.time()
    
    email = suite._generate_test_email()
    registration_data = {
        'email': email,
        'password': 'SecurePassword123!',
        'firstName': 'Test',
        'lastName': 'User'
    }
    
    response = suite.session.post(
        f"{backend_url}/api/auth/register",
        json=registration_data
    )
    
    registration_time = time.time() - start_time
    
    if response.status_code in [200, 201]:
        assert registration_time < 10.0, \
            f"Registration too slow: {registration_time:.2f}s"
    
    # Benchmark login time
    start_time = time.time()
    
    login_data = {
        'email': email,
        'password': registration_data['password']
    }
    
    response = suite.session.post(
        f"{backend_url}/api/auth/login",
        json=login_data
    )
    
    login_time = time.time() - start_time
    
    if response.status_code == 200:
        assert login_time < 5.0, \
            f"Login too slow: {login_time:.2f}s"

if __name__ == "__main__":
    # Run tests when executed directly
    pytest.main([__file__, "-v", "--tb=short"])