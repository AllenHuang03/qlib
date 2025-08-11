#!/usr/bin/env python3
"""
Working API with Registration - Guaranteed to work on Railway
"""
import os
import hashlib
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Qlib API with Registration")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage
USERS_DB = {
    "demo@qlib.com": {
        "id": "demo-user-1",
        "email": "demo@qlib.com",
        "name": "Demo User",
        "password": "demo123",
        "role": "user",
        "status": "active",
        "subscription_tier": "free",
        "paper_trading": True
    }
}

# Models
class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

# Security
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def get_current_user(credentials=Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = credentials.credentials
    if token == "demo-token-123":
        return USERS_DB["demo@qlib.com"]
    
    if token.startswith("token_"):
        user_id = token.split("_")[1]
        for user in USERS_DB.values():
            if user["id"] == user_id:
                return user
    
    raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
def root():
    return {"message": "Qlib API with Registration", "status": "running"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy", 
        "message": "API working with registration",
        "users_registered": len(USERS_DB),
        "version": "1.1.0"
    }

@app.post("/api/auth/register")
def register(user_data: UserRegister):
    if user_data.email in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user_id = f"user_{len(USERS_DB) + 1}"
    
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
    
    USERS_DB[user_data.email] = new_user
    
    return {
        "message": "Registration successful! You can now sign in.",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"]
        }
    }

@app.post("/api/auth/login")
def login(user_data: UserLogin):
    user = USERS_DB.get(user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user_data.email == "demo@qlib.com":
        if user_data.password != "demo123":
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        if hash_password(user_data.password) != user["password"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = f"token_{user['id']}_{hash_password(str(datetime.now()))[:16]}"
    
    return {
        "access_token": token,
        "token_type": "bearer",
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

@app.get("/api/auth/profile")
def get_profile(user=Depends(get_current_user)):
    return user

@app.get("/api/models")
def get_models(user=Depends(get_current_user)):
    return [
        {
            "id": "1",
            "name": "AI Stock Picker #1",
            "type": "LSTM",
            "status": "active",
            "accuracy": 89.2,
            "sharpe": 1.67
        }
    ]

@app.get("/api/dashboard/metrics")
def get_dashboard_metrics(user=Depends(get_current_user)):
    return {
        "total_return": 24.7,
        "sharpe_ratio": 1.92,
        "max_drawdown": -3.8,
        "portfolio_value": 124700.0,
        "active_models": 2,
        "paper_trading": user.get("paper_trading", True),
        "last_update": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("minimal_api:app", host="0.0.0.0", port=port, log_level="info")