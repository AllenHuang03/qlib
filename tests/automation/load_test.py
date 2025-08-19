#!/usr/bin/env python3
"""
Load Testing Framework
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive load testing using Locust framework.
Tests system behavior under sustained load and identifies breaking points.
"""

import time
import json
import random
import uuid
from pathlib import Path
from typing import Dict, Any
import argparse

try:
    from locust import HttpUser, task, between, events
    from locust.env import Environment
    from locust.stats import stats_printer, stats_history
    from locust.log import setup_logging
    LOCUST_AVAILABLE = True
except ImportError:
    LOCUST_AVAILABLE = False
    print("Locust not available. Install with: pip install locust")

# Add project root to path
project_root = Path(__file__).parent.parent.parent

class QlibTradingPlatformUser(HttpUser):
    """
    Simulates a user of the Qlib trading platform.
    
    User behaviors:
    1. Registration and authentication
    2. Dashboard access
    3. Portfolio operations
    4. Model interactions
    5. Market data requests
    """
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Called when a user starts - simulate user registration/login"""
        self.user_data = {}
        self.authenticated = False
        
        # Try to authenticate
        if random.choice([True, False]):  # 50% register new, 50% use test account
            self.register_and_login()
        else:
            self.use_test_account()
    
    def register_and_login(self):
        """Register a new user and login"""
        # Generate unique user data
        email = f"load_test_{uuid.uuid4().hex[:8]}@example.com"
        password = "LoadTest123!"
        
        registration_data = {
            'email': email,
            'password': password,
            'firstName': 'Load',
            'lastName': 'Test'
        }
        
        # Register
        with self.client.post("/api/auth/register", 
                             json=registration_data, 
                             catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
                self.user_data = registration_data
            else:
                response.failure(f"Registration failed: {response.status_code}")
                return
        
        # Login
        login_data = {
            'email': email,
            'password': password
        }
        
        with self.client.post("/api/auth/login", 
                             json=login_data, 
                             catch_response=True) as response:
            if response.status_code == 200:
                result = response.json()
                if 'token' in result:
                    self.client.headers.update({'Authorization': f'Bearer {result["token"]}'})
                    self.authenticated = True
                    response.success()
                else:
                    response.failure("Login did not return token")
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    def use_test_account(self):
        """Use a test account for authentication"""
        account_types = ['basic', 'verified', 'premium']
        account_type = random.choice(account_types)
        
        with self.client.post("/api/test-accounts/create", 
                             json={'accountType': account_type}, 
                             catch_response=True) as response:
            if response.status_code in [200, 201]:
                result = response.json()
                if 'token' in result:
                    self.client.headers.update({'Authorization': f'Bearer {result["token"]}'})
                    self.authenticated = True
                    self.user_data['accountType'] = account_type
                    response.success()
                else:
                    response.failure("Test account did not return token")
            else:
                response.failure(f"Test account creation failed: {response.status_code}")
    
    @task(10)
    def view_dashboard(self):
        """Access user dashboard - high frequency task"""
        if not self.authenticated:
            return
        
        with self.client.get("/api/user/dashboard", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            else:
                response.failure(f"Dashboard access failed: {response.status_code}")
    
    @task(8)
    def view_profile(self):
        """Access user profile - frequent task"""
        if not self.authenticated:
            return
        
        with self.client.get("/api/user/profile", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            else:
                response.failure(f"Profile access failed: {response.status_code}")
    
    @task(6)
    def access_models(self):
        """Access trading models - common task"""
        if not self.authenticated:
            return
        
        model_endpoints = [
            "/api/models/basic",
            "/api/models/advanced",
            "/api/models/list"
        ]
        
        endpoint = random.choice(model_endpoints)
        
        with self.client.get(endpoint, catch_response=True) as response:
            if response.status_code in [200, 404]:  # 404 acceptable for some models
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            elif response.status_code == 403:
                response.success()  # Access denied is acceptable for different user types
            else:
                response.failure(f"Model access failed: {response.status_code}")
    
    @task(5)
    def check_market_status(self):
        """Check market status - regular task"""
        if not self.authenticated:
            return
        
        with self.client.get("/api/market/status", catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Market status failed: {response.status_code}")
    
    @task(4)
    def access_portfolio(self):
        """Access portfolio data - regular task"""
        if not self.authenticated:
            return
        
        portfolio_endpoints = [
            "/api/portfolio/summary",
            "/api/portfolio/holdings",
            "/api/portfolio/performance"
        ]
        
        endpoint = random.choice(portfolio_endpoints)
        
        with self.client.get(endpoint, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            else:
                response.failure(f"Portfolio access failed: {response.status_code}")
    
    @task(3)
    def access_backtesting(self):
        """Access backtesting features - occasional task"""
        if not self.authenticated:
            return
        
        backtesting_endpoints = [
            "/api/backtesting/basic",
            "/api/backtesting/advanced",
            "/api/backtesting/results"
        ]
        
        endpoint = random.choice(backtesting_endpoints)
        
        with self.client.get(endpoint, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            elif response.status_code == 403:
                response.success()  # Access denied is acceptable
            else:
                response.failure(f"Backtesting access failed: {response.status_code}")
    
    @task(2)
    def upload_portfolio(self):
        """Upload portfolio file - infrequent but resource-intensive task"""
        if not self.authenticated:
            return
        
        # Only verified+ users can upload
        if self.user_data.get('accountType') in ['basic']:
            return
        
        # Simulate small CSV upload
        csv_content = """symbol,quantity,price,date
AAPL,100,150.00,2024-01-01
GOOGL,50,2800.00,2024-01-01
MSFT,75,350.00,2024-01-01"""
        
        files = {'file': ('test_portfolio.csv', csv_content, 'text/csv')}
        
        with self.client.post("/api/portfolio/upload", 
                             files=files, 
                             catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            elif response.status_code in [400, 422]:
                response.success()  # Validation errors are acceptable
            else:
                response.failure(f"Portfolio upload failed: {response.status_code}")
    
    @task(1)
    def access_ai_insights(self):
        """Access AI insights - premium feature, infrequent"""
        if not self.authenticated:
            return
        
        # Only premium+ users can access AI insights
        if self.user_data.get('accountType') not in ['premium', 'institutional']:
            return
        
        with self.client.get("/api/ai-insights", catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            elif response.status_code == 403:
                response.success()  # Access denied is acceptable
            else:
                response.failure(f"AI insights access failed: {response.status_code}")

class QlibStaffUser(HttpUser):
    """
    Simulates staff users accessing administrative functions.
    Lower frequency but different usage patterns.
    """
    
    wait_time = between(5, 15)  # Staff users work more slowly
    weight = 1  # Lower weight compared to regular users
    
    def on_start(self):
        """Staff user authentication"""
        staff_roles = ['kyc_staff', 'support_staff', 'trading_agent', 'enterprise_admin']
        role = random.choice(staff_roles)
        
        with self.client.post("/api/test-accounts/create", 
                             json={'accountType': 'staff', 'role': role}, 
                             catch_response=True) as response:
            if response.status_code in [200, 201]:
                result = response.json()
                if 'token' in result:
                    self.client.headers.update({'Authorization': f'Bearer {result["token"]}'})
                    self.authenticated = True
                    self.role = role
                    response.success()
                else:
                    response.failure("Staff account did not return token")
                    self.authenticated = False
            else:
                response.failure(f"Staff account creation failed: {response.status_code}")
                self.authenticated = False
    
    @task(5)
    def access_staff_dashboard(self):
        """Access staff-specific dashboard"""
        if not self.authenticated:
            return
        
        dashboards = {
            'kyc_staff': '/api/staff/kyc/dashboard',
            'support_staff': '/api/staff/support/dashboard',
            'trading_agent': '/api/staff/trading/dashboard',
            'enterprise_admin': '/api/admin/dashboard'
        }
        
        endpoint = dashboards.get(self.role, '/api/staff/dashboard')
        
        with self.client.get(endpoint, catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication expired")
                self.authenticated = False
            else:
                response.failure(f"Staff dashboard access failed: {response.status_code}")
    
    @task(3)
    def access_staff_functions(self):
        """Access role-specific staff functions"""
        if not self.authenticated:
            return
        
        functions = {
            'kyc_staff': [
                '/api/staff/kyc/pending-verifications',
                '/api/staff/kyc/document-reviews'
            ],
            'support_staff': [
                '/api/staff/support/tickets',
                '/api/staff/support/user-accounts'
            ],
            'trading_agent': [
                '/api/staff/trading/model-performance',
                '/api/staff/trading/risk-metrics'
            ],
            'enterprise_admin': [
                '/api/admin/users',
                '/api/admin/system-metrics'
            ]
        }
        
        endpoints = functions.get(self.role, ['/api/staff/general'])
        if endpoints:
            endpoint = random.choice(endpoints)
            
            with self.client.get(endpoint, catch_response=True) as response:
                if response.status_code in [200, 404]:
                    response.success()
                elif response.status_code == 401:
                    response.failure("Authentication expired")
                    self.authenticated = False
                else:
                    response.failure(f"Staff function access failed: {response.status_code}")

# Load testing scenarios

def run_load_test(host: str, users: int, spawn_rate: float, run_time: str):
    """Run load test with specified parameters"""
    
    if not LOCUST_AVAILABLE:
        print("Locust is required for load testing. Install with: pip install locust")
        return
    
    # Setup logging
    setup_logging("INFO", None)
    
    # Create environment
    env = Environment(user_classes=[QlibTradingPlatformUser, QlibStaffUser])
    env.create_local_runner()
    
    # Setup event listeners for reporting
    @events.test_start.add_listener
    def on_test_start(environment, **kwargs):
        print(f"🔥 Starting load test: {users} users, {spawn_rate} spawn rate, {run_time} duration")
        print(f"Target: {host}")
    
    @events.test_stop.add_listener  
    def on_test_stop(environment, **kwargs):
        print("🏁 Load test completed")
        
        # Generate summary report
        stats = environment.stats
        
        print("\n📊 LOAD TEST SUMMARY")
        print("=" * 50)
        print(f"Total requests: {stats.total.num_requests}")
        print(f"Failed requests: {stats.total.num_failures}")
        print(f"Failure rate: {stats.total.fail_ratio:.2%}")
        print(f"Average response time: {stats.total.avg_response_time:.2f}ms")
        print(f"95th percentile: {stats.total.get_response_time_percentile(0.95):.2f}ms")
        print(f"99th percentile: {stats.total.get_response_time_percentile(0.99):.2f}ms")
        print(f"Max response time: {stats.total.max_response_time:.2f}ms")
        print(f"RPS: {stats.total.current_rps:.2f}")
        
        # Save detailed results
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        results_file = project_root / 'logs' / 'testing' / f'load_test_results_{timestamp}.json'
        results_file.parent.mkdir(parents=True, exist_ok=True)
        
        results = {
            'timestamp': timestamp,
            'test_parameters': {
                'host': host,
                'users': users,
                'spawn_rate': spawn_rate,
                'run_time': run_time
            },
            'summary': {
                'total_requests': stats.total.num_requests,
                'failed_requests': stats.total.num_failures,
                'failure_rate': stats.total.fail_ratio,
                'avg_response_time': stats.total.avg_response_time,
                'percentile_95': stats.total.get_response_time_percentile(0.95),
                'percentile_99': stats.total.get_response_time_percentile(0.99),
                'max_response_time': stats.total.max_response_time,
                'rps': stats.total.current_rps
            },
            'endpoint_stats': {}
        }
        
        # Endpoint-specific stats
        for endpoint, stat in stats.entries.items():
            if endpoint[1]:  # Has a name
                results['endpoint_stats'][endpoint[1]] = {
                    'method': endpoint[0],
                    'requests': stat.num_requests,
                    'failures': stat.num_failures,
                    'avg_response_time': stat.avg_response_time,
                    'min_response_time': stat.min_response_time,
                    'max_response_time': stat.max_response_time
                }
        
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Detailed results saved to: {results_file}")
        
        # Performance assessment
        print("\n🎯 PERFORMANCE ASSESSMENT")
        print("=" * 50)
        
        if stats.total.fail_ratio > 0.05:  # >5% failure rate
            print("❌ HIGH FAILURE RATE - System unable to handle load")
        elif stats.total.avg_response_time > 5000:  # >5s average
            print("⚠️ SLOW RESPONSE TIMES - Performance degradation detected")
        elif stats.total.get_response_time_percentile(0.95) > 10000:  # >10s 95th percentile
            print("⚠️ HIGH TAIL LATENCY - Some requests very slow")
        else:
            print("✅ ACCEPTABLE PERFORMANCE - System handling load well")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS")
        print("=" * 50)
        
        if stats.total.fail_ratio > 0.1:
            print("- Investigate server errors and capacity limits")
            print("- Consider scaling infrastructure")
        
        if stats.total.avg_response_time > 2000:
            print("- Optimize slow endpoints")
            print("- Review database query performance")
            print("- Consider caching strategies")
        
        if stats.total.current_rps < 10:
            print("- Low throughput detected")
            print("- Review server configuration")
    
    # Start the test
    env.runner.start(users, spawn_rate=spawn_rate)
    
    # Parse run time
    if run_time.endswith('s'):
        duration = int(run_time[:-1])
    elif run_time.endswith('m'):
        duration = int(run_time[:-1]) * 60
    elif run_time.endswith('h'):
        duration = int(run_time[:-1]) * 3600
    else:
        duration = int(run_time)
    
    # Run for specified duration
    import gevent
    gevent.sleep(duration)
    
    # Stop the test
    env.runner.stop()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Qlib Trading Platform Load Test')
    parser.add_argument('--host', default='http://localhost:8000', help='Target host')
    parser.add_argument('--users', type=int, default=50, help='Number of concurrent users')
    parser.add_argument('--spawn-rate', type=float, default=5, help='Users spawned per second')
    parser.add_argument('--time', default='60s', help='Test duration (e.g., 60s, 5m, 1h)')
    
    args = parser.parse_args()
    
    run_load_test(args.host, args.users, args.spawn_rate, args.time)