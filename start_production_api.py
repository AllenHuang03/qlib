#!/usr/bin/env python3
"""
Production API Launcher
Starts the consolidated Qlib Pro Production API
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # Set environment variables
    api_dir = Path(__file__).parent / "backend"
    api_file = api_dir / "production_api.py"
    
    if not api_file.exists():
        print("❌ Production API file not found!")
        print(f"Expected: {api_file}")
        sys.exit(1)
    
    print("🚀 Starting Qlib Pro Production API...")
    print(f"📁 API Location: {api_file}")
    print(f"🌐 URL: http://localhost:8001")
    print(f"📖 Documentation: http://localhost:8001/docs")
    print("")
    
    # Set Alpha Vantage API key if available
    if not os.getenv("ALPHA_VANTAGE_KEY"):
        os.environ["ALPHA_VANTAGE_KEY"] = "YR3O8FBCPDC5IVEX"
        print("🔑 Using default Alpha Vantage API key")
    
    try:
        # Change to API directory and run
        os.chdir(api_dir)
        subprocess.run([sys.executable, "production_api.py"], check=True)
    except KeyboardInterrupt:
        print("\n⏹️  Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()