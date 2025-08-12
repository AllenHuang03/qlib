#!/usr/bin/env python3
"""
TEST RUNNER FOR QLIB PRO AUSTRALIAN TRADING PLATFORM
Quick script to run comprehensive end-to-end tests
"""

import asyncio
import sys
import os

# Add the tests directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'tests'))

from test_user_scenarios import AustralianTradingPlatformTests

async def run_comprehensive_tests():
    """Run all test scenarios and display results"""
    print("🚀 Starting Qlib Pro Comprehensive Testing Suite...")
    print("🇦🇺 Australian Trading Platform Focus")
    print("=" * 60)
    
    # Initialize test suite
    test_suite = AustralianTradingPlatformTests()
    
    # Run all scenarios
    results = await test_suite.run_all_scenarios()
    
    # Display summary
    print("\n" + "=" * 60)
    print("🎯 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] == "FAILED") 
    errors = sum(1 for r in results if r["status"] == "ERROR")
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {failed}/{total}")
    print(f"💥 Errors: {errors}/{total}")
    print(f"📊 Success Rate: {(passed/total*100):.1f}%")
    
    print("\n📋 Test report saved to: test_report.md")
    print("🔗 View detailed results in the generated report")
    
    return results

if __name__ == "__main__":
    # Run tests
    asyncio.run(run_comprehensive_tests())