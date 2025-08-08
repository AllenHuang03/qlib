#!/usr/bin/env python3
"""
Simple backend startup script with better error handling
"""
import sys
import os
import socket
from datetime import datetime

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

def find_available_port(start_port=8001, max_port=8020):
    """Find an available port"""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def main():
    print("=" * 50)
    print("  QLIB PRO BACKEND SERVER")
    print("=" * 50)
    print(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Find available port
    port = find_available_port()
    if not port:
        print("ERROR: No available ports found")
        input("Press Enter to exit...")
        return
    
    print(f"Using port: {port}")
    print(f"API will be available at: http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Set environment variables
    os.environ['PORT'] = str(port)
    os.environ['DEBUG'] = 'True'
    
    try:
        # Import and run the Flask app
        from app import app
        app.run(host='127.0.0.1', port=port, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    # Change to backend directory
    os.chdir(backend_dir)
    main()