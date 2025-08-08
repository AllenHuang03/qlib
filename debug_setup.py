#!/usr/bin/env python3
"""
Debug script to check current setup status
"""
import os
import requests
import sys
from datetime import datetime

def check_files():
    """Check if required files exist"""
    print("[FILE CHECK]")
    files_to_check = [
        'backend/app.py',
        'backend/requirements.txt', 
        'frontend/package.json',
        'frontend/src/main.tsx',
        'frontend/.env'
    ]
    
    for file_path in files_to_check:
        exists = os.path.exists(file_path)
        status = "[OK]" if exists else "[MISSING]"
        print(f"  {status} {file_path}")
    
    return True

def check_backend_ports():
    """Check which backend ports are active"""
    print("\n[BACKEND PORTS]")
    active_ports = []
    
    for port in range(8001, 8006):
        try:
            response = requests.get(f'http://localhost:{port}/api/health', timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"  [ACTIVE] Port {port} - Status: {data.get('status', 'unknown')}")
                print(f"           Qlib: {data.get('qlib_available', 'unknown')}")
                active_ports.append(port)
            else:
                print(f"  [ERROR] Port {port} - HTTP {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"  [OFFLINE] Port {port}")
    
    return active_ports

def check_frontend_config():
    """Check frontend configuration"""
    print("\n[FRONTEND CONFIG]")
    
    env_file = 'frontend/.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            content = f.read()
            print(f"  [OK] .env file exists:")
            for line in content.strip().split('\n'):
                if line:
                    print(f"       {line}")
    else:
        print("  [MISSING] frontend/.env file")
    
    package_file = 'frontend/package.json'
    if os.path.exists(package_file):
        print("  [OK] package.json exists")
    else:
        print("  [MISSING] package.json")

def test_backend_endpoints(port):
    """Test specific backend endpoints"""
    print(f"\n[BACKEND ENDPOINTS] Testing port {port}")
    
    endpoints = [
        '/api/health',
        '/api/auth/login',
        '/api/dashboard/metrics'
    ]
    
    for endpoint in endpoints:
        try:
            if endpoint == '/api/auth/login':
                # Test POST login
                response = requests.post(
                    f'http://localhost:{port}{endpoint}',
                    json={'email': 'demo@qlib.com', 'password': 'demo123'},
                    timeout=2
                )
            else:
                response = requests.get(f'http://localhost:{port}{endpoint}', timeout=2)
            
            status = f"HTTP {response.status_code}"
            if response.status_code == 200:
                print(f"  [OK] {endpoint} - {status}")
            else:
                print(f"  [ERROR] {endpoint} - {status}")
        except requests.exceptions.RequestException as e:
            print(f"  [FAILED] {endpoint} - {str(e)}")

def show_recommendations(active_ports):
    """Show recommendations based on current setup"""
    print(f"\n[RECOMMENDATIONS]")
    
    if not active_ports:
        print("  1. Start the backend server:")
        print("     cd backend && python app.py")
        print("  2. The server will show which port it's using")
        print("  3. Update frontend/.env with the correct port")
    else:
        active_port = active_ports[0]
        print(f"  1. Backend is running on port {active_port}")
        print(f"  2. Update frontend/.env:")
        print(f"     VITE_API_URL=http://localhost:{active_port}")
        print("  3. Restart the frontend if already running:")
        print("     cd frontend && npm run dev")
    
    print("\n  For frontend debugging:")
    print("  - Open browser dev tools (F12)")
    print("  - Check Console tab for errors")
    print("  - Check Network tab for failed API calls")

def main():
    print("=" * 50)
    print("  QLIB PRO - SETUP DEBUG SCRIPT")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Change to the qlib directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    check_files()
    active_ports = check_backend_ports()
    check_frontend_config()
    
    if active_ports:
        test_backend_endpoints(active_ports[0])
    
    show_recommendations(active_ports)
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)