"""
API Gateway for Qlib Pro Enterprise Trading Platform
Handles authentication, routing, and role-based access control
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum
import jwt
import httpx
import os
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Service URLs
CUSTOMER_SERVICE_URL = os.getenv("CUSTOMER_SERVICE_URL", "http://localhost:8081")
TRADING_SERVICE_URL = os.getenv("TRADING_SERVICE_URL", "http://localhost:8082")

app = FastAPI(
    title="Qlib Pro API Gateway",
    description="Enterprise Trading Platform API Gateway with Role-Based Access Control",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

class UserRole(str, Enum):
    CUSTOMER = "customer"
    TRADER = "trader"
    RISK_MANAGER = "risk"
    ADMIN = "admin"

class User(BaseModel):
    id: str
    email: str
    role: UserRole
    subscription_tier: Optional[str] = "free"

class LoginRequest(BaseModel):
    email: str
    password: str

class PermissionMatrix:
    """Define what each role can access"""
    PERMISSIONS = {
        UserRole.CUSTOMER: {
            "portfolio": ["read"],
            "insights": ["read"],
            "history": ["read"],
            "simulate": ["read", "write"],
            "notifications": ["read"]
        },
        UserRole.TRADER: {
            "portfolio": ["read"],
            "insights": ["read"],
            "history": ["read"],
            "signals": ["read"],
            "executions": ["read"],
            "models": ["read"]
        },
        UserRole.RISK_MANAGER: {
            "portfolio": ["read"],
            "risk": ["read", "write"],
            "limits": ["read", "write"],
            "alerts": ["read", "write"],
            "reports": ["read"]
        },
        UserRole.ADMIN: {
            "all": ["read", "write", "delete"]
        }
    }

def create_access_token(user_data: Dict[str, Any]) -> str:
    """Create JWT token for user"""
    to_encode = user_data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify JWT token and return user"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_data = payload.copy()
        user_data.pop("exp", None)  # Remove expiration from user data
        
        return User(**user_data)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def check_permission(user: User, resource: str, action: str) -> bool:
    """Check if user has permission for resource and action"""
    permissions = PermissionMatrix.PERMISSIONS.get(user.role, {})
    
    # Admin has access to everything
    if user.role == UserRole.ADMIN:
        return True
    
    # Check specific resource permissions
    resource_permissions = permissions.get(resource, [])
    return action in resource_permissions

def require_permission(resource: str, action: str = "read"):
    """Decorator to require specific permission"""
    def permission_decorator(user: User = Depends(verify_token)):
        if not check_permission(user, resource, action):
            raise HTTPException(
                status_code=403, 
                detail=f"Insufficient permissions for {action} access to {resource}"
            )
        return user
    return permission_decorator

# Authentication endpoints
@app.post("/api/auth/login")
async def login(login_data: LoginRequest):
    """Authenticate user and return JWT token"""
    # In production, verify against user database
    # For demo, accept any email/password combination
    if login_data.email and login_data.password:
        # Determine user role based on email pattern (demo logic)
        if login_data.email.startswith("admin"):
            role = UserRole.ADMIN
        elif login_data.email.startswith("trader"):
            role = UserRole.TRADER
        elif login_data.email.startswith("risk"):
            role = UserRole.RISK_MANAGER
        else:
            role = UserRole.CUSTOMER
            
        user_data = {
            "id": f"user-{hash(login_data.email) % 10000}",
            "email": login_data.email,
            "role": role,
            "subscription_tier": "pro"
        }
        
        token = create_access_token(user_data)
        
        return {
            "token": token,
            "user": user_data,
            "message": "Login successful"
        }
    
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.get("/api/auth/profile")
async def get_profile(user: User = Depends(verify_token)):
    """Get current user profile"""
    return user

# Customer Module Routes (Public-facing)
@app.api_route("/api/customer/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def customer_proxy(
    request: Request,
    path: str,
    user: User = Depends(require_permission("portfolio"))
):
    """Proxy requests to customer service"""
    async with httpx.AsyncClient() as client:
        url = f"{CUSTOMER_SERVICE_URL}/api/customer/{path}"
        
        # Forward the request
        response = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=await request.body(),
            headers={**dict(request.headers), "X-User-ID": user.id, "X-User-Role": user.role}
        )
        
        return response.json()

# Trading Agent Routes (Internal)
@app.api_route("/api/trading/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def trading_proxy(
    request: Request,
    path: str,
    user: User = Depends(require_permission("signals"))
):
    """Proxy requests to trading service (restricted access)"""
    async with httpx.AsyncClient() as client:
        url = f"{TRADING_SERVICE_URL}/api/trading/{path}"
        
        response = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=await request.body(),
            headers={**dict(request.headers), "X-User-ID": user.id, "X-User-Role": user.role}
        )
        
        return response.json()

# Admin Routes (Full access)
@app.api_route("/api/admin/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def admin_proxy(
    request: Request,
    path: str,
    user: User = Depends(require_permission("all"))
):
    """Proxy requests to admin endpoints (admin only)"""
    # Route to appropriate service based on path
    if path.startswith("customer"):
        service_url = CUSTOMER_SERVICE_URL
    elif path.startswith("trading"):
        service_url = TRADING_SERVICE_URL
    else:
        service_url = CUSTOMER_SERVICE_URL  # Default
    
    async with httpx.AsyncClient() as client:
        url = f"{service_url}/api/admin/{path}"
        
        response = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=await request.body(),
            headers={**dict(request.headers), "X-User-ID": user.id, "X-User-Role": user.role}
        )
        
        return response.json()

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "api-gateway",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Qlib Pro API Gateway",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        reload=True
    )