#!/usr/bin/env python3
"""
Simple backend starter that ensures stable connection
"""
import os
import sys
import time
import socket
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path.parent))
sys.path.insert(0, str(backend_path))

def find_free_port(start=8004, end=8020):
    """Find a free port in the range"""
    for port in range(start, end):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def start_backend():
    """Start the backend server"""
    print("🚀 Starting Qlib Backend Server...")
    
    # Find available port
    port = find_free_port()
    if not port:
        print("❌ No available ports found")
        return
        
    print(f"📡 Using port: {port}")
    
    # Set environment
    os.environ['PORT'] = str(port)
    os.environ['DEBUG'] = 'False'
    
    try:
        # Import and start Flask app
        from backend.app import app
        print(f"✅ Flask app loaded")
        print(f"🌐 Starting server on http://localhost:{port}")
        print(f"📊 API available at: http://localhost:{port}/api")
        print("🔑 Login: demo@qlib.com / demo123")
        print("\n" + "="*50)
        print("Backend is starting up...")
        print("Frontend should connect to port:", port)
        print("Update frontend .env file if needed!")
        print("="*50 + "\n")
        
        # Start the server
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    start_backend()