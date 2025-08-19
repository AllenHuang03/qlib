# 🚀 Qlib Continuous Testing Framework

**AGENT 5: CONTINUOUS INTEGRATION SPECIALIST**

Comprehensive automated testing framework for the Qlib trading platform, ensuring production-ready quality through continuous validation across all components and user journeys.

## 🎯 Overview

This testing framework provides:
- **Daily automated test suites** across all platform components
- **End-to-end customer journey testing** for all user types
- **Staff workflow integration testing** for all dashboard types
- **Data validation and CSV import testing** with edge case handling
- **Performance monitoring** with regression detection
- **Security testing** with vulnerability scanning
- **Comprehensive reporting** with visualization and notifications

## 🏗️ Architecture

```
tests/automation/
├── continuous_testing_framework.py   # Main testing orchestrator
├── test_customer_journeys.py         # E2E customer journey tests
├── test_staff_workflows.py           # Staff dashboard integration tests
├── test_data_integration.py          # Data validation and import tests
├── test_performance.py               # Performance monitoring tests
├── test_security.py                  # Security and vulnerability tests
├── load_test.py                      # Load testing with Locust
├── generate_test_report.py           # Report generation system
├── pytest.ini                       # Pytest configuration
├── requirements.txt                  # Python dependencies
└── README.md                         # This documentation
```

## 🚀 Quick Start

### Installation

1. **Install Python dependencies:**
   ```bash
   cd tests/automation
   pip install -r requirements.txt
   ```

2. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

### Running Tests

**Run all tests:**
```bash
python continuous_testing_framework.py --backend-url http://localhost:8000
```

**Run specific test suites:**
```bash
# Customer journey tests
pytest test_customer_journeys.py -v

# Staff workflow tests  
pytest test_staff_workflows.py -v

# Data integration tests
pytest test_data_integration.py -v

# Performance tests
pytest test_performance.py -v -m performance

# Security tests
pytest test_security.py -v -m security
```

**Run load tests:**
```bash
python load_test.py --users 50 --spawn-rate 5 --time 60s
```

## 🧪 Test Categories

### 1. Customer Journey Tests (`test_customer_journeys.py`)

Tests complete user flows for all customer types:

- **New Customer Onboarding**: Registration → Login → Dashboard → Plan Selection
- **Verified Customer Flow**: Portfolio Upload → Model Access → Backtesting
- **Premium Customer Flow**: Advanced Features → AI Insights → Real-time Trading
- **Institutional Client Flow**: Large Portfolios → Enterprise Features → Compliance

**Example:**
```python
def test_new_customer_complete_flow():
    # Registration
    response = register_user(email, password)
    assert response.status_code == 201
    
    # Login
    response = login_user(email, password)
    token = response.json()['token']
    
    # Dashboard access
    response = get_dashboard(token)
    assert response.status_code == 200
```

### 2. Staff Workflow Tests (`test_staff_workflows.py`)

Tests all staff dashboard functionality:

- **KYC Staff Dashboard**: Document review, compliance reporting, verification queue
- **Support Staff Dashboard**: Ticket management, user account support, system monitoring
- **Trading Agent Dashboard**: Model monitoring, algorithm management, risk controls
- **Enterprise Admin Dashboard**: User management, system administration, analytics

**Example:**
```python
def test_kyc_staff_workflow():
    # Create KYC staff account
    staff_token = create_staff_account('kyc_staff')
    
    # Access pending verifications
    response = get_pending_verifications(staff_token)
    assert response.status_code == 200
    
    # Process document review
    response = review_document(staff_token, document_id, 'approved')
    assert response.status_code == 200
```

### 3. Data Integration Tests (`test_data_integration.py`)

Tests data validation and import functionality:

- **Portfolio CSV Validation**: Format validation, required columns, data types
- **Portfolio Import**: Successful import, large files, concurrent uploads
- **Market Data Validation**: Real-time data, historical data integrity
- **Error Handling**: Malformed data, edge cases, recovery mechanisms

**Example:**
```python
def test_portfolio_csv_validation():
    # Valid portfolio
    with open('test_portfolio_small.csv', 'rb') as f:
        response = validate_portfolio(f, user_token)
    assert response.json()['valid'] == True
    
    # Invalid portfolio
    with open('test_portfolio_malformed.csv', 'rb') as f:
        response = validate_portfolio(f, user_token)
    assert response.json()['valid'] == False
```

### 4. Performance Tests (`test_performance.py`)

Monitors system performance and detects regressions:

- **API Response Times**: Health checks, authentication, dashboard loading
- **File Upload Performance**: Small files, large files, concurrent uploads
- **Memory Usage**: Baseline monitoring, load testing, resource cleanup
- **Concurrent Users**: Multi-user simulation, load spike handling

**Example:**
```python
def test_api_response_time():
    start_time = time.time()
    response = requests.get('/api/user/dashboard', headers=auth_headers)
    duration = time.time() - start_time
    
    assert response.status_code == 200
    assert duration < 2.0  # 2 second threshold
```

### 5. Security Tests (`test_security.py`)

Comprehensive security vulnerability testing:

- **Authentication Security**: Weak passwords, brute force protection, session management
- **Authorization Controls**: Role-based access, privilege escalation, staff access
- **Input Validation**: SQL injection, XSS protection, file upload security
- **API Security**: Security headers, CORS configuration, rate limiting

**Example:**
```python
def test_sql_injection_protection():
    malicious_payload = "'; DROP TABLE users; --"
    response = requests.get('/api/user/profile', 
                          params={'id': malicious_payload})
    
    # Should not expose SQL errors
    assert 'sql' not in response.text.lower()
    assert response.status_code != 500
```

## 📊 Performance Monitoring

### Response Time Thresholds

- **Health Endpoint**: < 1 second
- **Authentication**: < 2 seconds  
- **Dashboard Loading**: < 2 seconds
- **File Upload (Small)**: < 15 seconds
- **File Upload (Large)**: < 120 seconds

### Memory Usage Limits

- **Baseline**: < 512 MB increase
- **Under Load**: < 1 GB total
- **After Operations**: Proper cleanup expected

### Concurrent User Testing

- **Success Rate**: > 95% for concurrent operations
- **Load Spike Handling**: > 70% success rate for 50 concurrent requests

## 🔒 Security Testing

### Authentication Tests

- Password strength validation
- Account enumeration protection
- Brute force protection
- Session management security

### Authorization Tests

- Role-based access control
- Horizontal privilege escalation
- Staff access restrictions
- Data isolation verification

### Input Validation Tests

- SQL injection protection
- Cross-site scripting (XSS) prevention
- File upload security
- Path traversal protection

### API Security Tests

- HTTP security headers
- CORS configuration
- Rate limiting
- Information disclosure prevention

## 📈 Load Testing

Uses Locust framework for realistic load simulation:

```bash
# Run load test with 100 users
python load_test.py --users 100 --spawn-rate 10 --time 5m

# Run with custom parameters
python load_test.py --host https://api.qlib.com --users 200 --time 10m
```

### User Simulation

- **Regular Users**: Dashboard access, portfolio operations, model interactions
- **Staff Users**: Administrative functions, monitoring dashboards
- **File Uploads**: Portfolio CSV imports with various sizes
- **Real-world Patterns**: Realistic wait times and usage patterns

## 📋 Reporting

### Automated Reports

The framework generates comprehensive HTML reports with:

- **Executive Summary**: Success rates, test counts, critical issues
- **Performance Charts**: Response times, throughput, resource usage
- **Test Suite Breakdown**: Detailed results for each component
- **Failure Analysis**: Root cause analysis with recommendations
- **Security Findings**: Vulnerability assessment with severity ratings
- **Trend Analysis**: Performance regression detection

### Report Generation

```bash
# Generate report from test artifacts
python generate_test_report.py --artifacts-dir test-artifacts/

# View generated reports
open test-report.html        # Comprehensive HTML report
cat test-summary.json       # JSON summary for CI/CD
```

### Notifications

- **Slack Integration**: Automated notifications to development channels
- **Email Reports**: Daily/weekly summary reports
- **GitHub Issues**: Automatic issue creation for critical failures

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The framework integrates with GitHub Actions for:

- **Automated Testing**: Triggered on push, PR, and schedule
- **Parallel Execution**: Customer journeys, staff workflows, data integration
- **Performance Monitoring**: Continuous performance baseline maintenance
- **Security Scanning**: Regular vulnerability assessments
- **Report Generation**: Automated test reports and notifications

### Workflow Triggers

- **Push to main/develop**: Smoke tests and integration tests
- **Pull Requests**: Full test suite with performance checks
- **Daily Schedule**: Comprehensive testing including security scans
- **Manual Dispatch**: On-demand testing with configurable scope

## 🛠️ Configuration

### Environment Variables

```bash
# Testing configuration
export BACKEND_URL="http://localhost:8000"
export FRONTEND_URL="http://localhost:5173"
export TEST_TIMEOUT="300"

# Notification configuration  
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export EMAIL_NOTIFICATIONS="true"

# Performance thresholds
export API_RESPONSE_THRESHOLD="2.0"
export MEMORY_USAGE_THRESHOLD="512"
export SUCCESS_RATE_THRESHOLD="0.95"
```

### Test Configuration File

Create `test_config.json`:

```json
{
  "backend_url": "http://localhost:8000",
  "frontend_url": "http://localhost:5173",
  "test_timeout": 300,
  "parallel_tests": true,
  "coverage_threshold": 80.0,
  "performance_baseline": {
    "api_response_time": 2.0,
    "page_load_time": 3.0,
    "memory_usage": 512
  },
  "notification": {
    "email_enabled": false,
    "slack_webhook": null
  }
}
```

## 🎯 Best Practices

### Test Organization

1. **Atomic Tests**: Each test should be independent and isolated
2. **Clear Naming**: Descriptive test names explaining what is being tested
3. **Proper Setup/Teardown**: Clean environment for each test
4. **Error Handling**: Graceful failure with meaningful error messages

### Performance Testing

1. **Baseline Establishment**: Set performance baselines before regression testing
2. **Realistic Data**: Use production-like data sizes and patterns
3. **Environment Consistency**: Test in consistent environments
4. **Trend Monitoring**: Track performance over time

### Security Testing

1. **Regular Scanning**: Automated security tests in CI/CD pipeline
2. **Comprehensive Coverage**: Test all input vectors and endpoints
3. **Safe Payloads**: Use non-destructive test payloads
4. **Documentation**: Document all security findings and remediation

## 🚨 Troubleshooting

### Common Issues

**Backend Not Available:**
```bash
# Check backend health
curl http://localhost:8000/health

# Start backend
cd backend && python production_api.py
```

**Test Dependencies Missing:**
```bash
# Install all dependencies
pip install -r requirements.txt

# Install specific packages
pip install pytest locust matplotlib
```

**Database Connection Issues:**
```bash
# Check database status
python -c "import psycopg2; print('Database accessible')"

# Reset test database
python setup_database.py --reset-test
```

**Permission Errors:**
```bash
# Fix file permissions
chmod +x test_scripts/*.py

# Run with proper user
sudo -u www-data python continuous_testing_framework.py
```

### Debug Mode

Enable verbose logging:

```bash
# Enable debug logging
export PYTEST_DEBUG=1
pytest test_customer_journeys.py -v -s --log-cli-level=DEBUG

# Run single test with full output
pytest test_customer_journeys.py::test_new_customer_flow -v -s
```

## 📞 Support

For issues with the testing framework:

1. **Check Logs**: Review test logs in `logs/testing/`
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test Dependencies**: Verify all required services are running
4. **GitHub Issues**: Create issue with test logs and configuration

## 🎉 Success Metrics

The testing framework is successful when:

- **✅ 95%+ Success Rate** across all test suites
- **⚡ Performance Thresholds Met** for all critical paths
- **🔒 Zero High/Critical Security Issues** detected
- **📊 Comprehensive Coverage** of all user journeys
- **🚀 Production Confidence** through continuous validation

---

*Generated by Qlib Continuous Testing Framework - Agent 5: Continuous Integration Specialist*