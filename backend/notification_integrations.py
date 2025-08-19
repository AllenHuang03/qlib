#!/usr/bin/env python3
"""
NOTIFICATION SERVICE INTEGRATIONS
Integration hooks for connecting notification system with existing platform services
"""

import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

# Import existing services
try:
    from notification_service import notification_service, NotificationType, NotificationPriority
    NOTIFICATION_SERVICE_AVAILABLE = True
except ImportError:
    NOTIFICATION_SERVICE_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# KYC SERVICE INTEGRATION
# ================================

class KYCNotificationIntegration:
    """Integration between KYC service and notifications"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def on_kyc_application_submitted(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when KYC application is submitted"""
        if not self.service:
            return None
        
        try:
            # Set up user notification preferences with KYC defaults
            await self.service.update_user_preferences(user_data['user_id'], {
                'email_enabled': True,
                'security_alerts_email': True,
                'system_notifications': True
            })
            
            # Send KYC submission confirmation
            message_id = await self.service.send_kyc_status_update(
                user_id=user_data['user_id'],
                user_name=user_data.get('name', user_data.get('username', 'User')),
                user_email=user_data['email'],
                status='submitted'
            )
            
            logger.info(f"KYC submission notification sent for user {user_data['user_id']}: {message_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send KYC submission notification: {e}")
            return None
    
    async def on_kyc_status_changed(self, user_id: str, new_status: str, 
                                   user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when KYC status changes"""
        if not self.service:
            return None
        
        try:
            message_id = await self.service.send_kyc_status_update(
                user_id=user_id,
                user_name=user_data.get('name', user_data.get('username', 'User')),
                user_email=user_data['email'],
                status=new_status,
                verification_date=datetime.now().strftime('%d %B %Y') if new_status == 'approved' else None
            )
            
            logger.info(f"KYC status change notification sent for user {user_id}: {new_status}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send KYC status change notification: {e}")
            return None
    
    async def on_kyc_document_uploaded(self, user_id: str, document_type: str,
                                     user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when KYC document is uploaded"""
        if not self.service:
            return None
        
        try:
            # Send generic notification for document upload
            message_id = await self.service.send_notification(
                user_id=user_id,
                notification_type=NotificationType.KYC_SUBMITTED,
                template_data={
                    'user_name': user_data.get('name', 'User'),
                    'user_email': user_data['email'],
                    'document_type': document_type.replace('_', ' ').title(),
                    'status_url': 'https://qlibpro.com.au/kyc/status'
                },
                priority=NotificationPriority.MEDIUM
            )
            
            logger.info(f"Document upload notification sent for user {user_id}: {document_type}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send document upload notification: {e}")
            return None

# ================================
# PAYMENT SERVICE INTEGRATION
# ================================

class PaymentNotificationIntegration:
    """Integration between payment service and notifications"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def on_subscription_activated(self, user_id: str, subscription_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when subscription is activated"""
        if not self.service:
            return None
        
        try:
            # Enable all notifications for paying customers
            await self.service.update_user_preferences(user_id, {
                'email_enabled': True,
                'trading_signals_email': True,
                'portfolio_reports_email': True,
                'security_alerts_email': True,
                'system_notifications': True
            })
            
            message_id = await self.service.send_notification(
                user_id=user_id,
                notification_type=NotificationType.SUBSCRIPTION_ACTIVATED,
                template_data={
                    'user_name': subscription_data.get('user_name', 'User'),
                    'user_email': subscription_data.get('user_email', 'user@example.com'),
                    'subscription_tier': subscription_data.get('tier', 'Pro'),
                    'activation_date': datetime.now().strftime('%d %B %Y'),
                    'features': subscription_data.get('features', []),
                    'dashboard_url': 'https://qlibpro.com.au/dashboard'
                },
                priority=NotificationPriority.MEDIUM
            )
            
            logger.info(f"Subscription activation notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send subscription activation notification: {e}")
            return None
    
    async def on_payment_successful(self, user_id: str, payment_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when payment is successful"""
        if not self.service:
            return None
        
        try:
            # Send payment confirmation (similar to deposit confirmation)
            message_id = await self.service.send_notification(
                user_id=user_id,
                notification_type=NotificationType.DEPOSIT_CONFIRMATION,
                template_data={
                    'user_name': payment_data.get('user_name', 'User'),
                    'user_email': payment_data.get('user_email', 'user@example.com'),
                    'amount': f"{payment_data.get('amount', 0):,.2f}",
                    'currency': payment_data.get('currency', 'AUD'),
                    'transaction_id': payment_data.get('transaction_id', 'N/A'),
                    'new_balance': f"{payment_data.get('new_balance', 0):,.2f}",
                    'timestamp': datetime.now().strftime('%d %B %Y at %I:%M %p AEDT')
                },
                priority=NotificationPriority.MEDIUM
            )
            
            logger.info(f"Payment confirmation notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send payment confirmation notification: {e}")
            return None
    
    async def on_payment_failed(self, user_id: str, payment_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when payment fails"""
        if not self.service:
            return None
        
        try:
            message_id = await self.service.send_notification(
                user_id=user_id,
                notification_type=NotificationType.PAYMENT_FAILED,
                template_data={
                    'user_name': payment_data.get('user_name', 'User'),
                    'user_email': payment_data.get('user_email', 'user@example.com'),
                    'amount': f"{payment_data.get('amount', 0):,.2f}",
                    'currency': payment_data.get('currency', 'AUD'),
                    'error_message': payment_data.get('error_message', 'Payment processing failed'),
                    'retry_url': 'https://qlibpro.com.au/billing/retry',
                    'support_url': 'https://qlibpro.com.au/support'
                },
                priority=NotificationPriority.HIGH
            )
            
            logger.info(f"Payment failure notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send payment failure notification: {e}")
            return None

# ================================
# USER AUTHENTICATION INTEGRATION
# ================================

class AuthNotificationIntegration:
    """Integration with user authentication events"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def on_user_registration(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when user registers"""
        if not self.service:
            return None
        
        try:
            # Set up default notification preferences
            await self.service.update_user_preferences(user_data['user_id'], {
                'email_enabled': True,
                'sms_enabled': False,  # Start with email only
                'trading_signals_email': True,
                'trading_signals_sms': False,
                'portfolio_reports_email': True,
                'security_alerts_email': True,
                'security_alerts_sms': False,
                'marketing_emails': True,  # Allow marketing for new users
                'system_notifications': True,
                'timezone': user_data.get('timezone', 'Australia/Sydney')
            })
            
            # Send welcome email
            message_id = await self.service.send_welcome_email(
                user_id=user_data['user_id'],
                user_name=user_data.get('name', user_data.get('username', 'User')),
                user_email=user_data['email']
            )
            
            logger.info(f"Welcome notification sent for new user {user_data['user_id']}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send welcome notification: {e}")
            return None
    
    async def on_login_new_device(self, user_id: str, login_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when user logs in from new device"""
        if not self.service:
            return None
        
        try:
            message_id = await self.service.send_security_alert(
                user_id=user_id,
                user_name=login_data.get('user_name', 'User'),
                user_email=login_data.get('user_email', 'user@example.com'),
                user_phone=login_data.get('user_phone'),
                alert_type=f"Login from new {login_data.get('device_type', 'device')}",
                ip_address=login_data.get('ip_address', 'Unknown'),
                location=login_data.get('location', 'Unknown location')
            )
            
            logger.info(f"New device login notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send new device login notification: {e}")
            return None
    
    async def on_password_changed(self, user_id: str, user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when user changes password"""
        if not self.service:
            return None
        
        try:
            message_id = await self.service.send_security_alert(
                user_id=user_id,
                user_name=user_data.get('user_name', 'User'),
                user_email=user_data.get('user_email', 'user@example.com'),
                user_phone=user_data.get('user_phone'),
                alert_type="Password changed",
                ip_address=user_data.get('ip_address', 'Unknown'),
                location=user_data.get('location', 'Unknown location')
            )
            
            logger.info(f"Password change notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send password change notification: {e}")
            return None
    
    async def on_two_factor_enabled(self, user_id: str, user_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when 2FA is enabled"""
        if not self.service:
            return None
        
        try:
            message_id = await self.service.send_notification(
                user_id=user_id,
                notification_type=NotificationType.SECURITY_ALERT,
                template_data={
                    'user_name': user_data.get('user_name', 'User'),
                    'user_email': user_data.get('user_email', 'user@example.com'),
                    'alert_type': 'Two-factor authentication enabled',
                    'timestamp': datetime.now().strftime('%d %B %Y at %I:%M %p AEDT'),
                    'ip_address': user_data.get('ip_address', 'Unknown'),
                    'location': user_data.get('location', 'Unknown location'),
                    'security_url': 'https://qlibpro.com.au/security'
                },
                priority=NotificationPriority.MEDIUM
            )
            
            logger.info(f"2FA enabled notification sent for user {user_id}")
            return message_id
        
        except Exception as e:
            logger.error(f"Failed to send 2FA enabled notification: {e}")
            return None

# ================================
# TRADING SYSTEM INTEGRATION
# ================================

class TradingNotificationIntegration:
    """Integration with trading engine and market data"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def on_trading_signal_generated(self, signal_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification when AI generates trading signal"""
        if not self.service:
            return None
        
        try:
            # Get all users who should receive this signal
            # In production, this would query the user database
            user_ids = signal_data.get('target_users', [])
            
            sent_notifications = []
            
            for user_id in user_ids:
                try:
                    message_id = await self.service.send_trading_signal(
                        user_id=user_id,
                        user_name=signal_data.get('user_name', 'User'),
                        user_email=signal_data.get('user_email', 'user@example.com'),
                        user_phone=signal_data.get('user_phone'),
                        symbol=signal_data['symbol'],
                        signal=signal_data['signal'],
                        confidence=signal_data['confidence'],
                        current_price=signal_data['current_price'],
                        target_price=signal_data['target_price'],
                        reasoning=signal_data['reasoning']
                    )
                    
                    if message_id:
                        sent_notifications.append(message_id)
                
                except Exception as e:
                    logger.error(f"Failed to send trading signal to user {user_id}: {e}")
            
            logger.info(f"Trading signal notifications sent to {len(sent_notifications)} users")
            return sent_notifications[0] if sent_notifications else None
        
        except Exception as e:
            logger.error(f"Failed to process trading signal notification: {e}")
            return None
    
    async def on_market_alert(self, alert_data: Dict[str, Any]) -> Optional[str]:
        """Trigger notification for market alerts"""
        if not self.service:
            return None
        
        try:
            # Send to all active users (in production, filter by preferences)
            user_ids = alert_data.get('target_users', [])
            
            sent_notifications = []
            
            for user_id in user_ids:
                try:
                    message_id = await self.service.send_notification(
                        user_id=user_id,
                        notification_type=NotificationType.MARKET_ALERT,
                        template_data={
                            'user_name': alert_data.get('user_name', 'User'),
                            'user_email': alert_data.get('user_email', 'user@example.com'),
                            'alert_type': alert_data['alert_type'],
                            'market': alert_data.get('market', 'ASX'),
                            'description': alert_data['description'],
                            'impact': alert_data.get('impact', 'Medium'),
                            'recommendation': alert_data.get('recommendation', ''),
                            'dashboard_url': 'https://qlibpro.com.au/dashboard'
                        },
                        priority=NotificationPriority.MEDIUM
                    )
                    
                    if message_id:
                        sent_notifications.append(message_id)
                
                except Exception as e:
                    logger.error(f"Failed to send market alert to user {user_id}: {e}")
            
            logger.info(f"Market alert notifications sent to {len(sent_notifications)} users")
            return sent_notifications[0] if sent_notifications else None
        
        except Exception as e:
            logger.error(f"Failed to process market alert notification: {e}")
            return None

# ================================
# PORTFOLIO MANAGEMENT INTEGRATION
# ================================

class PortfolioNotificationIntegration:
    """Integration with portfolio management system"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def send_portfolio_reports(self, report_type: str = 'weekly') -> Dict[str, Any]:
        """Send portfolio reports to all users based on their preferences"""
        if not self.service:
            return {'success': False, 'error': 'Service unavailable'}
        
        try:
            sent_count = 0
            failed_count = 0
            
            # In production, this would query the database for all active users
            # For now, we'll simulate with user preferences
            for user_id, preferences in self.service.user_preferences.items():
                try:
                    # Check if user wants portfolio reports and frequency matches
                    if (preferences.portfolio_reports_email and 
                        preferences.portfolio_reports_frequency == report_type):
                        
                        # Generate sample portfolio data (in production, get real data)
                        portfolio_data = self._generate_sample_portfolio_data(user_id)
                        
                        message_id = await self.service.send_portfolio_report(
                            user_id=user_id,
                            user_name=portfolio_data['user_name'],
                            user_email=portfolio_data['user_email'],
                            period=report_type.title(),
                            total_return=portfolio_data['total_return'],
                            total_return_percent=portfolio_data['total_return_percent'],
                            best_performer=portfolio_data['best_performer'],
                            worst_performer=portfolio_data['worst_performer']
                        )
                        
                        if message_id:
                            sent_count += 1
                        else:
                            failed_count += 1
                
                except Exception as e:
                    logger.error(f"Failed to send portfolio report to user {user_id}: {e}")
                    failed_count += 1
            
            logger.info(f"Portfolio reports sent: {sent_count} success, {failed_count} failed")
            return {
                'success': True,
                'sent_count': sent_count,
                'failed_count': failed_count,
                'report_type': report_type
            }
        
        except Exception as e:
            logger.error(f"Failed to send portfolio reports: {e}")
            return {'success': False, 'error': str(e)}
    
    def _generate_sample_portfolio_data(self, user_id: str) -> Dict[str, Any]:
        """Generate sample portfolio data for testing"""
        import random
        
        return {
            'user_name': f'User {user_id}',
            'user_email': f'user{user_id}@example.com',
            'total_return': round(random.uniform(-500, 1500), 2),
            'total_return_percent': round(random.uniform(-5.0, 15.0), 2),
            'best_performer': random.choice(['CBA.AX', 'BHP.AX', 'WBC.AX', 'ANZ.AX', 'TLS.AX']),
            'worst_performer': random.choice(['ZIP.AX', 'APT.AX', 'FLT.AX', 'WEB.AX', 'IOU.AX'])
        }

# ================================
# SYSTEM MAINTENANCE INTEGRATION
# ================================

class SystemNotificationIntegration:
    """Integration for system-wide notifications"""
    
    def __init__(self):
        self.service = notification_service if NOTIFICATION_SERVICE_AVAILABLE else None
    
    async def send_maintenance_notification(self, maintenance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send maintenance notification to all users"""
        if not self.service:
            return {'success': False, 'error': 'Service unavailable'}
        
        try:
            sent_count = 0
            failed_count = 0
            
            # Send to all users who have system notifications enabled
            for user_id, preferences in self.service.user_preferences.items():
                if preferences.system_notifications and preferences.email_enabled:
                    try:
                        message_id = await self.service.send_notification(
                            user_id=user_id,
                            notification_type=NotificationType.SYSTEM_MAINTENANCE,
                            template_data={
                                'user_name': f'User {user_id}',
                                'user_email': f'user{user_id}@example.com',
                                'maintenance_type': maintenance_data.get('type', 'Scheduled maintenance'),
                                'start_time': maintenance_data.get('start_time', 'TBD'),
                                'end_time': maintenance_data.get('end_time', 'TBD'),
                                'affected_services': maintenance_data.get('affected_services', []),
                                'description': maintenance_data.get('description', ''),
                                'status_url': 'https://status.qlibpro.com.au'
                            },
                            priority=NotificationPriority.MEDIUM
                        )
                        
                        if message_id:
                            sent_count += 1
                        else:
                            failed_count += 1
                    
                    except Exception as e:
                        logger.error(f"Failed to send maintenance notification to user {user_id}: {e}")
                        failed_count += 1
            
            logger.info(f"Maintenance notifications sent: {sent_count} success, {failed_count} failed")
            return {
                'success': True,
                'sent_count': sent_count,
                'failed_count': failed_count,
                'maintenance_type': maintenance_data.get('type', 'Unknown')
            }
        
        except Exception as e:
            logger.error(f"Failed to send maintenance notifications: {e}")
            return {'success': False, 'error': str(e)}

# ================================
# SERVICE INSTANCES
# ================================

# Create service instances
kyc_notifications = KYCNotificationIntegration()
payment_notifications = PaymentNotificationIntegration()
auth_notifications = AuthNotificationIntegration()
trading_notifications = TradingNotificationIntegration()
portfolio_notifications = PortfolioNotificationIntegration()
system_notifications = SystemNotificationIntegration()

# ================================
# CONVENIENCE FUNCTIONS
# ================================

async def trigger_user_registration_flow(user_data: Dict[str, Any]) -> Optional[str]:
    """Complete user registration notification flow"""
    return await auth_notifications.on_user_registration(user_data)

async def trigger_kyc_flow(user_id: str, status: str, user_data: Dict[str, Any]) -> Optional[str]:
    """Complete KYC notification flow"""
    return await kyc_notifications.on_kyc_status_changed(user_id, status, user_data)

async def trigger_payment_flow(user_id: str, payment_data: Dict[str, Any], success: bool = True) -> Optional[str]:
    """Complete payment notification flow"""
    if success:
        return await payment_notifications.on_payment_successful(user_id, payment_data)
    else:
        return await payment_notifications.on_payment_failed(user_id, payment_data)

async def trigger_trading_signal_flow(signal_data: Dict[str, Any]) -> Optional[str]:
    """Complete trading signal notification flow"""
    return await trading_notifications.on_trading_signal_generated(signal_data)

async def send_weekly_portfolio_reports() -> Dict[str, Any]:
    """Send weekly portfolio reports to all eligible users"""
    return await portfolio_notifications.send_portfolio_reports('weekly')

async def send_daily_portfolio_reports() -> Dict[str, Any]:
    """Send daily portfolio reports to all eligible users"""
    return await portfolio_notifications.send_portfolio_reports('daily')

async def send_monthly_portfolio_reports() -> Dict[str, Any]:
    """Send monthly portfolio reports to all eligible users"""
    return await portfolio_notifications.send_portfolio_reports('monthly')

# Export all integration classes and functions
__all__ = [
    'KYCNotificationIntegration',
    'PaymentNotificationIntegration', 
    'AuthNotificationIntegration',
    'TradingNotificationIntegration',
    'PortfolioNotificationIntegration',
    'SystemNotificationIntegration',
    'kyc_notifications',
    'payment_notifications',
    'auth_notifications', 
    'trading_notifications',
    'portfolio_notifications',
    'system_notifications',
    'trigger_user_registration_flow',
    'trigger_kyc_flow',
    'trigger_payment_flow',
    'trigger_trading_signal_flow',
    'send_weekly_portfolio_reports',
    'send_daily_portfolio_reports',
    'send_monthly_portfolio_reports'
]