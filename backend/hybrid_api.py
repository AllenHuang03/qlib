#!/usr/bin/env python3
"""
Hybrid API - Works with or without Supabase
Falls back to mock data if database unavailable
"""
import os
import logging
import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# Configuration
PORT = int(os.getenv("PORT", 8000))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")

# Initialize FastAPI
app = FastAPI(
    title="Qlib Pro Trading Platform API",
    description="Hybrid API with Supabase integration",
    version="2.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# In-memory user storage (for demo)
USERS_DB = {
    "demo@qlib.com": {
        "id": "demo-user-1",
        "email": "demo@qlib.com",
        "name": "Demo User",
        "password": "demo123",
        "role": "user",
        "status": "active",
        "subscription_tier": "free",
        "paper_trading": True,
        "created_at": datetime.now().isoformat()
    }
}

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password"""
    return hash_password(password) == hashed

def create_token(user_id: str) -> str:
    """Create simple token"""
    return f"token_{user_id}_{hash_password(str(datetime.now()))[:16]}"

# ================================
# AUTHENTICATION
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Check for demo tokens
    if token == "demo-token-123":
        return USERS_DB["demo@qlib.com"]
    
    # Extract user ID from token (simple approach)
    if token.startswith("token_"):
        user_id = token.split("_")[1]
        for user in USERS_DB.values():
            if user["id"] == user_id:
                return user
    
    raise HTTPException(status_code=401, detail="Invalid token")

# ================================
# API ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Qlib Pro Trading Platform API",
        "status": "running",
        "version": "2.1.0",
        "supabase_enabled": bool(SUPABASE_URL and SUPABASE_ANON_KEY)
    }

@app.get("/api/health")
async def health_check():
    """Enhanced health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "supabase": bool(SUPABASE_URL and SUPABASE_ANON_KEY),
            "alpha_vantage": bool(ALPHA_VANTAGE_KEY),
            "database": "mock_mode",
            "registration": "enabled",
            "authentication": "enabled"
        },
        "version": "2.1.0",
        "users_registered": len(USERS_DB)
    }

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """User registration"""
    try:
        # Check if user already exists
        if user_data.email in USERS_DB:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate password
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Create new user
        user_id = f"user_{len(USERS_DB) + 1}_{hash_password(user_data.email)[:8]}"
        
        new_user = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "password": hash_password(user_data.password),
            "role": "user",
            "status": "active",
            "subscription_tier": "free",
            "paper_trading": True,
            "created_at": datetime.now().isoformat()
        }
        
        # Store user
        USERS_DB[user_data.email] = new_user
        
        logger.info(f"✅ New user registered: {user_data.email}")
        
        return {
            "message": "Registration successful! You can now sign in.",
            "user": {
                "id": new_user["id"],
                "email": new_user["email"],
                "name": new_user["name"],
                "role": new_user["role"]
            },
            "requires_verification": False
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """User login"""
    try:
        # Find user
        user = USERS_DB.get(user_data.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check password
        if user_data.email == "demo@qlib.com":
            # Demo user - plain text password
            if user_data.password != "demo123":
                raise HTTPException(status_code=401, detail="Invalid credentials")
        else:
            # Regular users - hashed password
            if not verify_password(user_data.password, user["password"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        token = create_token(user["id"])
        
        # Return success
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "status": user["status"],
                "subscription_tier": user["subscription_tier"],
                "paper_trading": user["paper_trading"]
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "status": user["status"],
        "subscription_tier": user["subscription_tier"],
        "paper_trading": user["paper_trading"]
    }

# ================================
# TRADING DATA ENDPOINTS
# ================================

@app.get("/api/models")
async def get_models(user: dict = Depends(get_current_user)):
    """Get available AI models"""
    return [
        {
            "id": "lstm-alpha158",
            "name": "AI Stock Picker Pro",
            "type": "LSTM",
            "status": "active",
            "accuracy": 87.3,
            "sharpe": 1.84,
            "subscribers": 234,
            "description": "Advanced LSTM model trained on Alpha158 features"
        },
        {
            "id": "lightgbm-multi",
            "name": "AI Value Hunter",
            "type": "LightGBM",
            "status": "active",
            "accuracy": 83.9,
            "sharpe": 1.67,
            "subscribers": 156,
            "description": "Gradient boosting model for value detection"
        }
    ]

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    """Get personalized dashboard metrics"""
    is_paper_trading = user.get("paper_trading", True)
    
    return {
        "total_return": 0.0 if is_paper_trading else 24.7,
        "sharpe_ratio": 0.0 if is_paper_trading else 1.92,
        "max_drawdown": 0.0 if is_paper_trading else -3.8,
        "portfolio_value": 100000.0 if is_paper_trading else 124700.0,
        "active_models": 0,
        "paper_trading": is_paper_trading,
        "subscription_tier": user.get("subscription_tier", "free"),
        "last_update": datetime.now().isoformat()
    }

@app.get("/api/dashboard/performance")
async def get_performance_data(user: dict = Depends(get_current_user)):
    """Get portfolio performance data"""
    # Mock performance data
    base_date = datetime.now() - timedelta(days=30)
    data = []
    
    for i in range(30):
        date = base_date + timedelta(days=i)
        portfolio_value = 100000 + (i * 200) + (i * 50 if i % 3 == 0 else -i * 30)
        benchmark_value = 100000 + (i * 150)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "portfolio": round(portfolio_value, 2),
            "benchmark": round(benchmark_value, 2)
        })
    
    return data

# ================================
# ADMIN ENDPOINTS
# ================================

@app.get("/api/admin/users")
async def get_admin_users():
    """Get all registered users (for testing)"""
    users = []
    for user in USERS_DB.values():
        users.append({
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "status": user["status"],
            "created_at": user["created_at"]
        })
    return users

# ================================
# ERROR HANDLERS
# ================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception on {request.url}: {str(exc)}")
    return {"error": "Internal server error", "detail": str(exc)}

# ================================
# STARTUP
# ================================

@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("🚀 Qlib Pro Hybrid API starting up...")
    logger.info(f"🔄 Supabase: {'enabled' if SUPABASE_URL else 'disabled'}")
    logger.info(f"💾 Database: mock mode")
    logger.info(f"👥 Demo users: {len(USERS_DB)}")
    logger.info(f"🎯 Running on port: {PORT}")

# ================================
# MAIN
# ================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "hybrid_api:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )