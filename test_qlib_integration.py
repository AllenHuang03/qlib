#!/usr/bin/env python3
"""
Test script to verify Qlib integration is working
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_qlib_availability():
    """Test if Qlib can be imported and initialized"""
    try:
        from backend.qlib_manager import qlib_manager, QLIB_AVAILABLE
        
        print(f"OK Qlib Available: {QLIB_AVAILABLE}")
        
        if QLIB_AVAILABLE and qlib_manager:
            print(f"OK QlibManager Initialized: {qlib_manager.initialized}")
            
            if qlib_manager.initialized:
                # Test dataset fetching
                datasets = qlib_manager.get_available_datasets()
                print(f"OK Available Datasets: {len(datasets)}")
                for dataset in datasets:
                    print(f"   - {dataset['name']}: {dataset['status']}")
                
                # Test sample data fetching
                sample_data = qlib_manager.get_market_data_sample(limit=5)
                print(f"OK Sample Market Data: {len(sample_data)} records")
                
                # Test model creation
                print("\nTesting model creation...")
                model_config = {
                    'name': 'Test-LightGBM-Model',
                    'type': 'LightGBM',
                    'description': 'Test model for integration verification'
                }
                
                result = qlib_manager.create_real_model(model_config)
                if 'error' not in result:
                    print(f"OK Model created: {result['name']}")
                    model_id = result['id']
                    
                    # Test backtest
                    print("\nTesting backtest...")
                    backtest_config = {
                        'name': 'Test Backtest',
                        'model_id': model_id,
                        'start_date': '2022-01-01',
                        'end_date': '2022-12-31'
                    }
                    
                    backtest_result = qlib_manager.run_real_backtest(backtest_config)
                    if 'error' not in backtest_result:
                        print(f"OK Backtest completed: {backtest_result['name']}")
                        print(f"   Returns: {backtest_result['returns']}%")
                        print(f"   Sharpe: {backtest_result['sharpe']}")
                    else:
                        print(f"ERROR Backtest failed: {backtest_result['error']}")
                else:
                    print(f"ERROR Model creation failed: {result['error']}")
            else:
                print("ERROR QlibManager not initialized - likely missing data")
                print("   Run: python -m qlib.run.get_data qlib_data --target_dir ~/.qlib/qlib_data/cn_data --region cn")
        else:
            print("ERROR QlibManager not available")
            
    except ImportError as e:
        print(f"ERROR Qlib import failed: {e}")
        print("   Install Qlib: pip install pyqlib")
    except Exception as e:
        print(f"ERROR Error testing Qlib: {e}")

def test_backend_endpoints():
    """Test backend API endpoints"""
    import requests
    import json
    
    base_url = "http://localhost:8003/api"
    
    print("\nTesting Backend API Endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"OK Health Check: {health['status']}")
            print(f"   Qlib Available: {health['qlib_available']}")
            print(f"   Qlib Initialized: {health.get('qlib_initialized', 'N/A')}")
        else:
            print(f"ERROR Health check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR Cannot connect to backend: {e}")
        print("   Start backend: cd backend && python app.py")
        return
    
    # Test login to get token
    try:
        login_data = {"email": "demo@qlib.com", "password": "demo123"}
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=5)
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data['access_token']
            headers = {"Authorization": f"Bearer {token}"}
            print("OK Authentication successful")
            
            # Test models endpoint
            response = requests.get(f"{base_url}/models", headers=headers, timeout=5)
            if response.status_code == 200:
                models = response.json()
                print(f"OK Models endpoint: {len(models)} models")
            else:
                print(f"ERROR Models endpoint failed: {response.status_code}")
            
            # Test datasets endpoint
            response = requests.get(f"{base_url}/data/datasets", headers=headers, timeout=5)
            if response.status_code == 200:
                datasets = response.json()
                print(f"OK Datasets endpoint: {len(datasets)} datasets")
                for dataset in datasets:
                    print(f"   - {dataset['name']}: {dataset['status']}")
            else:
                print(f"ERROR Datasets endpoint failed: {response.status_code}")
                
        else:
            print(f"ERROR Authentication failed: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"ERROR API test failed: {e}")

if __name__ == "__main__":
    print("Testing Qlib Integration\n")
    print("=" * 50)
    
    test_qlib_availability()
    test_backend_endpoints()
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("\nNext steps:")
    print("1. If Qlib not available: pip install pyqlib")
    print("2. If Qlib not initialized: download data with qlib.run.get_data")
    print("3. If backend not running: cd backend && python app.py")
    print("4. If frontend not running: cd frontend && npm run dev")