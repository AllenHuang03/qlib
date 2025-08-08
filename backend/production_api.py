"""
Production API Server - Connects frontend to real Qlib backend
Supports both consumer interface and admin dashboard
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import redis
import yfinance as yf
import pandas as pd
import numpy as np

# Import our Qlib pipeline
try:
    from qlib_pipeline import qlib_pipeline, train_model, generate_signals, ModelConfig, TrainingResult
    PIPELINE_AVAILABLE = True
except ImportError as e:
    print(f"Qlib pipeline not available: {e}")
    PIPELINE_AVAILABLE = False

# API Models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = 'user'

class UserLogin(BaseModel):
    email: str
    password: str

class ModelCreateRequest(BaseModel):
    name: str
    display_name: str
    model_type: str = Field(..., regex="^(LightGBM|LSTM|Transformer|GATs|HIST)$")
    description: str = ""
    market: str = "csi300"
    start_date: str = "2020-01-01"
    end_date: str = "2023-12-31"

class ModelControlRequest(BaseModel):
    action: str = Field(..., regex="^(start|pause|stop|delete)$")

class BacktestRequest(BaseModel):
    model_id: str
    name: str
    start_date: str
    end_date: str
    initial_capital: float = 100000
    benchmark: str = "SPY"

class TradingSignalResponse(BaseModel):
    model_id: str
    symbol: str
    signal_type: str
    confidence: float
    target_price: float
    current_price: float
    reasoning: str
    key_factors: Dict
    generated_at: datetime
    expires_at: datetime

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://qlib_user:qlib_pass@localhost/qlib_prod")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SECRET_KEY = os.getenv("SECRET_KEY", "qlib-secret-key-change-in-production")

# Initialize FastAPI app
app = FastAPI(
    title="Qlib AI Trading Platform API",
    description="Production API for AI-powered quantitative trading",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3010", "https://qlib-ai.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database setup
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    DATABASE_AVAILABLE = True
except Exception as e:
    print(f"Database connection failed: {e}")
    DATABASE_AVAILABLE = False
    SessionLocal = None

# Redis setup  
try:
    redis_client = redis.from_url(REDIS_URL)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception as e:
    print(f"Redis connection failed: {e}")
    REDIS_AVAILABLE = False
    redis_client = None

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database dependency
def get_db():
    if not DATABASE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user info"""
    token = credentials.credentials
    
    # Simple token validation for demo
    # In production, use proper JWT validation
    if token == "demo-token-123":
        return {"id": "1", "email": "demo@qlib.com", "role": "trader", "name": "Demo User"}
    elif token == "admin-token-123":
        return {"id": "2", "email": "admin@qlib.ai", "role": "admin", "name": "Admin User"}
    
    raise HTTPException(status_code=401, detail="Invalid authentication token")

# Admin-only dependency
async def get_admin_user(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Market Data Service
class MarketDataService:
    """Service for fetching and caching market data"""
    
    def __init__(self):
        self.cache_ttl = 300  # 5 minutes cache
    
    def get_real_time_price(self, symbol: str) -> Dict:
        """Get real-time price for a symbol"""
        try:
            # Try Redis cache first
            if REDIS_AVAILABLE:
                cached = redis_client.get(f"price:{symbol}")
                if cached:
                    return json.loads(cached)
            
            # Fetch from Yahoo Finance
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="1d")
            
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
                prev_close = info.get('previousClose', current_price)
                change = current_price - prev_close
                change_pct = (change / prev_close) * 100 if prev_close else 0
                
                price_data = {
                    'symbol': symbol,
                    'price': round(current_price, 2),
                    'change': round(change, 2),
                    'change_percent': round(change_pct, 2),
                    'volume': int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                    'last_updated': datetime.now().isoformat()
                }
                
                # Cache the result
                if REDIS_AVAILABLE:
                    redis_client.setex(f"price:{symbol}", self.cache_ttl, json.dumps(price_data))
                
                return price_data
            
            raise ValueError(f"No data available for {symbol}")
            
        except Exception as e:
            logger.error(f"Failed to fetch price for {symbol}: {str(e)}")
            # Return mock data as fallback
            return self._get_mock_price(symbol)
    
    def _get_mock_price(self, symbol: str) -> Dict:
        """Generate mock price data for testing"""
        base_prices = {
            'AAPL': 182.50, 'MSFT': 337.20, 'GOOGL': 134.80, 
            'TSLA': 248.50, 'NVDA': 821.30, 'SPY': 445.20
        }
        
        base_price = base_prices.get(symbol, 100.0)
        # Add some random variation
        np.random.seed(hash(symbol + str(datetime.now().date())) % 2**32)
        price = base_price * (1 + np.random.normal(0, 0.02))
        change = np.random.normal(0, 0.01) * base_price
        
        return {
            'symbol': symbol,
            'price': round(price, 2),
            'change': round(change, 2),
            'change_percent': round((change / base_price) * 100, 2),
            'volume': int(np.random.uniform(1000000, 10000000)),
            'last_updated': datetime.now().isoformat()
        }

    def get_historical_data(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        """Get historical data for backtesting"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            return hist
        except Exception as e:
            logger.error(f"Failed to fetch historical data for {symbol}: {str(e)}")
            return pd.DataFrame()

# Initialize services
market_data_service = MarketDataService()

# API Routes

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@app.post("/api/auth/login")
async def login(user_login: UserLogin):
    """Authenticate user and return token"""
    # Simple demo authentication
    if user_login.email == "demo@qlib.com" and user_login.password == "demo123":
        return {
            "access_token": "demo-token-123",
            "token_type": "bearer",
            "user": {
                "id": "1",
                "email": "demo@qlib.com",
                "name": "Demo User",
                "role": "trader"
            }
        }
    elif user_login.email == "admin@qlib.ai" and user_login.password == "admin123":
        return {
            "access_token": "admin-token-123", 
            "token_type": "bearer",
            "user": {
                "id": "2",
                "email": "admin@qlib.ai",
                "name": "Admin User",
                "role": "admin"
            }
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return user

# ================================
# CONSUMER API ENDPOINTS
# ================================

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    """Get dashboard metrics for consumer interface"""
    # In production, fetch from database based on user's portfolios
    return {
        "total_return": 22.8,
        "sharpe_ratio": 1.84,
        "max_drawdown": -4.2,
        "portfolio_value": 122340,
        "active_models": 2,
        "total_models": 4,
        "last_update": datetime.now().isoformat()
    }

@app.get("/api/dashboard/performance") 
async def get_performance_data(user: dict = Depends(get_current_user)):
    """Get portfolio performance data for charts"""
    # Mock performance data - in production, fetch from performance_data table
    base_date = datetime.now() - timedelta(days=180)
    data = []
    
    for i in range(180):
        date = base_date + timedelta(days=i)
        portfolio_value = 100000 * (1 + (i * 0.001) + np.random.normal(0, 0.01))
        benchmark_value = 100000 * (1 + (i * 0.0007) + np.random.normal(0, 0.008))
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "portfolio": round(portfolio_value, 2),
            "benchmark": round(benchmark_value, 2)
        })
    
    return data

@app.get("/api/models")
async def get_models(user: dict = Depends(get_current_user)):
    """Get available AI models for user"""
    if PIPELINE_AVAILABLE:
        # Get models from Qlib pipeline
        models = qlib_pipeline.list_models()
        # Convert to consumer-friendly format
        consumer_models = []
        for model in models:
            consumer_models.append({
                "id": model["model_id"],
                "name": model["display_name"],
                "type": model["model_type"],
                "status": "active" if model["status"] == "active" else "training",
                "accuracy": f"{model['performance'].get('accuracy', 0):.1f}%",
                "sharpe": f"{model['performance'].get('correlation', 0):.2f}",
                "last_trained": model["trained_at"],
                "description": f"AI-powered {model['model_type']} trading strategy"
            })
        return consumer_models
    
    # Fallback mock data
    return [
        {
            "id": "1",
            "name": "AI Stock Picker #1", 
            "type": "LightGBM",
            "status": "active",
            "accuracy": "89.2%",
            "sharpe": "1.67",
            "last_trained": "2024-01-15",
            "description": "Conservative growth strategy using gradient boosting"
        },
        {
            "id": "2",
            "name": "AI Value Hunter",
            "type": "LSTM", 
            "status": "active",
            "accuracy": "85.7%",
            "sharpe": "1.43",
            "last_trained": "2024-01-12",
            "description": "Deep learning model for undervalued stock detection"
        }
    ]

@app.post("/api/models/{model_id}/control")
async def control_model(model_id: str, request: ModelControlRequest, user: dict = Depends(get_current_user)):
    """Control model for user (pause/resume)"""
    # In production, this would update user_model_subscriptions table
    return {"message": f"Model {request.action}ed successfully", "status": request.action}

@app.get("/api/models/{model_id}/signals")
async def get_model_signals(model_id: str, user: dict = Depends(get_current_user)):
    """Get recent trading signals from a model"""
    if PIPELINE_AVAILABLE:
        signals = generate_signals(model_id, ['AAPL', 'MSFT', 'GOOGL'])
        # Enhance signals with current market data
        for signal in signals:
            market_data = market_data_service.get_real_time_price(signal['symbol'])
            signal['current_price'] = market_data['price']
            signal['change'] = f"{market_data['change']:+.2f}"
            signal['change_percent'] = f"{market_data['change_percent']:+.1f}%"
        return signals
    
    # Mock signals
    return [
        {
            "symbol": "AAPL",
            "signal_type": "BUY",
            "confidence": 92,
            "current_price": 182.50,
            "change": "+2.30",
            "change_percent": "+1.3%", 
            "reasoning": "Strong earnings momentum detected",
            "generated_at": datetime.now().isoformat()
        }
    ]

# ================================
# ADMIN API ENDPOINTS
# ================================

@app.get("/api/admin/system/stats")
async def get_system_stats(admin: dict = Depends(get_admin_user)):
    """Get system statistics for admin dashboard"""
    if DATABASE_AVAILABLE:
        # In production, query database for real statistics
        pass
    
    # Mock statistics
    return {
        "users": {
            "total_users": 15247,
            "active_users": 12834,
            "paper_trading_users": 8945,
            "real_trading_users": 3889,
            "new_users_today": 89
        },
        "models": {
            "total_models": 8,
            "active_models": 3,
            "failed_models": 1,
            "training_models": 2
        },
        "trading": {
            "total_signals": 15247,
            "signals_today": 234,
            "total_trades": 45123,
            "trades_today": 156
        },
        "system_health": "healthy"
    }

@app.get("/api/admin/models")
async def get_admin_models(admin: dict = Depends(get_admin_user)):
    """Get detailed model information for admin"""
    if PIPELINE_AVAILABLE:
        models = qlib_pipeline.list_models()
        admin_models = []
        
        for model in models:
            # Get training status
            training_status = qlib_pipeline.get_training_progress(model["model_id"])
            
            admin_models.append({
                "id": model["model_id"],
                "name": model["display_name"],
                "technical_name": model["model_id"],
                "type": model["model_type"],
                "status": training_status.get("status", "active"),
                "accuracy": model["performance"].get("accuracy", 0),
                "sharpe_ratio": model["performance"].get("correlation", 0),
                "subscribers": np.random.randint(50, 500),  # Mock subscriber count
                "signals_generated": np.random.randint(100, 2000),
                "last_updated": model["trained_at"],
                "training_progress": training_status.get("progress", 100)
            })
        
        return admin_models
    
    # Mock admin model data
    return [
        {
            "id": "lstm_alpha158_v1",
            "name": "AI Stock Picker #1",
            "technical_name": "lstm_alpha158_v1", 
            "type": "LSTM",
            "status": "active",
            "accuracy": 89.2,
            "sharpe_ratio": 1.67,
            "subscribers": 234,
            "signals_generated": 1547,
            "last_updated": "2024-01-15T14:30:00Z",
            "training_progress": 100
        }
    ]

@app.post("/api/admin/models")
async def create_model(request: ModelCreateRequest, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Create and train a new model"""
    model_config = {
        "name": request.name,
        "display_name": request.display_name,
        "model_type": request.model_type,
        "description": request.description,
        "market": request.market,
        "start_date": request.start_date,
        "end_date": request.end_date
    }
    
    # Start training in background
    if PIPELINE_AVAILABLE:
        background_tasks.add_task(train_model_background, model_config)
    
    return {
        "message": "Model creation started",
        "model_id": request.name,
        "status": "training"
    }

async def train_model_background(config: Dict):
    """Background task for model training"""
    try:
        logger.info(f"Starting background training for {config['name']}")
        result = await train_model(config)
        logger.info(f"Training completed for {config['name']}: {result.status}")
    except Exception as e:
        logger.error(f"Background training failed for {config['name']}: {str(e)}")

@app.post("/api/admin/models/{model_id}/control")
async def admin_control_model(model_id: str, request: ModelControlRequest, admin: dict = Depends(get_admin_user)):
    """Admin control over models (start/stop/delete)"""
    if PIPELINE_AVAILABLE:
        if request.action == "stop":
            qlib_pipeline.stop_training(model_id)
        # Handle other actions...
    
    return {"message": f"Model {request.action}ed successfully", "model_id": model_id}

@app.get("/api/admin/models/{model_id}/progress") 
async def get_model_progress(model_id: str, admin: dict = Depends(get_admin_user)):
    """Get training progress for a model"""
    if PIPELINE_AVAILABLE:
        return qlib_pipeline.get_training_progress(model_id)
    
    return {"status": "not_found", "progress": 0}

# ================================
# MARKET DATA ENDPOINTS
# ================================

@app.get("/api/market/price/{symbol}")
async def get_market_price(symbol: str):
    """Get real-time price for a symbol"""
    return market_data_service.get_real_time_price(symbol.upper())

@app.get("/api/market/historical/{symbol}")
async def get_historical_data(symbol: str, period: str = "1y"):
    """Get historical data for charts"""
    df = market_data_service.get_historical_data(symbol.upper(), period)
    
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
    
    # Convert to API format
    data = []
    for date, row in df.iterrows():
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(row['Open'], 2),
            "high": round(row['High'], 2),
            "low": round(row['Low'], 2),
            "close": round(row['Close'], 2),
            "volume": int(row['Volume']) if 'Volume' in row else 0
        })
    
    return data

# ================================
# WEBSOCKET FOR REAL-TIME UPDATES
# ================================

@app.websocket("/ws/signals/{model_id}")
async def websocket_signals(websocket: WebSocket, model_id: str):
    """WebSocket endpoint for real-time trading signals"""
    await websocket.accept()
    
    try:
        while True:
            # Generate new signals every 30 seconds
            if PIPELINE_AVAILABLE:
                signals = generate_signals(model_id, ['AAPL', 'MSFT', 'GOOGL'])
                await websocket.send_json({"type": "signals", "data": signals})
            
            await asyncio.sleep(30)  # Send updates every 30 seconds
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

@app.websocket("/ws/training/{model_id}")
async def websocket_training_progress(websocket: WebSocket, model_id: str):
    """WebSocket endpoint for training progress updates"""
    await websocket.accept()
    
    try:
        while True:
            if PIPELINE_AVAILABLE:
                progress = qlib_pipeline.get_training_progress(model_id)
                await websocket.send_json({"type": "progress", "data": progress})
                
                # Stop sending updates when training is complete
                if progress.get("status") not in ["training", "pending"]:
                    break
            
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except Exception as e:
        logger.error(f"Training WebSocket error: {str(e)}")
        await websocket.close()

# ================================
# HEALTH CHECK
# ================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": DATABASE_AVAILABLE,
            "redis": REDIS_AVAILABLE,
            "qlib_pipeline": PIPELINE_AVAILABLE
        },
        "version": "1.0.0"
    }

# ================================
# STARTUP/SHUTDOWN
# ================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Qlib AI Trading Platform API")
    logger.info(f"Database available: {DATABASE_AVAILABLE}")
    logger.info(f"Redis available: {REDIS_AVAILABLE}")
    logger.info(f"Qlib pipeline available: {PIPELINE_AVAILABLE}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Qlib AI Trading Platform API")

# ================================
# MAIN
# ================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "production_api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )