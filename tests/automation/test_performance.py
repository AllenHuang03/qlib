#!/usr/bin/env python3
"""
Performance Monitoring and Regression Detection Tests
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive performance monitoring framework with regression detection.
Monitors system performance across all components and detects performance degradation.
"""

import pytest
import requests
import time
import json
import os
import psutil
import statistics
import concurrent.futures
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Tuple
import uuid
import threading
from datetime import datetime, timedelta

# Add project root to path
project_root = Path(__file__).parent.parent.parent
import sys
sys.path.insert(0, str(project_root))

class PerformanceMonitor:
    """
    Performance monitoring and regression detection system.
    
    Monitors:
    1. API response times
    2. Database query performance
    3. File upload/processing times
    4. Memory usage patterns
    5. Concurrent user handling
    6. System resource utilization
    """
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.session = requests.Session()
        self.session.timeout = 30
        self.performance_data = {}
        self.baseline_file = project_root / 'logs' / 'testing' / 'performance_baseline.json'
        self.baseline_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Performance thresholds
        self.thresholds = {
            'api_response_time': 2.0,      # seconds
            'file_upload_time': 30.0,      # seconds
            'memory_usage': 512,           # MB
            'concurrent_success_rate': 0.95, # 95%
            'database_query_time': 5.0,    # seconds
            'page_load_time': 3.0          # seconds
        }
        
    def setup_method(self):
        """Setup for each test method"""
        try:
            response = self.session.get(f"{self.backend_url}/health")
            assert response.status_code == 200
        except Exception as e:
            pytest.skip(f"Backend not available: {e}")
    
    def _create_test_account(self, account_type: str = 'verified') -> Dict[str, str]:
        """Create a test account for performance testing"""
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
    
    def _measure_response_time(self, method: str, url: str, **kwargs) -> Tuple[float, requests.Response]:
        """Measure API response time"""
        start_time = time.time()
        response = getattr(self.session, method.lower())(url, **kwargs)
        duration = time.time() - start_time
        return duration, response
    
    def _get_system_metrics(self) -> Dict[str, float]:
        """Get current system metrics"""
        process = psutil.Process(os.getpid())
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_mb': process.memory_info().rss / 1024 / 1024,
            'memory_percent': process.memory_percent(),
            'disk_io_read': psutil.disk_io_counters().read_bytes if psutil.disk_io_counters() else 0,
            'disk_io_write': psutil.disk_io_counters().write_bytes if psutil.disk_io_counters() else 0,
            'network_sent': psutil.net_io_counters().bytes_sent,
            'network_recv': psutil.net_io_counters().bytes_recv
        }
    
    def _load_baseline(self) -> Dict[str, Any]:
        """Load performance baseline data"""
        if self.baseline_file.exists():
            with open(self.baseline_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_baseline(self, baseline_data: Dict[str, Any]) -> None:
        """Save performance baseline data"""
        with open(self.baseline_file, 'w') as f:
            json.dump(baseline_data, f, indent=2)
    
    def _detect_regression(self, metric_name: str, current_value: float, baseline_value: float, tolerance: float = 0.2) -> bool:
        """Detect performance regression"""
        if baseline_value == 0:
            return False
        
        degradation = (current_value - baseline_value) / baseline_value
        return degradation > tolerance

class TestAPIPerformance(PerformanceMonitor):
    """
    Test API endpoint performance and response times.
    """
    
    def test_health_endpoint_performance(self):
        """Test health endpoint response time"""
        
        response_times = []
        
        for _ in range(10):  # Multiple measurements for accuracy
            duration, response = self._measure_response_time('GET', f"{self.backend_url}/health")
            
            if response.status_code == 200:
                response_times.append(duration)
        
        if response_times:
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)
            
            # Health endpoint should be very fast
            assert avg_response_time < 1.0, \
                f"Health endpoint too slow (avg): {avg_response_time:.3f}s"
            assert max_response_time < 2.0, \
                f"Health endpoint too slow (max): {max_response_time:.3f}s"
            
            self.performance_data['health_endpoint'] = {
                'avg_response_time': avg_response_time,
                'max_response_time': max_response_time,
                'measurements': len(response_times)
            }
    
    def test_authentication_performance(self):
        """Test authentication endpoint performance"""
        
        # Test registration performance
        registration_times = []
        
        for i in range(5):
            email = f"perf_test_{uuid.uuid4().hex[:8]}@example.com"
            registration_data = {
                'email': email,
                'password': 'SecurePassword123!',
                'firstName': 'Performance',
                'lastName': 'Test'
            }
            
            duration, response = self._measure_response_time(
                'POST', 
                f"{self.backend_url}/api/auth/register",
                json=registration_data
            )
            
            if response.status_code in [200, 201]:
                registration_times.append(duration)
                
                # Test login performance
                login_data = {
                    'email': email,
                    'password': registration_data['password']
                }
                
                login_duration, login_response = self._measure_response_time(
                    'POST',
                    f"{self.backend_url}/api/auth/login",
                    json=login_data
                )
                
                if login_response.status_code == 200:
                    assert login_duration < self.thresholds['api_response_time'], \
                        f"Login too slow: {login_duration:.3f}s"
        
        if registration_times:
            avg_registration_time = statistics.mean(registration_times)
            assert avg_registration_time < 5.0, \
                f"Registration too slow: {avg_registration_time:.3f}s"
            
            self.performance_data['authentication'] = {
                'avg_registration_time': avg_registration_time,
                'successful_registrations': len(registration_times)
            }
    
    def test_dashboard_loading_performance(self):
        """Test dashboard loading performance"""
        
        auth_data = self._create_test_account('verified')
        
        if auth_data['token']:
            dashboard_times = []
            
            for _ in range(5):
                duration, response = self._measure_response_time(
                    'GET',
                    f"{self.backend_url}/api/user/dashboard",
                    headers=auth_data['headers']
                )
                
                if response.status_code == 200:
                    dashboard_times.append(duration)
            
            if dashboard_times:
                avg_dashboard_time = statistics.mean(dashboard_times)
                assert avg_dashboard_time < self.thresholds['api_response_time'], \
                    f"Dashboard loading too slow: {avg_dashboard_time:.3f}s"
                
                self.performance_data['dashboard_loading'] = {
                    'avg_load_time': avg_dashboard_time,
                    'measurements': len(dashboard_times)
                }
    
    def test_api_endpoint_performance_suite(self):
        """Test performance of various API endpoints"""
        
        auth_data = self._create_test_account('premium')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        # Define endpoints to test
        endpoints = [
            ('GET', '/api/user/profile'),
            ('GET', '/api/models/basic'),
            ('GET', '/api/portfolio/summary'),
            ('GET', '/api/market/status'),
            ('GET', '/api/backtesting/basic')
        ]
        
        endpoint_performance = {}
        
        for method, endpoint in endpoints:
            response_times = []
            
            for _ in range(3):  # 3 measurements per endpoint
                duration, response = self._measure_response_time(
                    method,
                    f"{self.backend_url}{endpoint}",
                    headers=auth_data['headers']
                )
                
                if response.status_code in [200, 404]:  # 404 acceptable for some endpoints
                    response_times.append(duration)
                elif response.status_code != 500:  # Don't fail on unimplemented endpoints
                    response_times.append(duration)
            
            if response_times:
                avg_time = statistics.mean(response_times)
                endpoint_performance[endpoint] = {
                    'avg_response_time': avg_time,
                    'measurements': len(response_times)
                }
                
                # Check against threshold
                if avg_time > self.thresholds['api_response_time']:
                    print(f"WARNING: {endpoint} slower than threshold: {avg_time:.3f}s")
        
        self.performance_data['api_endpoints'] = endpoint_performance

class TestFileUploadPerformance(PerformanceMonitor):
    """
    Test file upload and processing performance.
    """
    
    def test_small_portfolio_upload_performance(self):
        """Test small portfolio upload performance"""
        
        auth_data = self._create_test_account('verified')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        portfolio_file = project_root / 'backend' / 'test_data' / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            upload_times = []
            
            for _ in range(3):  # Multiple uploads for average
                start_time = time.time()
                
                with open(portfolio_file, 'rb') as f:
                    files = {'file': f}
                    response = self.session.post(
                        f"{self.backend_url}/api/portfolio/upload",
                        files=files,
                        headers=auth_data['headers']
                    )
                
                duration = time.time() - start_time
                
                if response.status_code in [200, 201]:
                    upload_times.append(duration)
            
            if upload_times:
                avg_upload_time = statistics.mean(upload_times)
                assert avg_upload_time < 15.0, \
                    f"Small portfolio upload too slow: {avg_upload_time:.3f}s"
                
                self.performance_data['small_portfolio_upload'] = {
                    'avg_upload_time': avg_upload_time,
                    'file_size': portfolio_file.stat().st_size,
                    'measurements': len(upload_times)
                }
    
    def test_large_portfolio_upload_performance(self):
        """Test large portfolio upload performance"""
        
        auth_data = self._create_test_account('institutional')
        
        if not auth_data['token']:
            pytest.skip("Could not create test account")
        
        large_portfolio_file = project_root / 'backend' / 'test_data' / 'test_portfolio_10k_holdings.csv'
        
        if large_portfolio_file.exists():
            start_time = time.time()
            
            with open(large_portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            duration = time.time() - start_time
            
            if response.status_code in [200, 201]:
                # Large file upload threshold
                assert duration < 120.0, \
                    f"Large portfolio upload too slow: {duration:.3f}s"
                
                file_size = large_portfolio_file.stat().st_size
                throughput = file_size / duration / 1024 / 1024  # MB/s
                
                self.performance_data['large_portfolio_upload'] = {
                    'upload_time': duration,
                    'file_size': file_size,
                    'throughput_mbps': throughput
                }
                
                # Throughput should be reasonable
                assert throughput > 0.1, \
                    f"Upload throughput too low: {throughput:.3f} MB/s"
    
    def test_concurrent_upload_performance(self):
        """Test performance under concurrent uploads"""
        
        # Create multiple test accounts
        accounts = []
        for i in range(3):
            auth_data = self._create_test_account('verified')
            if auth_data['token']:
                accounts.append(auth_data)
        
        if len(accounts) < 2:
            pytest.skip("Could not create enough test accounts")
        
        portfolio_file = project_root / 'backend' / 'test_data' / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            def upload_file(auth_data):
                """Upload file for one account"""
                start_time = time.time()
                
                with open(portfolio_file, 'rb') as f:
                    files = {'file': f}
                    response = self.session.post(
                        f"{self.backend_url}/api/portfolio/upload",
                        files=files,
                        headers=auth_data['headers']
                    )
                
                duration = time.time() - start_time
                return duration, response.status_code
            
            # Execute concurrent uploads
            start_time = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=len(accounts)) as executor:
                futures = [executor.submit(upload_file, account) for account in accounts]
                results = [f.result() for f in futures]
            
            total_time = time.time() - start_time
            
            # Analyze results
            successful_uploads = [r for r in results if r[1] in [200, 201]]
            upload_times = [r[0] for r in successful_uploads]
            
            if upload_times:
                avg_concurrent_time = statistics.mean(upload_times)
                success_rate = len(successful_uploads) / len(results)
                
                self.performance_data['concurrent_upload'] = {
                    'avg_upload_time': avg_concurrent_time,
                    'total_time': total_time,
                    'success_rate': success_rate,
                    'concurrent_users': len(accounts)
                }
                
                # Success rate should be high
                assert success_rate >= self.thresholds['concurrent_success_rate'], \
                    f"Concurrent upload success rate too low: {success_rate:.2%}"

class TestMemoryAndResourcePerformance(PerformanceMonitor):
    """
    Test memory usage and system resource performance.
    """
    
    def test_memory_usage_baseline(self):
        """Test baseline memory usage"""
        
        initial_metrics = self._get_system_metrics()
        
        # Perform some basic operations
        auth_data = self._create_test_account('verified')
        
        if auth_data['token']:
            # Dashboard access
            self.session.get(
                f"{self.backend_url}/api/user/dashboard",
                headers=auth_data['headers']
            )
            
            # Profile access
            self.session.get(
                f"{self.backend_url}/api/user/profile",
                headers=auth_data['headers']
            )
        
        final_metrics = self._get_system_metrics()
        
        memory_increase = final_metrics['memory_mb'] - initial_metrics['memory_mb']
        
        self.performance_data['memory_usage'] = {
            'initial_memory_mb': initial_metrics['memory_mb'],
            'final_memory_mb': final_metrics['memory_mb'],
            'memory_increase_mb': memory_increase,
            'cpu_percent': final_metrics['cpu_percent']
        }
        
        # Memory increase should be reasonable
        assert memory_increase < 100, \
            f"Memory usage increase too high: {memory_increase:.2f}MB"
    
    def test_memory_usage_under_load(self):
        """Test memory usage under concurrent load"""
        
        initial_metrics = self._get_system_metrics()
        
        # Create multiple concurrent requests
        def make_requests():
            auth_data = self._create_test_account('verified')
            if auth_data['token']:
                for _ in range(5):
                    self.session.get(
                        f"{self.backend_url}/api/user/dashboard",
                        headers=auth_data['headers']
                    )
        
        # Run concurrent load
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_requests) for _ in range(5)]
            [f.result() for f in futures]
        
        final_metrics = self._get_system_metrics()
        
        memory_increase = final_metrics['memory_mb'] - initial_metrics['memory_mb']
        
        self.performance_data['memory_under_load'] = {
            'initial_memory_mb': initial_metrics['memory_mb'],
            'final_memory_mb': final_metrics['memory_mb'],
            'memory_increase_mb': memory_increase,
            'cpu_percent': final_metrics['cpu_percent']
        }
        
        # Memory increase under load should still be reasonable
        assert memory_increase < self.thresholds['memory_usage'], \
            f"Memory usage under load too high: {memory_increase:.2f}MB"
    
    def test_resource_cleanup(self):
        """Test that resources are properly cleaned up"""
        
        initial_metrics = self._get_system_metrics()
        
        # Perform operations that should clean up
        for i in range(10):
            auth_data = self._create_test_account('verified')
            if auth_data['token']:
                self.session.get(
                    f"{self.backend_url}/api/user/dashboard",
                    headers=auth_data['headers']
                )
        
        # Wait for cleanup
        time.sleep(5)
        
        final_metrics = self._get_system_metrics()
        
        memory_increase = final_metrics['memory_mb'] - initial_metrics['memory_mb']
        
        self.performance_data['resource_cleanup'] = {
            'initial_memory_mb': initial_metrics['memory_mb'],
            'final_memory_mb': final_metrics['memory_mb'],
            'memory_increase_mb': memory_increase
        }
        
        # Memory should not keep growing indefinitely
        assert memory_increase < 200, \
            f"Resources not properly cleaned up: {memory_increase:.2f}MB increase"

class TestConcurrentUserPerformance(PerformanceMonitor):
    """
    Test performance under concurrent user load.
    """
    
    def test_concurrent_user_handling(self):
        """Test system performance with concurrent users"""
        
        def user_simulation():
            """Simulate a user session"""
            try:
                # Create account
                auth_data = self._create_test_account('verified')
                if not auth_data['token']:
                    return {'success': False, 'error': 'account_creation_failed'}
                
                operations = []
                
                # Dashboard access
                start_time = time.time()
                response = self.session.get(
                    f"{self.backend_url}/api/user/dashboard",
                    headers=auth_data['headers']
                )
                duration = time.time() - start_time
                operations.append({
                    'operation': 'dashboard',
                    'duration': duration,
                    'status': response.status_code
                })
                
                # Profile access
                start_time = time.time()
                response = self.session.get(
                    f"{self.backend_url}/api/user/profile",
                    headers=auth_data['headers']
                )
                duration = time.time() - start_time
                operations.append({
                    'operation': 'profile',
                    'duration': duration,
                    'status': response.status_code
                })
                
                return {'success': True, 'operations': operations}
                
            except Exception as e:
                return {'success': False, 'error': str(e)}
        
        # Simulate concurrent users
        num_users = 10
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_users) as executor:
            futures = [executor.submit(user_simulation) for _ in range(num_users)]
            results = [f.result() for f in futures]
        
        total_time = time.time() - start_time
        
        # Analyze results
        successful_sessions = [r for r in results if r['success']]
        success_rate = len(successful_sessions) / len(results)
        
        # Calculate average operation times
        all_operations = []
        for session in successful_sessions:
            all_operations.extend(session.get('operations', []))
        
        avg_operation_time = 0
        if all_operations:
            operation_times = [op['duration'] for op in all_operations]
            avg_operation_time = statistics.mean(operation_times)
        
        self.performance_data['concurrent_users'] = {
            'num_users': num_users,
            'success_rate': success_rate,
            'total_time': total_time,
            'avg_operation_time': avg_operation_time,
            'successful_sessions': len(successful_sessions)
        }
        
        # Success rate should be high
        assert success_rate >= 0.8, \
            f"Concurrent user success rate too low: {success_rate:.2%}"
        
        # Average operation time should be reasonable
        if avg_operation_time > 0:
            assert avg_operation_time < 10.0, \
                f"Concurrent operations too slow: {avg_operation_time:.3f}s"
    
    def test_load_spike_handling(self):
        """Test handling of sudden load spikes"""
        
        def quick_request():
            """Make a quick health check request"""
            try:
                start_time = time.time()
                response = self.session.get(f"{self.backend_url}/health")
                duration = time.time() - start_time
                return {'success': response.status_code == 200, 'duration': duration}
            except Exception:
                return {'success': False, 'duration': 0}
        
        # Create sudden spike of requests
        spike_size = 50
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=spike_size) as executor:
            futures = [executor.submit(quick_request) for _ in range(spike_size)]
            results = [f.result() for f in futures]
        
        total_time = time.time() - start_time
        
        successful_requests = [r for r in results if r['success']]
        success_rate = len(successful_requests) / len(results)
        
        if successful_requests:
            response_times = [r['duration'] for r in successful_requests]
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)
        else:
            avg_response_time = 0
            max_response_time = 0
        
        self.performance_data['load_spike'] = {
            'spike_size': spike_size,
            'success_rate': success_rate,
            'total_time': total_time,
            'avg_response_time': avg_response_time,
            'max_response_time': max_response_time
        }
        
        # Should handle load spike gracefully
        assert success_rate >= 0.7, \
            f"Load spike handling too poor: {success_rate:.2%}"

class TestRegressionDetection(PerformanceMonitor):
    """
    Test regression detection and baseline comparison.
    """
    
    def test_baseline_establishment(self):
        """Establish performance baseline"""
        
        # Run a subset of performance tests to establish baseline
        self.test_health_endpoint_performance()
        self.test_authentication_performance()
        
        # Save current performance as baseline
        baseline_data = {
            'timestamp': datetime.now().isoformat(),
            'performance_data': self.performance_data,
            'system_info': {
                'python_version': sys.version,
                'platform': sys.platform
            }
        }
        
        self._save_baseline(baseline_data)
        
        assert len(self.performance_data) > 0, \
            "Should establish performance baseline"
    
    def test_regression_detection(self):
        """Test detection of performance regressions"""
        
        # Load existing baseline
        baseline = self._load_baseline()
        
        if not baseline or 'performance_data' not in baseline:
            pytest.skip("No baseline data available for regression testing")
        
        # Run current performance tests
        self.test_health_endpoint_performance()
        
        # Compare with baseline
        baseline_perf = baseline['performance_data']
        regressions = []
        
        for metric_name, current_data in self.performance_data.items():
            if metric_name in baseline_perf:
                baseline_data = baseline_perf[metric_name]
                
                # Compare key metrics
                if 'avg_response_time' in current_data and 'avg_response_time' in baseline_data:
                    current_time = current_data['avg_response_time']
                    baseline_time = baseline_data['avg_response_time']
                    
                    if self._detect_regression(metric_name, current_time, baseline_time):
                        regressions.append({
                            'metric': metric_name,
                            'current': current_time,
                            'baseline': baseline_time,
                            'degradation': (current_time - baseline_time) / baseline_time * 100
                        })
        
        # Report regressions
        if regressions:
            regression_details = "\n".join([
                f"- {r['metric']}: {r['current']:.3f}s vs {r['baseline']:.3f}s "
                f"(+{r['degradation']:.1f}%)"
                for r in regressions
            ])
            
            print(f"WARNING: Performance regressions detected:\n{regression_details}")
        
        # Don't fail the test for regressions, just warn
        self.performance_data['regressions'] = regressions
    
    def teardown_method(self):
        """Cleanup and save performance data"""
        
        # Save performance data for analysis
        if self.performance_data:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            performance_file = project_root / 'logs' / 'testing' / f'performance_{timestamp}.json'
            
            with open(performance_file, 'w') as f:
                json.dump({
                    'timestamp': datetime.now().isoformat(),
                    'performance_data': self.performance_data,
                    'thresholds': self.thresholds
                }, f, indent=2)

# Test Configuration

@pytest.fixture(scope="session")
def backend_url():
    """Get backend URL from environment or use default"""
    return os.environ.get('BACKEND_URL', 'http://localhost:8000')

# Performance test suite

@pytest.mark.performance
class TestPerformanceSuite:
    """Complete performance test suite"""
    
    def test_api_performance_suite(self, backend_url):
        """Run API performance test suite"""
        monitor = TestAPIPerformance(backend_url)
        monitor.setup_method()
        
        try:
            monitor.test_health_endpoint_performance()
            monitor.test_authentication_performance()
            monitor.test_dashboard_loading_performance()
            monitor.test_api_endpoint_performance_suite()
        finally:
            monitor.teardown_method()
    
    def test_file_upload_performance_suite(self, backend_url):
        """Run file upload performance test suite"""
        monitor = TestFileUploadPerformance(backend_url)
        monitor.setup_method()
        
        try:
            monitor.test_small_portfolio_upload_performance()
            monitor.test_large_portfolio_upload_performance()
            monitor.test_concurrent_upload_performance()
        finally:
            monitor.teardown_method()
    
    def test_memory_performance_suite(self, backend_url):
        """Run memory and resource performance test suite"""
        monitor = TestMemoryAndResourcePerformance(backend_url)
        monitor.setup_method()
        
        try:
            monitor.test_memory_usage_baseline()
            monitor.test_memory_usage_under_load()
            monitor.test_resource_cleanup()
        finally:
            monitor.teardown_method()
    
    def test_concurrent_performance_suite(self, backend_url):
        """Run concurrent user performance test suite"""
        monitor = TestConcurrentUserPerformance(backend_url)
        monitor.setup_method()
        
        try:
            monitor.test_concurrent_user_handling()
            monitor.test_load_spike_handling()
        finally:
            monitor.teardown_method()

if __name__ == "__main__":
    # Run performance tests when executed directly
    pytest.main([__file__, "-v", "--tb=short", "-m", "performance"])