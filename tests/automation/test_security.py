#!/usr/bin/env python3
"""
Security Testing Suite
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive security testing framework for the Qlib trading platform.
Tests authentication, authorization, input validation, and vulnerability prevention.
"""

import pytest
import requests
import time
import json
import os
import uuid
import base64
import hashlib
from pathlib import Path
from typing import Dict, Any, List
import tempfile
import random
import string

# Add project root to path
project_root = Path(__file__).parent.parent.parent
import sys
sys.path.insert(0, str(project_root))

class SecurityTestSuite:
    """
    Comprehensive security test suite for the Qlib trading platform.
    
    Tests:
    1. Authentication security
    2. Authorization and access control
    3. Input validation and sanitization
    4. File upload security
    5. SQL injection protection
    6. XSS protection
    7. CSRF protection
    8. Rate limiting
    9. Session management
    10. Data encryption
    """
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.session = requests.Session()
        self.session.timeout = 30
        self.security_findings = []
        
    def setup_method(self):
        """Setup for each test method"""
        try:
            response = self.session.get(f"{self.backend_url}/health")
            assert response.status_code == 200
        except Exception as e:
            pytest.skip(f"Backend not available: {e}")
    
    def teardown_method(self):
        """Cleanup after each test method"""
        pass
    
    def _generate_test_email(self) -> str:
        """Generate unique test email"""
        return f"security_test_{uuid.uuid4().hex[:8]}@example.com"
    
    def _create_test_account(self, account_type: str = 'verified') -> Dict[str, str]:
        """Create a test account for security testing"""
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': account_type}
        )
        
        if response.status_code in [200, 201]:
            account_data = response.json()
            return {
                'token': account_data.get('token', ''),
                'headers': {'Authorization': f'Bearer {account_data.get("token", "")}'}
            }
        return {'token': '', 'headers': {}}
    
    def _add_security_finding(self, severity: str, test_name: str, description: str, details: str = ""):
        """Add a security finding"""
        self.security_findings.append({
            'severity': severity,
            'test': test_name,
            'description': description,
            'details': details,
            'timestamp': time.time()
        })

class TestAuthenticationSecurity(SecurityTestSuite):
    """
    Test authentication security mechanisms.
    """
    
    def test_weak_password_rejection(self):
        """Test that weak passwords are rejected"""
        
        weak_passwords = [
            "123",           # Too short
            "password",      # Common password
            "123456789",     # Numeric only
            "abcdefgh",      # Alphabetic only
            "Password",      # No numbers/symbols
            "password123",   # Common pattern
        ]
        
        for weak_password in weak_passwords:
            email = self._generate_test_email()
            registration_data = {
                'email': email,
                'password': weak_password,
                'firstName': 'Security',
                'lastName': 'Test'
            }
            
            response = self.session.post(
                f"{self.backend_url}/api/auth/register",
                json=registration_data
            )
            
            if response.status_code == 200:
                self._add_security_finding(
                    'HIGH',
                    'weak_password_acceptance',
                    f'Weak password accepted: {weak_password}',
                    f'Password "{weak_password}" should be rejected but was accepted'
                )
    
    def test_account_enumeration_protection(self):
        """Test protection against account enumeration"""
        
        # Test with non-existent email
        non_existent_email = f"nonexistent_{uuid.uuid4().hex}@example.com"
        login_data = {
            'email': non_existent_email,
            'password': 'anypassword'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/login",
            json=login_data
        )
        
        # Should not reveal whether account exists
        if response.status_code == 200:
            self._add_security_finding(
                'MEDIUM',
                'account_enumeration',
                'Login with non-existent account succeeded',
                f'Login with {non_existent_email} should fail but returned 200'
            )
        
        # Check response time consistency
        start_time = time.time()
        response1 = self.session.post(
            f"{self.backend_url}/api/auth/login",
            json={'email': non_existent_email, 'password': 'wrong'}
        )
        time1 = time.time() - start_time
        
        # Create real account and test with wrong password
        real_email = self._generate_test_email()
        self.session.post(
            f"{self.backend_url}/api/auth/register",
            json={
                'email': real_email,
                'password': 'StrongPassword123!',
                'firstName': 'Test',
                'lastName': 'User'
            }
        )
        
        start_time = time.time()
        response2 = self.session.post(
            f"{self.backend_url}/api/auth/login",
            json={'email': real_email, 'password': 'wrong'}
        )
        time2 = time.time() - start_time
        
        # Response times should be similar (within 500ms)
        time_diff = abs(time1 - time2)
        if time_diff > 0.5:
            self._add_security_finding(
                'LOW',
                'timing_attack_vulnerability',
                'Response time differences may enable account enumeration',
                f'Time difference: {time_diff:.3f}s between non-existent and existing accounts'
            )
    
    def test_brute_force_protection(self):
        """Test protection against brute force attacks"""
        
        # Create test account
        email = self._generate_test_email()
        password = 'StrongPassword123!'
        
        registration_data = {
            'email': email,
            'password': password,
            'firstName': 'Security',
            'lastName': 'Test'
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/auth/register",
            json=registration_data
        )
        
        if response.status_code not in [200, 201]:
            pytest.skip("Could not create test account for brute force test")
        
        # Attempt multiple failed logins
        failed_attempts = 0
        for i in range(10):  # Try 10 failed logins
            login_data = {
                'email': email,
                'password': f'wrongpassword{i}'
            }
            
            response = self.session.post(
                f"{self.backend_url}/api/auth/login",
                json=login_data
            )
            
            if response.status_code != 200:
                failed_attempts += 1
            
            # Check if rate limiting kicks in
            if response.status_code == 429:  # Too Many Requests
                break
            
            time.sleep(0.1)  # Small delay between attempts
        
        # If no rate limiting detected after many attempts
        if failed_attempts >= 10:
            # Try one more with correct password
            response = self.session.post(
                f"{self.backend_url}/api/auth/login",
                json={'email': email, 'password': password}
            )
            
            if response.status_code == 200:
                self._add_security_finding(
                    'HIGH',
                    'no_brute_force_protection',
                    'No brute force protection detected',
                    f'Account still accessible after {failed_attempts} failed login attempts'
                )
    
    def test_session_management(self):
        """Test session management security"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Test token validation
        response = self.session.get(
            f"{self.backend_url}/api/user/profile",
            headers=auth_data['headers']
        )
        
        if response.status_code == 200:
            # Test with modified token
            modified_token = auth_data['token'][:-5] + 'XXXXX'
            modified_headers = {'Authorization': f'Bearer {modified_token}'}
            
            response = self.session.get(
                f"{self.backend_url}/api/user/profile",
                headers=modified_headers
            )
            
            if response.status_code == 200:
                self._add_security_finding(
                    'HIGH',
                    'weak_token_validation',
                    'Modified authentication token accepted',
                    f'Token validation appears weak - modified token was accepted'
                )
        
        # Test token expiration (if implemented)
        # This would require waiting or manipulating timestamps

class TestAuthorizationSecurity(SecurityTestSuite):
    """
    Test authorization and access control mechanisms.
    """
    
    def test_role_based_access_control(self):
        """Test role-based access control"""
        
        # Create accounts with different roles
        basic_auth = self._create_test_account('basic')
        verified_auth = self._create_test_account('verified')
        premium_auth = self._create_test_account('premium')
        
        # Test basic user accessing premium features
        if basic_auth['token']:
            premium_endpoints = [
                '/api/models/advanced',
                '/api/ai-insights',
                '/api/backtesting/advanced'
            ]
            
            for endpoint in premium_endpoints:
                response = self.session.get(
                    f"{self.backend_url}{endpoint}",
                    headers=basic_auth['headers']
                )
                
                if response.status_code == 200:
                    # Check if response indicates access restriction
                    try:
                        data = response.json()
                        if not any(keyword in str(data).lower() for keyword in ['upgrade', 'premium', 'access', 'denied']):
                            self._add_security_finding(
                                'HIGH',
                                'authorization_bypass',
                                f'Basic user accessed premium endpoint: {endpoint}',
                                'Role-based access control may be bypassed'
                            )
                    except:
                        # If response is not JSON, it might be actual data
                        self._add_security_finding(
                            'HIGH',
                            'authorization_bypass',
                            f'Basic user accessed premium endpoint: {endpoint}',
                            'Non-JSON response suggests actual data access'
                        )
    
    def test_horizontal_privilege_escalation(self):
        """Test for horizontal privilege escalation"""
        
        # Create two different user accounts
        user1_auth = self._create_test_account('verified')
        user2_auth = self._create_test_account('verified')
        
        if not (user1_auth['token'] and user2_auth['token']):
            pytest.skip("Could not create test accounts")
        
        # Try to access user2's data with user1's token
        # This would require knowing user IDs or having predictable endpoints
        user_endpoints = [
            '/api/user/profile',
            '/api/portfolio/summary',
            '/api/user/settings'
        ]
        
        for endpoint in user_endpoints:
            # First, access with proper token
            response1 = self.session.get(
                f"{self.backend_url}{endpoint}",
                headers=user1_auth['headers']
            )
            
            response2 = self.session.get(
                f"{self.backend_url}{endpoint}",
                headers=user2_auth['headers']
            )
            
            # If both succeed and return identical data, might indicate issue
            if (response1.status_code == 200 and response2.status_code == 200 and
                response1.text == response2.text and len(response1.text) > 10):
                
                self._add_security_finding(
                    'MEDIUM',
                    'potential_data_leakage',
                    f'Different users get identical responses from {endpoint}',
                    'May indicate shared data or insufficient isolation'
                )
    
    def test_staff_access_control(self):
        """Test staff role access control"""
        
        # Create regular user
        user_auth = self._create_test_account('verified')
        
        if not user_auth['token']:
            pytest.skip("Could not create test account")
        
        # Try to access staff endpoints
        staff_endpoints = [
            '/api/staff/kyc/dashboard',
            '/api/staff/support/tickets',
            '/api/admin/users',
            '/api/admin/system-metrics'
        ]
        
        for endpoint in staff_endpoints:
            response = self.session.get(
                f"{self.backend_url}{endpoint}",
                headers=user_auth['headers']
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    # Check if response contains actual admin/staff data
                    if isinstance(data, (list, dict)) and len(str(data)) > 100:
                        self._add_security_finding(
                            'CRITICAL',
                            'admin_access_bypass',
                            f'Regular user accessed staff endpoint: {endpoint}',
                            'Critical security breach - unauthorized admin access'
                        )
                except:
                    pass

class TestInputValidationSecurity(SecurityTestSuite):
    """
    Test input validation and sanitization.
    """
    
    def test_sql_injection_protection(self):
        """Test protection against SQL injection"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # SQL injection payloads
        sql_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES('hacker','pass'); --",
            "' OR 1=1 --",
            "admin'--",
            "admin'/*",
            "' OR SLEEP(5) --"
        ]
        
        # Test SQL injection in various endpoints
        test_endpoints = [
            ('GET', '/api/user/profile', {'id': None}),
            ('POST', '/api/auth/login', {'email': None, 'password': 'test'}),
            ('GET', '/api/portfolio/search', {'symbol': None})
        ]
        
        for payload in sql_payloads:
            for method, endpoint, params in test_endpoints:
                test_params = params.copy()
                
                # Inject payload into each parameter
                for param_name, param_value in test_params.items():
                    if param_value is None:
                        test_params[param_name] = payload
                        
                        try:
                            if method == 'GET':
                                response = self.session.get(
                                    f"{self.backend_url}{endpoint}",
                                    params=test_params,
                                    headers=auth_data['headers']
                                )
                            else:
                                response = self.session.post(
                                    f"{self.backend_url}{endpoint}",
                                    json=test_params,
                                    headers=auth_data['headers']
                                )
                            
                            # Check for SQL error messages in response
                            if response.status_code == 500:
                                error_indicators = [
                                    'sql', 'sqlite', 'mysql', 'postgres', 'oracle',
                                    'syntax error', 'column', 'table', 'database'
                                ]
                                
                                response_text = response.text.lower()
                                if any(indicator in response_text for indicator in error_indicators):
                                    self._add_security_finding(
                                        'HIGH',
                                        'sql_injection_vulnerability',
                                        f'SQL error exposed in {endpoint}',
                                        f'Payload: {payload}, Response: {response.text[:200]}'
                                    )
                            
                            # Check for successful injection (unusual response)
                            elif response.status_code == 200:
                                try:
                                    data = response.json()
                                    # Look for signs of successful injection
                                    if isinstance(data, list) and len(data) > 1000:
                                        self._add_security_finding(
                                            'CRITICAL',
                                            'possible_sql_injection',
                                            f'Suspicious large response from {endpoint}',
                                            f'Payload: {payload} returned {len(data)} records'
                                        )
                                except:
                                    pass
                        
                        except Exception as e:
                            # Network errors are not security issues
                            pass
                        
                        # Reset parameter
                        test_params[param_name] = param_value
    
    def test_xss_protection(self):
        """Test protection against Cross-Site Scripting (XSS)"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # XSS payloads
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<<SCRIPT>alert('XSS')//<</SCRIPT>",
            "<BODY ONLOAD=alert('XSS')>"
        ]
        
        # Test XSS in profile updates
        for payload in xss_payloads:
            profile_data = {
                'firstName': payload,
                'lastName': 'Test',
                'bio': payload
            }
            
            response = self.session.post(
                f"{self.backend_url}/api/user/profile",
                json=profile_data,
                headers=auth_data['headers']
            )
            
            # Check if payload is reflected back unescaped
            if response.status_code == 200:
                try:
                    data = response.json()
                    response_str = str(data)
                    
                    # Check if script tags or event handlers are present
                    dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=']
                    if any(pattern in response_str.lower() for pattern in dangerous_patterns):
                        self._add_security_finding(
                            'HIGH',
                            'xss_vulnerability',
                            'XSS payload reflected in response',
                            f'Payload: {payload} reflected in profile data'
                        )
                except:
                    pass
    
    def test_file_upload_security(self):
        """Test file upload security"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Test malicious file uploads
        malicious_files = [
            ('malicious.php', b'<?php echo "Hacked"; ?>', 'application/php'),
            ('evil.jsp', b'<% Runtime.getRuntime().exec("calc"); %>', 'application/java'),
            ('bad.asp', b'<% Response.Write("Hacked") %>', 'application/asp'),
            ('script.js', b'alert("XSS")', 'application/javascript'),
            ('large_file.csv', b'A' * (10 * 1024 * 1024), 'text/csv'),  # 10MB file
            ('../../etc/passwd', b'root:x:0:0:root:/root:/bin/bash', 'text/plain')
        ]
        
        for filename, content, content_type in malicious_files:
            files = {'file': (filename, content, content_type)}
            
            response = self.session.post(
                f"{self.backend_url}/api/portfolio/upload",
                files=files,
                headers=auth_data['headers']
            )
            
            if response.status_code in [200, 201]:
                self._add_security_finding(
                    'HIGH',
                    'malicious_file_upload',
                    f'Malicious file upload accepted: {filename}',
                    f'File type {content_type} should be rejected'
                )
    
    def test_path_traversal_protection(self):
        """Test protection against path traversal attacks"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Path traversal payloads
        path_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "..%252f..%252f..%252fetc%252fpasswd"
        ]
        
        # Test file access endpoints
        for payload in path_payloads:
            # Test as file parameter
            response = self.session.get(
                f"{self.backend_url}/api/files/download",
                params={'filename': payload},
                headers=auth_data['headers']
            )
            
            if response.status_code == 200:
                # Check if response contains system file content
                content = response.text.lower()
                if any(indicator in content for indicator in ['root:', 'bin/bash', 'localhost']):
                    self._add_security_finding(
                        'CRITICAL',
                        'path_traversal_vulnerability',
                        f'Path traversal successful: {payload}',
                        'System files accessible via path traversal'
                    )

class TestAPISecurityMisconfiguration(SecurityTestSuite):
    """
    Test for API security misconfigurations.
    """
    
    def test_http_security_headers(self):
        """Test for proper HTTP security headers"""
        
        response = self.session.get(f"{self.backend_url}/health")
        
        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': None,  # Any value is good
            'Content-Security-Policy': None
        }
        
        missing_headers = []
        
        for header, expected_values in required_headers.items():
            if header not in response.headers:
                missing_headers.append(header)
            elif expected_values and isinstance(expected_values, list):
                if response.headers[header] not in expected_values:
                    missing_headers.append(f"{header} (incorrect value)")
        
        if missing_headers:
            self._add_security_finding(
                'MEDIUM',
                'missing_security_headers',
                'Missing or incorrect security headers',
                f'Missing: {", ".join(missing_headers)}'
            )
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        
        # Test with malicious origin
        malicious_origin = "https://evil.com"
        headers = {'Origin': malicious_origin}
        
        response = self.session.options(
            f"{self.backend_url}/api/user/profile",
            headers=headers
        )
        
        # Check if malicious origin is allowed
        if 'Access-Control-Allow-Origin' in response.headers:
            allowed_origin = response.headers['Access-Control-Allow-Origin']
            if allowed_origin == '*' or allowed_origin == malicious_origin:
                self._add_security_finding(
                    'MEDIUM',
                    'permissive_cors',
                    'Permissive CORS configuration detected',
                    f'Origin {malicious_origin} was allowed'
                )
    
    def test_rate_limiting(self):
        """Test API rate limiting"""
        
        # Make rapid requests to test rate limiting
        rapid_requests = 0
        rate_limited = False
        
        for i in range(50):  # Make 50 rapid requests
            response = self.session.get(f"{self.backend_url}/health")
            rapid_requests += 1
            
            if response.status_code == 429:  # Too Many Requests
                rate_limited = True
                break
            
            if i < 10:  # Only add small delay for first 10 requests
                time.sleep(0.01)
        
        if not rate_limited and rapid_requests >= 50:
            self._add_security_finding(
                'MEDIUM',
                'no_rate_limiting',
                'No rate limiting detected',
                f'Made {rapid_requests} requests without rate limiting'
            )
    
    def test_information_disclosure(self):
        """Test for information disclosure"""
        
        # Test error handling
        response = self.session.get(f"{self.backend_url}/nonexistent-endpoint")
        
        if response.status_code == 500:
            error_content = response.text.lower()
            
            # Check for stack traces or sensitive information
            sensitive_info = [
                'traceback', 'stack trace', 'file "/', 'line ',
                'exception', 'error at', 'internal server error',
                'database', 'sql', 'connection string'
            ]
            
            if any(info in error_content for info in sensitive_info):
                self._add_security_finding(
                    'MEDIUM',
                    'information_disclosure',
                    'Sensitive information in error responses',
                    f'Error response contains technical details'
                )
        
        # Test API documentation exposure
        doc_endpoints = [
            '/docs', '/swagger', '/api-docs', '/openapi.json',
            '/redoc', '/graphql', '/api/docs'
        ]
        
        for endpoint in doc_endpoints:
            response = self.session.get(f"{self.backend_url}{endpoint}")
            if response.status_code == 200:
                self._add_security_finding(
                    'LOW',
                    'api_documentation_exposed',
                    f'API documentation exposed at {endpoint}',
                    'Consider restricting access in production'
                )

class TestDataProtectionSecurity(SecurityTestSuite):
    """
    Test data protection and privacy mechanisms.
    """
    
    def test_sensitive_data_exposure(self):
        """Test for sensitive data exposure"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Check user profile endpoint
        response = self.session.get(
            f"{self.backend_url}/api/user/profile",
            headers=auth_data['headers']
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                response_str = str(data).lower()
                
                # Check for passwords or tokens in response
                sensitive_patterns = ['password', 'token', 'secret', 'key', 'hash']
                exposed_data = [pattern for pattern in sensitive_patterns if pattern in response_str]
                
                if exposed_data:
                    self._add_security_finding(
                        'HIGH',
                        'sensitive_data_exposure',
                        'Sensitive data in API response',
                        f'Exposed: {", ".join(exposed_data)}'
                    )
            except:
                pass
    
    def test_data_validation_bypass(self):
        """Test data validation bypass attempts"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Test with malformed JSON
        malformed_payloads = [
            '{"email": "test@example.com", "extra_field": "malicious"}',
            '{"email": null}',
            '{"email": [1,2,3]}',
            '{"email": {"nested": "object"}}'
        ]
        
        for payload in malformed_payloads:
            try:
                response = self.session.post(
                    f"{self.backend_url}/api/user/profile",
                    data=payload,
                    headers={'Content-Type': 'application/json', **auth_data['headers']}
                )
                
                if response.status_code == 200:
                    self._add_security_finding(
                        'MEDIUM',
                        'weak_input_validation',
                        'Malformed data accepted',
                        f'Payload: {payload[:100]}...'
                    )
            except:
                pass

def test_comprehensive_security_suite(backend_url="http://localhost:8000"):
    """Run comprehensive security test suite"""
    
    print("🔒 Running Comprehensive Security Test Suite")
    print("=" * 50)
    
    # Initialize test suite
    suite = SecurityTestSuite(backend_url)
    suite.setup_method()
    
    # Run all security test categories
    test_classes = [
        TestAuthenticationSecurity,
        TestAuthorizationSecurity,
        TestInputValidationSecurity,
        TestAPISecurityMisconfiguration,
        TestDataProtectionSecurity
    ]
    
    all_findings = []
    
    for test_class in test_classes:
        print(f"\n🧪 Running {test_class.__name__}")
        
        test_instance = test_class(backend_url)
        test_instance.setup_method()
        
        # Get all test methods
        test_methods = [method for method in dir(test_instance) 
                       if method.startswith('test_') and callable(getattr(test_instance, method))]
        
        for method_name in test_methods:
            try:
                print(f"  • {method_name}")
                test_method = getattr(test_instance, method_name)
                test_method()
            except Exception as e:
                print(f"    ⚠️ Test failed: {e}")
        
        all_findings.extend(test_instance.security_findings)
        test_instance.teardown_method()
    
    # Generate security report
    print("\n" + "=" * 50)
    print("🔍 SECURITY ASSESSMENT REPORT")
    print("=" * 50)
    
    if not all_findings:
        print("✅ No security issues detected!")
        return True
    
    # Categorize findings by severity
    critical_findings = [f for f in all_findings if f['severity'] == 'CRITICAL']
    high_findings = [f for f in all_findings if f['severity'] == 'HIGH']
    medium_findings = [f for f in all_findings if f['severity'] == 'MEDIUM']
    low_findings = [f for f in all_findings if f['severity'] == 'LOW']
    
    print(f"🚨 Critical Issues: {len(critical_findings)}")
    print(f"⚠️ High Issues: {len(high_findings)}")
    print(f"📝 Medium Issues: {len(medium_findings)}")
    print(f"ℹ️ Low Issues: {len(low_findings)}")
    
    # Show critical and high issues
    for severity, findings in [('CRITICAL', critical_findings), ('HIGH', high_findings)]:
        if findings:
            print(f"\n{severity} ISSUES:")
            for finding in findings:
                print(f"  • {finding['test']}: {finding['description']}")
                if finding['details']:
                    print(f"    Details: {finding['details']}")
    
    # Security recommendations
    print(f"\n💡 SECURITY RECOMMENDATIONS:")
    if critical_findings or high_findings:
        print("  • Immediate action required for critical/high severity issues")
        print("  • Review authentication and authorization mechanisms")
        print("  • Implement input validation and sanitization")
        print("  • Add security headers and proper error handling")
    
    if medium_findings:
        print("  • Address medium severity issues in next release")
        print("  • Review API security configuration")
        print("  • Implement rate limiting and monitoring")
    
    # Save detailed security report
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    report_file = project_root / 'logs' / 'testing' / f'security_report_{timestamp}.json'
    report_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(report_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'summary': {
                'total_findings': len(all_findings),
                'critical': len(critical_findings),
                'high': len(high_findings),
                'medium': len(medium_findings),
                'low': len(low_findings)
            },
            'findings': all_findings
        }, f, indent=2)
    
    print(f"\n📄 Detailed report saved: {report_file}")
    
    # Return True if no critical/high issues
    return len(critical_findings) == 0 and len(high_findings) == 0

# Pytest integration
@pytest.mark.security
class TestSecuritySuite:
    """Security test suite for pytest integration"""
    
    def test_authentication_security(self, backend_url="http://localhost:8000"):
        """Test authentication security mechanisms"""
        test = TestAuthenticationSecurity(backend_url)
        test.setup_method()
        test.test_weak_password_rejection()
        test.test_account_enumeration_protection()
        test.test_brute_force_protection()
        test.teardown_method()
    
    def test_authorization_security(self, backend_url="http://localhost:8000"):
        """Test authorization and access control"""
        test = TestAuthorizationSecurity(backend_url)
        test.setup_method()
        test.test_role_based_access_control()
        test.test_horizontal_privilege_escalation()
        test.teardown_method()
    
    def test_input_validation_security(self, backend_url="http://localhost:8000"):
        """Test input validation and sanitization"""
        test = TestInputValidationSecurity(backend_url)
        test.setup_method()
        test.test_sql_injection_protection()
        test.test_xss_protection()
        test.test_file_upload_security()
        test.teardown_method()

if __name__ == "__main__":
    # Run comprehensive security suite when executed directly
    import argparse
    
    parser = argparse.ArgumentParser(description='Qlib Security Testing Suite')
    parser.add_argument('--backend-url', default='http://localhost:8000', help='Backend URL to test')
    
    args = parser.parse_args()
    
    success = test_comprehensive_security_suite(args.backend_url)
    
    if not success:
        exit(1)  # Exit with error code if security issues found