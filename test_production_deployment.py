#!/usr/bin/env python3
"""
Production Deployment Testing Script for Qlib Pro
Tests all critical functionality after deployment
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any

# Production URLs
BACKEND_URL = "https://qlib-production-b7f5.up.railway.app"
FRONTEND_URL = "https://startling-dragon-196548.netlify.app"

# Test accounts
TEST_ACCOUNTS = [
    {"email": "newcustomer@test.com", "password": "Test123!", "type": "new_customer"},
    {"email": "verified@test.com", "password": "Test123!", "type": "verified_customer"},
    {"email": "premium@test.com", "password": "Test123!", "type": "premium_customer"},
    {"email": "institution@test.com", "password": "Test123!", "type": "institutional"},
    {"email": "kyc.staff@test.com", "password": "Test123!", "type": "kyc_staff"},
    {"email": "agent@test.com", "password": "Test123!", "type": "trading_agent"},
    {"email": "admin@test.com", "password": "Test123!", "type": "admin"},
    {"email": "support@test.com", "password": "Test123!", "type": "support_staff"}
]

class ProductionTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, status: str, message: str, response_time: float = 0):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "response_time_ms": round(response_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {message} ({result['response_time_ms']}ms)")
    
    async def test_backend_health(self):
        """Test backend health endpoints"""
        start_time = time.time()
        
        try:
            async with self.session.get(f"{BACKEND_URL}/health") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Backend Health Check", "PASS", 
                                f"Backend healthy: {data.get('status', 'unknown')}", response_time)
                else:
                    self.log_test("Backend Health Check", "FAIL", 
                                f"Health check failed with status {response.status}", response_time)
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Backend Health Check", "FAIL", f"Health check error: {str(e)}", response_time)
    
    async def test_detailed_health(self):
        """Test detailed health endpoint"""
        start_time = time.time()
        
        try:
            async with self.session.get(f"{BACKEND_URL}/health/detailed") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    overall_status = data.get('overall_status', 'unknown')
                    summary = data.get('summary', {})
                    
                    self.log_test("Detailed Health Check", "PASS", 
                                f"Overall: {overall_status}, Checks: {summary}", response_time)
                else:
                    self.log_test("Detailed Health Check", "FAIL", 
                                f"Detailed health failed with status {response.status}", response_time)
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Detailed Health Check", "FAIL", f"Detailed health error: {str(e)}", response_time)
    
    async def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        start_time = time.time()
        
        try:
            async with self.session.get(FRONTEND_URL) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    content = await response.text()
                    if "Qlib" in content or "Trading" in content:
                        self.log_test("Frontend Accessibility", "PASS", 
                                    "Frontend loaded successfully", response_time)
                    else:
                        self.log_test("Frontend Accessibility", "WARN", 
                                    "Frontend loaded but content may be incorrect", response_time)
                else:
                    self.log_test("Frontend Accessibility", "FAIL", 
                                f"Frontend failed with status {response.status}", response_time)
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Frontend Accessibility", "FAIL", f"Frontend error: {str(e)}", response_time)
    
    async def test_api_endpoints(self):
        """Test key API endpoints"""
        endpoints_to_test = [
            "/api/health",
            "/api/models/available",
            "/api/market/quotes",
            "/docs"
        ]
        
        for endpoint in endpoints_to_test:
            start_time = time.time()
            
            try:
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        self.log_test(f"API Endpoint {endpoint}", "PASS", 
                                    f"Endpoint responding correctly", response_time)
                    elif response.status == 404:
                        self.log_test(f"API Endpoint {endpoint}", "WARN", 
                                    f"Endpoint not found (may not be implemented yet)", response_time)
                    else:
                        self.log_test(f"API Endpoint {endpoint}", "FAIL", 
                                    f"Endpoint failed with status {response.status}", response_time)
                        
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"API Endpoint {endpoint}", "FAIL", 
                            f"Endpoint error: {str(e)}", response_time)
    
    async def test_authentication(self):
        """Test authentication with test accounts"""
        for account in TEST_ACCOUNTS[:4]:  # Test first 4 customer accounts
            start_time = time.time()
            
            try:
                login_data = {
                    "email": account["email"],
                    "password": account["password"]
                }
                
                async with self.session.post(f"{BACKEND_URL}/api/auth/login", 
                                           json=login_data) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        if "access_token" in data:
                            self.log_test(f"Auth {account['type']}", "PASS", 
                                        f"Login successful for {account['email']}", response_time)
                        else:
                            self.log_test(f"Auth {account['type']}", "FAIL", 
                                        "Login response missing access_token", response_time)
                    elif response.status == 404:
                        self.log_test(f"Auth {account['type']}", "WARN", 
                                    "Auth endpoint not found (may not be implemented)", response_time)
                    else:
                        self.log_test(f"Auth {account['type']}", "FAIL", 
                                    f"Login failed with status {response.status}", response_time)
                        
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Auth {account['type']}", "FAIL", 
                            f"Auth error: {str(e)}", response_time)
    
    async def test_market_data(self):
        """Test market data endpoints"""
        start_time = time.time()
        
        try:
            # Test quotes endpoint
            async with self.session.get(f"{BACKEND_URL}/api/market/quotes/CBA.AX") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Market Data", "PASS", 
                                f"Market data retrieved for CBA.AX", response_time)
                elif response.status == 404:
                    self.log_test("Market Data", "WARN", 
                                "Market data endpoint not found", response_time)
                else:
                    self.log_test("Market Data", "FAIL", 
                                f"Market data failed with status {response.status}", response_time)
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Market Data", "FAIL", f"Market data error: {str(e)}", response_time)
    
    async def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Production Deployment Tests...")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Frontend URL: {FRONTEND_URL}")
        print("=" * 60)
        
        # Run all tests
        await self.test_backend_health()
        await self.test_detailed_health()
        await self.test_frontend_accessibility()
        await self.test_api_endpoints()
        await self.test_authentication()
        await self.test_market_data()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        # Calculate summary
        total_tests = len(self.test_results)
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️ Warnings: {warnings}")
        
        success_rate = (passed / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 DEPLOYMENT LOOKS GOOD! Most tests passed.")
        elif success_rate >= 60:
            print("⚠️ DEPLOYMENT HAS ISSUES. Some tests failed.")
        else:
            print("❌ DEPLOYMENT HAS MAJOR ISSUES. Many tests failed.")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if r["status"] == "FAIL"]
        if failed_tests:
            print("\n🔍 FAILED TESTS:")
            for test in failed_tests:
                print(f"  ❌ {test['test']}: {test['message']}")
        
        # Average response time
        response_times = [r["response_time_ms"] for r in self.test_results if r["response_time_ms"] > 0]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"\n⚡ Average Response Time: {avg_response_time:.1f}ms")
        
        return success_rate >= 80

async def main():
    """Main test execution"""
    async with ProductionTester() as tester:
        success = await tester.run_all_tests()
        
        print("\n" + "=" * 60)
        print("📋 NEXT STEPS")
        print("=" * 60)
        
        if success:
            print("✅ 1. Test all 8 user accounts manually")
            print("✅ 2. Upload test portfolio CSV files")
            print("✅ 3. Test real-time market data feeds")
            print("✅ 4. Verify AI signal generation")
            print("✅ 5. Test all customer journeys")
            print("\n🎉 Ready for user testing and beta launch!")
        else:
            print("🔧 1. Check Railway deployment logs")
            print("🔧 2. Verify all environment variables are set")
            print("🔧 3. Run database migration in Supabase")
            print("🔧 4. Check CORS settings")
            print("🔧 5. Verify API endpoints are implemented")
            print("\n⚠️ Fix issues before proceeding to user testing")
        
        print(f"\n🌐 URLs:")
        print(f"Frontend: {FRONTEND_URL}")
        print(f"Backend API: {BACKEND_URL}")
        print(f"Backend Health: {BACKEND_URL}/health")
        print(f"API Documentation: {BACKEND_URL}/docs")

if __name__ == "__main__":
    asyncio.run(main())