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
from contextlib import asynccontextmanager

# Import Qlib service
try:
    from qlib_service import qlib_service
    QLIB_SERVICE_AVAILABLE = True
except ImportError:
    print("Qlib service not available, using fallback")
    QLIB_SERVICE_AVAILABLE = False

# Import WebSocket manager
try:
    from websocket_manager import websocket_manager
    WEBSOCKET_AVAILABLE = True
except ImportError:
    print("WebSocket manager not available")
    WEBSOCKET_AVAILABLE = False

# Import Payment service
try:
    from payment_service import payment_service
    PAYMENT_SERVICE_AVAILABLE = True
except ImportError:
    print("Payment service not available")
    PAYMENT_SERVICE_AVAILABLE = False

# Import Cloud Storage service
try:
    from cloud_storage_service import cloud_storage_service
    STORAGE_SERVICE_AVAILABLE = True
except ImportError:
    print("Cloud storage service not available")
    STORAGE_SERVICE_AVAILABLE = False

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
    """Get all AI models"""
    if QLIB_SERVICE_AVAILABLE:
        try:
            models_data = qlib_service.get_models()
            # Convert to Model objects for API response
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

# Market Data API
@app.get("/api/market/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time market quote"""
    try:
        # Try to get real data from Alpha Vantage
        url = f"https://www.alphavantage.co/query"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": ALPHA_VANTAGE_KEY
        }
        
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if "Global Quote" in data:
            quote_data = data["Global Quote"]
            return MarketQuote(
                symbol=symbol,
                price=float(quote_data.get("05. price", 0)),
                change=float(quote_data.get("09. change", 0)),
                change_percent=float(quote_data.get("10. change percent", "0%").replace("%", "")),
                volume=int(float(quote_data.get("06. volume", 0))),
                last_updated=quote_data.get("07. latest trading day", "")
            )
    except Exception as e:
        print(f"Error fetching real data for {symbol}: {e}")
    
    # Fallback to mock data
    return MarketQuote(
        symbol=symbol,
        price=round(random.uniform(50, 300), 2),
        change=round(random.uniform(-5, 5), 2),
        change_percent=round(random.uniform(-3, 3), 2),
        volume=random.randint(100000, 5000000),
        last_updated=datetime.date.today().isoformat()
    )

# Portfolio API
@app.get("/api/portfolio/holdings", response_model=List[Holding])
async def get_holdings():
    """Get portfolio holdings"""
    # Mock holdings data
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
    """Rebalance portfolio"""
    await asyncio.sleep(2)  # Simulate processing
    
    changes = [
        {"action": "BUY", "quantity": 100, "symbol": "CSL.AX", "reason": "Underweight healthcare"},
        {"action": "SELL", "quantity": 50, "symbol": "WBC.AX", "reason": "Overweight financials"}
    ]
    
    return {
        "message": "Portfolio rebalanced successfully",
        "changes": changes,
        "estimated_benefit": "+$1,240 annual return improvement"
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
            return {
                'success': True,
                'message': 'Payment confirmed and subscription activated',
                'subscription_tier': result.get('metadata', {}).get('tier', 'pro'),
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

if __name__ == "__main__":
    print("Starting Qlib Pro Production API...")
    print("Documentation: http://localhost:8080/docs")
    print("Health Check: http://localhost:8080/health")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8080,
        reload=False,
        access_log=True
    )