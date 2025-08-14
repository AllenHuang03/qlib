"""
Customer Service Module - Public-Facing API
Provides simplified, user-friendly interfaces without exposing trading algorithms
"""
from fastapi import FastAPI, HTTPException, Request, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import logging

# Import KYC service
from kyc_service import (
    kyc_service, CustomerProfile, KYCApplication, 
    DocumentType, VerificationStatus, RiskLevel
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Qlib Pro Customer Service",
    description="Customer-facing API for portfolio management and AI insights",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Portfolio(BaseModel):
    id: str
    user_id: str
    cash_balance: float
    total_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    day_change: float
    day_change_percent: float

class Holding(BaseModel):
    symbol: str
    name: str
    quantity: int
    average_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    weight: float

class AIInsight(BaseModel):
    date: str
    market_summary: str
    key_opportunities: List[str]
    risk_alerts: List[str]
    recommended_actions: List[str]

class TradeHistory(BaseModel):
    id: str
    date: str
    symbol: str
    action: str  # "BUY" or "SELL"
    quantity: int
    price: float
    total_value: float
    reason: str  # Plain language explanation

class Simulation(BaseModel):
    id: str
    name: str
    start_date: str
    end_date: str
    initial_capital: float
    current_value: float
    total_return: float
    sharpe_ratio: float
    max_drawdown: float

# Helper function to get user ID from headers
def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    if not x_user_id:
        return "demo-user-1"  # Fallback for development
    return x_user_id

# Portfolio endpoints
@app.get("/api/customer/portfolio", response_model=Portfolio)
async def get_portfolio(user_id: str = get_user_id):
    """Get user's portfolio summary"""
    # Mock portfolio data - in production, fetch from User DB
    return Portfolio(
        id=f"portfolio-{user_id}",
        user_id=user_id,
        cash_balance=25780.50,
        total_value=542340.75,
        unrealized_pnl=22340.75,
        unrealized_pnl_percent=4.3,
        day_change=1250.25,
        day_change_percent=0.23
    )

@app.get("/api/customer/portfolio/holdings", response_model=List[Holding])
async def get_holdings(user_id: str = get_user_id):
    """Get portfolio holdings"""
    # Mock holdings - in production, fetch from User DB
    return [
        Holding(
            symbol="CBA.AX",
            name="Commonwealth Bank",
            quantity=850,
            average_price=108.20,
            current_price=110.50,
            market_value=93925.00,
            unrealized_pnl=1955.00,
            unrealized_pnl_percent=2.13,
            weight=17.4
        ),
        Holding(
            symbol="BHP.AX",
            name="BHP Group",
            quantity=2200,
            average_price=44.80,
            current_price=45.20,
            market_value=99440.00,
            unrealized_pnl=880.00,
            unrealized_pnl_percent=0.89,
            weight=18.3
        ),
        Holding(
            symbol="CSL.AX",
            name="CSL Limited",
            quantity=320,
            average_price=289.50,
            current_price=295.20,
            market_value=94464.00,
            unrealized_pnl=1824.00,
            unrealized_pnl_percent=1.97,
            weight=17.4
        )
    ]

# AI Insights endpoints
@app.get("/api/customer/insights/today", response_model=AIInsight)
async def get_daily_insights(user_id: str = get_user_id):
    """Get today's AI insights in plain language"""
    return AIInsight(
        date=datetime.now().strftime("%Y-%m-%d"),
        market_summary=\"\"\"Australian markets showed resilience today with the ASX 200 gaining 0.8%. 
        Banking sector led gains on positive earnings outlook, while mining stocks benefited from stronger commodity prices.\"\"\",
        key_opportunities=[
            "Banks showing technical breakout patterns - CBA approaching resistance at $112",
            "Healthcare sector undervalued relative to global peers - CSL attractive at current levels",
            "Energy stocks gaining momentum on supply concerns - consider BHP for commodity exposure"
        ],
        risk_alerts=[
            "Rising bond yields may pressure high-dividend stocks",
            "USD strength could impact commodity exporters",
            "Monitor RBA policy meeting next week for rate guidance"
        ],
        recommended_actions=[
            "Consider taking partial profits on CBA near $112 resistance",
            "Maintain healthcare positions - defensive characteristics remain attractive",
            "Review portfolio allocation - slight overweight to financials detected"
        ]
    )

@app.get("/api/customer/insights/weekly", response_model=List[AIInsight])
async def get_weekly_insights(user_id: str = get_user_id):
    """Get this week's AI insights"""
    insights = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        insights.append(AIInsight(
            date=date,
            market_summary=f"Market summary for {date}: Mixed trading with sector rotation continuing.",
            key_opportunities=[
                f"Opportunity {i+1}: Technical patterns emerging in {random.choice(['tech', 'healthcare', 'mining'])} sector",
                f"Opportunity {i+2}: Value play identified in {random.choice(['banks', 'retail', 'utilities'])}"
            ],
            risk_alerts=[
                f"Risk alert {i+1}: Monitor volatility in {random.choice(['commodity', 'currency', 'bond'])} markets"
            ],
            recommended_actions=[
                f"Action {i+1}: Review {random.choice(['sector', 'position', 'risk'])} allocation"
            ]
        ))
    return insights

# Trade History endpoints
@app.get("/api/customer/history/trades", response_model=List[TradeHistory])
async def get_trade_history(user_id: str = get_user_id, limit: int = 50):
    """Get simplified trade history"""
    trades = []
    for i in range(min(limit, 20)):  # Limit for demo
        date = (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d")
        symbol = random.choice(["CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "TLS.AX"])
        action = random.choice(["BUY", "SELL"])
        quantity = random.randint(10, 500)
        price = round(random.uniform(20, 300), 2)
        
        trades.append(TradeHistory(
            id=f"trade-{i+1}",
            date=date,
            symbol=symbol,
            action=action,
            quantity=quantity,
            price=price,
            total_value=quantity * price,
            reason=f"AI model identified {action.lower()} opportunity based on momentum and value factors"
        ))
    
    return sorted(trades, key=lambda x: x.date, reverse=True)

# Simulation endpoints
@app.get("/api/customer/simulate/strategies", response_model=List[Simulation])
async def get_simulations(user_id: str = get_user_id):
    """Get paper trading simulations"""
    return [
        Simulation(
            id="sim-1",
            name="Conservative Growth Strategy",
            start_date="2024-01-01",
            end_date="2024-12-31",
            initial_capital=100000.0,
            current_value=108450.0,
            total_return=8.45,
            sharpe_ratio=1.24,
            max_drawdown=-3.2
        ),
        Simulation(
            id="sim-2", 
            name="Momentum Strategy",
            start_date="2024-06-01",
            end_date="2024-12-31",
            initial_capital=50000.0,
            current_value=56780.0,
            total_return=13.56,
            sharpe_ratio=1.67,
            max_drawdown=-5.8
        )
    ]

@app.post("/api/customer/simulate/create")
async def create_simulation(request: Request, user_id: str = get_user_id):
    """Create new paper trading simulation"""
    data = await request.json()
    
    simulation_id = f"sim-{random.randint(1000, 9999)}"
    return {
        "id": simulation_id,
        "message": "Simulation created successfully",
        "name": data.get("name", "New Simulation"),
        "initial_capital": data.get("initial_capital", 10000),
        "strategy": data.get("strategy", "balanced"),
        "status": "active"
    }

# Notifications endpoints
@app.get("/api/customer/notifications")
async def get_notifications(user_id: str = get_user_id):
    """Get user notifications"""
    return [
        {
            "id": "notif-1",
            "type": "trade_executed",
            "title": "Trade Executed: CBA.AX",
            "message": "Bought 100 shares of CBA.AX at $110.25",
            "timestamp": datetime.now().isoformat(),
            "read": False
        },
        {
            "id": "notif-2",
            "type": "market_alert",
            "title": "Market Alert",
            "message": "Banking sector showing strong momentum - review positions",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "read": False
        },
        {
            "id": "notif-3",
            "type": "performance",
            "title": "Monthly Performance Report",
            "message": "Your portfolio outperformed benchmark by 1.2% this month",
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
            "read": True
        }
    ]

# KYC/AML Customer Onboarding Endpoints (Independent Reserve Style)
@app.post("/api/customer/kyc/initiate", response_model=KYCApplication)
async def initiate_kyc(customer_data: CustomerProfile):
    """Initiate comprehensive KYC/AML verification process"""
    try:
        application = await kyc_service.initiate_kyc_application(customer_data)
        return application
    except Exception as e:
        logger.error(f"KYC initiation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate KYC process")

@app.post("/api/customer/kyc/verify-email")
async def verify_email(request: Request):
    """Verify email address with 6-digit code"""
    data = await request.json()
    app_id = data.get("application_id")
    code = data.get("verification_code")
    
    try:
        success = await kyc_service.verify_email(app_id, code)
        return {
            "verified": success,
            "message": "Email verified successfully" if success else "Invalid verification code",
            "next_step": "phone_verification" if success else None
        }
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/customer/kyc/verify-phone")
async def verify_phone(request: Request):
    """Verify phone number with SMS code"""
    data = await request.json()
    app_id = data.get("application_id")
    code = data.get("verification_code")
    
    try:
        success = await kyc_service.verify_phone(app_id, code)
        return {
            "verified": success,
            "message": "Phone verified successfully" if success else "Invalid SMS code",
            "next_step": "document_upload" if success else None
        }
    except Exception as e:
        logger.error(f"Phone verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/customer/kyc/setup-2fa")
async def setup_two_factor(request: Request):
    """Generate Google Authenticator QR code"""
    data = await request.json()
    app_id = data.get("application_id")
    
    try:
        tfa_setup = await kyc_service.setup_two_factor_auth(app_id)
        return {
            **tfa_setup,
            "message": "Scan QR code with Google Authenticator app",
            "app_store_links": {
                "ios": "https://apps.apple.com/app/google-authenticator/id388497605",
                "android": "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
            }
        }
    except Exception as e:
        logger.error(f"2FA setup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/customer/kyc/verify-2fa")
async def verify_two_factor(request: Request):
    """Verify Google Authenticator 6-digit code"""
    data = await request.json()
    app_id = data.get("application_id")
    totp_code = data.get("totp_code")
    
    try:
        success = await kyc_service.verify_two_factor_code(app_id, totp_code)
        return {
            "verified": success,
            "message": "Two-factor authentication enabled" if success else "Invalid authenticator code",
            "next_step": "facial_recognition" if success else None
        }
    except Exception as e:
        logger.error(f"2FA verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/customer/kyc/upload-document")
async def upload_identity_document(
    application_id: str = Form(...),
    document_type: str = Form(...),
    document_file: UploadFile = File(...)
):
    """Upload identity document for OCR verification"""
    try:
        doc_type = DocumentType(document_type)
        verification = await kyc_service.verify_document(application_id, document_file, doc_type)
        
        return {
            "document_type": doc_type,
            "confidence_score": verification.confidence_score,
            "verification_status": verification.verification_status,
            "extracted_data": verification.extracted_data,
            "message": f"Document processed with {verification.confidence_score:.1%} confidence",
            "next_step": "facial_recognition" if verification.verification_status == VerificationStatus.APPROVED else "manual_review"
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document type")
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail="Document processing failed")

@app.post("/api/customer/kyc/facial-verification")
async def facial_verification(
    application_id: str = Form(...),
    selfie_file: UploadFile = File(...)
):
    """Perform facial recognition and liveness detection"""
    try:
        verification = await kyc_service.verify_facial_recognition(application_id, selfie_file)
        
        return {
            "face_match_confidence": verification.face_match_confidence,
            "liveness_score": verification.liveness_score,
            "verification_status": verification.verification_status,
            "message": f"Face verification: {verification.face_match_confidence:.1%} match, {verification.liveness_score:.1%} liveness",
            "instructions": [
                "Look directly at camera",
                "Ensure good lighting",
                "Remove sunglasses/hat",
                "Follow on-screen prompts"
            ] if verification.verification_status != VerificationStatus.APPROVED else [],
            "next_step": "aml_screening" if verification.verification_status == VerificationStatus.APPROVED else "retry_selfie"
        }
    except Exception as e:
        logger.error(f"Facial verification error: {e}")
        raise HTTPException(status_code=500, detail="Facial verification failed")

@app.post("/api/customer/kyc/aml-screening")
async def aml_screening(request: Request):
    """Perform AML/CTF compliance screening"""
    data = await request.json()
    app_id = data.get("application_id")
    
    try:
        screening_results = await kyc_service.perform_aml_screening(app_id)
        
        return {
            **screening_results,
            "message": "AML screening completed",
            "compliance_status": "CLEAR" if not any([
                screening_results["pep_check"],
                screening_results["sanctions_check"], 
                screening_results["adverse_media"]
            ]) else "REQUIRES_REVIEW",
            "next_step": "finalization"
        }
    except Exception as e:
        logger.error(f"AML screening error: {e}")
        raise HTTPException(status_code=500, detail="AML screening failed")

@app.post("/api/customer/kyc/finalize")
async def finalize_kyc(request: Request):
    """Finalize KYC application and determine approval"""
    data = await request.json()
    app_id = data.get("application_id")
    
    try:
        application = await kyc_service.finalize_application(app_id)
        
        status_messages = {
            VerificationStatus.APPROVED: "🎉 Congratulations! Your account has been approved for trading.",
            VerificationStatus.REQUIRES_MANUAL_REVIEW: "Your application is under review. We'll contact you within 24-48 hours.",
            VerificationStatus.REJECTED: "Unfortunately, we cannot approve your application at this time."
        }
        
        return {
            "application_id": app_id,
            "status": application.status,
            "risk_level": application.risk_level,
            "message": status_messages.get(application.status, "Application processed"),
            "trading_enabled": application.status == VerificationStatus.APPROVED,
            "compliance_notes": application.compliance_notes,
            "next_steps": [
                "Fund your account to start trading",
                "Complete investment profile questionnaire", 
                "Download mobile app for 2FA access"
            ] if application.status == VerificationStatus.APPROVED else []
        }
    except Exception as e:
        logger.error(f"KYC finalization error: {e}")
        raise HTTPException(status_code=500, detail="Application finalization failed")

@app.get("/api/customer/kyc/status/{application_id}", response_model=KYCApplication)
async def get_kyc_status(application_id: str):
    """Get current KYC application status"""
    try:
        application = kyc_service.get_application_status(application_id)
        return application
    except Exception as e:
        raise HTTPException(status_code=404, detail="Application not found")

@app.get("/api/customer/kyc/requirements")
async def get_kyc_requirements():
    """Get KYC requirements and acceptable documents"""
    return {
        "required_documents": {
            "primary_id": [
                {
                    "type": "Australian Driver's License",
                    "description": "Current Australian driver's license (front and back)",
                    "acceptable_formats": ["JPG", "PNG", "PDF"],
                    "max_size_mb": 10
                },
                {
                    "type": "Australian Passport", 
                    "description": "Australian passport photo page",
                    "acceptable_formats": ["JPG", "PNG", "PDF"],
                    "max_size_mb": 10
                },
                {
                    "type": "Medicare Card",
                    "description": "Australian Medicare card",
                    "acceptable_formats": ["JPG", "PNG", "PDF"], 
                    "max_size_mb": 10
                }
            ],
            "proof_of_address": [
                {
                    "type": "Utility Bill",
                    "description": "Recent utility bill (gas, electricity, water) - within 90 days",
                    "acceptable_formats": ["JPG", "PNG", "PDF"],
                    "max_size_mb": 10
                },
                {
                    "type": "Bank Statement", 
                    "description": "Bank statement - within 90 days",
                    "acceptable_formats": ["JPG", "PNG", "PDF"],
                    "max_size_mb": 10
                }
            ]
        },
        "verification_steps": [
            {
                "step": 1,
                "name": "Personal Details",
                "description": "Provide legal name, date of birth, address",
                "estimated_time": "2 minutes"
            },
            {
                "step": 2,
                "name": "Email Verification", 
                "description": "Verify email with 6-digit code",
                "estimated_time": "1 minute"
            },
            {
                "step": 3,
                "name": "Phone Verification",
                "description": "Verify mobile number with SMS code", 
                "estimated_time": "1 minute"
            },
            {
                "step": 4,
                "name": "Document Upload",
                "description": "Upload government-issued photo ID",
                "estimated_time": "3 minutes"
            },
            {
                "step": 5,
                "name": "Facial Recognition",
                "description": "Take selfie for identity verification",
                "estimated_time": "2 minutes" 
            },
            {
                "step": 6,
                "name": "Two-Factor Authentication",
                "description": "Set up Google Authenticator",
                "estimated_time": "2 minutes"
            },
            {
                "step": 7,
                "name": "AML Screening",
                "description": "Automated compliance screening",
                "estimated_time": "1 minute"
            }
        ],
        "total_estimated_time": "12-15 minutes",
        "approval_timeframe": "Usually instant, up to 48 hours for manual review",
        "compliance_note": "We comply with Australian AML/CTF regulations and AUSTRAC requirements"
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "customer-service",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
async def root():
    return {
        "service": "Qlib Pro Customer Service",
        "version": "1.0.0",
        "status": "operational",
        "kyc_enabled": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081, reload=True)