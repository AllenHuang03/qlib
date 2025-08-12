#!/usr/bin/env python3
"""
Simple test for market data API
"""
import os
import asyncio
import httpx

async def test_alpha_vantage(api_key: str, symbol: str = "AAPL"):
    """Test Alpha Vantage API directly"""
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": api_key
    }
    
    print(f"Testing Alpha Vantage API for {symbol}...")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {data}")
            
            if "Global Quote" in data:
                quote = data["Global Quote"]
                print(f"\n✅ Success! {symbol} Data:")
                print(f"   Price: ${quote.get('05. price', 'N/A')}")
                print(f"   Change: {quote.get('09. change', 'N/A')}")
                print(f"   Change %: {quote.get('10. change percent', 'N/A')}")
                print(f"   Volume: {quote.get('06. volume', 'N/A')}")
                return True
            else:
                print("❌ No quote data found")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    # Check if API key is set
    api_key = os.getenv("ALPHA_VANTAGE_KEY")
    
    if not api_key:
        print("❌ ALPHA_VANTAGE_KEY not set!")
        print("Run: set ALPHA_VANTAGE_KEY=your-key-here")
        return
    
    print(f"🔑 Using API key: {api_key[:8]}...")
    
    # Test different symbols
    symbols = ["AAPL", "MSFT", "GOOGL"]
    
    for symbol in symbols:
        success = await test_alpha_vantage(api_key, symbol)
        if success:
            break
        await asyncio.sleep(1)  # Rate limiting

if __name__ == "__main__":
    asyncio.run(main())