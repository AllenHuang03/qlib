#!/usr/bin/env python3
"""
Automatic setup synchronization script
"""
import os
import sys
import time
import requests
import subprocess
from datetime import datetime

def find_active_backend():
    """Find which port has an active backend"""
    for port in range(8001, 8010):
        try:
            response = requests.get(f'http://localhost:{port}/api/health', timeout=2)
            if response.status_code == 200:
                return port
        except:
            continue
    return None

def update_frontend_env(port):
    """Update frontend .env file with correct backend port"""
    env_file = 'frontend/.env'
    env_content = f'VITE_API_URL=http://localhost:{port}\n'
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        return True
    except Exception as e:
        print(f"Error updating {env_file}: {e}")
        return False

def test_backend_connection(port):
    """Test backend endpoints"""
    try:
        # Test health
        health_response = requests.get(f'http://localhost:{port}/api/health', timeout=3)
        if health_response.status_code != 200:
            return False, "Health check failed"
        
        # Test login
        login_response = requests.post(
            f'http://localhost:{port}/api/auth/login',
            json={'email': 'demo@qlib.com', 'password': 'demo123'},
            timeout=3
        )
        if login_response.status_code != 200:
            return False, "Login test failed"
        
        return True, "All tests passed"
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("  QLIB PRO - SETUP SYNCHRONIZATION")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Step 1: Find active backend
    print("Step 1: Scanning for active backend...")
    active_port = find_active_backend()
    
    if not active_port:
        print("[ERROR] No active backend found!")
        print("\nPlease start the backend first:")
        print("  Option 1: python start_backend_simple.py")
        print("  Option 2: cd backend && python app.py")
        print("\nThen run this script again.")
        input("\nPress Enter to exit...")
        return
    
    print(f"[OK] Backend found on port {active_port}")
    
    # Step 2: Test backend
    print("\nStep 2: Testing backend endpoints...")
    success, message = test_backend_connection(active_port)
    
    if not success:
        print(f"[ERROR] Backend test failed: {message}")
        input("Press Enter to exit...")
        return
    
    print(f"[OK] {message}")
    
    # Step 3: Update frontend config
    print("\nStep 3: Updating frontend configuration...")
    if update_frontend_env(active_port):
        print(f"[OK] Updated frontend/.env with port {active_port}")
    else:
        print("[ERROR] Failed to update frontend configuration")
        input("Press Enter to exit...")
        return
    
    # Step 4: Verify configuration
    print("\nStep 4: Verifying configuration...")
    try:
        with open('frontend/.env', 'r') as f:
            content = f.read().strip()
            print(f"[OK] Frontend config: {content}")
    except:
        print("[ERROR] Could not read frontend config")
    
    print("\n" + "=" * 60)
    print("  SETUP SYNCHRONIZATION COMPLETE!")
    print("=" * 60)
    print(f"✓ Backend running on: http://localhost:{active_port}")
    print(f"✓ Frontend configured for: http://localhost:{active_port}")
    print()
    print("Next steps:")
    print("1. Start/restart your frontend:")
    print("   cd frontend && npm run dev")
    print()
    print("2. Open browser to: http://localhost:3007 (or 3000)")
    print("   Login with: demo@qlib.com / demo123")
    print()
    print("If frontend is already running, restart it to pick up the new config.")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        input("Press Enter to exit...")