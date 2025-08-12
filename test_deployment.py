#!/usr/bin/env python3
"""
Quick deployment test for Qlib Pro
"""

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import fastapi
        print("+ FastAPI imported")
        
        import uvicorn
        print("+ Uvicorn imported")
        
        import httpx
        print("+ HTTPX imported")
        
        import numpy
        print("+ NumPy imported")
        
        # Test our main modules
        from main import app
        print("+ Main API app imported")
        
        from supabase_service import SupabaseService
        print("+ Supabase service imported")
        
        from australian_market_service import AustralianMarketService
        print("+ Australian market service imported")
        
        from auth_service import TwoFactorAuthService
        print("+ Auth service imported")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_configuration():
    """Test configuration values"""
    print("\nTesting configuration...")
    
    import os
    
    # Check if we have the required environment variables or fallbacks
    configs = {
        "ALPHA_VANTAGE_KEY": os.getenv("ALPHA_VANTAGE_KEY", "YR3O8FBCPDC5IVEX"),
        "NEWS_API_KEY": os.getenv("NEWS_API_KEY", "96ded78b5ae44522acc383bf0df3a27a"),
        "SUPABASE_URL": os.getenv("SUPABASE_URL", "https://egbirkjdybtcxlzodclt.supabase.co"),
        "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY")[:20] + "..." if os.getenv("SUPABASE_ANON_KEY") else "Not set"
    }
    
    for key, value in configs.items():
        print(f"+ {key}: {'Configured' if value else 'Not set'}")
    
    return True

def test_app_creation():
    """Test that the FastAPI app can be created"""
    print("\nTesting app creation...")
    
    try:
        from main import app
        
        # Test app attributes
        assert hasattr(app, 'routes'), "App missing routes"
        assert len(app.routes) > 0, "App has no routes"
        
        print(f"+ App created with {len(app.routes)} routes")
        
        # Test some key routes exist
        route_paths = [route.path for route in app.routes if hasattr(route, 'path')]
        
        required_routes = ['/api/health', '/api/auth/login', '/api/market/quotes']
        for required_route in required_routes:
            if any(required_route in path for path in route_paths):
                print(f"+ Route found: {required_route}")
            else:
                print(f"! Route missing: {required_route}")
        
        return True
        
    except Exception as e:
        print(f"- App creation error: {e}")
        return False

def main():
    """Run all deployment tests"""
    print("Qlib Pro - Deployment Test Suite")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Configuration Test", test_configuration),
        ("App Creation Test", test_app_creation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"- {test_name} failed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("All tests passed! Ready for deployment.")
        return True
    else:
        print("Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)