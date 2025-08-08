#!/usr/bin/env python3
"""
Quick health check script for Qlib Pro setup
"""
import requests
import json
import sys
from datetime import datetime

def test_backend_connection():
    """Test backend API connection"""
    print("[CHECK] Testing Backend Connection...")
    
    # Try different common ports
    ports = [8001, 8002, 8003, 8004, 8005]
    
    for port in ports:
        try:
            url = f"http://localhost:{port}/api/health"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"[OK] Backend is running on port {port}")
                print(f"   Status: {data.get('status', 'unknown')}")
                print(f"   Qlib Available: {data.get('qlib_available', 'unknown')}")
                print(f"   Timestamp: {data.get('timestamp', 'unknown')}")
                return port
                
        except requests.exceptions.RequestException:
            continue
    
    print("[ERROR] Backend not accessible on any common port")
    return None

def test_demo_login(port):
    """Test demo login functionality"""
    print("\n[CHECK] Testing Demo Login...")
    
    try:
        url = f"http://localhost:{port}/api/auth/login"
        payload = {
            "email": "demo@qlib.com",
            "password": "demo123"
        }
        
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Demo login successful")
            print(f"   User: {data.get('user', {}).get('name', 'Unknown')}")
            print(f"   Role: {data.get('user', {}).get('role', 'Unknown')}")
            return data.get('access_token')
        else:
            print(f"[ERROR] Login failed: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Login request failed: {e}")
        return None

def test_dashboard_data(port, token):
    """Test dashboard data retrieval"""
    print("\n[CHECK] Testing Dashboard Data...")
    
    try:
        url = f"http://localhost:{port}/api/dashboard/metrics"
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Dashboard data retrieved successfully")
            print(f"   Total Return: {data.get('total_return', 'N/A')}%")
            print(f"   Sharpe Ratio: {data.get('sharpe_ratio', 'N/A')}")
            print(f"   Portfolio Value: ${data.get('portfolio_value', 'N/A'):,}")
            print(f"   Active Models: {data.get('active_models', 'N/A')}")
            return True
        else:
            print(f"[ERROR] Dashboard data failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Dashboard request failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Qlib Pro Setup Health Check")
    print("=" * 40)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test backend connection
    port = test_backend_connection()
    if not port:
        print("\n[ERROR] Setup incomplete: Backend not running")
        print("Please start the backend server:")
        print("   cd backend && python app.py")
        sys.exit(1)
    
    # Test demo login
    token = test_demo_login(port)
    if not token:
        print("\n[ERROR] Authentication failed")
        sys.exit(1)
    
    # Test dashboard data
    dashboard_ok = test_dashboard_data(port, token)
    if not dashboard_ok:
        print("\n[ERROR] Dashboard data retrieval failed")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    print("[SUCCESS] All tests passed! Setup is working correctly.")
    print()
    print("Next steps:")
    print(f"1. Start frontend: cd frontend && npm run dev")
    print(f"2. Open browser: http://localhost:3000")
    print(f"3. Login with: demo@qlib.com / demo123")
    print(f"4. Backend API: http://localhost:{port}")

if __name__ == "__main__":
    main()