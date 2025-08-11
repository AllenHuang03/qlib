#!/usr/bin/env python3
"""
Production API with Supabase Authentication
Real user management, authentication, and database integration
"""
import os
import jwt
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import asyncpg
import asyncio

# Configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") 
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")  # Supabase postgres URL
PORT = int(os.getenv("PORT", 8000))

# Validate required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {missing_vars}")

# Initialize FastAPI
app = FastAPI(
    title="Qlib Pro Trading Platform API",
    description="Production API with Supabase authentication",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)

# Database connection pool
db_pool = None

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: datetime
    subscription_tier: str
    paper_trading: bool

# ================================
# DATABASE CONNECTION
# ================================

async def get_db_pool():
    """Get database connection pool"""
    global db_pool
    if db_pool is None:
        try:
            db_pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ Database connection pool created")
        except Exception as e:
            logger.error(f"❌ Failed to create database pool: {e}")
            raise
    return db_pool

async def execute_query(query: str, *args) -> List[Dict[str, Any]]:
    """Execute database query and return results"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Database query error: {e}")
            raise HTTPException(status_code=500, detail="Database error")

# ================================
# SUPABASE AUTHENTICATION
# ================================

class SupabaseAuth:
    """Supabase authentication client"""
    
    def __init__(self):
        self.url = SUPABASE_URL
        self.anon_key = SUPABASE_ANON_KEY
        self.service_key = SUPABASE_SERVICE_KEY
        self.jwt_secret = SUPABASE_JWT_SECRET
    
    async def sign_up(self, email: str, password: str, name: str) -> Dict:
        """Register new user with Supabase Auth"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.url}/auth/v1/signup",
                    headers={
                        "apikey": self.anon_key,
                        "Authorization": f"Bearer {self.anon_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": email,
                        "password": password,
                        "data": {"name": name}
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Create user profile in our database
                    if data.get("user"):
                        await self._create_user_profile(data["user"], name)
                    
                    return data
                else:
                    error = response.json()
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=error.get("msg", "Registration failed")
                    )
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=408, detail="Request timeout")
        except Exception as e:
            logger.error(f"Sign up error: {e}")
            raise HTTPException(status_code=500, detail="Registration failed")
    
    async def sign_in(self, email: str, password: str) -> Dict:
        """Sign in user with Supabase Auth"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.url}/auth/v1/token?grant_type=password",
                    headers={
                        "apikey": self.anon_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": email,
                        "password": password
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error = response.json()
                    raise HTTPException(
                        status_code=401,
                        detail=error.get("error_description", "Invalid credentials")
                    )
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=408, detail="Request timeout")
        except Exception as e:
            logger.error(f"Sign in error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    async def get_user_from_token(self, token: str) -> Dict:
        """Get user info from JWT token"""
        try:
            # Verify and decode JWT token
            if self.jwt_secret:
                payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            else:
                # Fallback: get user from Supabase API
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.url}/auth/v1/user",
                        headers={
                            "apikey": self.anon_key,
                            "Authorization": f"Bearer {token}"
                        }
                    )
                    if response.status_code == 200:
                        payload = response.json()
                    else:
                        raise HTTPException(status_code=401, detail="Invalid token")
            
            # Get user profile from database
            user_id = payload.get("sub")
            if user_id:
                profile = await self._get_user_profile(user_id)
                return profile
            else:
                raise HTTPException(status_code=401, detail="Invalid token payload")
                
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    async def _create_user_profile(self, supabase_user: Dict, name: str):
        """Create user profile in our database"""
        try:
            query = """
                INSERT INTO user_profiles (id, email, name, role, status, subscription_tier, paper_trading)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email
            """
            await execute_query(
                query,
                supabase_user["id"],
                supabase_user["email"],
                name,
                "user",  # default role
                "active",  # default status
                "free",  # default subscription
                True  # start with paper trading
            )
            logger.info(f"✅ Created profile for user: {supabase_user['email']}")
        except Exception as e:
            logger.error(f"Failed to create user profile: {e}")
    
    async def _get_user_profile(self, user_id: str) -> Dict:
        """Get user profile from database"""
        query = """
            SELECT id, email, name, role, status, created_at, 
                   subscription_tier, paper_trading
            FROM user_profiles 
            WHERE id = $1
        """
        results = await execute_query(query, user_id)
        if results:
            return results[0]
        else:
            raise HTTPException(status_code=404, detail="User profile not found")

# Initialize Supabase client
supabase_auth = SupabaseAuth()

# ================================
# AUTHENTICATION DEPENDENCY
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    user = await supabase_auth.get_user_from_token(token)
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    """Require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

# ================================
# API ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Qlib Pro Trading Platform API", "status": "running", "version": "2.0.0"}

@app.get("/api/health")
async def health_check():
    """Health check with database status"""
    try:
        # Test database connection
        await execute_query("SELECT 1")
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": db_status,
            "supabase": bool(SUPABASE_URL and SUPABASE_ANON_KEY),
            "alpha_vantage": bool(ALPHA_VANTAGE_KEY)
        },
        "version": "2.0.0"
    }

# ================================
# AUTHENTICATION ENDPOINTS
# ================================

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """User registration via Supabase"""
    try:
        result = await supabase_auth.sign_up(
            user_data.email,
            user_data.password,
            user_data.name
        )
        return {
            "message": "Registration successful. Please check your email to verify your account.",
            "user": result.get("user"),
            "requires_verification": True
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """User login via Supabase"""
    try:
        result = await supabase_auth.sign_in(user_data.email, user_data.password)
        
        # Get user profile
        user_profile = None
        if result.get("user"):
            try:
                user_profile = await supabase_auth._get_user_profile(result["user"]["id"])
            except Exception as e:
                logger.warning(f"Could not fetch user profile: {e}")
        
        return {
            "access_token": result["access_token"],
            "refresh_token": result.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": result.get("expires_in", 3600),
            "user": user_profile or result.get("user")
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    return user

@app.put("/api/auth/profile")
async def update_profile(
    profile_data: dict,
    user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        # Update allowed fields only
        allowed_fields = ["name"]
        updates = {k: v for k, v in profile_data.items() if k in allowed_fields}
        
        if updates:
            # Build dynamic query
            set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
            query = f"UPDATE user_profiles SET {set_clause} WHERE id = $1 RETURNING *"
            
            results = await execute_query(query, user["id"], *updates.values())
            if results:
                return results[0]
        
        return user
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")

# ================================
# TRADING DATA ENDPOINTS (Mock for now)
# ================================

@app.get("/api/models")
async def get_models(user: dict = Depends(get_current_user)):
    """Get available AI models"""
    # Mock data for now - will be replaced with real Qlib models
    return [
        {
            "id": "lstm-alpha158",
            "name": "AI Stock Picker Pro",
            "type": "LSTM",
            "status": "active",
            "accuracy": 87.3,
            "sharpe": 1.84,
            "subscribers": 234,
            "description": "Advanced LSTM model trained on Alpha158 features",
            "subscription_required": user.get("subscription_tier") == "free"
        },
        {
            "id": "lightgbm-multi",
            "name": "AI Value Hunter",
            "type": "LightGBM",
            "status": "active", 
            "accuracy": 83.9,
            "sharpe": 1.67,
            "subscribers": 156,
            "description": "Gradient boosting model for value stock detection",
            "subscription_required": False
        }
    ]

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    """Get personalized dashboard metrics"""
    # Mock data - will be replaced with real portfolio data
    return {
        "total_return": 0.0 if user.get("paper_trading") else 24.7,
        "sharpe_ratio": 0.0 if user.get("paper_trading") else 1.92,
        "max_drawdown": 0.0 if user.get("paper_trading") else -3.8,
        "portfolio_value": 100000.0 if user.get("paper_trading") else 124700.0,
        "active_models": 0,
        "paper_trading": user.get("paper_trading", True),
        "subscription_tier": user.get("subscription_tier", "free"),
        "last_update": datetime.now().isoformat()
    }

# ================================
# ERROR HANDLERS
# ================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception on {request.url}: {str(exc)}")
    return {"error": "Internal server error", "detail": str(exc)}

# ================================
# STARTUP/SHUTDOWN
# ================================

@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("🚀 Qlib Pro API starting up...")
    logger.info(f"🔄 Supabase URL: {SUPABASE_URL}")
    logger.info(f"💾 Database: {'configured' if DATABASE_URL else 'not configured'}")
    logger.info(f"🔑 Alpha Vantage: {'configured' if ALPHA_VANTAGE_KEY else 'not configured'}")
    logger.info(f"🎯 Running on port: {PORT}")
    
    # Initialize database pool
    try:
        await get_db_pool()
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("💤 Database pool closed")

# ================================
# MAIN (for Railway)
# ================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "supabase_api:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )