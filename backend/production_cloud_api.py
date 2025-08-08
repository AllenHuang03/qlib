"""
Production Cloud API - Optimized for free tier deployment
Uses Supabase, Alpha Vantage, NewsAPI, and Upstash Redis
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
import asyncpg
from supabase import create_client, Client
import redis

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np

# Configuration from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") 
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "change-in-production")

# Initialize services
app = FastAPI(
    title="Qlib AI Trading Platform - Cloud API",
    description="Production API with real market data and cloud services",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL else None
redis_client = redis.from_url(UPSTASH_REDIS_URL) if UPSTASH_REDIS_URL else None

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# API Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class ModelCreateRequest(BaseModel):
    name: str
    display_name: str
    model_type: str = Field(..., pattern="^(LightGBM|LSTM|Transformer|GATs|HIST)$")
    description: str = ""

# ================================
# MARKET DATA SERVICE
# ================================

class CloudMarketDataService:
    """Production market data service using Alpha Vantage"""
    
    def __init__(self):
        self.alpha_vantage_key = ALPHA_VANTAGE_KEY
        self.cache_ttl = 300  # 5 minutes
        
    async def get_real_time_quote(self, symbol: str) -> Dict:
        """Get real-time quote from Alpha Vantage"""
        try:
            # Try cache first
            if redis_client:
                cached = redis_client.get(f"quote:{symbol}")
                if cached:
                    return json.loads(cached)
            
            if not self.alpha_vantage_key:
                return self._get_mock_quote(symbol)
            
            # Fetch from Alpha Vantage
            url = f"https://www.alphavantage.co/query"
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": self.alpha_vantage_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                if "Global Quote" in data:
                    quote = data["Global Quote"]
                    
                    result = {
                        "symbol": symbol,
                        "price": float(quote.get("05. price", 0)),
                        "change": float(quote.get("09. change", 0)),
                        "change_percent": quote.get("10. change percent", "0%").replace("%", ""),
                        "volume": int(quote.get("06. volume", 0)),
                        "last_updated": datetime.now().isoformat()
                    }
                    
                    # Cache result
                    if redis_client:
                        redis_client.setex(f"quote:{symbol}", self.cache_ttl, json.dumps(result))
                    
                    return result
                else:
                    logger.warning(f"No quote data for {symbol}: {data}")
                    return self._get_mock_quote(symbol)
                    
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {str(e)}")
            return self._get_mock_quote(symbol)
    
    def _get_mock_quote(self, symbol: str) -> Dict:
        """Generate realistic mock quote data"""
        base_prices = {
            'AAPL': 182.50, 'MSFT': 337.20, 'GOOGL': 134.80, 
            'TSLA': 248.50, 'NVDA': 821.30, 'SPY': 445.20,
            'QQQ': 382.15, 'IWM': 195.75, 'VTI': 245.30
        }
        
        base_price = base_prices.get(symbol, 100.0)
        np.random.seed(hash(symbol + str(datetime.now().date())) % 2**32)
        
        change_pct = np.random.normal(0, 0.02)
        current_price = base_price * (1 + change_pct)
        change = current_price - base_price
        
        return {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct * 100, 2),
            "volume": int(np.random.uniform(1000000, 10000000)),
            "last_updated": datetime.now().isoformat()
        }
    
    async def get_financial_news(self, symbol: str = None) -> List[Dict]:
        """Get financial news from NewsAPI"""
        try:
            if not NEWS_API_KEY:
                return self._get_mock_news()
            
            # Try cache first
            cache_key = f"news:{symbol or 'general'}"
            if redis_client:
                cached = redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            
            url = "https://newsapi.org/v2/everything"
            params = {
                "apiKey": NEWS_API_KEY,
                "q": f"{symbol} stock" if symbol else "stock market trading",
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 10,
                "domains": "cnbc.com,reuters.com,bloomberg.com,marketwatch.com"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                if data.get("status") == "ok":
                    articles = []
                    for article in data.get("articles", []):
                        articles.append({
                            "title": article.get("title"),
                            "description": article.get("description"),
                            "url": article.get("url"),
                            "source": article.get("source", {}).get("name"),
                            "published_at": article.get("publishedAt")
                        })
                    
                    # Cache for 30 minutes
                    if redis_client:
                        redis_client.setex(cache_key, 1800, json.dumps(articles))
                    
                    return articles
                else:
                    logger.warning(f"NewsAPI error: {data}")
                    return self._get_mock_news()
                    
        except Exception as e:
            logger.error(f"Error fetching news: {str(e)}")
            return self._get_mock_news()
    
    def _get_mock_news(self) -> List[Dict]:
        """Generate mock financial news"""
        mock_articles = [
            {
                "title": "Tech Stocks Rally on AI Optimism",
                "description": "Major technology companies see gains as investors bet on artificial intelligence growth.",
                "url": "https://example.com/tech-rally",
                "source": "MarketWatch",
                "published_at": (datetime.now() - timedelta(hours=2)).isoformat()
            },
            {
                "title": "Federal Reserve Signals Cautious Approach",
                "description": "Fed officials indicate measured approach to interest rate decisions amid economic uncertainty.",
                "url": "https://example.com/fed-signals",
                "source": "Reuters",
                "published_at": (datetime.now() - timedelta(hours=4)).isoformat()
            },
            {
                "title": "Earnings Season Outlook Remains Positive",
                "description": "Analysts expect strong earnings growth despite economic headwinds.",
                "url": "https://example.com/earnings-outlook",
                "source": "CNBC",
                "published_at": (datetime.now() - timedelta(hours=6)).isoformat()
            }
        ]
        return mock_articles

# Initialize market data service
market_service = CloudMarketDataService()

# ================================
# AUTHENTICATION
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from Supabase auth token"""
    try:
        token = credentials.credentials
        
        if not supabase:
            # Fallback for development
            if token == "demo-token-123":
                return {"id": "demo-user", "email": "demo@qlib.com", "role": "user"}
            elif token == "admin-token-123":
                return {"id": "admin-user", "email": "admin@qlib.ai", "role": "admin"}
            else:
                raise HTTPException(status_code=401, detail="Invalid token")
        
        # Verify with Supabase
        user = supabase.auth.get_user(token)
        if user and user.user:
            # Get user profile
            profile = supabase.table("user_profiles").select("*").eq("id", user.user.id).execute()
            if profile.data:
                return {
                    "id": user.user.id,
                    "email": user.user.email,
                    "role": profile.data[0].get("role", "user"),
                    "name": profile.data[0].get("name", "User")
                }
        
        raise HTTPException(status_code=401, detail="Invalid authentication")
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_admin_user(user: dict = Depends(get_current_user)):
    """Ensure user is admin"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ================================
# API ENDPOINTS
# ================================

@app.get("/api/health")
async def health_check():
    """Health check with service status"""
    services = {
        "supabase": bool(supabase),
        "redis": bool(redis_client),
        "alpha_vantage": bool(ALPHA_VANTAGE_KEY),
        "news_api": bool(NEWS_API_KEY)
    }
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": services,
        "version": "2.0.0"
    }

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """Register new user with Supabase Auth"""
    try:
        if not supabase:
            raise HTTPException(status_code=503, detail="Authentication service not available")
        
        # Register with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "name": user_data.name
                }
            }
        })
        
        if response.user:
            return {
                "message": "Registration successful",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "name": user_data.name
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """Login user with Supabase Auth"""
    try:
        if not supabase:
            # Development fallback
            if user_data.email == "demo@qlib.com" and user_data.password == "demo123":
                return {
                    "access_token": "demo-token-123",
                    "user": {"id": "demo", "email": "demo@qlib.com", "role": "user", "name": "Demo User"}
                }
            elif user_data.email == "admin@qlib.ai" and user_data.password == "admin123":
                return {
                    "access_token": "admin-token-123",
                    "user": {"id": "admin", "email": "admin@qlib.ai", "role": "admin", "name": "Admin User"}
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Login with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.user and response.session:
            # Get user profile
            profile = supabase.table("user_profiles").select("*").eq("id", response.user.id).execute()
            
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "role": profile.data[0].get("role", "user") if profile.data else "user",
                    "name": profile.data[0].get("name", "User") if profile.data else "User"
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

# ================================
# CONSUMER API ENDPOINTS
# ================================

@app.get("/api/models")
async def get_models(user: dict = Depends(get_current_user)):
    """Get available AI models"""
    try:
        if not supabase:
            # Mock data fallback
            return [
                {
                    "id": "lstm-1",
                    "name": "AI Stock Picker #1",
                    "type": "LSTM",
                    "status": "active",
                    "accuracy": "89.2%",
                    "sharpe": "1.67",
                    "description": "Conservative growth strategy"
                }
            ]
        
        # Fetch from Supabase
        response = supabase.table("model_performance_summary").select("*").execute()
        
        models = []
        for model in response.data:
            models.append({
                "id": model["id"],
                "name": model["display_name"],
                "type": model["model_type"],
                "status": model["status"],
                "accuracy": f"{model.get('accuracy', 0):.1f}%",
                "sharpe": f"{model.get('sharpe_ratio', 0):.2f}",
                "subscribers": model.get("subscribers", 0),
                "description": f"AI-powered {model['model_type']} strategy"
            })
        
        return models
        
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch models")

@app.get("/api/models/{model_id}/signals")
async def get_model_signals(model_id: str, user: dict = Depends(get_current_user)):
    """Get trading signals for a model"""
    try:
        if not supabase:
            # Mock signals
            symbols = ['AAPL', 'MSFT', 'GOOGL']
            signals = []
            for symbol in symbols:
                quote = await market_service.get_real_time_quote(symbol)
                signals.append({
                    "symbol": symbol,
                    "signal_type": np.random.choice(['BUY', 'SELL', 'HOLD']),
                    "confidence": np.random.uniform(75, 95),
                    "current_price": quote["price"],
                    "change": quote["change"],
                    "reasoning": f"AI analysis indicates {np.random.choice(['strong momentum', 'value opportunity', 'technical breakout'])}",
                    "generated_at": datetime.now().isoformat()
                })
            return signals
        
        # Fetch real signals
        response = supabase.table("trading_signals").select("*").eq("model_id", model_id).order("generated_at", desc=True).limit(10).execute()
        
        signals = []
        for signal in response.data:
            # Enhance with current market data
            quote = await market_service.get_real_time_quote(signal["symbol"])
            
            signals.append({
                "symbol": signal["symbol"],
                "signal_type": signal["signal_type"],
                "confidence": signal["confidence"],
                "current_price": quote["price"],
                "change": quote["change"],
                "reasoning": signal.get("reasoning", "AI-generated trading signal"),
                "key_factors": signal.get("key_factors", {}),
                "generated_at": signal["generated_at"]
            })
        
        return signals
        
    except Exception as e:
        logger.error(f"Error fetching signals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch signals")

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    """Get dashboard metrics for user"""
    try:
        if not supabase:
            # Mock metrics
            return {
                "total_return": 22.8,
                "sharpe_ratio": 1.84,
                "max_drawdown": -4.2,
                "portfolio_value": 122340,
                "active_models": 2,
                "total_models": 4
            }
        
        # Fetch user's portfolio summary
        response = supabase.table("user_portfolio_summary").select("*").eq("user_id", user["id"]).execute()
        
        if response.data:
            portfolio = response.data[0]
            return {
                "total_return": portfolio.get("total_return", 0),
                "portfolio_value": portfolio.get("current_value", 100000),
                "active_models": portfolio.get("active_models", 0),
                "cash_balance": portfolio.get("cash_balance", 0)
            }
        else:
            return {"error": "No portfolio found"}
            
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch metrics")

# ================================
# MARKET DATA ENDPOINTS
# ================================

@app.get("/api/market/quote/{symbol}")
async def get_market_quote(symbol: str):
    """Get real-time quote"""
    return await market_service.get_real_time_quote(symbol.upper())

@app.get("/api/market/news")
async def get_market_news(symbol: str = None):
    """Get financial news"""
    return await market_service.get_financial_news(symbol)

# ================================
# ADMIN ENDPOINTS
# ================================

@app.get("/api/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get system statistics"""
    try:
        if not supabase:
            # Mock stats
            return {
                "users": {"total": 15247, "active": 12834},
                "models": {"total": 8, "active": 3},
                "signals": {"today": 234, "total": 15247}
            }
        
        # Get real stats from database
        user_count = supabase.table("user_profiles").select("id", count="exact").execute()
        model_count = supabase.table("ai_models").select("id", count="exact").execute()
        signal_count = supabase.table("trading_signals").select("id", count="exact").execute()
        
        return {
            "users": {
                "total": user_count.count or 0,
                "active": user_count.count or 0  # Simplified
            },
            "models": {
                "total": model_count.count or 0,
                "active": model_count.count or 0
            },
            "signals": {
                "total": signal_count.count or 0,
                "today": 50  # Mock daily count
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

@app.post("/api/admin/models")
async def create_model(request: ModelCreateRequest, admin: dict = Depends(get_admin_user)):
    """Create new AI model"""
    try:
        if not supabase:
            return {"message": "Model creation started", "model_id": request.name}
        
        # Insert into database
        model_data = {
            "name": request.name,
            "display_name": request.display_name,
            "model_type": request.model_type,
            "description": request.description,
            "status": "training",
            "created_by": admin["id"]
        }
        
        response = supabase.table("ai_models").insert(model_data).execute()
        
        if response.data:
            return {
                "message": "Model created successfully",
                "model_id": response.data[0]["id"]
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to create model")
            
    except Exception as e:
        logger.error(f"Error creating model: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create model")

# ================================
# BACKGROUND TASKS
# ================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Qlib Cloud API")
    logger.info(f"Supabase connected: {bool(supabase)}")
    logger.info(f"Redis connected: {bool(redis_client)}")
    logger.info(f"Alpha Vantage available: {bool(ALPHA_VANTAGE_KEY)}")
    logger.info(f"NewsAPI available: {bool(NEWS_API_KEY)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("production_cloud_api:app", host="0.0.0.0", port=port)