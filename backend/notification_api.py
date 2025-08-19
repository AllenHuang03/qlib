#!/usr/bin/env python3
"""
NOTIFICATION API ENDPOINTS
RESTful API for managing notifications and user preferences
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import logging

# Import the notification service
try:
    from notification_service import (
        notification_service, NotificationType, NotificationPriority, 
        DeliveryMethod, NotificationPreferences, NotificationMessage,
        NotificationStatus
    )
    NOTIFICATION_SERVICE_AVAILABLE = True
except ImportError:
    NOTIFICATION_SERVICE_AVAILABLE = False
    logging.error("Notification service not available")

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# ================================
# REQUEST/RESPONSE MODELS
# ================================

class NotificationPreferencesRequest(BaseModel):
    email_enabled: Optional[bool] = True
    sms_enabled: Optional[bool] = True
    trading_signals_email: Optional[bool] = True
    trading_signals_sms: Optional[bool] = False
    portfolio_reports_email: Optional[bool] = True
    portfolio_reports_frequency: Optional[str] = Field(default="weekly", regex="^(daily|weekly|monthly)$")
    security_alerts_email: Optional[bool] = True
    security_alerts_sms: Optional[bool] = True
    marketing_emails: Optional[bool] = False
    system_notifications: Optional[bool] = True
    quiet_hours_start: Optional[str] = Field(default="22:00", regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(default="07:00", regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: Optional[str] = Field(default="Australia/Sydney")

class NotificationPreferencesResponse(BaseModel):
    user_id: str
    email_enabled: bool
    sms_enabled: bool
    trading_signals_email: bool
    trading_signals_sms: bool
    portfolio_reports_email: bool
    portfolio_reports_frequency: str
    security_alerts_email: bool
    security_alerts_sms: bool
    marketing_emails: bool
    system_notifications: bool
    quiet_hours_start: str
    quiet_hours_end: str
    timezone: str
    unsubscribe_token: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]

class SendNotificationRequest(BaseModel):
    user_id: str
    notification_type: str
    template_data: Dict[str, Any]
    priority: Optional[str] = "medium"
    scheduled_at: Optional[str] = None
    
    @validator('notification_type')
    def validate_notification_type(cls, v):
        valid_types = [t.value for t in NotificationType]
        if v not in valid_types:
            raise ValueError(f"Invalid notification type. Must be one of: {valid_types}")
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v:
            valid_priorities = [p.value for p in NotificationPriority]
            if v not in valid_priorities:
                raise ValueError(f"Invalid priority. Must be one of: {valid_priorities}")
        return v

class WelcomeEmailRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr

class KYCStatusRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    status: str = Field(..., regex="^(submitted|approved|rejected|manual_review)$")
    verification_date: Optional[str] = None

class DepositConfirmationRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    amount: float = Field(..., gt=0)
    currency: str = Field(default="AUD", regex="^(AUD|USD)$")
    transaction_id: str
    new_balance: float = Field(..., ge=0)

class TradingSignalRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    user_phone: Optional[str] = None
    symbol: str
    signal: str = Field(..., regex="^(BUY|SELL|HOLD)$")
    confidence: float = Field(..., ge=0, le=100)
    current_price: float = Field(..., gt=0)
    target_price: float = Field(..., gt=0)
    reasoning: str

class SecurityAlertRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    user_phone: Optional[str] = None
    alert_type: str
    ip_address: str
    location: str

class PortfolioReportRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: EmailStr
    period: str = Field(..., regex="^(daily|weekly|monthly)$")
    total_return: float
    total_return_percent: float
    best_performer: str
    worst_performer: str

class NotificationHistoryResponse(BaseModel):
    message_id: str
    notification_type: str
    delivery_method: str
    status: str
    recipient_email: Optional[str]
    recipient_phone: Optional[str]
    subject: Optional[str]
    sent_at: Optional[str]
    created_at: str

class DeliveryStatsResponse(BaseModel):
    total_messages: int
    sent: int
    delivered: int
    failed: int
    bounced: int
    success_rate: float
    by_type: Dict[str, int]
    by_method: Dict[str, int]

# ================================
# DEPENDENCY INJECTION
# ================================

def get_notification_service():
    """Dependency to get notification service"""
    if not NOTIFICATION_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Notification service unavailable")
    return notification_service

async def get_current_user(user_id: str = Query(..., description="User ID")) -> str:
    """Get current user ID (simplified for this implementation)"""
    return user_id

# ================================
# NOTIFICATION PREFERENCE ENDPOINTS
# ================================

@router.get("/preferences/{user_id}", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    user_id: str,
    service = Depends(get_notification_service)
):
    """Get user notification preferences"""
    try:
        preferences = await service.get_user_preferences(user_id)
        
        if not preferences:
            # Return default preferences
            return NotificationPreferencesResponse(
                user_id=user_id,
                email_enabled=True,
                sms_enabled=True,
                trading_signals_email=True,
                trading_signals_sms=False,
                portfolio_reports_email=True,
                portfolio_reports_frequency="weekly",
                security_alerts_email=True,
                security_alerts_sms=True,
                marketing_emails=False,
                system_notifications=True,
                quiet_hours_start="22:00",
                quiet_hours_end="07:00",
                timezone="Australia/Sydney",
                unsubscribe_token=None,
                created_at=None,
                updated_at=None
            )
        
        return NotificationPreferencesResponse(
            user_id=preferences.user_id,
            email_enabled=preferences.email_enabled,
            sms_enabled=preferences.sms_enabled,
            trading_signals_email=preferences.trading_signals_email,
            trading_signals_sms=preferences.trading_signals_sms,
            portfolio_reports_email=preferences.portfolio_reports_email,
            portfolio_reports_frequency=preferences.portfolio_reports_frequency,
            security_alerts_email=preferences.security_alerts_email,
            security_alerts_sms=preferences.security_alerts_sms,
            marketing_emails=preferences.marketing_emails,
            system_notifications=preferences.system_notifications,
            quiet_hours_start=preferences.quiet_hours_start,
            quiet_hours_end=preferences.quiet_hours_end,
            timezone=preferences.timezone,
            unsubscribe_token=preferences.unsubscribe_token,
            created_at=preferences.created_at,
            updated_at=preferences.updated_at
        )
    
    except Exception as e:
        logger.error(f"Error getting preferences for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification preferences")

@router.put("/preferences/{user_id}", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    user_id: str,
    preferences: NotificationPreferencesRequest,
    service = Depends(get_notification_service)
):
    """Update user notification preferences"""
    try:
        # Convert request to dictionary, excluding None values
        prefs_dict = {k: v for k, v in preferences.dict().items() if v is not None}
        
        updated_prefs = await service.update_user_preferences(user_id, prefs_dict)
        
        return NotificationPreferencesResponse(
            user_id=updated_prefs.user_id,
            email_enabled=updated_prefs.email_enabled,
            sms_enabled=updated_prefs.sms_enabled,
            trading_signals_email=updated_prefs.trading_signals_email,
            trading_signals_sms=updated_prefs.trading_signals_sms,
            portfolio_reports_email=updated_prefs.portfolio_reports_email,
            portfolio_reports_frequency=updated_prefs.portfolio_reports_frequency,
            security_alerts_email=updated_prefs.security_alerts_email,
            security_alerts_sms=updated_prefs.security_alerts_sms,
            marketing_emails=updated_prefs.marketing_emails,
            system_notifications=updated_prefs.system_notifications,
            quiet_hours_start=updated_prefs.quiet_hours_start,
            quiet_hours_end=updated_prefs.quiet_hours_end,
            timezone=updated_prefs.timezone,
            unsubscribe_token=updated_prefs.unsubscribe_token,
            created_at=updated_prefs.created_at,
            updated_at=updated_prefs.updated_at
        )
    
    except Exception as e:
        logger.error(f"Error updating preferences for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")

@router.post("/unsubscribe")
async def unsubscribe_user(
    token: str = Query(..., description="Unsubscribe token"),
    service = Depends(get_notification_service)
):
    """Unsubscribe user using token"""
    try:
        success = await service.unsubscribe_user(token)
        
        if success:
            return {"message": "Successfully unsubscribed from email notifications"}
        else:
            raise HTTPException(status_code=404, detail="Invalid unsubscribe token")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing user with token {token[:8]}...: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe")

# ================================
# NOTIFICATION SENDING ENDPOINTS
# ================================

@router.post("/send")
async def send_notification(
    request: SendNotificationRequest,
    service = Depends(get_notification_service)
):
    """Send a generic notification"""
    try:
        # Convert string enums to enum types
        notification_type = NotificationType(request.notification_type)
        priority = NotificationPriority(request.priority) if request.priority else NotificationPriority.MEDIUM
        
        # Parse scheduled time if provided
        scheduled_at = None
        if request.scheduled_at:
            try:
                scheduled_at = datetime.fromisoformat(request.scheduled_at.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid scheduled_at format. Use ISO format.")
        
        message_id = await service.send_notification(
            user_id=request.user_id,
            notification_type=notification_type,
            template_data=request.template_data,
            priority=priority,
            scheduled_at=scheduled_at
        )
        
        if message_id:
            return {"message": "Notification queued successfully", "message_id": message_id}
        else:
            return {"message": "Notification not sent due to user preferences"}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send notification")

@router.post("/welcome-email")
async def send_welcome_email(
    request: WelcomeEmailRequest,
    service = Depends(get_notification_service)
):
    """Send welcome email to new user"""
    try:
        message_id = await service.send_welcome_email(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email
        )
        
        if message_id:
            return {"message": "Welcome email queued successfully", "message_id": message_id}
        else:
            return {"message": "Welcome email not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending welcome email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send welcome email")

@router.post("/kyc-status")
async def send_kyc_status_update(
    request: KYCStatusRequest,
    service = Depends(get_notification_service)
):
    """Send KYC status update notification"""
    try:
        message_id = await service.send_kyc_status_update(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email,
            status=request.status,
            verification_date=request.verification_date
        )
        
        if message_id:
            return {"message": "KYC status notification queued successfully", "message_id": message_id}
        else:
            return {"message": "KYC status notification not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending KYC status notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send KYC status notification")

@router.post("/deposit-confirmation")
async def send_deposit_confirmation(
    request: DepositConfirmationRequest,
    service = Depends(get_notification_service)
):
    """Send deposit confirmation notification"""
    try:
        message_id = await service.send_deposit_confirmation(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email,
            amount=request.amount,
            currency=request.currency,
            transaction_id=request.transaction_id,
            new_balance=request.new_balance
        )
        
        if message_id:
            return {"message": "Deposit confirmation queued successfully", "message_id": message_id}
        else:
            return {"message": "Deposit confirmation not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending deposit confirmation: {e}")
        raise HTTPException(status_code=500, detail="Failed to send deposit confirmation")

@router.post("/trading-signal")
async def send_trading_signal(
    request: TradingSignalRequest,
    service = Depends(get_notification_service)
):
    """Send trading signal notification"""
    try:
        message_id = await service.send_trading_signal(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email,
            symbol=request.symbol,
            signal=request.signal,
            confidence=request.confidence,
            current_price=request.current_price,
            target_price=request.target_price,
            reasoning=request.reasoning,
            user_phone=request.user_phone
        )
        
        if message_id:
            return {"message": "Trading signal queued successfully", "message_id": message_id}
        else:
            return {"message": "Trading signal not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending trading signal: {e}")
        raise HTTPException(status_code=500, detail="Failed to send trading signal")

@router.post("/security-alert")
async def send_security_alert(
    request: SecurityAlertRequest,
    service = Depends(get_notification_service)
):
    """Send security alert notification"""
    try:
        message_id = await service.send_security_alert(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email,
            alert_type=request.alert_type,
            ip_address=request.ip_address,
            location=request.location,
            user_phone=request.user_phone
        )
        
        if message_id:
            return {"message": "Security alert queued successfully", "message_id": message_id}
        else:
            return {"message": "Security alert not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending security alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to send security alert")

@router.post("/portfolio-report")
async def send_portfolio_report(
    request: PortfolioReportRequest,
    service = Depends(get_notification_service)
):
    """Send portfolio performance report"""
    try:
        message_id = await service.send_portfolio_report(
            user_id=request.user_id,
            user_name=request.user_name,
            user_email=request.user_email,
            period=request.period,
            total_return=request.total_return,
            total_return_percent=request.total_return_percent,
            best_performer=request.best_performer,
            worst_performer=request.worst_performer
        )
        
        if message_id:
            return {"message": "Portfolio report queued successfully", "message_id": message_id}
        else:
            return {"message": "Portfolio report not sent due to user preferences"}
    
    except Exception as e:
        logger.error(f"Error sending portfolio report: {e}")
        raise HTTPException(status_code=500, detail="Failed to send portfolio report")

# ================================
# NOTIFICATION HISTORY & MONITORING
# ================================

@router.get("/history/{user_id}", response_model=List[NotificationHistoryResponse])
async def get_notification_history(
    user_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return"),
    service = Depends(get_notification_service)
):
    """Get notification history for user"""
    try:
        history = await service.get_notification_history(user_id, limit)
        
        return [
            NotificationHistoryResponse(
                message_id=msg['message_id'],
                notification_type=msg['notification_type'],
                delivery_method=msg['delivery_method'],
                status=msg['status'],
                recipient_email=msg.get('recipient_email'),
                recipient_phone=msg.get('recipient_phone'),
                subject=msg.get('subject'),
                sent_at=msg.get('sent_at'),
                created_at=msg['created_at']
            )
            for msg in history
        ]
    
    except Exception as e:
        logger.error(f"Error getting notification history for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification history")

@router.get("/stats", response_model=DeliveryStatsResponse)
async def get_delivery_statistics(
    days: int = Query(7, ge=1, le=90, description="Number of days to include in statistics"),
    service = Depends(get_notification_service)
):
    """Get notification delivery statistics"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        end_date = datetime.utcnow()
        
        stats = await service.get_delivery_statistics(start_date, end_date)
        
        return DeliveryStatsResponse(
            total_messages=stats['total_messages'],
            sent=stats['sent'],
            delivered=stats['delivered'],
            failed=stats['failed'],
            bounced=stats['bounced'],
            success_rate=stats['success_rate'],
            by_type=stats['by_type'],
            by_method=stats['by_method']
        )
    
    except Exception as e:
        logger.error(f"Error getting delivery statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get delivery statistics")

@router.get("/message/{message_id}")
async def get_notification_message(
    message_id: str,
    service = Depends(get_notification_service)
):
    """Get specific notification message details"""
    try:
        message = service.notification_history.get(message_id)
        
        if not message:
            raise HTTPException(status_code=404, detail="Notification message not found")
        
        return {
            "message_id": message.message_id,
            "user_id": message.user_id,
            "notification_type": message.notification_type.value,
            "delivery_method": message.delivery_method.value,
            "priority": message.priority.value,
            "status": message.status.value,
            "recipient_email": message.recipient_email,
            "recipient_phone": message.recipient_phone,
            "subject": message.subject,
            "sent_at": message.sent_at,
            "delivered_at": message.delivered_at,
            "error_message": message.error_message,
            "provider_message_id": message.provider_message_id,
            "created_at": message.created_at
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message {message_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification message")

# ================================
# UTILITY ENDPOINTS
# ================================

@router.get("/types")
async def get_notification_types():
    """Get list of available notification types"""
    return {
        "notification_types": [
            {
                "value": t.value,
                "name": t.value.replace('_', ' ').title()
            }
            for t in NotificationType
        ]
    }

@router.get("/health")
async def health_check(service = Depends(get_notification_service)):
    """Health check endpoint"""
    try:
        # Test basic functionality
        stats = await service.get_delivery_statistics(
            start_date=datetime.utcnow() - timedelta(minutes=1),
            end_date=datetime.utcnow()
        )
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "email_provider": "available" if service.email_provider else "unavailable",
                "sms_provider": "available" if service.sms_provider.enabled else "unavailable",
                "template_engine": "available" if service.template_engine else "unavailable"
            },
            "recent_stats": stats
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

# ================================
# TEST ENDPOINTS (DEVELOPMENT ONLY)
# ================================

@router.post("/test/all")
async def test_all_notifications(
    service = Depends(get_notification_service)
):
    """Test all notification types with sample data (development only)"""
    try:
        test_user_id = "test_user_notifications"
        
        # Set up test user preferences
        await service.update_user_preferences(test_user_id, {
            'email_enabled': True,
            'sms_enabled': True,
            'trading_signals_email': True,
            'trading_signals_sms': True,
            'portfolio_reports_email': True,
            'security_alerts_email': True,
            'security_alerts_sms': True
        })
        
        results = []
        
        # Test welcome email
        msg_id = await service.send_welcome_email(
            user_id=test_user_id,
            user_name="Test User",
            user_email="test@example.com"
        )
        results.append({"type": "welcome", "message_id": msg_id})
        
        # Test deposit confirmation
        msg_id = await service.send_deposit_confirmation(
            user_id=test_user_id,
            user_name="Test User",
            user_email="test@example.com",
            amount=1000.00,
            currency="AUD",
            transaction_id="TEST_123",
            new_balance=5000.00
        )
        results.append({"type": "deposit_confirmation", "message_id": msg_id})
        
        # Test trading signal
        msg_id = await service.send_trading_signal(
            user_id=test_user_id,
            user_name="Test User",
            user_email="test@example.com",
            user_phone="+61412345678",
            symbol="CBA.AX",
            signal="BUY",
            confidence=88.5,
            current_price=95.20,
            target_price=102.00,
            reasoning="Technical analysis shows strong bullish momentum with support at $94."
        )
        results.append({"type": "trading_signal", "message_id": msg_id})
        
        # Test security alert
        msg_id = await service.send_security_alert(
            user_id=test_user_id,
            user_name="Test User",
            user_email="test@example.com",
            user_phone="+61412345678",
            alert_type="Login from new device",
            ip_address="203.219.45.123",
            location="Melbourne, VIC, Australia"
        )
        results.append({"type": "security_alert", "message_id": msg_id})
        
        # Test KYC approval
        msg_id = await service.send_kyc_status_update(
            user_id=test_user_id,
            user_name="Test User",
            user_email="test@example.com",
            status="approved"
        )
        results.append({"type": "kyc_approved", "message_id": msg_id})
        
        return {
            "message": "All test notifications sent successfully",
            "results": results,
            "user_id": test_user_id
        }
    
    except Exception as e:
        logger.error(f"Error running notification tests: {e}")
        raise HTTPException(status_code=500, detail="Failed to run notification tests")

# Export router for inclusion in main API
__all__ = ['router']