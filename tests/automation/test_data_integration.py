#!/usr/bin/env python3
"""
Data Integration and Validation Tests
AGENT 5: CONTINUOUS INTEGRATION SPECIALIST

Comprehensive automated tests for data validation and CSV import functionality implemented by Agent 4.
Tests portfolio data processing, validation rules, and data integrity across all insertion points.
"""

import pytest
import requests
import time
import json
import os
import csv
import io
from pathlib import Path
from typing import Dict, Any, List
import uuid
import tempfile

# Add project root to path
project_root = Path(__file__).parent.parent.parent
import sys
sys.path.insert(0, str(project_root))

class DataIntegrationTestSuite:
    """
    Comprehensive test suite for data integration functionality.
    
    Tests:
    1. Portfolio CSV validation and import
    2. Market data validation
    3. Large file handling
    4. Error handling and recovery
    5. Data integrity checks
    6. Performance benchmarks
    """
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.test_data_dir = project_root / 'backend' / 'test_data'
        self.session = requests.Session()
        self.session.timeout = 60  # Longer timeout for file operations
        
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
    
    def _create_test_account(self, account_type: str = 'verified') -> Dict[str, str]:
        """Create a test account for data operations"""
        response = self.session.post(
            f"{self.backend_url}/api/test-accounts/create",
            json={'accountType': account_type}
        )
        
        account_data = self._verify_api_response(response, 201)
        assert 'token' in account_data, f"Test account creation should return token"
        
        return {
            'token': account_data['token'],
            'headers': {'Authorization': f'Bearer {account_data["token"]}'}
        }
    
    def _create_test_csv(self, data: List[Dict[str, Any]], filename: str = None) -> str:
        """Create a temporary CSV file with test data"""
        if filename is None:
            filename = f"test_{uuid.uuid4().hex[:8]}.csv"
        
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
        
        if data:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(temp_file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        temp_file.close()
        return temp_file.name

class TestPortfolioCSVValidation(DataIntegrationTestSuite):
    """
    Test portfolio CSV validation functionality (Agent 4).
    
    Validates:
    1. Correct CSV format
    2. Required columns
    3. Data type validation
    4. Business rule validation
    5. Error reporting
    """
    
    def test_valid_portfolio_validation(self):
        """Test validation of a correctly formatted portfolio CSV"""
        
        auth_data = self._create_test_account('verified')
        
        # Use existing test portfolio
        portfolio_file = self.test_data_dir / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            with open(portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files,
                    headers=auth_data['headers']
                )
            
            validation_result = self._verify_api_response(response)
            
            # Should pass validation
            assert validation_result.get('valid', False), \
                f"Valid portfolio should pass validation: {validation_result}"
            
            # Should not have critical errors
            errors = validation_result.get('errors', [])
            critical_errors = [e for e in errors if e.get('severity') == 'critical']
            assert len(critical_errors) == 0, \
                f"Valid portfolio should not have critical errors: {critical_errors}"
    
    def test_malformed_portfolio_validation(self):
        """Test validation of malformed portfolio CSV"""
        
        auth_data = self._create_test_account('verified')
        
        # Use existing malformed test portfolio
        malformed_file = self.test_data_dir / 'test_portfolio_malformed.csv'
        
        if malformed_file.exists():
            with open(malformed_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files,
                    headers=auth_data['headers']
                )
            
            # Should handle malformed data gracefully
            assert response.status_code != 500, \
                "Portfolio validation should not crash on malformed data"
            
            if response.status_code == 200:
                validation_result = response.json()
                
                # Should fail validation
                assert not validation_result.get('valid', True), \
                    "Malformed portfolio should fail validation"
                
                # Should provide error details
                assert 'errors' in validation_result, \
                    "Validation should provide error details"
    
    def test_missing_required_columns(self):
        """Test validation when required columns are missing"""
        
        auth_data = self._create_test_account('verified')
        
        # Create CSV with missing required columns
        incomplete_data = [
            {'symbol': 'AAPL'},  # Missing quantity, price, etc.
            {'symbol': 'GOOGL'}
        ]
        
        csv_file = self._create_test_csv(incomplete_data)
        
        try:
            with open(csv_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files,
                    headers=auth_data['headers']
                )
            
            assert response.status_code != 500, \
                "Validation should handle missing columns gracefully"
            
            if response.status_code == 200:
                validation_result = response.json()
                
                # Should fail validation
                assert not validation_result.get('valid', True), \
                    "Portfolio with missing columns should fail validation"
                
                # Should identify missing columns
                errors = validation_result.get('errors', [])
                missing_column_errors = [e for e in errors if 'column' in str(e).lower() or 'missing' in str(e).lower()]
                assert len(missing_column_errors) > 0, \
                    "Should identify missing column errors"
        
        finally:
            os.unlink(csv_file)
    
    def test_invalid_data_types(self):
        """Test validation with invalid data types"""
        
        auth_data = self._create_test_account('verified')
        
        # Create CSV with invalid data types
        invalid_data = [
            {
                'symbol': 'AAPL',
                'quantity': 'not_a_number',  # Should be numeric
                'price': 'invalid_price',    # Should be numeric
                'date': 'invalid_date'       # Should be valid date
            }
        ]
        
        csv_file = self._create_test_csv(invalid_data)
        
        try:
            with open(csv_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files,
                    headers=auth_data['headers']
                )
            
            assert response.status_code != 500, \
                "Validation should handle invalid data types gracefully"
            
            if response.status_code == 200:
                validation_result = response.json()
                
                # Should fail validation
                assert not validation_result.get('valid', True), \
                    "Portfolio with invalid data types should fail validation"
                
                # Should identify data type errors
                errors = validation_result.get('errors', [])
                type_errors = [e for e in errors if 'type' in str(e).lower() or 'invalid' in str(e).lower()]
                assert len(type_errors) > 0, \
                    "Should identify data type errors"
        
        finally:
            os.unlink(csv_file)
    
    def test_business_rule_validation(self):
        """Test business rule validation (negative quantities, invalid symbols, etc.)"""
        
        auth_data = self._create_test_account('verified')
        
        # Create CSV with business rule violations
        invalid_business_data = [
            {
                'symbol': 'INVALID_SYMBOL_TOO_LONG_123456',  # Invalid symbol
                'quantity': -100,                             # Negative quantity
                'price': -50.0,                              # Negative price
                'date': '2024-01-01'
            },
            {
                'symbol': '',                                 # Empty symbol
                'quantity': 0,                               # Zero quantity
                'price': 0,                                  # Zero price
                'date': '2024-01-01'
            }
        ]
        
        csv_file = self._create_test_csv(invalid_business_data)
        
        try:
            with open(csv_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/validate",
                    files=files,
                    headers=auth_data['headers']
                )
            
            assert response.status_code != 500, \
                "Validation should handle business rule violations gracefully"
            
            if response.status_code == 200:
                validation_result = response.json()
                
                # Should report business rule violations
                errors = validation_result.get('errors', [])
                business_errors = [e for e in errors if 'symbol' in str(e).lower() or 'quantity' in str(e).lower() or 'price' in str(e).lower()]
                
                # Should identify at least some business rule violations
                assert len(business_errors) > 0 or not validation_result.get('valid', True), \
                    "Should identify business rule violations"
        
        finally:
            os.unlink(csv_file)

class TestPortfolioCSVImport(DataIntegrationTestSuite):
    """
    Test portfolio CSV import functionality (Agent 4).
    
    Tests:
    1. Successful import process
    2. Data persistence
    3. Import progress tracking
    4. Error recovery
    """
    
    def test_successful_portfolio_import(self):
        """Test successful portfolio import process"""
        
        auth_data = self._create_test_account('verified')
        
        # Use existing test portfolio
        portfolio_file = self.test_data_dir / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            start_time = time.time()
            
            with open(portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            import_time = time.time() - start_time
            
            import_result = self._verify_api_response(response, 201)
            
            # Should indicate successful import
            assert 'portfolio' in import_result or 'success' in str(import_result).lower(), \
                f"Import should indicate success: {import_result}"
            
            # Should complete in reasonable time
            assert import_time < 30.0, \
                f"Portfolio import too slow: {import_time:.2f}s"
            
            # Verify data was persisted by checking portfolio summary
            response = self.session.get(
                f"{self.backend_url}/api/portfolio/summary",
                headers=auth_data['headers']
            )
            
            if response.status_code == 200:
                summary = response.json()
                assert isinstance(summary, dict), \
                    "Portfolio summary should be available after import"
    
    def test_large_portfolio_import(self):
        """Test import of large portfolio files"""
        
        auth_data = self._create_test_account('institutional')
        
        # Use existing large test portfolio
        large_portfolio_file = self.test_data_dir / 'test_portfolio_10k_holdings.csv'
        
        if large_portfolio_file.exists():
            start_time = time.time()
            
            with open(large_portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            import_time = time.time() - start_time
            
            # Should handle large files
            assert response.status_code != 500, \
                "Large portfolio import should not crash"
            
            if response.status_code in [200, 201]:
                import_result = response.json()
                
                # Should complete within reasonable time for institutional clients
                assert import_time < 180.0, \
                    f"Large portfolio import too slow: {import_time:.2f}s"
                
                # Should indicate successful processing
                assert 'portfolio' in import_result or 'success' in str(import_result).lower(), \
                    "Large import should indicate success"
    
    def test_concurrent_imports(self):
        """Test handling of concurrent portfolio imports"""
        
        import threading
        import concurrent.futures
        
        # Create multiple test accounts
        accounts = []
        for i in range(3):
            accounts.append(self._create_test_account('verified'))
        
        portfolio_file = self.test_data_dir / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            def import_portfolio(auth_data):
                """Import portfolio for one account"""
                with open(portfolio_file, 'rb') as f:
                    files = {'file': f}
                    response = self.session.post(
                        f"{self.backend_url}/api/portfolio/upload",
                        files=files,
                        headers=auth_data['headers']
                    )
                return response.status_code
            
            # Execute concurrent imports
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                futures = [executor.submit(import_portfolio, account) for account in accounts]
                results = [f.result() for f in futures]
            
            # All imports should succeed or handle gracefully
            server_errors = [r for r in results if r == 500]
            assert len(server_errors) == 0, \
                f"Concurrent imports should not cause server errors: {results}"
            
            # At least some should succeed
            successes = [r for r in results if r in [200, 201]]
            assert len(successes) > 0, \
                f"At least some concurrent imports should succeed: {results}"
    
    def test_import_with_errors(self):
        """Test import behavior when there are data errors"""
        
        auth_data = self._create_test_account('verified')
        
        # Use edge cases test file
        edge_cases_file = self.test_data_dir / 'test_portfolio_edge_cases.csv'
        
        if edge_cases_file.exists():
            with open(edge_cases_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            # Should handle edge cases gracefully
            assert response.status_code != 500, \
                "Import should handle edge cases without crashing"
            
            if response.status_code in [200, 201]:
                import_result = response.json()
                
                # Should report any issues encountered
                if 'warnings' in import_result or 'errors' in import_result:
                    warnings = import_result.get('warnings', [])
                    errors = import_result.get('errors', [])
                    assert isinstance(warnings, list) and isinstance(errors, list), \
                        "Warnings and errors should be structured"

class TestMarketDataValidation(DataIntegrationTestSuite):
    """
    Test market data validation functionality (Agent 4).
    
    Tests:
    1. Market data format validation
    2. Real-time data validation
    3. Historical data integrity
    4. Data source verification
    """
    
    def test_market_data_validation(self):
        """Test market data validation endpoints"""
        
        auth_data = self._create_test_account('verified')
        
        # Test market data validation endpoint
        response = self.session.get(
            f"{self.backend_url}/api/market/validate",
            headers=auth_data['headers']
        )
        
        assert response.status_code != 500, \
            "Market data validation should not crash"
        
        if response.status_code == 200:
            validation_result = response.json()
            assert isinstance(validation_result, dict), \
                "Market data validation should return structured data"
    
    def test_market_data_format_validation(self):
        """Test validation of market data format"""
        
        auth_data = self._create_test_account('verified')
        
        # Test with sample market data
        market_data = {
            'symbol': 'AAPL',
            'date': '2024-01-01',
            'open': 150.0,
            'high': 155.0,
            'low': 148.0,
            'close': 153.0,
            'volume': 1000000
        }
        
        response = self.session.post(
            f"{self.backend_url}/api/market/validate-format",
            json=market_data,
            headers=auth_data['headers']
        )
        
        assert response.status_code != 500, \
            "Market data format validation should not crash"
    
    def test_real_time_data_validation(self):
        """Test real-time market data validation"""
        
        auth_data = self._create_test_account('premium')
        
        # Test real-time data endpoint
        response = self.session.get(
            f"{self.backend_url}/api/market/real-time/AAPL",
            headers=auth_data['headers']
        )
        
        assert response.status_code != 500, \
            "Real-time data should not crash"
        
        if response.status_code == 200:
            real_time_data = response.json()
            
            # Should have required fields for real-time data
            expected_fields = ['symbol', 'price', 'timestamp']
            for field in expected_fields:
                if field in real_time_data:
                    assert real_time_data[field] is not None, \
                        f"Real-time data field {field} should not be null"

class TestDataIntegrityAndPerformance(DataIntegrationTestSuite):
    """
    Test data integrity and performance requirements (Agent 4).
    
    Tests:
    1. Data consistency checks
    2. Performance benchmarks
    3. Memory usage monitoring
    4. Error recovery
    """
    
    def test_data_consistency_after_import(self):
        """Test data consistency after portfolio import"""
        
        auth_data = self._create_test_account('verified')
        
        portfolio_file = self.test_data_dir / 'test_portfolio_small.csv'
        
        if portfolio_file.exists():
            # Read original CSV data
            original_data = []
            with open(portfolio_file, 'r') as f:
                reader = csv.DictReader(f)
                original_data = list(reader)
            
            # Import portfolio
            with open(portfolio_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            if response.status_code in [200, 201]:
                # Get imported data
                response = self.session.get(
                    f"{self.backend_url}/api/portfolio/holdings",
                    headers=auth_data['headers']
                )
                
                if response.status_code == 200:
                    imported_data = response.json()
                    
                    # Basic consistency checks
                    if isinstance(imported_data, list) and len(original_data) > 0:
                        assert len(imported_data) > 0, \
                            "Imported data should not be empty if original data exists"
                        
                        # Check if at least some symbols match
                        original_symbols = {row.get('symbol', '').upper() for row in original_data}
                        imported_symbols = {holding.get('symbol', '').upper() for holding in imported_data}
                        
                        common_symbols = original_symbols.intersection(imported_symbols)
                        assert len(common_symbols) > 0, \
                            "Should have some common symbols between original and imported data"
    
    def test_import_performance_benchmarks(self):
        """Test performance benchmarks for different file sizes"""
        
        auth_data = self._create_test_account('institutional')
        
        # Test different file sizes
        test_files = [
            ('test_portfolio_small.csv', 30.0),     # Small file - 30s max
            ('test_portfolio_10k_holdings.csv', 180.0)  # Large file - 3min max
        ]
        
        for filename, max_time in test_files:
            file_path = self.test_data_dir / filename
            
            if file_path.exists():
                start_time = time.time()
                
                with open(file_path, 'rb') as f:
                    files = {'file': f}
                    response = self.session.post(
                        f"{self.backend_url}/api/portfolio/upload",
                        files=files,
                        headers=auth_data['headers']
                    )
                
                import_time = time.time() - start_time
                
                if response.status_code in [200, 201]:
                    assert import_time < max_time, \
                        f"Import of {filename} too slow: {import_time:.2f}s > {max_time}s"
    
    def test_memory_usage_during_import(self):
        """Test memory usage during large file imports"""
        
        import psutil
        import os
        
        auth_data = self._create_test_account('institutional')
        
        large_file = self.test_data_dir / 'test_portfolio_10k_holdings.csv'
        
        if large_file.exists():
            # Monitor memory before import
            process = psutil.Process(os.getpid())
            memory_before = process.memory_info().rss / 1024 / 1024  # MB
            
            with open(large_file, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            # Monitor memory after import
            memory_after = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = memory_after - memory_before
            
            # Memory increase should be reasonable (less than 1GB for test)
            assert memory_increase < 1024, \
                f"Memory usage increase too high: {memory_increase:.2f}MB"
    
    def test_error_recovery_mechanisms(self):
        """Test error recovery and graceful degradation"""
        
        auth_data = self._create_test_account('verified')
        
        # Test with completely invalid file
        invalid_content = b"This is not a CSV file at all!"
        
        # Create temporary file with invalid content
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        temp_file.write(invalid_content)
        temp_file.close()
        
        try:
            with open(temp_file.name, 'rb') as f:
                files = {'file': f}
                response = self.session.post(
                    f"{self.backend_url}/api/portfolio/upload",
                    files=files,
                    headers=auth_data['headers']
                )
            
            # Should handle gracefully, not crash
            assert response.status_code != 500, \
                "Should handle completely invalid files gracefully"
            
            # Should return appropriate error response
            if response.status_code in [400, 422]:
                error_response = response.json()
                assert 'error' in str(error_response).lower() or 'invalid' in str(error_response).lower(), \
                    "Should provide meaningful error message"
        
        finally:
            os.unlink(temp_file.name)

# Test Configuration and Utilities

@pytest.fixture(scope="session")
def backend_url():
    """Get backend URL from environment or use default"""
    return os.environ.get('BACKEND_URL', 'http://localhost:8000')

@pytest.fixture(scope="session")
def test_data_dir():
    """Get test data directory"""
    return project_root / 'backend' / 'test_data'

# Parametrized tests for different data scenarios

@pytest.mark.parametrize("data_scenario", [
    "portfolio_validation",
    "portfolio_import",
    "market_data_validation",
    "performance_benchmark"
])
def test_data_integration_smoke_test(data_scenario, backend_url):
    """Smoke test for each data integration scenario"""
    
    suite = DataIntegrationTestSuite(backend_url)
    suite.setup_method()
    
    try:
        if data_scenario == "portfolio_validation":
            test = TestPortfolioCSVValidation(backend_url)
            test.test_valid_portfolio_validation()
        elif data_scenario == "portfolio_import":
            test = TestPortfolioCSVImport(backend_url)
            test.test_successful_portfolio_import()
        elif data_scenario == "market_data_validation":
            test = TestMarketDataValidation(backend_url)
            test.test_market_data_validation()
        elif data_scenario == "performance_benchmark":
            test = TestDataIntegrityAndPerformance(backend_url)
            test.test_import_performance_benchmarks()
            
    except Exception as e:
        pytest.fail(f"Data integration scenario {data_scenario} failed: {e}")
    finally:
        suite.teardown_method()

# Performance tests

@pytest.mark.performance
def test_data_integration_performance_suite(backend_url):
    """Comprehensive performance test suite for data integration"""
    
    suite = DataIntegrationTestSuite(backend_url)
    
    # Test validation performance
    auth_data = suite._create_test_account('verified')
    
    portfolio_file = suite.test_data_dir / 'test_portfolio_small.csv'
    
    if portfolio_file.exists():
        # Benchmark validation time
        start_time = time.time()
        
        with open(portfolio_file, 'rb') as f:
            files = {'file': f}
            response = suite.session.post(
                f"{backend_url}/api/portfolio/validate",
                files=files,
                headers=auth_data['headers']
            )
        
        validation_time = time.time() - start_time
        
        if response.status_code == 200:
            assert validation_time < 15.0, \
                f"Portfolio validation too slow: {validation_time:.2f}s"

if __name__ == "__main__":
    # Run tests when executed directly
    pytest.main([__file__, "-v", "--tb=short"])