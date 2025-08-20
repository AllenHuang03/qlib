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
    """Get mock market quotes"""
    quotes = []
    symbols = ["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX"]
    
    for symbol in symbols:
        quotes.append(MarketQuote(
            symbol=symbol,
            price=round(random.uniform(50, 300), 2),
            change=round(random.uniform(-5, 5), 2),
            change_percent=round(random.uniform(-3, 3), 2),
            volume=random.randint(100000, 5000000),
            last_updated=datetime.datetime.now().isoformat()
        ))
    
    return {
        "quotes": quotes,
        "total": len(quotes),
        "timestamp": datetime.datetime.now().isoformat(),
        "market": "ASX",
        "data_source": "Mock Data"
    }

@app.get("/api/market/historical/{symbol}")
async def get_historical_data(symbol: str):
    """Get mock historical data"""
    data = []
    for i in range(30):
        date = datetime.datetime.now() - datetime.timedelta(days=30-i)
        base_price = 100 + random.uniform(-10, 10)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(base_price + random.uniform(-2, 2), 2),
            "high": round(base_price + random.uniform(0, 5), 2),
            "low": round(base_price - random.uniform(0, 5), 2),
            "close": round(base_price + random.uniform(-3, 3), 2),
            "volume": random.randint(100000, 1000000)
        })
    
    return {
        "symbol": symbol,
        "data": data,
        "count": len(data),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/live/historical/{symbol}")
async def get_live_historical_data(symbol: str, days: int = 30):
    """Get enhanced historical data with mock fallback"""
    data = []
    for i in range(days):
        date = datetime.datetime.now() - datetime.timedelta(days=days-i)
        base_price = 100 + random.uniform(-10, 10)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "timestamp": date.timestamp(),
            "open": round(base_price + random.uniform(-2, 2), 2),
            "high": round(base_price + random.uniform(0, 5), 2),
            "low": round(base_price - random.uniform(0, 5), 2),
            "close": round(base_price + random.uniform(-3, 3), 2),
            "volume": random.randint(100000, 1000000)
        })
    
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

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

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
        
        # Keep connection alive and send periodic updates
        while True:
            # Send mock market data every 5 seconds
            mock_data = {
                "type": "market_update",
                "symbol": "CBA.AX",
                "price": round(random.uniform(90, 110), 2),
                "change": round(random.uniform(-2, 2), 2),
                "volume": random.randint(1000, 10000),
                "timestamp": datetime.datetime.now().isoformat()
            }
            await manager.send_personal_message(json.dumps(mock_data), websocket)
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
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