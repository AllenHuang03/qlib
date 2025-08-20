#!/usr/bin/env python3
"""
MINIMAL PRODUCTION API - Railway Deployment
Essential endpoints only to ensure Railway deployment success
"""

import os
import time
import random
import datetime
import json
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the real market data service
try:
    from market_data_service import market_data_service
    REAL_DATA_AVAILABLE = True
    print("SUCCESS: Real market data service loaded")
except ImportError:
    REAL_DATA_AVAILABLE = False
    print("WARNING: Using mock data only - install market_data_service for real data")

# Railway configuration - Railway uses port 8080
PORT = int(os.environ.get("PORT", 8080))

app = FastAPI(
    title="Qlib Pro - Minimal Production API", 
    description="Essential trading platform API for Railway deployment",
    version="2.1.1"
)

# CORS middleware - allow Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://startling-dragon-196548.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class MarketQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    last_updated: str

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Qlib Pro - Minimal Production API",
        "version": "2.1.0", 
        "status": "operational",
        "timestamp": datetime.datetime.now().isoformat(),
        "endpoints": [
            "/health",
            "/api/health", 
            "/api/market/quotes",
            "/api/market/historical/{symbol}",
            "/api/market/live/historical/{symbol}",
            "/api/market/indicators/{symbol}",
            "/api/market/multi-asset/symbols"
        ]
    }

# Health checks
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "version": "2.1.0"
    }

@app.get("/api/health")
async def api_health():
    return {
        "status": "healthy", 
        "message": "Qlib Pro Minimal API is running",
        "timestamp": datetime.datetime.now().isoformat(),
        "services": {
            "api": "available",
            "database": "mock",
            "market_data": "mock"
        }
    }

# Market data endpoints with mock data
@app.get("/api/market/quotes")
async def get_quotes():
    """Get market quotes - real data when available, fallback to mock"""
    
    if REAL_DATA_AVAILABLE:
        try:
            # Use real market data service
            symbols = ["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX"]
            real_data = await market_data_service.get_realtime_quotes(symbols)
            
            # Convert to our API format
            quotes = []
            for quote in real_data.get("quotes", []):
                quotes.append(MarketQuote(
                    symbol=quote["symbol"],
                    price=quote["price"],
                    change=quote["change"],
                    change_percent=quote.get("change_percent", "0%").replace("%", ""),
                    volume=quote["volume"],
                    last_updated=quote.get("timestamp", datetime.datetime.now().isoformat())
                ))
            
            return {
                "quotes": quotes,
                "total": len(quotes),
                "timestamp": datetime.datetime.now().isoformat(),
                "market": "ASX",
                "data_source": f"Real Data ({real_data.get('market_status', 'unknown')})"
            }
            
        except Exception as e:
            print(f"Real data fetch failed: {e}, falling back to mock data")
    
    # Fallback to mock data
    quotes = []
    
    # Realistic price ranges for major ASX stocks (as of 2025)
    stock_data = {
        "CBA.AX": {"base": 171.21, "range": 5.0},    # Commonwealth Bank
        "BHP.AX": {"base": 38.45, "range": 2.0},     # BHP Group  
        "CSL.AX": {"base": 285.30, "range": 8.0},    # CSL Limited
        "WBC.AX": {"base": 28.95, "range": 1.5},     # Westpac
        "ANZ.AX": {"base": 30.20, "range": 1.2},     # ANZ Bank
    }
    
    for symbol, data in stock_data.items():
        base_price = data["base"]
        price_range = data["range"]
        
        # Generate realistic price movement
        price_change = random.uniform(-price_range, price_range)
        current_price = base_price + price_change
        change_percent = (price_change / base_price) * 100
        
        quotes.append(MarketQuote(
            symbol=symbol,
            price=round(current_price, 2),
            change=round(price_change, 2),
            change_percent=round(change_percent, 2),
            volume=random.randint(500000, 8000000),  # Realistic volume for major stocks
            last_updated=datetime.datetime.now().isoformat()
        ))
    
    return {
        "quotes": quotes,
        "total": len(quotes),
        "timestamp": datetime.datetime.now().isoformat(),
        "market": "ASX",
        "data_source": "Mock Data (Real data unavailable)"
    }

@app.get("/api/market/historical/{symbol}")
async def get_historical_data(symbol: str):
    """Get mock historical data with realistic prices"""
    data = []
    
    # Get base price for the symbol
    stock_data = {
        "CBA.AX": 171.21,
        "BHP.AX": 38.45,
        "CSL.AX": 285.30,
        "WBC.AX": 28.95,
        "ANZ.AX": 30.20,
    }
    
    base_price = stock_data.get(symbol, 100.0)
    current_price = base_price
    
    for i in range(30):
        date = datetime.datetime.now() - datetime.timedelta(days=30-i)
        
        # Generate realistic daily price movement (±2% typical range)
        daily_change_percent = random.uniform(-0.02, 0.02)
        daily_change = current_price * daily_change_percent
        
        # Calculate OHLC for the day
        open_price = current_price
        close_price = current_price + daily_change
        high_price = max(open_price, close_price) + random.uniform(0, abs(daily_change) * 0.5)
        low_price = min(open_price, close_price) - random.uniform(0, abs(daily_change) * 0.5)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "time": date.isoformat(),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": random.randint(500000, 3000000)
        })
        
        # Update current price for next day
        current_price = close_price
    
    return {
        "symbol": symbol,
        "data": data,
        "count": len(data),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/live/historical/{symbol}")
async def get_live_historical_data(symbol: str, days: int = 30):
    """Get enhanced historical data with realistic prices"""
    data = []
    
    # Get base price for the symbol
    stock_data = {
        "CBA.AX": 171.21,
        "BHP.AX": 38.45,
        "CSL.AX": 285.30,
        "WBC.AX": 28.95,
        "ANZ.AX": 30.20,
    }
    
    base_price = stock_data.get(symbol, 100.0)
    current_price = base_price
    
    for i in range(days):
        date = datetime.datetime.now() - datetime.timedelta(days=days-i)
        
        # Generate realistic daily price movement
        daily_change_percent = random.uniform(-0.015, 0.015)  # ±1.5%
        daily_change = current_price * daily_change_percent
        
        # Calculate OHLC for the day
        open_price = current_price
        close_price = current_price + daily_change
        high_price = max(open_price, close_price) + random.uniform(0, abs(daily_change) * 0.3)
        low_price = min(open_price, close_price) - random.uniform(0, abs(daily_change) * 0.3)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "timestamp": date.timestamp(),
            "time": date.isoformat(),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": random.randint(800000, 4000000)
        })
        
        # Update current price for next day
        current_price = close_price
    
    return {
        "symbol": symbol,
        "days": days,
        "data": data,
        "count": len(data),
        "asset_class": "equity",
        "timestamp": datetime.datetime.now().isoformat(),
        "source": "mock_data"
    }

@app.get("/api/market/indicators/{symbol}")
async def get_technical_indicators(symbol: str):
    """Get mock technical indicators"""
    return {
        "symbol": symbol,
        "indicators": {
            "SMA_20": {"value": round(random.uniform(100, 120), 2), "timestamp": time.time()},
            "SMA_50": {"value": round(random.uniform(95, 115), 2), "timestamp": time.time()},
            "RSI_14": {"value": round(random.uniform(30, 70), 2), "timestamp": time.time()},
            "MACD": {"value": round(random.uniform(-2, 2), 2), "timestamp": time.time()},
            "BB_UPPER": {"value": round(random.uniform(110, 130), 2), "timestamp": time.time()},
            "BB_LOWER": {"value": round(random.uniform(90, 110), 2), "timestamp": time.time()}
        },
        "count": 6,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/multi-asset/symbols")
async def get_supported_symbols():
    """Get supported symbols across asset classes"""
    return {
        "symbols": {
            "equity": ["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX", "TLS.AX"],
            "cryptocurrency": ["BTC.AX", "ETH.AX", "ADA.AX"],
            "commodity": ["GOLD", "SILVER", "OIL.WTI"],
            "fixed_income": ["AGB.2Y", "AGB.5Y", "AGB.10Y"],
            "forex": ["AUDUSD", "EURAUD", "GBPAUD"]
        },
        "total_symbols": 20,
        "asset_classes": ["equity", "cryptocurrency", "commodity", "fixed_income", "forex"],
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/signals/{symbol}")
async def get_trading_signals(symbol: str):
    """Get mock trading signals"""
    return {
        "symbol": symbol,
        "signals": [
            {
                "type": "BUY",
                "strength": round(random.uniform(0.6, 0.9), 2),
                "price": round(random.uniform(90, 110), 2),
                "timestamp": datetime.datetime.now().isoformat(),
                "reason": "Technical breakout pattern detected"
            },
            {
                "type": "HOLD",
                "strength": round(random.uniform(0.5, 0.8), 2),
                "price": round(random.uniform(90, 110), 2),
                "timestamp": datetime.datetime.now().isoformat(),
                "reason": "Consolidation phase, await next trend"
            }
        ],
        "count": 2,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/live/quotes")
async def get_live_quotes(symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,ANZ.AX"):
    """Get live quotes for multiple symbols with realistic prices"""
    symbol_list = symbols.split(',')
    quotes = []
    
    # Realistic price data for major ASX stocks
    stock_data = {
        "CBA.AX": {"base": 171.21, "range": 2.0},
        "BHP.AX": {"base": 38.45, "range": 1.0},
        "CSL.AX": {"base": 285.30, "range": 4.0},
        "WBC.AX": {"base": 28.95, "range": 0.8},
        "ANZ.AX": {"base": 30.20, "range": 0.9},
    }
    
    for symbol in symbol_list:
        data = stock_data.get(symbol, {"base": 100.0, "range": 2.0})
        base_price = data["base"]
        price_range = data["range"]
        
        # Generate realistic price and spread
        price_change = random.uniform(-price_range, price_range)
        current_price = base_price + price_change
        spread = current_price * 0.001  # 0.1% spread
        
        quotes.append({
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(price_change, 2),
            "change_percent": round((price_change / base_price) * 100, 2),
            "volume": random.randint(1000000, 6000000),
            "bid": round(current_price - spread/2, 2),
            "ask": round(current_price + spread/2, 2),
            "last_updated": datetime.datetime.now().isoformat()
        })
    
    return {
        "quotes": quotes,
        "total": len(quotes),
        "timestamp": datetime.datetime.now().isoformat(),
        "market": "ASX",
        "data_source": "Mock Data"
    }

@app.get("/api/market/multi-asset/data/{symbol}")
async def get_asset_class_info(symbol: str):
    """Get asset class information for a symbol"""
    # Mock asset class mapping
    asset_classes = {
        "CBA.AX": "equity",
        "BHP.AX": "equity", 
        "CSL.AX": "equity",
        "WBC.AX": "equity",
        "ANZ.AX": "equity",
        "BTC.AX": "cryptocurrency",
        "ETH.AX": "cryptocurrency",
        "GOLD": "commodity",
        "SILVER": "commodity"
    }
    
    asset_class = asset_classes.get(symbol, "equity")
    
    return {
        "symbol": symbol,
        "asset_class": asset_class,
        "market": "ASX" if symbol.endswith(".AX") else "OTHER",
        "currency": "AUD",
        "exchange": "Australian Securities Exchange",
        "sector": "Financial Services" if asset_class == "equity" else asset_class.title(),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/activity")
async def get_trading_activity():
    """Get mock trading activity data"""
    activities = []
    
    for i in range(10):
        activities.append({
            "id": f"trade_{i+1}",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=i*15)).isoformat(),
            "symbol": random.choice(["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX"]),
            "side": random.choice(["BUY", "SELL"]),
            "quantity": random.randint(100, 5000),
            "price": round(random.uniform(30, 300), 2),
            "value": 0,  # Will be calculated
            "status": random.choice(["FILLED", "PENDING", "CANCELLED"]),
            "type": random.choice(["MARKET", "LIMIT", "STOP"]),
            "agent": f"Agent_{random.randint(1, 5)}"
        })
    
    # Calculate values
    for activity in activities:
        activity["value"] = round(activity["quantity"] * activity["price"], 2)
    
    return {
        "activities": activities,
        "total": len(activities),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/agents")
async def get_trading_agents():
    """Get mock trading agents data"""
    agents = []
    
    for i in range(5):
        agent_id = f"Agent_{i+1}"
        pnl = round(random.uniform(-5000, 15000), 2)
        
        agents.append({
            "id": agent_id,
            "name": f"Quantitative Agent {i+1}",
            "status": random.choice(["ACTIVE", "PAUSED", "STOPPED"]),
            "strategy": random.choice(["Mean Reversion", "Momentum", "Arbitrage", "Market Making", "Trend Following"]),
            "pnl": pnl,
            "pnl_percent": round((pnl / 100000) * 100, 2),  # Assuming $100k starting capital
            "trades_today": random.randint(5, 50),
            "win_rate": round(random.uniform(0.45, 0.75), 2),
            "sharpe_ratio": round(random.uniform(0.8, 2.5), 2),
            "max_drawdown": round(random.uniform(-0.15, -0.05), 2),
            "last_trade": (datetime.datetime.now() - datetime.timedelta(minutes=random.randint(1, 120))).isoformat(),
            "positions": random.randint(0, 8)
        })
    
    return {
        "agents": agents,
        "total": len(agents),
        "active_count": len([a for a in agents if a["status"] == "ACTIVE"]),
        "total_pnl": sum(a["pnl"] for a in agents),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/api/trading/agents/{agent_id}/control")
async def control_trading_agent(agent_id: str, action: dict):
    """Control trading agent - start, pause, stop"""
    valid_actions = ["start", "pause", "stop"]
    action_type = action.get("action", "").lower()
    
    if action_type not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    # Simulate agent control
    status_map = {
        "start": "ACTIVE",
        "pause": "PAUSED", 
        "stop": "STOPPED"
    }
    
    new_status = status_map[action_type]
    
    return {
        "success": True,
        "agent_id": agent_id,
        "action": action_type,
        "new_status": new_status,
        "timestamp": datetime.datetime.now().isoformat(),
        "message": f"Agent {agent_id} {action_type} command executed successfully"
    }

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.subscriptions: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
        # Remove from all subscriptions
        for symbol, connections in self.subscriptions.items():
            if websocket in connections:
                connections.remove(websocket)
        
        print(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")
    
    def subscribe(self, websocket: WebSocket, symbol: str):
        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = []
        if websocket not in self.subscriptions[symbol]:
            self.subscriptions[symbol].append(websocket)
            print(f"Client subscribed to {symbol}")
    
    def unsubscribe(self, websocket: WebSocket, symbol: str):
        if symbol in self.subscriptions and websocket in self.subscriptions[symbol]:
            self.subscriptions[symbol].remove(websocket)
            print(f"Client unsubscribed from {symbol}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        broken_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                broken_connections.append(connection)
        
        # Clean up broken connections
        for broken in broken_connections:
            self.disconnect(broken)
    
    async def broadcast_to_symbol(self, symbol: str, message: str):
        if symbol in self.subscriptions:
            broken_connections = []
            for connection in self.subscriptions[symbol]:
                try:
                    await connection.send_text(message)
                except:
                    broken_connections.append(connection)
            
            # Clean up broken connections
            for broken in broken_connections:
                self.disconnect(broken)

manager = ConnectionManager()

# Background task to generate mock live data
async def generate_mock_live_data():
    import asyncio
    
    symbols = ["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX", "AAPL", "TSLA", "GOOGL"]
    base_prices = {
        "CBA.AX": 171.21,
        "BHP.AX": 38.45,
        "CSL.AX": 285.30,
        "WBC.AX": 28.95,
        "ANZ.AX": 30.20,
        "AAPL": 150.00,
        "TSLA": 200.00,
        "GOOGL": 140.00
    }
    
    while True:
        try:
            for symbol in symbols:
                if symbol in manager.subscriptions and len(manager.subscriptions[symbol]) > 0:
                    base_price = base_prices.get(symbol, 100)
                    
                    # Generate realistic price movement
                    change_percent = (random.random() - 0.5) * 0.02  # ±1% max change
                    new_price = base_price * (1 + change_percent)
                    
                    # Update base price for next iteration (mean reversion)
                    base_prices[symbol] = new_price * 0.8 + base_price * 0.2
                    
                    # Create realistic OHLC data
                    high = new_price * (1 + random.random() * 0.005)
                    low = new_price * (1 - random.random() * 0.005)
                    open_price = base_price
                    
                    live_data = {
                        "type": "price_update",
                        "symbol": symbol,
                        "price": round(new_price, 2),
                        "change": round(new_price - base_price, 2),
                        "changePercent": round(change_percent * 100, 2),
                        "volume": random.randint(100000, 1000000),
                        "high": round(high, 2),
                        "low": round(low, 2),
                        "open": round(open_price, 2),
                        "timestamp": int(time.time() * 1000)
                    }
                    
                    await manager.broadcast_to_symbol(symbol, json.dumps(live_data))
            
            await asyncio.sleep(2)  # Update every 2 seconds
            
        except Exception as e:
            print(f"Error in mock data generation: {e}")
            await asyncio.sleep(5)

# Start background task
import asyncio
import time

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(generate_mock_live_data())

# WebSocket endpoint for live market data
@app.websocket("/ws/live-market")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection message
        await manager.send_personal_message(json.dumps({
            "type": "connection",
            "message": "Connected to live market data",
            "timestamp": datetime.datetime.now().isoformat()
        }), websocket)
        
        # Listen for subscription messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                symbol = message.get("symbol", "").upper()
                manager.subscribe(websocket, symbol)
                
                # Send confirmation
                await manager.send_personal_message(json.dumps({
                    "type": "subscription_confirmed",
                    "symbol": symbol,
                    "message": f"Subscribed to {symbol}",
                    "timestamp": datetime.datetime.now().isoformat()
                }), websocket)
                
            elif message.get("type") == "unsubscribe":
                symbol = message.get("symbol", "").upper()
                manager.unsubscribe(websocket, symbol)
                
                # Send confirmation
                await manager.send_personal_message(json.dumps({
                    "type": "unsubscription_confirmed",
                    "symbol": symbol,
                    "message": f"Unsubscribed from {symbol}",
                    "timestamp": datetime.datetime.now().isoformat()
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# WebSocket info endpoint
@app.get("/ws/live-market")
async def websocket_info():
    """WebSocket endpoint information"""
    return {
        "message": "WebSocket endpoint for live market data",
        "status": "available",
        "url": "wss://qlib-production.up.railway.app/ws/live-market",
        "protocols": ["live-quotes", "trading-signals", "market-alerts"]
    }

if __name__ == "__main__":
    print(f"Starting Qlib Pro Minimal API on port {PORT}...")
    print(f"Health check: http://0.0.0.0:{PORT}/health")
    print(f"Documentation: http://0.0.0.0:{PORT}/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",  # Accept external connections
        port=PORT,       # Use Railway's PORT environment variable  
        reload=False,
        access_log=True
    )