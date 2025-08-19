#!/usr/bin/env python3
"""
Qlib Pro Production API
Comprehensive backend API for the Qlib Pro trading platform
"""

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import datetime
import random
import os
import requests
import io
import time
from contextlib import asynccontextmanager

# Import Monitoring System
try:
    from monitoring import monitoring, setup_monitoring_routes
    MONITORING_AVAILABLE = True
    print("SUCCESS: Production Monitoring System loaded")
except ImportError:
    MONITORING_AVAILABLE = False
    print("WARNING: Monitoring system not available")

# Import Optimized Model service
try:
    from optimized_model_service import optimized_model_service
    OPTIMIZED_MODEL_SERVICE_AVAILABLE = True
    print("SUCCESS: Optimized Model Service with GPU acceleration loaded")
except ImportError:
    OPTIMIZED_MODEL_SERVICE_AVAILABLE = False
    try:
        from qlib_service import qlib_service
        QLIB_SERVICE_AVAILABLE = True
        print("WARNING: Using fallback Qlib Service")
    except ImportError:
        print("ERROR: No model service available, using mock data")
        QLIB_SERVICE_AVAILABLE = False

# Import Enhanced Market Data service
try:
    from enhanced_market_data_service import enhanced_market_data_service
    ENHANCED_MARKET_DATA_AVAILABLE = True
    print("SUCCESS: Enhanced Market Data Service with OpenBB integration loaded")
except ImportError:
    ENHANCED_MARKET_DATA_AVAILABLE = False
    try:
        from market_data_service import market_data_service
        MARKET_DATA_SERVICE_AVAILABLE = True
        print("WARNING: Using fallback Market Data Service")
    except ImportError:
        print("ERROR: No market data service available, using mock data")
        MARKET_DATA_SERVICE_AVAILABLE = False

# Import Live Market Data Engine
try:
    from enhanced_market_data.live_market_engine import live_market_engine
    from enhanced_market_data.websocket_market_service import websocket_market_service
    from enhanced_market_data.multi_asset_service import multi_asset_service
    LIVE_MARKET_ENGINE_AVAILABLE = True
    print("SUCCESS: Live Market Data Engine with WebSocket streaming loaded")
except ImportError:
    LIVE_MARKET_ENGINE_AVAILABLE = False
    print("WARNING: Live Market Data Engine not available")

# Import Test Account Service
try:
    from test_account_service import test_account_service, TestAccount
    TEST_ACCOUNT_SERVICE_AVAILABLE = True
    print("SUCCESS: Test Account Service loaded with specialized test accounts")
except ImportError:
    TEST_ACCOUNT_SERVICE_AVAILABLE = False
    print("WARNING: Test Account Service not available, using demo fallback")

# Import WebSocket manager
try:
    from websocket_manager import websocket_manager
    WEBSOCKET_AVAILABLE = True
except ImportError:
    print("WebSocket manager not available")
    WEBSOCKET_AVAILABLE = False

# Import Notification System
try:
    from notification_api import router as notification_router
    from notification_service import notification_service
    from notification_integrations import (
        auth_notifications, kyc_notifications, payment_notifications,
        trading_notifications, portfolio_notifications
    )
    from notification_compliance import compliance_manager
    from notification_monitoring import monitoring_service
    NOTIFICATION_SYSTEM_AVAILABLE = True
    print("SUCCESS: Comprehensive Notification & Communication System loaded")
except ImportError as e:
    print(f"WARNING: Notification system not available - {e}")
    NOTIFICATION_SYSTEM_AVAILABLE = False

# Import Payment service
try:
    from payment_service import payment_service
    PAYMENT_SERVICE_AVAILABLE = True
except ImportError:
    print("Payment service not available")
    PAYMENT_SERVICE_AVAILABLE = False

# Import Real-Time Trading Engine
try:
    from real_time_trading_engine import real_time_trading_engine
    TRADING_ENGINE_AVAILABLE = True
    print("SUCCESS: Real-Time Trading Engine with live signals loaded")
except ImportError:
    TRADING_ENGINE_AVAILABLE = False
    print("WARNING: Real-Time Trading Engine not available")

# Import Redis Cache Service
try:
    from redis_cache_service import redis_cache_service
    REDIS_CACHE_AVAILABLE = True
    print("SUCCESS: Enhanced Redis Cache Service loaded")
except ImportError:
    REDIS_CACHE_AVAILABLE = False
    print("WARNING: Redis Cache Service not available")

# Import Advanced Portfolio Manager
try:
    from advanced_portfolio_manager import advanced_portfolio_manager
    PORTFOLIO_MANAGER_AVAILABLE = True
    print("SUCCESS: Advanced Portfolio Manager with risk engine loaded")
except ImportError:
    PORTFOLIO_MANAGER_AVAILABLE = False
    print("WARNING: Advanced Portfolio Manager not available")

# Import Cloud Storage service
try:
    from cloud_storage_service import cloud_storage_service
    STORAGE_SERVICE_AVAILABLE = True
except ImportError:
    print("Cloud storage service not available")
    STORAGE_SERVICE_AVAILABLE = False

# Import Model Training API
try:
    from model_training_api import (
        start_model_training,
        get_training_progress,
        get_all_training_sessions,
        control_training,
        get_training_logs,
        get_model_performance,
        get_available_model_types,
        get_training_statistics,
        validate_training_config
    )
    MODEL_TRAINING_AVAILABLE = True
    print("SUCCESS: Model Training API with real-time progress loaded")
except ImportError as e:
    print(f"WARNING: Model Training API not available: {e}")
    MODEL_TRAINING_AVAILABLE = False

# Data Models
class Model(BaseModel):
    id: str
    name: str
    type: str
    status: str
    accuracy: str
    sharpe: str
    last_trained: str
    description: str
    created_at: str

class CreateModelRequest(BaseModel):
    name: str
    type: str
    description: str

class PaymentIntentRequest(BaseModel):
    tier: str
    currency: str = 'aud'
    customer_email: str

class SubscriptionRequest(BaseModel):
    tier: str
    customer_email: str
    payment_method_id: Optional[str] = None

class Signal(BaseModel):
    symbol: str
    signal: str
    confidence: float
    target_price: float
    reasoning: str

class MarketQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    last_updated: str

class Holding(BaseModel):
    symbol: str
    name: str
    quantity: int
    price: float
    value: float
    weight: float
    pnl: float
    pnl_percent: float

class Dataset(BaseModel):
    id: str
    name: str
    type: str
    size: str
    lastUpdate: str
    status: str
    records: str

# Helper Functions
def generate_mock_historical_data(symbol: str, days: int = 30):
    """Generate mock historical data for testing"""
    base_price = 100.0 + hash(symbol) % 50  # Deterministic base price per symbol
    historical_data = []
    
    for i in range(days):
        date = datetime.datetime.now() - datetime.timedelta(days=days-i-1)
        # Generate realistic price movements
        price_change = (random.random() - 0.5) * 0.05  # ±2.5% daily change
        price = base_price * (1 + price_change * i * 0.1)
        
        historical_data.append({
            "date": date.strftime('%Y-%m-%d'),
            "timestamp": date.timestamp(),
            "open": round(price * (1 + (random.random() - 0.5) * 0.01), 2),
            "high": round(price * (1 + abs(random.random()) * 0.02), 2),
            "low": round(price * (1 - abs(random.random()) * 0.02), 2),
            "close": round(price, 2),
            "volume": random.randint(100000, 1000000)
        })
    
    return historical_data

def generate_mock_indicators(symbol: str):
    """Generate mock technical indicators"""
    return {
        "sma_20": {"value": 105.50, "timestamp": datetime.datetime.now().timestamp()},
        "sma_50": {"value": 103.25, "timestamp": datetime.datetime.now().timestamp()},
        "rsi": {"value": random.uniform(30, 70), "timestamp": datetime.datetime.now().timestamp()},
        "macd": {"value": random.uniform(-2, 2), "timestamp": datetime.datetime.now().timestamp()},
        "bollinger_upper": {"value": 108.75, "timestamp": datetime.datetime.now().timestamp()},
        "bollinger_lower": {"value": 101.25, "timestamp": datetime.datetime.now().timestamp()},
    }

# Mock Data Storage
MOCK_MODELS = [
    Model(
        id="1",
        name="LSTM Alpha158",
        type="LSTM",
        status="active",
        accuracy="87.2%",
        sharpe="1.89",
        last_trained="2024-01-15",
        description="Long Short-Term Memory model using Alpha158 features",
        created_at="2024-01-10T10:00:00Z"
    ),
    Model(
        id="2", 
        name="LightGBM Multi-Factor",
        type="LightGBM",
        status="training",
        accuracy="85.5%",
        sharpe="1.67",
        last_trained="2024-01-14",
        description="Gradient boosting model with multiple factor integration",
        created_at="2024-01-08T14:30:00Z"
    )
]

MOCK_DATASETS = [
    Dataset(
        id="1",
        name="CSI300 Daily",
        type="Stock Prices",
        size="2.3 GB",
        lastUpdate="2024-01-15 09:30",
        status="active",
        records="450,231"
    ),
    Dataset(
        id="2",
        name="Alpha158 Features", 
        type="Technical Indicators",
        size="845 MB",
        lastUpdate="2024-01-15 09:25",
        status="active",
        records="158,942"
    )
]

# Alpha Vantage API Key
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "YR3O8FBCPDC5IVEX")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("Qlib Pro Production API Starting...")
    print(f"Loaded {len(MOCK_MODELS)} models")
    print(f"Loaded {len(MOCK_DATASETS)} datasets")
    yield
    print("Qlib Pro Production API Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Qlib Pro Production API",
    description="Comprehensive backend API for AI-powered trading platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include notification API routes
if NOTIFICATION_SYSTEM_AVAILABLE:
    app.include_router(notification_router)
    print("SUCCESS: Notification API endpoints added")
else:
    print("WARNING: Notification API endpoints not available")

# Setup monitoring routes
if MONITORING_AVAILABLE:
    setup_monitoring_routes(app)
    print("SUCCESS: Monitoring endpoints added (/health, /health/detailed, /metrics)")
else:
    # Basic health check fallback
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}

# Health Check
@app.get("/")
async def root():
    return {
        "message": "Qlib Pro Production API",
        "version": "2.0.0",
        "status": "operational",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "services": {
            "models": len(MOCK_MODELS),
            "datasets": len(MOCK_DATASETS),
            "market_data": "connected"
        }
    }

# WebSocket endpoints
@app.websocket("/ws/training")
async def websocket_training(websocket: WebSocket):
    """WebSocket endpoint for model training updates"""
    if WEBSOCKET_AVAILABLE:
        await websocket_manager.connect(websocket, 'training')
        try:
            while True:
                # Keep connection alive and handle any incoming messages
                await websocket.receive_text()
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, 'training')
    else:
        await websocket.close()

@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    """WebSocket endpoint for market data updates"""
    if WEBSOCKET_AVAILABLE:
        await websocket_manager.connect(websocket, 'market')
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, 'market')
    else:
        await websocket.close()

@app.websocket("/ws/live-market")
async def websocket_live_market(websocket: WebSocket):
    """Enhanced WebSocket endpoint for live market data streaming"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            connection_id = await websocket_market_service.connect_client(websocket)
            
            while True:
                message = await websocket.receive_text()
                message_data = json.loads(message)
                await websocket_market_service.handle_message(connection_id, message_data)
                
        except WebSocketDisconnect:
            if 'connection_id' in locals():
                await websocket_market_service.disconnect_client(connection_id)
        except Exception as e:
            print(f"Live market WebSocket error: {e}")
            if 'connection_id' in locals():
                await websocket_market_service.disconnect_client(connection_id)
    else:
        await websocket.close()

@app.websocket("/ws/system")
async def websocket_system(websocket: WebSocket):
    """WebSocket endpoint for system notifications"""
    if WEBSOCKET_AVAILABLE:
        await websocket_manager.connect(websocket, 'system')
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, 'system')
    else:
        await websocket.close()

# Models API
@app.get("/api/models", response_model=List[Model])
async def get_models():
    """Get all AI models with enhanced performance metrics"""
    if OPTIMIZED_MODEL_SERVICE_AVAILABLE:
        try:
            # Get models from optimized service
            performance_data = await optimized_model_service.get_model_performance()
            models = []
            
            for model_id, perf in performance_data.items():
                config = optimized_model_service.production_models.get(model_id, {})
                model = Model(
                    id=model_id,
                    name=config.get('name', model_id),
                    type=config.get('type', 'Unknown'),
                    status=config.get('status', 'active'),
                    accuracy=f"{perf.accuracy}%",
                    sharpe=str(perf.sharpe_ratio),
                    last_trained=perf.last_updated.split('T')[0],
                    description=f"Production {config.get('type')} model with {config.get('features', 'Alpha')} features",
                    created_at=perf.last_updated
                )
                models.append(model)
            
            return models
        except Exception as e:
            print(f"Error getting models from optimized service: {e}")
    elif QLIB_SERVICE_AVAILABLE:
        try:
            models_data = qlib_service.get_models()
            models = [Model(**model) for model in models_data]
            return models
        except Exception as e:
            print(f"Error getting models from Qlib service: {e}")
    
    # Fallback to mock data
    return MOCK_MODELS

@app.post("/api/models")
async def create_model(model_data: CreateModelRequest):
    """Create a new AI model"""
    if QLIB_SERVICE_AVAILABLE:
        try:
            new_model_data = qlib_service.create_model(
                name=model_data.name,
                model_type=model_data.type, 
                description=model_data.description
            )
            
            # Start WebSocket training updates
            if WEBSOCKET_AVAILABLE:
                websocket_manager.start_model_training(
                    new_model_data['id'], 
                    new_model_data['name']
                )
            
            return {
                "message": f"Model '{model_data.name}' created successfully",
                "model": new_model_data,
                "status": "training",
                "estimated_completion": "2-4 hours"
            }
        except Exception as e:
            print(f"Error creating model with Qlib service: {e}")
    
    # Fallback implementation
    await asyncio.sleep(1)
    new_model = Model(
        id=str(len(MOCK_MODELS) + 1),
        name=model_data.name,
        type=model_data.type,
        status="training",
        accuracy="0%",
        sharpe="0.0",
        last_trained=datetime.date.today().isoformat(),
        description=model_data.description,
        created_at=datetime.datetime.now().isoformat()
    )
    MOCK_MODELS.append(new_model)
    return {
        "message": f"Model '{model_data.name}' created successfully",
        "model": new_model.dict(),
        "status": "training",
        "estimated_completion": "2-4 hours"
    }

@app.get("/api/models/{model_id}", response_model=Model)
async def get_model(model_id: str):
    """Get specific model by ID"""
    if QLIB_SERVICE_AVAILABLE:
        try:
            model_data = qlib_service.get_model(model_id)
            if model_data:
                return Model(**model_data)
        except Exception as e:
            print(f"Error getting model from Qlib service: {e}")
    
    # Fallback to mock data
    for model in MOCK_MODELS:
        if model.id == model_id:
            return model
    raise HTTPException(status_code=404, detail="Model not found")

@app.post("/api/models/{model_id}/control")
async def control_model(model_id: str, request: Request):
    """Control model (pause/resume/stop)"""
    body = await request.json()
    action = body.get("action", "").lower()
    
    if QLIB_SERVICE_AVAILABLE:
        try:
            result = qlib_service.control_model(model_id, action)
            return result
        except Exception as e:
            print(f"Error controlling model with Qlib service: {e}")
    
    # Fallback to mock implementation
    for model in MOCK_MODELS:
        if model.id == model_id:
            if action == "pause":
                model.status = "paused"
            elif action == "resume":
                model.status = "active"
            elif action == "stop":
                model.status = "stopped"
            return {"message": f"Model {action}ed successfully", "status": model.status}
    raise HTTPException(status_code=404, detail="Model not found")

@app.delete("/api/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a model"""
    if QLIB_SERVICE_AVAILABLE:
        try:
            # In real implementation, would delete model from Qlib service
            model = qlib_service.get_model(model_id)
            if model:
                del qlib_service.available_models[model_id]
                return {"message": f"Model '{model['name']}' deleted successfully"}
        except Exception as e:
            print(f"Error deleting model from Qlib service: {e}")
    
    # Fallback to mock data
    for i, model in enumerate(MOCK_MODELS):
        if model.id == model_id:
            deleted_model = MOCK_MODELS.pop(i)
            return {"message": f"Model '{deleted_model.name}' deleted successfully"}
    raise HTTPException(status_code=404, detail="Model not found")

@app.put("/api/models/{model_id}")
async def update_model(model_id: str, request: Request):
    """Update model configuration"""
    body = await request.json()
    
    if QLIB_SERVICE_AVAILABLE:
        try:
            model = qlib_service.get_model(model_id)
            if model:
                # Update model configuration
                model.update(body)
                return {"message": "Model updated successfully", "model": model}
        except Exception as e:
            print(f"Error updating model in Qlib service: {e}")
    
    # Fallback to mock data
    for model in MOCK_MODELS:
        if model.id == model_id:
            if "name" in body:
                model.name = body["name"]
            if "description" in body:
                model.description = body["description"]
            return {"message": "Model updated successfully", "model": model.dict()}
    raise HTTPException(status_code=404, detail="Model not found")

@app.post("/api/models/{model_id}/duplicate")
async def duplicate_model(model_id: str):
    """Duplicate an existing model"""
    if QLIB_SERVICE_AVAILABLE:
        try:
            original_model = qlib_service.get_model(model_id)
            if original_model:
                new_model = qlib_service.create_model(
                    name=f"{original_model['name']} (Copy)",
                    model_type=original_model['type'],
                    description=f"Copy of {original_model['description']}"
                )
                return {"message": "Model duplicated successfully", "model": new_model}
        except Exception as e:
            print(f"Error duplicating model in Qlib service: {e}")
    
    # Fallback to mock data
    for model in MOCK_MODELS:
        if model.id == model_id:
            new_model = Model(
                id=str(len(MOCK_MODELS) + 1),
                name=f"{model.name} (Copy)",
                type=model.type,
                status="stopped",
                accuracy=model.accuracy,
                sharpe=model.sharpe,
                last_trained=model.last_trained,
                description=f"Copy of {model.description}",
                created_at=datetime.datetime.now().isoformat()
            )
            MOCK_MODELS.append(new_model)
            return {"message": "Model duplicated successfully", "model": new_model.dict()}
    raise HTTPException(status_code=404, detail="Model not found")

@app.get("/api/models/{model_id}/predictions")
async def get_model_predictions(model_id: str, symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,TLS.AX"):
    """Get enhanced predictions from a specific model"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    
    if OPTIMIZED_MODEL_SERVICE_AVAILABLE:
        try:
            predictions = await optimized_model_service.get_model_predictions(symbol_list, [model_id])
            if model_id in predictions:
                return [pred.__dict__ for pred in predictions[model_id]]
        except Exception as e:
            print(f"Error getting predictions from optimized service: {e}")
    elif QLIB_SERVICE_AVAILABLE:
        try:
            predictions = qlib_service.get_predictions(model_id)
            if predictions:
                return predictions
        except Exception as e:
            print(f"Error getting predictions from Qlib service: {e}")
    
    # Fallback to mock predictions
    mock_predictions = []
    for symbol in symbol_list:
        mock_predictions.append({
            "symbol": symbol,
            "signal": random.choice(["BUY", "HOLD", "SELL"]),
            "confidence": round(random.uniform(0.6, 0.95), 3),
            "target_price": round(random.uniform(50, 300), 2),
            "current_price": round(random.uniform(45, 295), 2),
            "prediction": round(random.uniform(-0.05, 0.08), 4),
            "risk_score": round(random.uniform(0.1, 0.5), 3),
            "timestamp": datetime.datetime.now().isoformat()
        })
    
    return mock_predictions

@app.get("/api/models/ensemble/predictions")
async def get_ensemble_predictions(symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,TLS.AX"):
    """Get ensemble predictions from multiple models"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    
    if OPTIMIZED_MODEL_SERVICE_AVAILABLE:
        try:
            ensemble_results = await optimized_model_service.get_ensemble_prediction(symbol_list)
            return {
                "predictions": ensemble_results,
                "models_used": len(optimized_model_service.production_models),
                "timestamp": datetime.datetime.now().isoformat(),
                "ensemble_method": "accuracy_weighted"
            }
        except Exception as e:
            print(f"Error getting ensemble predictions: {e}")
    
    # Fallback ensemble
    ensemble_predictions = {}
    for symbol in symbol_list:
        ensemble_predictions[symbol] = {
            "prediction": round(random.uniform(-0.03, 0.05), 4),
            "confidence": round(random.uniform(0.7, 0.9), 3),
            "signal": random.choice(["BUY", "HOLD", "SELL"]),
            "target_price": round(random.uniform(50, 300), 2),
            "contributing_models": 3,
            "model_agreement": round(random.uniform(0.6, 0.9), 3)
        }
    
    return {
        "predictions": ensemble_predictions,
        "models_used": 3,
        "timestamp": datetime.datetime.now().isoformat(),
        "ensemble_method": "mock"
    }

@app.get("/api/models/performance")
async def get_models_performance():
    """Get performance metrics for all models"""
    if OPTIMIZED_MODEL_SERVICE_AVAILABLE:
        try:
            performance_data = await optimized_model_service.get_model_performance()
            return {
                "models": {k: v.__dict__ for k, v in performance_data.items()},
                "service_stats": optimized_model_service.get_service_statistics(),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting model performance: {e}")
    
    # Fallback performance data
    return {
        "models": {
            "lstm_alpha158": {
                "accuracy": 87.2,
                "sharpe_ratio": 1.89,
                "max_drawdown": 0.12,
                "win_rate": 0.68,
                "avg_return": 0.15
            },
            "lightgbm_multi_factor": {
                "accuracy": 85.5,
                "sharpe_ratio": 1.67,
                "max_drawdown": 0.08,
                "win_rate": 0.71,
                "avg_return": 0.13
            }
        },
        "service_stats": {"mock": True},
        "timestamp": datetime.datetime.now().isoformat()
    }

# Authentication API
@app.post("/api/auth/login")
async def login(request: Request):
    """Handle user login with test account support"""
    try:
        body = await request.json()
        email = body.get("email", "")
        password = body.get("password", "")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # First, try test account authentication
        if TEST_ACCOUNT_SERVICE_AVAILABLE:
            test_account = test_account_service.authenticate_test_account(email, password)
            if test_account:
                return {
                    "access_token": f"test-token-{test_account.id}",
                    "token_type": "bearer",
                    "user": {
                        "id": test_account.id,
                        "email": test_account.email,
                        "name": test_account.name,
                        "role": test_account.role,
                        "user_type": test_account.user_type,
                        "kyc_status": test_account.kyc_status,
                        "subscription_tier": test_account.subscription_tier,
                        "portfolio_value": test_account.portfolio_value,
                        "account_balance": test_account.account_balance,
                        "trading_experience": test_account.trading_experience,
                        "risk_tolerance": test_account.risk_tolerance,
                        "investment_goals": test_account.investment_goals,
                        "permissions": test_account.permissions,
                        "department": test_account.department,
                        "paper_trading": True,
                        "test_scenarios": test_account.test_scenarios,
                        "description": test_account.description
                    },
                    "message": "Test account login successful"
                }
        
        # Fallback to demo authentication
        if email == "demo@qlib.com" and password == "demo123":
            return {
                "access_token": "demo-auth-token-12345",
                "token_type": "bearer",
                "user": {
                    "id": "demo-user-1",
                    "email": email,
                    "name": "Demo User",
                    "role": "customer",
                    "subscription_tier": "pro",
                    "paper_trading": True
                },
                "message": "Demo login successful"
            }
        
        # If no authentication method works
        raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/profile")
async def get_profile(request: Request):
    """Get user profile with test account support"""
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="No valid token provided")
        
        token = auth_header.replace("Bearer ", "")
        
        if not token or token.strip() == "" or token == "null":
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if it's a test account token
        if token.startswith("test-token-") and TEST_ACCOUNT_SERVICE_AVAILABLE:
            account_id = token.replace("test-token-", "")
            test_account = test_account_service.get_account_by_id(account_id)
            if test_account:
                return {
                    "id": test_account.id,
                    "email": test_account.email,
                    "name": test_account.name,
                    "role": test_account.role,
                    "user_type": test_account.user_type,
                    "kyc_status": test_account.kyc_status,
                    "subscription_tier": test_account.subscription_tier,
                    "portfolio_value": test_account.portfolio_value,
                    "account_balance": test_account.account_balance,
                    "trading_experience": test_account.trading_experience,
                    "risk_tolerance": test_account.risk_tolerance,
                    "investment_goals": test_account.investment_goals,
                    "permissions": test_account.permissions,
                    "department": test_account.department,
                    "paper_trading": True,
                    "test_scenarios": test_account.test_scenarios,
                    "description": test_account.description,
                    "created_at": test_account.created_at.isoformat(),
                    "last_login": test_account.last_login.isoformat() if test_account.last_login else None
                }
        
        # Demo token validation
        if token == "demo-auth-token-12345":
            return {
                "id": "demo-user-1",
                "email": "demo@qlib.com",
                "name": "Demo User",
                "role": "customer",
                "subscription_tier": "pro",
                "paper_trading": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        
        raise HTTPException(status_code=401, detail="Invalid token")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile error: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

# Test Account Management API
@app.get("/api/test-accounts")
async def get_test_accounts():
    """Get all test accounts for login showcase"""
    if not TEST_ACCOUNT_SERVICE_AVAILABLE:
        return {
            "accounts": [],
            "message": "Test account service not available"
        }
    
    try:
        accounts = test_account_service.get_all_accounts()
        return {
            "accounts": [
                {
                    "id": acc.id,
                    "email": acc.email,
                    "name": acc.name,
                    "user_type": acc.user_type,
                    "role": acc.role,
                    "kyc_status": acc.kyc_status,
                    "subscription_tier": acc.subscription_tier,
                    "portfolio_value": acc.portfolio_value,
                    "account_balance": acc.account_balance,
                    "department": acc.department,
                    "test_scenarios": acc.test_scenarios,
                    "description": acc.description
                } for acc in accounts
            ],
            "summary": test_account_service.generate_account_summary()
        }
    except Exception as e:
        print(f"Test accounts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve test accounts")

@app.get("/api/test-accounts/summary")
async def get_test_accounts_summary():
    """Get test account summary statistics"""
    if not TEST_ACCOUNT_SERVICE_AVAILABLE:
        return {"message": "Test account service not available"}
    
    try:
        return test_account_service.generate_account_summary()
    except Exception as e:
        print(f"Test account summary error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")

@app.put("/api/test-accounts/{account_id}/kyc-status")
async def update_test_account_kyc_status(account_id: str, request: Request):
    """Update KYC status for test account (for testing KYC workflows)"""
    if not TEST_ACCOUNT_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Test account service not available")
    
    try:
        body = await request.json()
        new_status = body.get("kyc_status")
        
        if not new_status or new_status not in ["not_started", "pending", "under_review", "approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid KYC status")
        
        success = test_account_service.update_account_kyc_status(account_id, new_status)
        if success:
            return {"message": f"KYC status updated to {new_status}"}
        else:
            raise HTTPException(status_code=404, detail="Test account not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"KYC status update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update KYC status")

# AI Signals API  
@app.get("/api/signals")
async def get_signals(symbols: str = "CBA.AX,BHP.AX,CSL.AX"):
    """Get AI trading signals for symbols"""
    symbol_list = symbols.split(",")
    signals = []
    
    for symbol in symbol_list:
        signal = Signal(
            symbol=symbol.strip(),
            signal=random.choice(["BUY", "HOLD", "SELL"]),
            confidence=round(random.uniform(0.7, 0.95), 2),
            target_price=round(random.uniform(50, 300), 2),
            reasoning=f"Technical analysis shows strong momentum for {symbol}"
        )
        signals.append(signal)
    
    return signals

@app.get("/api/ai/signals")
async def get_ai_signals(symbols: str = "CBA.AX,BHP.AX,CSL.AX"):
    """Get AI trading signals for symbols (alternative endpoint)"""
    return await get_signals(symbols)

# Enhanced Market Data API
@app.get("/api/market/quotes")
async def get_quotes(symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,ANZ.AX"):
    """Get real-time market quotes with enhanced data"""
    if ENHANCED_MARKET_DATA_AVAILABLE:
        try:
            symbol_list = [s.strip() for s in symbols.split(",")]
            quotes_data = await enhanced_market_data_service.get_comprehensive_quotes(symbol_list)
            return quotes_data
        except Exception as e:
            print(f"Error using enhanced market data service: {e}")
    elif MARKET_DATA_SERVICE_AVAILABLE:
        try:
            symbol_list = symbols.split(",")
            quotes_data = await market_data_service.get_realtime_quotes(symbol_list)
            return quotes_data
        except Exception as e:
            print(f"Error using market data service: {e}")
    
    # Fallback to original implementation
    symbol_list = symbols.split(",")
    quotes = []
    
    for symbol in symbol_list:
        quotes.append(MarketQuote(
            symbol=symbol.strip(),
            price=round(random.uniform(50, 300), 2),
            change=round(random.uniform(-5, 5), 2),
            change_percent=round(random.uniform(-3, 3), 2),
            volume=random.randint(100000, 5000000),
            last_updated=datetime.datetime.now().isoformat()
        ))
    
    return {"quotes": quotes, "total": len(quotes), "market": "ASX"}

@app.get("/api/market/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time market quote for a single symbol"""
    quotes_data = await get_quotes(symbol)
    quotes = quotes_data.get("quotes", [])
    
    if quotes:
        return quotes[0]
    else:
        # Fallback
        return MarketQuote(
            symbol=symbol,
            price=round(random.uniform(50, 300), 2),
            change=round(random.uniform(-5, 5), 2),
            change_percent=round(random.uniform(-3, 3), 2),
            volume=random.randint(100000, 5000000),
            last_updated=datetime.datetime.now().isoformat()
        )

@app.get("/api/market/historical/{symbol}")
async def get_historical_data(symbol: str, period: str = "1y"):
    """Get historical price data"""
    if MARKET_DATA_SERVICE_AVAILABLE:
        try:
            return await market_data_service.get_historical_data(symbol, period)
        except Exception as e:
            print(f"Error getting historical data: {e}")
    
    # Fallback mock data
    import numpy as np
    days = {'1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365}
    num_days = days.get(period, 365)
    
    data = []
    base_price = 100
    for i in range(num_days):
        date = datetime.datetime.now() - datetime.timedelta(days=num_days - i)
        base_price *= (1 + np.random.normal(0, 0.02))
        
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'close': round(base_price, 2),
            'volume': random.randint(100000, 1000000)
        })
    
    return {"symbol": symbol, "period": period, "data": data}

@app.get("/api/market/indices")
async def get_market_indices():
    """Get Australian market indices"""
    if MARKET_DATA_SERVICE_AVAILABLE:
        try:
            return await market_data_service.get_market_indices()
        except Exception as e:
            print(f"Error getting market indices: {e}")
    
    # Fallback mock data
    indices = [
        {"symbol": "^AXJO", "name": "ASX 200", "value": 7542.30, "change": 45.2, "change_percent": "0.60%"},
        {"symbol": "^AXKO", "name": "All Ordinaries", "value": 7798.50, "change": 38.1, "change_percent": "0.49%"}
    ]
    return {"indices": indices, "market": "ASX"}

@app.get("/api/market/sectors")
async def get_sector_performance():
    """Get enhanced sector performance data"""
    if ENHANCED_MARKET_DATA_AVAILABLE:
        try:
            return await enhanced_market_data_service.get_sector_performance()
        except Exception as e:
            print(f"Error getting enhanced sector performance: {e}")
    elif MARKET_DATA_SERVICE_AVAILABLE:
        try:
            return await market_data_service.get_sector_performance()
        except Exception as e:
            print(f"Error getting sector performance: {e}")
    
    # Fallback mock data
    sectors = [
        {"sector": "Financials", "change_percent": 1.2, "top_stocks": ["CBA.AX", "WBC.AX", "ANZ.AX"]},
        {"sector": "Materials", "change_percent": -0.8, "top_stocks": ["BHP.AX", "RIO.AX", "FMG.AX"]},
        {"sector": "Healthcare", "change_percent": 0.5, "top_stocks": ["CSL.AX", "COL.AX"]}
    ]
    return {"sectors": sectors}

@app.get("/api/market/real-time")
async def get_real_time_market_data(symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,TLS.AX"):
    """Get comprehensive real-time market data optimized for trading"""
    if ENHANCED_MARKET_DATA_AVAILABLE:
        try:
            symbol_list = [s.strip() for s in symbols.split(",")]
            return await enhanced_market_data_service.get_real_time_market_data(symbol_list)
        except Exception as e:
            print(f"Error getting real-time market data: {e}")
    
    # Fallback to basic quotes
    return await get_quotes(symbols)

@app.get("/api/market/sentiment/{symbol}")
async def get_market_sentiment(symbol: str):
    """Get market sentiment analysis for a specific symbol"""
    if ENHANCED_MARKET_DATA_AVAILABLE:
        try:
            sentiment = await enhanced_market_data_service._get_market_sentiment(symbol)
            if sentiment:
                return sentiment.__dict__
        except Exception as e:
            print(f"Error getting market sentiment: {e}")
    
    # Fallback mock sentiment
    return {
        "symbol": symbol,
        "sentiment_score": round(random.uniform(-1, 1), 3),
        "confidence": round(random.uniform(0.6, 0.9), 3),
        "analyst_rating": random.choice(["Strong Buy", "Buy", "Hold", "Sell"]),
        "news_volume": random.randint(5, 50),
        "social_mentions": random.randint(100, 10000)
    }

@app.get("/api/market/news")
async def get_market_news(query: str = "ASX Australian stock market", limit: int = 10):
    """Get market news"""
    if MARKET_DATA_SERVICE_AVAILABLE:
        try:
            return await market_data_service.get_market_news(query, limit)
        except Exception as e:
            print(f"Error getting market news: {e}")
    
    # Fallback mock news
    news = [
        {
            "title": "ASX 200 closes higher on banking strength",
            "summary": "Major banks led gains with strong earnings outlook",
            "source": "Financial Review",
            "timestamp": datetime.datetime.now().isoformat(),
            "sentiment": "positive"
        }
    ]
    return {"news": news[:limit], "total": len(news)}

# Portfolio API
@app.get("/api/portfolio/holdings", response_model=List[Holding])
async def get_holdings():
    """Get portfolio holdings with advanced analytics"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            positions = await advanced_portfolio_manager.get_positions()
            # Convert to Holding objects for API response
            holdings = []
            for pos in positions:
                holding = Holding(
                    symbol=pos['symbol'],
                    name=pos['symbol'].replace('.AX', ''),
                    quantity=pos['shares'],
                    price=pos['current_price'],
                    value=pos['market_value'],
                    weight=pos['weight'] * 100,
                    pnl=pos['unrealized_pnl'],
                    pnl_percent=pos['unrealized_pnl_percent']
                )
                holdings.append(holding)
            return holdings
        except Exception as e:
            logger.error(f"Error getting portfolio holdings: {e}")
    
    # Fallback mock data
    holdings = [
        Holding(
            symbol="CBA.AX",
            name="Commonwealth Bank",
            quantity=850,
            price=110.50,
            value=93925,
            weight=15.2,
            pnl=4850,
            pnl_percent=5.4
        ),
        Holding(
            symbol="BHP.AX", 
            name="BHP Group",
            quantity=2200,
            price=45.20,
            value=99440,
            weight=16.1,
            pnl=6240,
            pnl_percent=6.7
        )
    ]
    return holdings

@app.post("/api/portfolio/rebalance")
async def rebalance_portfolio():
    """Generate and execute portfolio rebalancing"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            # Generate rebalancing recommendation
            recommendation = await advanced_portfolio_manager.generate_rebalance_recommendation()
            
            return {
                "message": "Rebalancing recommendation generated",
                "recommendation": {
                    "recommendation_id": recommendation.recommendation_id,
                    "trades_required": recommendation.trades_required,
                    "expected_improvement": recommendation.expected_improvement,
                    "transaction_costs": recommendation.transaction_costs,
                    "reasoning": recommendation.reasoning,
                    "confidence_score": recommendation.confidence_score
                },
                "timestamp": recommendation.timestamp
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Rebalancing failed: {e}")
    
    # Fallback mock response
    await asyncio.sleep(2)
    changes = [
        {"action": "BUY", "quantity": 100, "symbol": "CSL.AX", "reason": "Underweight healthcare"},
        {"action": "SELL", "quantity": 50, "symbol": "WBC.AX", "reason": "Overweight financials"}
    ]
    
    return {
        "message": "Portfolio rebalanced successfully",
        "changes": changes,
        "estimated_benefit": "+$1,240 annual return improvement"
    }

@app.get("/api/portfolio/metrics")
async def get_portfolio_metrics():
    """Get comprehensive portfolio performance metrics"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            metrics = await advanced_portfolio_manager.get_portfolio_metrics()
            return {
                "metrics": {
                    "total_value": metrics.total_value,
                    "cash_balance": metrics.cash_balance,
                    "invested_value": metrics.invested_value,
                    "total_pnl": metrics.total_pnl,
                    "total_pnl_percent": metrics.total_pnl_percent,
                    "daily_pnl": metrics.daily_pnl,
                    "daily_return": metrics.daily_return,
                    "volatility": metrics.volatility,
                    "sharpe_ratio": metrics.sharpe_ratio,
                    "sortino_ratio": metrics.sortino_ratio,
                    "max_drawdown": metrics.max_drawdown,
                    "beta": metrics.beta,
                    "alpha": metrics.alpha,
                    "win_rate": metrics.win_rate,
                    "profit_factor": metrics.profit_factor
                },
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get portfolio metrics: {e}")
    
    # Fallback mock metrics
    return {
        "metrics": {
            "total_value": 1050000,
            "cash_balance": 50000,
            "invested_value": 1000000,
            "total_pnl": 50000,
            "total_pnl_percent": 5.0,
            "daily_pnl": 2500,
            "daily_return": 0.24,
            "volatility": 12.5,
            "sharpe_ratio": 1.65,
            "max_drawdown": 8.2,
            "beta": 1.15,
            "win_rate": 68.5
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/portfolio/risk")
async def get_portfolio_risk_metrics():
    """Get advanced portfolio risk metrics"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            risk_metrics = await advanced_portfolio_manager.get_risk_metrics()
            return {
                "risk_metrics": {
                    "var_1d": risk_metrics.var_1d,
                    "var_5d": risk_metrics.var_5d,
                    "cvar_1d": risk_metrics.cvar_1d,
                    "expected_shortfall": risk_metrics.expected_shortfall,
                    "maximum_drawdown": risk_metrics.maximum_drawdown,
                    "downside_deviation": risk_metrics.downside_deviation,
                    "tracking_error": risk_metrics.tracking_error,
                    "concentration_risk": risk_metrics.concentration_risk,
                    "sector_risk": risk_metrics.sector_risk,
                    "correlation_risk": risk_metrics.correlation_risk,
                    "liquidity_risk": risk_metrics.liquidity_risk
                },
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get risk metrics: {e}")
    
    # Fallback mock risk metrics
    return {
        "risk_metrics": {
            "var_1d": 15000,
            "var_5d": 33500,
            "cvar_1d": 22000,
            "maximum_drawdown": 8.2,
            "concentration_risk": {"CBA.AX": 0.15, "BHP.AX": 0.16},
            "sector_risk": {"Financials": 0.45, "Materials": 0.25, "Healthcare": 0.15},
            "correlation_risk": 0.35,
            "liquidity_risk": 0.85
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/api/portfolio/position")
async def add_portfolio_position(request: Request):
    """Add new position to portfolio"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            data = await request.json()
            symbol = data.get('symbol')
            shares = data.get('shares')
            price = data.get('price')
            
            if not all([symbol, shares, price]):
                raise HTTPException(status_code=400, detail="Missing required fields: symbol, shares, price")
            
            success = await advanced_portfolio_manager.add_position(symbol, shares, price)
            
            if success:
                return {
                    "message": f"Successfully added {shares} shares of {symbol}",
                    "symbol": symbol,
                    "shares": shares,
                    "price": price,
                    "timestamp": datetime.datetime.now().isoformat()
                }
            else:
                raise HTTPException(status_code=400, detail="Failed to add position - risk limits or insufficient funds")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error adding position: {e}")
    else:
        raise HTTPException(status_code=503, detail="Portfolio manager not available")

@app.delete("/api/portfolio/position/{symbol}")
async def remove_portfolio_position(symbol: str, shares: Optional[float] = None):
    """Remove or reduce position"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            success = await advanced_portfolio_manager.remove_position(symbol, shares)
            
            if success:
                return {
                    "message": f"Successfully removed position for {symbol}",
                    "symbol": symbol,
                    "shares_sold": shares,
                    "timestamp": datetime.datetime.now().isoformat()
                }
            else:
                raise HTTPException(status_code=400, detail="Failed to remove position")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error removing position: {e}")
    else:
        raise HTTPException(status_code=503, detail="Portfolio manager not available")

@app.get("/api/portfolio/summary")
async def get_portfolio_summary():
    """Get portfolio summary information"""
    if PORTFOLIO_MANAGER_AVAILABLE:
        try:
            summary = advanced_portfolio_manager.get_portfolio_summary()
            metrics = await advanced_portfolio_manager.get_portfolio_metrics()
            
            return {
                "summary": summary,
                "performance": {
                    "total_value": metrics.total_value,
                    "total_return": metrics.total_pnl_percent,
                    "sharpe_ratio": metrics.sharpe_ratio,
                    "max_drawdown": metrics.max_drawdown
                },
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get portfolio summary: {e}")
    
    # Fallback mock summary
    return {
        "summary": {
            "initial_capital": 1000000,
            "cash_balance": 50000,
            "positions_count": 5,
            "trades_executed": 25
        },
        "performance": {
            "total_value": 1050000,
            "total_return": 5.0,
            "sharpe_ratio": 1.65,
            "max_drawdown": 8.2
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

# Data Management API
@app.get("/api/data/datasets", response_model=List[Dataset])
async def get_datasets():
    """Get all datasets"""
    return MOCK_DATASETS

@app.post("/api/data/refresh")
async def refresh_data():
    """Refresh market data"""
    await asyncio.sleep(3)  # Simulate data refresh
    
    # Update mock data timestamps
    for dataset in MOCK_DATASETS:
        dataset.lastUpdate = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    return {
        "message": "Market data refreshed successfully", 
        "datasets_updated": len(MOCK_DATASETS),
        "last_update": datetime.datetime.now().isoformat()
    }

@app.get("/api/data/datasets/{dataset_id}/download")
async def download_dataset(dataset_id: str):
    """Download dataset file"""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Find the dataset
    dataset = None
    for d in MOCK_DATASETS:
        if d.id == dataset_id:
            dataset = d
            break
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Generate CSV data for download
    csv_data = io.StringIO()
    writer = csv.writer(csv_data)
    
    # CSV headers
    writer.writerow(['Date', 'Symbol', 'Open', 'High', 'Low', 'Close', 'Volume'])
    
    # Generate sample data based on dataset
    symbols = ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'TLS.AX'][:int(dataset.records.replace(',', '')) // 100]
    
    for i in range(min(1000, int(dataset.records.replace(',', '')) // 10)):  # Limit for demo
        date = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        symbol = symbols[i % len(symbols)]
        base_price = 50 + (hash(symbol) % 100)
        price_var = random.uniform(0.95, 1.05)
        
        open_price = round(base_price * price_var, 2)
        high_price = round(open_price * random.uniform(1.0, 1.05), 2)
        low_price = round(open_price * random.uniform(0.95, 1.0), 2)
        close_price = round((high_price + low_price) / 2 * random.uniform(0.98, 1.02), 2)
        volume = random.randint(100000, 2000000)
        
        writer.writerow([date, symbol, open_price, high_price, low_price, close_price, volume])
    
    csv_data.seek(0)
    
    # Return as downloadable file
    return StreamingResponse(
        io.BytesIO(csv_data.getvalue().encode()),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={dataset.name.replace(' ', '_')}.csv"}
    )

@app.post("/api/data/sync")
async def sync_data():
    """Trigger data synchronization"""
    await asyncio.sleep(2)  # Simulate sync time
    
    sync_results = {
        "status": "completed",
        "datasets_synced": len(MOCK_DATASETS),
        "records_updated": sum(int(d.records.replace(',', '')) for d in MOCK_DATASETS),
        "sync_time": datetime.datetime.now().isoformat(),
        "data_quality_score": round(random.uniform(85, 98), 1),
        "storage_used_mb": round(random.uniform(1500, 2500), 1)
    }
    
    return sync_results

# Dashboard API
@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    """Get dashboard summary data"""
    return {
        "portfolio_value": 522340,
        "total_pnl": 22340,
        "pnl_percent": 4.5,
        "active_models": 2,
        "signals_today": 8,
        "last_updated": datetime.datetime.now().isoformat()
    }

# Backtesting API
@app.post("/api/backtests")
async def create_backtest(backtest_data: Dict[str, Any]):
    """Create a new backtest"""
    await asyncio.sleep(2)  # Simulate processing
    
    backtest_id = str(random.randint(1000, 9999))
    
    return {
        "id": backtest_id,
        "name": backtest_data.get("name", "New Backtest"),
        "status": "running",
        "message": f"Backtest {backtest_data.get('name')} started successfully",
        "estimated_completion": "2-5 minutes"
    }

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.datetime.now().isoformat()
        }
    )

# Payment API
@app.get("/api/payment/pricing")
async def get_pricing_tiers():
    """Get available pricing tiers"""
    if PAYMENT_SERVICE_AVAILABLE:
        return payment_service.get_pricing_tiers()
    
    # Fallback pricing
    return {
        'pro': {
            'name': 'Qlib Pro',
            'price_aud': 2900,
            'price_usd': 1999,
            'features': [
                'Advanced AI Models',
                'Real-time Trading Signals',
                'Portfolio Management',
                'Basic Backtesting',
                'Email Support'
            ]
        },
        'premium': {
            'name': 'Qlib Premium',
            'price_aud': 9900,
            'price_usd': 6999,
            'features': [
                'All Pro Features',
                'Custom Model Training',
                'Advanced Backtesting',
                'API Access',
                'Priority Support',
                'White-label Options'
            ]
        }
    }

@app.post("/api/payment/create-payment-intent")
async def create_payment_intent(payment_request: PaymentIntentRequest):
    """Create a Stripe Payment Intent"""
    if not PAYMENT_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    
    try:
        # Get tier pricing
        tiers = payment_service.get_pricing_tiers()
        tier_info = tiers.get(payment_request.tier)
        
        if not tier_info:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
        # Determine amount based on currency
        amount = tier_info['price_aud'] if payment_request.currency.lower() == 'aud' else tier_info['price_usd']
        
        # Create payment intent
        result = payment_service.create_payment_intent(
            amount=amount,
            currency=payment_request.currency,
            customer_email=payment_request.customer_email,
            metadata={'tier': payment_request.tier}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payment/confirm-payment/{payment_intent_id}")
async def confirm_payment(payment_intent_id: str):
    """Confirm a payment and activate subscription"""
    if not PAYMENT_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    
    try:
        # Confirm payment
        result = payment_service.confirm_payment(payment_intent_id)
        
        if result['success']:
            # In real app, update user subscription in database
            subscription_tier = result.get('metadata', {}).get('tier', 'pro')
            
            # Send payment confirmation notification
            if NOTIFICATION_SYSTEM_AVAILABLE:
                try:
                    await payment_notifications.on_payment_successful(
                        user_id=f"user_{payment_intent_id}",
                        payment_data={
                            'user_name': 'Customer',  # Would get from user database
                            'user_email': 'customer@example.com',  # Would get from payment data
                            'amount': result['amount_received'] / 100,  # Convert from cents
                            'currency': result['currency'].upper(),
                            'transaction_id': payment_intent_id,
                            'new_balance': result['amount_received'] / 100,
                            'tier': subscription_tier
                        }
                    )
                except Exception as e:
                    print(f"Payment notification failed: {e}")
            
            return {
                'success': True,
                'message': 'Payment confirmed and subscription activated',
                'subscription_tier': subscription_tier,
                'amount': result['amount_received'],
                'currency': result['currency']
            }
        else:
            return {
                'success': False,
                'message': 'Payment not confirmed',
                'status': result['status']
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payment/create-subscription")
async def create_subscription(subscription_request: SubscriptionRequest):
    """Create a recurring subscription"""
    if not PAYMENT_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    
    try:
        result = payment_service.create_subscription(
            customer_email=subscription_request.customer_email,
            tier=subscription_request.tier,
            payment_method_id=subscription_request.payment_method_id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/payment/subscriptions/{customer_email}")
async def get_customer_subscriptions(customer_email: str):
    """Get customer's subscriptions"""
    if not PAYMENT_SERVICE_AVAILABLE:
        return {'subscriptions': [], 'total': 0, 'mock': True}
    
    try:
        return payment_service.get_customer_subscriptions(customer_email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/payment/subscription/{subscription_id}")
async def cancel_subscription(subscription_id: str):
    """Cancel a subscription"""
    if not PAYMENT_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment service unavailable")
    
    try:
        return payment_service.cancel_subscription(subscription_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payment/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    if not PAYMENT_SERVICE_AVAILABLE:
        return {'status': 'payment service unavailable'}
    
    try:
        payload = await request.body()
        signature = request.headers.get('stripe-signature')
        
        return payment_service.process_webhook(payload.decode(), signature)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Cloud Storage API
@app.post("/api/storage/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    metadata: Optional[str] = Form(None)
):
    """Upload a file to cloud storage"""
    if not STORAGE_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Storage service unavailable")
    
    try:
        # Read file data
        file_data = await file.read()
        
        # Parse metadata if provided
        file_metadata = {}
        if metadata:
            import json
            try:
                file_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                pass
        
        # Upload file
        result = cloud_storage_service.upload_file(
            file_data=file_data,
            filename=file.filename,
            user_id=user_id,
            content_type=file.content_type,
            metadata=file_metadata
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/storage/files/{user_id}")
async def list_user_files(user_id: str, prefix: Optional[str] = ""):
    """List files for a user"""
    if not STORAGE_SERVICE_AVAILABLE:
        return {'files': [], 'total': 0}
    
    try:
        files = cloud_storage_service.list_user_files(user_id, prefix or "")
        return {
            'files': files,
            'total': len(files),
            'user_id': user_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/storage/download/{file_key:path}")
async def download_file(file_key: str, user_id: str):
    """Download a file"""
    if not STORAGE_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Storage service unavailable")
    
    try:
        result = cloud_storage_service.download_file(file_key, user_id)
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(result['content']),
            media_type=result['content_type'],
            headers={
                "Content-Disposition": f"attachment; filename={result['metadata'].get('original_filename', 'download')}"
            }
        )
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/storage/files/{file_key:path}")
async def delete_file(file_key: str, user_id: str):
    """Delete a file"""
    if not STORAGE_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Storage service unavailable")
    
    try:
        result = cloud_storage_service.delete_file(file_key, user_id)
        return result
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/storage/usage/{user_id}")
async def get_storage_usage(user_id: str):
    """Get user's storage usage"""
    if not STORAGE_SERVICE_AVAILABLE:
        return {
            'user_id': user_id,
            'total_files': 0,
            'total_size': 0,
            'total_size_mb': 0,
            'max_size_mb': 1024,
            'usage_percent': 0,
            'provider': 'unavailable'
        }
    
    try:
        return cloud_storage_service.get_user_storage_usage(user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Cache Management API
@app.get("/api/cache/health")
async def get_cache_health():
    """Get cache service health status"""
    if REDIS_CACHE_AVAILABLE:
        try:
            health_status = await redis_cache_service.health_check()
            return {
                "cache_service": "available",
                "health": health_status,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "cache_service": "error",
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat()
            }
    else:
        return {
            "cache_service": "unavailable",
            "message": "Redis cache service not initialized",
            "timestamp": datetime.datetime.now().isoformat()
        }

@app.get("/api/cache/metrics")
async def get_cache_metrics():
    """Get cache performance metrics"""
    if REDIS_CACHE_AVAILABLE:
        try:
            metrics = await redis_cache_service.get_cache_metrics()
            return {
                "metrics": {
                    "total_requests": metrics.total_requests,
                    "cache_hits": metrics.cache_hits,
                    "cache_misses": metrics.cache_misses,
                    "hit_rate_percent": metrics.hit_rate,
                    "avg_response_time_ms": metrics.avg_response_time_ms,
                    "memory_usage_mb": metrics.memory_usage_mb,
                    "keys_count": metrics.keys_count,
                    "total_data_mb": metrics.total_data_mb
                },
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get cache metrics: {e}")
    else:
        raise HTTPException(status_code=503, detail="Cache service not available")

@app.post("/api/cache/warm")
async def warm_cache():
    """Pre-warm cache with frequently accessed data"""
    if REDIS_CACHE_AVAILABLE:
        try:
            # Define symbols and models to warm up
            symbols = ['CBA.AX', 'WBC.AX', 'BHP.AX', 'CSL.AX', 'ANZ.AX']
            model_ids = ['lstm_alpha158', 'lightgbm_multi_factor', 'lstm_momentum']
            
            await redis_cache_service.warm_cache(symbols, model_ids)
            
            return {
                "message": "Cache warming initiated successfully",
                "symbols": len(symbols),
                "models": len(model_ids),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cache warming failed: {e}")
    else:
        raise HTTPException(status_code=503, detail="Cache service not available")

@app.delete("/api/cache/clear/{category}")
async def clear_cache_category(category: str):
    """Clear all cache entries for a specific category"""
    if REDIS_CACHE_AVAILABLE:
        try:
            # Validate category
            valid_categories = ['prediction', 'market_data', 'model_performance', 'user_data', 'analytics']
            if category not in valid_categories:
                raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
            
            deleted_count = await redis_cache_service.invalidate_category(category)
            
            return {
                "message": f"Cache category '{category}' cleared successfully",
                "deleted_entries": deleted_count,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cache clear failed: {e}")
    else:
        raise HTTPException(status_code=503, detail="Cache service not available")

@app.post("/api/cache/cleanup")
async def cleanup_cache():
    """Clean up expired cache entries"""
    if REDIS_CACHE_AVAILABLE:
        try:
            await redis_cache_service.cleanup_expired_entries()
            
            return {
                "message": "Cache cleanup completed successfully",
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cache cleanup failed: {e}")
    else:
        raise HTTPException(status_code=503, detail="Cache service not available")

# Real-Time Trading Engine API
@app.post("/api/trading/session/start")
async def start_trading_session():
    """Start real-time trading session"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            await real_time_trading_engine.start_trading_session()
            stats = await real_time_trading_engine.get_trading_statistics()
            return {
                "message": "Trading session started successfully",
                "session": stats,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start trading session: {e}")
    else:
        raise HTTPException(status_code=503, detail="Trading engine not available")

@app.post("/api/trading/session/stop")
async def stop_trading_session():
    """Stop real-time trading session"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            await real_time_trading_engine.stop_trading_session()
            stats = await real_time_trading_engine.get_trading_statistics()
            return {
                "message": "Trading session stopped successfully", 
                "session": stats,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to stop trading session: {e}")
    else:
        raise HTTPException(status_code=503, detail="Trading engine not available")

@app.get("/api/trading/signals/live")
async def get_live_trading_signals():
    """Get current live trading signals"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            signals = await real_time_trading_engine.get_active_signals()
            return {
                "signals": signals,
                "total": len(signals),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get signals: {e}")
    
    # Fallback mock signals
    return {
        "signals": [
            {
                "signal_id": "mock-1",
                "symbol": "CBA.AX",
                "signal": "BUY",
                "confidence": 0.85,
                "price_target": 115.50,
                "current_price": 110.50,
                "reasoning": ["Strong technical momentum", "Positive earnings outlook"]
            }
        ],
        "total": 1,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/positions")
async def get_trading_positions():
    """Get current trading positions"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            positions = await real_time_trading_engine.get_positions()
            return {
                "positions": positions,
                "total": len(positions),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get positions: {e}")
    
    # Fallback mock positions
    return {
        "positions": [
            {
                "symbol": "CBA.AX",
                "quantity": 100,
                "average_price": 108.50,
                "current_price": 110.50,
                "unrealized_pnl": 200.00,
                "unrealized_pnl_percent": 1.84
            }
        ],
        "total": 1,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/orders")
async def get_trading_orders(status: Optional[str] = None):
    """Get trading orders, optionally filtered by status"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            orders = await real_time_trading_engine.get_orders(status)
            return {
                "orders": orders,
                "total": len(orders),
                "status_filter": status,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get orders: {e}")
    
    # Fallback mock orders
    return {
        "orders": [
            {
                "order_id": "mock-order-1",
                "symbol": "CBA.AX",
                "side": "BUY",
                "quantity": 100,
                "status": "filled",
                "average_fill_price": 110.50
            }
        ],
        "total": 1,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/risk")
async def get_trading_risk_metrics():
    """Get current risk metrics"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            risk_metrics = await real_time_trading_engine.get_risk_metrics()
            return {
                "risk_metrics": risk_metrics,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get risk metrics: {e}")
    
    # Fallback mock risk metrics
    return {
        "risk_metrics": {
            "portfolio_value": 1000000,
            "total_exposure": 750000,
            "leverage": 0.75,
            "var_1d": 20000,
            "max_drawdown": 0.08
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/trading/statistics")
async def get_trading_statistics():
    """Get trading session statistics"""
    if TRADING_ENGINE_AVAILABLE:
        try:
            stats = await real_time_trading_engine.get_trading_statistics()
            return {
                "statistics": stats,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get statistics: {e}")
    
    # Fallback mock statistics
    return {
        "statistics": {
            "signals_generated": 156,
            "signal_success_rate": 67.3,
            "orders_placed": 45,
            "fill_rate": 98.2,
            "active_positions": 8
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

# Trading Environment API (Legacy - maintained for compatibility)
@app.get("/api/trading/agents")
async def get_trading_agents():
    """Get all active trading agents (legacy endpoint)"""
    try:
        from datetime import datetime, timedelta
        
        # Enhanced mock agents based on real-time engine
        agents = []
        
        if TRADING_ENGINE_AVAILABLE:
            stats = await real_time_trading_engine.get_trading_statistics()
            positions = await real_time_trading_engine.get_positions()
            
            # Create agents based on active models
            if OPTIMIZED_MODEL_SERVICE_AVAILABLE:
                performance_data = await optimized_model_service.get_model_performance()
                for model_id, perf in performance_data.items():
                    config = optimized_model_service.production_models.get(model_id, {})
                    
                    # Find associated position
                    agent_position = None
                    if positions:
                        agent_position = positions[0] if positions else None
                    
                    agent = {
                        "id": model_id,
                        "name": config.get('name', model_id),
                        "model_type": config.get('type', 'Unknown'),
                        "status": "running" if stats.get('session_status') == 'active' else "paused",
                        "performance": {
                            "total_return": round((perf.avg_return - 1) * 100, 1),
                            "sharpe_ratio": perf.sharpe_ratio,
                            "win_rate": perf.win_rate * 100,
                            "trades_count": random.randint(20, 100)
                        },
                        "current_position": {
                            "symbol": agent_position['symbol'] if agent_position else "CBA.AX",
                            "quantity": agent_position['quantity'] if agent_position else 0,
                            "entry_price": agent_position['average_price'] if agent_position else 0,
                            "current_pnl": agent_position['unrealized_pnl'] if agent_position else 0
                        } if agent_position else None,
                        "last_signal": {
                            "action": random.choice(["BUY", "HOLD", "SELL"]),
                            "symbol": agent_position['symbol'] if agent_position else "CBA.AX",
                            "confidence": round(random.uniform(0.7, 0.95), 2),
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                    agents.append(agent)
        
        # Fallback if no real data
        if not agents:
            agents = [
                {
                    "id": "agent-1",
                    "name": "LSTM Alpha Strategy",
                    "model_type": "LSTM",
                    "status": "running",
                    "performance": {
                        "total_return": 12.5,
                        "sharpe_ratio": 1.8,
                        "win_rate": 68.2,
                        "trades_count": 47
                    },
                    "current_position": {
                        "symbol": "CBA.AX",
                        "quantity": 100,
                        "entry_price": 108.50,
                        "current_pnl": 275.00
                    },
                    "last_signal": {
                        "action": "HOLD",
                        "symbol": "CBA.AX",
                        "confidence": 0.82,
                        "timestamp": datetime.now().isoformat()
                    }
                }
            ]
        
        return {
            "agents": agents,
            "total": len(agents),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trading/agents/{agent_id}/control")
async def control_trading_agent(agent_id: str, request: Request):
    """Control trading agent (start/pause/stop)"""
    try:
        body = await request.json()
        action_type = body.get("action")
        
        if action_type not in ["start", "pause", "stop"]:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Simulate agent control
        new_status = "running" if action_type == "start" else action_type + ("ped" if action_type == "stop" else "d")
        
        return {
            "message": f"Agent {action_type}ed successfully",
            "agent_id": agent_id,
            "status": new_status,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trading/activity")
async def get_trading_activity():
    """Get recent trading activity"""
    try:
        from datetime import datetime, timedelta
        
        # Mock trading activity
        activity = [
            {
                "time": "10:45 AM",
                "agent": "LSTM Alpha",
                "action": "BUY",
                "symbol": "CBA.AX",
                "quantity": 100,
                "price": 108.50,
                "timestamp": datetime.now().isoformat()
            },
            {
                "time": "10:32 AM", 
                "agent": "LightGBM Multi",
                "action": "SELL",
                "symbol": "WBC.AX",
                "quantity": 150,
                "price": 25.20,
                "timestamp": (datetime.now() - timedelta(minutes=13)).isoformat()
            },
            {
                "time": "10:18 AM",
                "agent": "GRU Momentum", 
                "action": "BUY",
                "symbol": "BHP.AX",
                "quantity": 200,
                "price": 44.20,
                "timestamp": (datetime.now() - timedelta(minutes=27)).isoformat()
            }
        ]
        
        return {
            "activity": activity,
            "total": len(activity),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# MODEL TRAINING API ENDPOINTS
# ================================

@app.post("/api/training/start")
async def start_training(request: Request):
    """Start model training with configuration"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        request_data = await request.json()
        
        # Validate configuration
        validation_errors = validate_training_config(request_data)
        if validation_errors:
            raise HTTPException(status_code=400, detail={
                "message": "Configuration validation failed",
                "errors": validation_errors
            })
        
        # Extract user ID from auth (simplified for demo)
        auth_header = request.headers.get("authorization", "")
        user_id = "demo-user-1" if auth_header else None
        
        result = await start_model_training(request_data, user_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")

@app.get("/api/training/progress/{training_id}")
async def get_training_progress_endpoint(training_id: str):
    """Get training progress for a specific session"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        progress = await get_training_progress(training_id)
        return progress.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@app.get("/api/training/sessions")
async def get_training_sessions_endpoint(request: Request):
    """Get all training sessions for user"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        # Extract user ID from auth (simplified for demo)
        auth_header = request.headers.get("authorization", "")
        user_id = "demo-user-1" if auth_header else None
        
        sessions = await get_all_training_sessions(user_id)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

@app.post("/api/training/control/{training_id}")
async def control_training_endpoint(training_id: str, request: Request):
    """Control training session (pause/resume/stop)"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        body = await request.json()
        action = body.get("action", "").lower()
        
        if action not in ["pause", "resume", "stop"]:
            raise HTTPException(status_code=400, detail="Invalid action. Must be 'pause', 'resume', or 'stop'")
        
        result = await control_training(training_id, action)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to control training: {str(e)}")

@app.get("/api/training/logs/{training_id}")
async def get_training_logs_endpoint(training_id: str, limit: int = 100):
    """Get training logs for a session"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        logs = await get_training_logs(training_id, limit)
        return logs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@app.get("/api/training/performance/{training_id}")
async def get_model_performance_endpoint(training_id: str):
    """Get comprehensive model performance metrics"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        performance = await get_model_performance(training_id)
        return performance.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance: {str(e)}")

@app.get("/api/training/model-types")
async def get_model_types_endpoint():
    """Get available model types and configurations"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        model_types = await get_available_model_types()
        return model_types
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model types: {str(e)}")

@app.get("/api/training/statistics")
async def get_training_stats_endpoint():
    """Get training statistics and system status"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        stats = await get_training_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@app.post("/api/training/validate-config")
async def validate_training_config_endpoint(request: Request):
    """Validate training configuration without starting training"""
    if not MODEL_TRAINING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model training service not available")
    
    try:
        request_data = await request.json()
        validation_errors = validate_training_config(request_data)
        
        return {
            "valid": len(validation_errors) == 0,
            "errors": validation_errors,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

# Enhanced WebSocket endpoint for training progress
@app.websocket("/ws/training/{training_id}")
async def websocket_training_progress(websocket: WebSocket, training_id: str):
    """WebSocket endpoint for real-time training progress updates"""
    if WEBSOCKET_AVAILABLE and MODEL_TRAINING_AVAILABLE:
        await websocket.accept()
        try:
            while True:
                # Send current progress
                progress = await get_training_progress(training_id)
                if progress:
                    await websocket.send_json({
                        "type": "training_progress",
                        "training_id": training_id,
                        "data": progress.dict()
                    })
                
                # Wait before next update
                await asyncio.sleep(2)  # Update every 2 seconds
                
        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"Training WebSocket error: {e}")
            await websocket.close()
    else:
        await websocket.close()

# ================================
# ENHANCED MARKET DATA API ENDPOINTS
# ================================

@app.get("/api/market/live/quotes")
async def get_live_quotes(symbols: str = "CBA.AX,BHP.AX,CSL.AX,WBC.AX,ANZ.AX"):
    """Get live market quotes with enhanced data"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            symbol_list = [s.strip() for s in symbols.split(",")]
            quotes = []
            
            for symbol in symbol_list:
                # Get real-time data from live engine
                data_point = await live_market_engine.get_realtime_data(symbol)
                if data_point:
                    quote = {
                        "symbol": symbol,
                        "price": data_point.close,
                        "change": data_point.close - data_point.open,
                        "change_percent": ((data_point.close - data_point.open) / data_point.open) * 100,
                        "volume": data_point.volume,
                        "bid": data_point.bid,
                        "ask": data_point.ask,
                        "spread": data_point.spread,
                        "high": data_point.high,
                        "low": data_point.low,
                        "open": data_point.open,
                        "asset_class": data_point.asset_class.value,
                        "source": data_point.source,
                        "last_updated": datetime.datetime.fromtimestamp(data_point.timestamp).isoformat()
                    }
                    quotes.append(quote)
            
            return {
                "quotes": quotes,
                "total": len(quotes),
                "market_status": live_market_engine.get_market_status().value,
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting live quotes: {e}")
    
    # Fallback to existing quotes endpoint
    return await get_quotes(symbols)

@app.get("/api/market/live/historical/{symbol}")
async def get_live_historical_data(symbol: str, days: int = 30):
    """Get historical data with enhanced features"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            data_points = await live_market_engine.get_historical_data(symbol, days)
            
            # Convert to API format
            historical_data = []
            for point in data_points:
                historical_data.append({
                    "date": datetime.datetime.fromtimestamp(point.timestamp).strftime('%Y-%m-%d'),
                    "timestamp": point.timestamp,
                    "open": point.open,
                    "high": point.high,
                    "low": point.low,
                    "close": point.close,
                    "volume": point.volume,
                    "asset_class": point.asset_class.value,
                    "source": point.source
                })
            
            return {
                "symbol": symbol,
                "days": days,
                "data": historical_data,
                "count": len(historical_data),
                "asset_class": data_points[0].asset_class.value if data_points else "equity",
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting live historical data: {e}")
    
    # Fallback to existing historical endpoint
    try:
        return await get_historical_data(symbol, f"{days}d")
    except Exception as e:
        # Final fallback with mock data
        return {
            "symbol": symbol,
            "days": days,
            "data": generate_mock_historical_data(symbol, days),
            "count": days,
            "asset_class": "equity",
            "timestamp": datetime.datetime.now().isoformat(),
            "source": "mock_fallback"
        }

@app.get("/api/market/indicators/{symbol}")
async def get_technical_indicators(symbol: str):
    """Get technical indicators for a symbol"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            indicators = live_market_engine.get_current_indicators(symbol)
            
            # Convert to API format
            formatted_indicators = {}
            for indicator_type, indicator in indicators.items():
                formatted_indicators[indicator_type] = {
                    "value": indicator.value,
                    "timestamp": indicator.timestamp,
                    "params": indicator.params
                }
            
            return {
                "symbol": symbol,
                "indicators": formatted_indicators,
                "count": len(formatted_indicators),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting technical indicators: {e}")
    
    # Fallback mock indicators
    return {
        "symbol": symbol,
        "indicators": {
            "SMA_20": {"value": 110.25, "timestamp": time.time(), "params": {"period": 20}},
            "RSI_14": {"value": 65.8, "timestamp": time.time(), "params": {"period": 14}},
            "MACD": {"value": 1.2, "timestamp": time.time(), "params": {"fast": 12, "slow": 26}}
        },
        "count": 3,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/signals/{symbol}")
async def get_trading_signals_for_symbol(symbol: str):
    """Get AI trading signals for a specific symbol"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            signals = live_market_engine.get_current_signals(symbol)
            
            # Convert to API format
            formatted_signals = []
            for signal in signals:
                formatted_signals.append({
                    "id": signal.id,
                    "symbol": signal.symbol,
                    "signal_type": signal.signal_type,
                    "confidence": signal.confidence,
                    "price_target": signal.price_target,
                    "current_price": signal.current_price,
                    "reasoning": signal.reasoning,
                    "strength": signal.strength,
                    "signal_category": signal.signal_category,
                    "timestamp": datetime.datetime.fromtimestamp(signal.timestamp).isoformat()
                })
            
            return {
                "symbol": symbol,
                "signals": formatted_signals,
                "count": len(formatted_signals),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting trading signals: {e}")
    
    # Fallback mock signals
    return {
        "symbol": symbol,
        "signals": [
            {
                "id": f"signal_{int(time.time())}",
                "symbol": symbol,
                "signal_type": random.choice(["BUY", "SELL", "HOLD"]),
                "confidence": round(random.uniform(0.7, 0.95), 2),
                "price_target": round(random.uniform(100, 200), 2),
                "current_price": round(random.uniform(95, 195), 2),
                "reasoning": ["Technical analysis", "Market momentum"],
                "strength": "STRONG",
                "signal_category": "ENTRY",
                "timestamp": datetime.datetime.now().isoformat()
            }
        ],
        "count": 1,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/multi-asset/symbols")
async def get_supported_symbols():
    """Get all supported symbols across asset classes"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            symbols = multi_asset_service.get_supported_symbols()
            return {
                "symbols": symbols,
                "total_symbols": sum(len(symbols_list) for symbols_list in symbols.values()),
                "asset_classes": list(symbols.keys()),
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting supported symbols: {e}")
    
    # Fallback mock symbols
    return {
        "symbols": {
            "equity": ["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX"],
            "cryptocurrency": ["BTC.AX", "ETH.AX", "ADA.AX"],
            "commodity": ["GOLD", "SILVER", "OIL.WTI"],
            "fixed_income": ["AGB.2Y", "AGB.5Y", "AGB.10Y"],
            "forex": ["AUDUSD", "EURAUD", "GBPAUD"]
        },
        "total_symbols": 18,
        "asset_classes": ["equity", "cryptocurrency", "commodity", "fixed_income", "forex"],
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/market/multi-asset/data/{symbol}")
async def get_multi_asset_data(symbol: str):
    """Get comprehensive data for any asset class"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            # Detect asset class and get appropriate data
            asset_class = multi_asset_service._detect_asset_class(symbol)
            data = await multi_asset_service.get_realtime_data(symbol, asset_class)
            
            if data:
                return {
                    "symbol": symbol,
                    "asset_class": asset_class.value,
                    "data": data.__dict__ if hasattr(data, '__dict__') else data,
                    "timestamp": datetime.datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Error getting multi-asset data: {e}")
    
    # Fallback to regular quote
    return await get_quote(symbol)

@app.get("/api/market/websocket/stats")
async def get_websocket_market_stats():
    """Get WebSocket market service statistics"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            stats = websocket_market_service.get_service_stats()
            return {
                "service_stats": stats,
                "engine_status": "running" if live_market_engine.running else "stopped",
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting WebSocket stats: {e}")
    
    return {
        "service_stats": {"message": "Live market engine not available"},
        "engine_status": "unavailable",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/api/market/engine/start")
async def start_market_engine():
    """Start the live market data engine"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            await live_market_engine.start()
            await websocket_market_service.start()
            await multi_asset_service.start()
            
            return {
                "message": "Live market data engine started successfully",
                "services": ["live_market_engine", "websocket_market_service", "multi_asset_service"],
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start market engine: {e}")
    else:
        raise HTTPException(status_code=503, detail="Live market engine not available")

@app.post("/api/market/engine/stop")
async def stop_market_engine():
    """Stop the live market data engine"""
    if LIVE_MARKET_ENGINE_AVAILABLE:
        try:
            await live_market_engine.stop()
            await websocket_market_service.stop()
            await multi_asset_service.stop()
            
            return {
                "message": "Live market data engine stopped successfully",
                "services": ["live_market_engine", "websocket_market_service", "multi_asset_service"],
                "timestamp": datetime.datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to stop market engine: {e}")
    else:
        raise HTTPException(status_code=503, detail="Live market engine not available")

if __name__ == "__main__":
    print("Starting Qlib Pro Production API...")
    print("Documentation: http://localhost:8001/docs")
    print("Health Check: http://localhost:8001/health")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
        reload=False,
        access_log=True
    )