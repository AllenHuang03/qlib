#!/usr/bin/env python3
"""
COMPREHENSIVE NOTIFICATION & COMMUNICATION SERVICE
Professional email notifications, SMS alerts, and communication system
for Australian trading platform with full compliance
"""

import os
import asyncio
import smtplib
import hashlib
import logging
import json
import pytz
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Environment, FileSystemLoader, BaseLoader
import requests
from enum import Enum

# Third-party service imports
try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content, Attachment, FileContent, FileName, FileType, Disposition
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    AWS_SES_AVAILABLE = True
except ImportError:
    AWS_SES_AVAILABLE = False

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# CONFIGURATION & ENUMS
# ================================

class NotificationType(str, Enum):
    WELCOME = "welcome"
    KYC_SUBMITTED = "kyc_submitted"
    KYC_APPROVED = "kyc_approved"
    KYC_REJECTED = "kyc_rejected"
    KYC_MANUAL_REVIEW = "kyc_manual_review"
    DEPOSIT_CONFIRMATION = "deposit_confirmation"
    WITHDRAWAL_CONFIRMATION = "withdrawal_confirmation"
    TRADING_SIGNAL_HIGH = "trading_signal_high"
    TRADING_SIGNAL_MEDIUM = "trading_signal_medium"
    PORTFOLIO_DAILY_REPORT = "portfolio_daily_report"
    PORTFOLIO_WEEKLY_REPORT = "portfolio_weekly_report"
    PORTFOLIO_MONTHLY_REPORT = "portfolio_monthly_report"
    SECURITY_ALERT = "security_alert"
    LOGIN_NEW_DEVICE = "login_new_device"
    PASSWORD_CHANGED = "password_changed"
    TWO_FA_CODE = "two_fa_code"
    ACCOUNT_LOCKED = "account_locked"
    SUBSCRIPTION_ACTIVATED = "subscription_activated"
    SUBSCRIPTION_EXPIRED = "subscription_expired"
    PAYMENT_FAILED = "payment_failed"
    MARKET_ALERT = "market_alert"
    SYSTEM_MAINTENANCE = "system_maintenance"
    COMPLIANCE_UPDATE = "compliance_update"

class DeliveryMethod(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"

# ================================
# DATA MODELS
# ================================

@dataclass
class NotificationPreferences:
    """User notification preferences with granular control"""
    user_id: str
    email_enabled: bool = True
    sms_enabled: bool = True
    trading_signals_email: bool = True
    trading_signals_sms: bool = False
    portfolio_reports_email: bool = True
    portfolio_reports_frequency: str = "weekly"  # daily, weekly, monthly
    security_alerts_email: bool = True
    security_alerts_sms: bool = True
    marketing_emails: bool = False
    system_notifications: bool = True
    quiet_hours_start: str = "22:00"  # 10 PM
    quiet_hours_end: str = "07:00"    # 7 AM
    timezone: str = "Australia/Sydney"
    unsubscribe_token: Optional[str] = None
    created_at: str = None
    updated_at: str = None

@dataclass
class NotificationTemplate:
    """Email/SMS template definition"""
    template_id: str
    template_type: NotificationType
    subject_template: str
    html_template: str
    text_template: str
    sms_template: Optional[str] = None
    variables: List[str] = None
    compliance_footer: bool = True
    unsubscribe_link: bool = True
    created_at: str = None

@dataclass
class NotificationMessage:
    """Individual notification message"""
    message_id: str
    user_id: str
    notification_type: NotificationType
    delivery_method: DeliveryMethod
    priority: NotificationPriority
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    template_data: Dict[str, Any] = None
    status: NotificationStatus = NotificationStatus.PENDING
    scheduled_at: Optional[str] = None
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    error_message: Optional[str] = None
    provider_message_id: Optional[str] = None
    created_at: str = None

@dataclass
class NotificationAudit:
    """Audit trail for compliance and tracking"""
    audit_id: str
    message_id: str
    user_id: str
    action: str  # sent, delivered, bounced, unsubscribed, etc.
    provider: str
    metadata: Dict[str, Any] = None
    timestamp: str = None

# ================================
# EMAIL TEMPLATE ENGINE
# ================================

class EmailTemplateEngine:
    """Professional email template engine with Australian compliance"""
    
    def __init__(self):
        self.base_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'email')
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.base_template_path) if os.path.exists(self.base_template_path) else BaseLoader()
        )
        
        # Australian compliance settings
        self.company_info = {
            'company_name': 'Qlib Pro Trading Platform',
            'company_address': 'Level 10, 123 Collins Street, Melbourne VIC 3000, Australia',
            'abn': 'ABN 12 345 678 901',
            'afsl': 'AFSL 123456',
            'support_email': 'support@qlibpro.com.au',
            'support_phone': '+61 3 9000 0000',
            'website': 'https://qlibpro.com.au',
            'privacy_policy_url': 'https://qlibpro.com.au/privacy',
            'terms_url': 'https://qlibpro.com.au/terms',
            'unsubscribe_url': 'https://qlibpro.com.au/unsubscribe'
        }
        
        # Load built-in templates
        self._load_built_in_templates()
    
    def _load_built_in_templates(self):
        """Load built-in email templates"""
        self.templates = {
            NotificationType.WELCOME: NotificationTemplate(
                template_id="welcome_email",
                template_type=NotificationType.WELCOME,
                subject_template="Welcome to Qlib Pro - Your Trading Journey Begins!",
                html_template=self._get_welcome_html_template(),
                text_template=self._get_welcome_text_template(),
                variables=["user_name", "login_url", "support_email"]
            ),
            
            NotificationType.KYC_APPROVED: NotificationTemplate(
                template_id="kyc_approved",
                template_type=NotificationType.KYC_APPROVED,
                subject_template="Identity Verification Complete - Welcome to Full Trading Access",
                html_template=self._get_kyc_approved_html_template(),
                text_template=self._get_kyc_approved_text_template(),
                variables=["user_name", "verification_date", "next_steps_url"]
            ),
            
            NotificationType.DEPOSIT_CONFIRMATION: NotificationTemplate(
                template_id="deposit_confirmation",
                template_type=NotificationType.DEPOSIT_CONFIRMATION,
                subject_template="Deposit Confirmation - ${{amount}} AUD Received",
                html_template=self._get_deposit_confirmation_html_template(),
                text_template=self._get_deposit_confirmation_text_template(),
                variables=["user_name", "amount", "currency", "timestamp", "transaction_id", "new_balance"]
            ),
            
            NotificationType.TRADING_SIGNAL_HIGH: NotificationTemplate(
                template_id="trading_signal_high",
                template_type=NotificationType.TRADING_SIGNAL_HIGH,
                subject_template="🚨 HIGH CONFIDENCE Trading Signal: {{symbol}} {{signal}}",
                html_template=self._get_trading_signal_html_template(),
                text_template=self._get_trading_signal_text_template(),
                sms_template="🚨 HIGH: {{symbol}} {{signal}} @${{current_price}} Target: ${{target_price}} Confidence: {{confidence}}%",
                variables=["user_name", "symbol", "signal", "confidence", "current_price", "target_price", "reasoning"]
            ),
            
            NotificationType.PORTFOLIO_WEEKLY_REPORT: NotificationTemplate(
                template_id="portfolio_weekly",
                template_type=NotificationType.PORTFOLIO_WEEKLY_REPORT,
                subject_template="Your Weekly Portfolio Performance Report",
                html_template=self._get_portfolio_report_html_template(),
                text_template=self._get_portfolio_report_text_template(),
                variables=["user_name", "period", "total_return", "total_return_percent", "best_performer", "worst_performer", "report_url"]
            ),
            
            NotificationType.SECURITY_ALERT: NotificationTemplate(
                template_id="security_alert",
                template_type=NotificationType.SECURITY_ALERT,
                subject_template="🔒 Security Alert: {{alert_type}}",
                html_template=self._get_security_alert_html_template(),
                text_template=self._get_security_alert_text_template(),
                sms_template="🔒 SECURITY ALERT: {{alert_type}} detected. If this wasn't you, secure your account immediately at {{security_url}}",
                variables=["user_name", "alert_type", "timestamp", "ip_address", "location", "security_url"]
            )
        }
    
    def render_template(self, template_type: NotificationType, data: Dict[str, Any], 
                       delivery_method: DeliveryMethod = DeliveryMethod.EMAIL) -> Dict[str, str]:
        """Render notification template with data"""
        template = self.templates.get(template_type)
        if not template:
            raise ValueError(f"Template not found for type: {template_type}")
        
        # Add company info and compliance data
        template_data = {
            **data,
            **self.company_info,
            'current_year': datetime.now().year,
            'unsubscribe_token': data.get('unsubscribe_token', 'TOKEN_PLACEHOLDER'),
            'timestamp': datetime.now(pytz.timezone('Australia/Sydney')).strftime('%d %B %Y at %I:%M %p AEDT')
        }
        
        try:
            if delivery_method == DeliveryMethod.SMS and template.sms_template:
                # Render SMS template
                from jinja2 import Template
                sms_template = Template(template.sms_template)
                return {'sms_content': sms_template.render(**template_data)}
            else:
                # Render email templates
                from jinja2 import Template
                subject_template = Template(template.subject_template)
                html_template = Template(template.html_template)
                text_template = Template(template.text_template)
                
                return {
                    'subject': subject_template.render(**template_data),
                    'html_content': html_template.render(**template_data),
                    'text_content': text_template.render(**template_data)
                }
        except Exception as e:
            logger.error(f"Template rendering error for {template_type}: {e}")
            raise
    
    def _get_welcome_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Qlib Pro</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .welcome-message { font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 30px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { margin: 10px 0; padding-left: 20px; position: relative; }
        .feature-item::before { content: "✓"; position: absolute; left: 0; color: #28a745; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .compliance { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Qlib Pro</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your AI-Powered Trading Platform</p>
        </div>
        
        <div class="content">
            <div class="welcome-message">
                <p>Dear {{user_name}},</p>
                <p>Welcome to Qlib Pro! We're excited to have you join our community of sophisticated traders using cutting-edge AI technology to navigate the Australian markets.</p>
            </div>
            
            <div class="features">
                <h3>What you can do now:</h3>
                <div class="feature-item">Access real-time market data and AI-powered trading signals</div>
                <div class="feature-item">Build and backtest your investment strategies</div>
                <div class="feature-item">Monitor your portfolio performance with detailed analytics</div>
                <div class="feature-item">Connect with our expert support team</div>
            </div>
            
            <p style="text-align: center;">
                <a href="{{login_url}}" class="cta-button">Start Trading Now</a>
            </p>
            
            <p>If you have any questions, our support team is here to help at {{support_email}} or call {{support_phone}}.</p>
            
            <p>Best regards,<br>The Qlib Pro Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>{{company_address}}<br>{{abn}} | {{afsl}}</p>
            <div class="compliance">
                <p>This communication is issued by {{company_name}}, holder of Australian Financial Services Licence {{afsl}}. 
                   Please consider our Financial Services Guide before making investment decisions.</p>
                <p>You are receiving this email because you registered for a Qlib Pro account. 
                   <a href="{{unsubscribe_url}}?token={{unsubscribe_token}}">Unsubscribe</a> | 
                   <a href="{{privacy_policy_url}}">Privacy Policy</a></p>
            </div>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_welcome_text_template(self) -> str:
        return """
WELCOME TO QLIB PRO

Dear {{user_name}},

Welcome to Qlib Pro! We're excited to have you join our community of sophisticated traders using cutting-edge AI technology to navigate the Australian markets.

What you can do now:
✓ Access real-time market data and AI-powered trading signals
✓ Build and backtest your investment strategies  
✓ Monitor your portfolio performance with detailed analytics
✓ Connect with our expert support team

Get Started: {{login_url}}

If you have any questions, our support team is here to help:
Email: {{support_email}}
Phone: {{support_phone}}

Best regards,
The Qlib Pro Team

---
{{company_name}}
{{company_address}}
{{abn}} | {{afsl}}

This communication is issued by {{company_name}}, holder of Australian Financial Services Licence {{afsl}}.

Unsubscribe: {{unsubscribe_url}}?token={{unsubscribe_token}}
Privacy Policy: {{privacy_policy_url}}
        """
    
    def _get_kyc_approved_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Identity Verification Complete</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
        .content { padding: 40px 20px; }
        .cta-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .compliance { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Identity Verification Complete</h1>
        </div>
        
        <div class="content">
            <p>Dear {{user_name}},</p>
            
            <p>Congratulations! Your identity verification has been successfully completed on {{verification_date}}. You now have full access to all Qlib Pro features including:</p>
            
            <ul>
                <li>Live trading with real funds</li>
                <li>Deposit and withdrawal capabilities</li>
                <li>Advanced portfolio management tools</li>
                <li>Priority customer support</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="{{next_steps_url}}" class="cta-button">Access Your Dashboard</a>
            </p>
            
            <p>Thank you for choosing Qlib Pro for your trading needs.</p>
            
            <p>Best regards,<br>The Qlib Pro Compliance Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>{{company_address}}<br>{{abn}} | {{afsl}}</p>
            <div class="compliance">
                <p>This verification complies with Anti-Money Laundering and Counter-Terrorism Financing requirements under Australian law.</p>
            </div>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_kyc_approved_text_template(self) -> str:
        return """
✅ IDENTITY VERIFICATION COMPLETE

Dear {{user_name}},

Congratulations! Your identity verification has been successfully completed on {{verification_date}}.

You now have full access to all Qlib Pro features including:
• Live trading with real funds
• Deposit and withdrawal capabilities  
• Advanced portfolio management tools
• Priority customer support

Access Your Dashboard: {{next_steps_url}}

Thank you for choosing Qlib Pro for your trading needs.

Best regards,
The Qlib Pro Compliance Team

---
{{company_name}}
This verification complies with Anti-Money Laundering and Counter-Terrorism Financing requirements under Australian law.
        """
    
    def _get_deposit_confirmation_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deposit Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px 20px; text-align: center; color: white; }
        .amount { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .content { padding: 30px 20px; }
        .transaction-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: 600; color: #666; }
        .detail-value { color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Deposit Received</h1>
            <div class="amount">${{amount}} {{currency}}</div>
        </div>
        
        <div class="content">
            <p>Dear {{user_name}},</p>
            
            <p>Your deposit has been successfully processed and added to your Qlib Pro trading account.</p>
            
            <div class="transaction-details">
                <h3>Transaction Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">${{amount}} {{currency}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <span class="detail-value">{{transaction_id}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Processed:</span>
                    <span class="detail-value">{{timestamp}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">New Account Balance:</span>
                    <span class="detail-value">${{new_balance}} {{currency}}</span>
                </div>
            </div>
            
            <p>Your funds are now available for trading. Happy investing!</p>
            
            <p>Best regards,<br>The Qlib Pro Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>{{company_address}}<br>{{abn}} | {{afsl}}</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_deposit_confirmation_text_template(self) -> str:
        return """
💰 DEPOSIT CONFIRMATION - ${{amount}} {{currency}}

Dear {{user_name}},

Your deposit has been successfully processed and added to your Qlib Pro trading account.

Transaction Details:
- Amount: ${{amount}} {{currency}}
- Transaction ID: {{transaction_id}}
- Processed: {{timestamp}}
- New Account Balance: ${{new_balance}} {{currency}}

Your funds are now available for trading. Happy investing!

Best regards,
The Qlib Pro Team
        """
    
    def _get_trading_signal_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trading Signal Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center; color: white; }
        .signal-badge { display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 20px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .signal-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .price-info { display: flex; justify-content: space-between; margin: 15px 0; }
        .confidence-bar { background: #e9ecef; height: 10px; border-radius: 5px; margin: 10px 0; }
        .confidence-fill { background: #28a745; height: 100%; border-radius: 5px; }
        .reasoning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 HIGH CONFIDENCE Trading Signal</h1>
            <div class="signal-badge">{{symbol}} - {{signal}}</div>
        </div>
        
        <div class="content">
            <p>Dear {{user_name}},</p>
            
            <p>Our AI analysis has identified a high-confidence trading opportunity:</p>
            
            <div class="signal-details">
                <h3>Signal Details</h3>
                <div class="price-info">
                    <div>
                        <strong>Current Price:</strong><br>
                        ${{current_price}}
                    </div>
                    <div>
                        <strong>Target Price:</strong><br>
                        ${{target_price}}
                    </div>
                </div>
                
                <div>
                    <strong>Confidence Level: {{confidence}}%</strong>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: {{confidence}}%;"></div>
                    </div>
                </div>
            </div>
            
            <div class="reasoning">
                <h4>AI Analysis Summary</h4>
                <p>{{reasoning}}</p>
            </div>
            
            <p><strong>Important:</strong> This signal is generated by AI analysis and should be considered alongside your own research and risk management strategy. Past performance does not guarantee future results.</p>
            
            <p>Best regards,<br>The Qlib Pro AI Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>{{afsl}} | This is not personal financial advice</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_trading_signal_text_template(self) -> str:
        return """
🚨 HIGH CONFIDENCE Trading Signal

{{symbol}} - {{signal}}

Dear {{user_name}},

Our AI analysis has identified a high-confidence trading opportunity:

Signal Details:
- Current Price: ${{current_price}}
- Target Price: ${{target_price}}
- Confidence Level: {{confidence}}%

AI Analysis Summary:
{{reasoning}}

IMPORTANT: This signal is generated by AI analysis and should be considered alongside your own research and risk management strategy. Past performance does not guarantee future results.

Best regards,
The Qlib Pro AI Team
        """
    
    def _get_portfolio_report_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Portfolio Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%); padding: 30px 20px; text-align: center; color: white; }
        .content { padding: 30px 20px; }
        .performance-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
        .metric-label { font-weight: 600; color: #666; }
        .metric-value { color: #333; font-weight: bold; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .cta-button { display: inline-block; background: #6f42c1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 {{period}} Portfolio Report</h1>
        </div>
        
        <div class="content">
            <p>Dear {{user_name}},</p>
            
            <p>Here's your {{period}} portfolio performance summary:</p>
            
            <div class="performance-summary">
                <h3>Performance Summary</h3>
                <div class="metric">
                    <span class="metric-label">Total Return:</span>
                    <span class="metric-value {% if total_return >= 0 %}positive{% else %}negative{% endif %}">${{total_return}} ({{total_return_percent}}%)</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Best Performer:</span>
                    <span class="metric-value">{{best_performer}}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Needs Attention:</span>
                    <span class="metric-value">{{worst_performer}}</span>
                </div>
            </div>
            
            <p style="text-align: center;">
                <a href="{{report_url}}" class="cta-button">View Detailed Report</a>
            </p>
            
            <p>Keep up the great work! Our AI continues to monitor your portfolio for optimization opportunities.</p>
            
            <p>Best regards,<br>The Qlib Pro Analytics Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>{{afsl}} | Past performance does not guarantee future results</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_portfolio_report_text_template(self) -> str:
        return """
📊 {{period}} PORTFOLIO REPORT

Dear {{user_name}},

Here's your {{period}} portfolio performance summary:

Performance Summary:
- Total Return: ${{total_return}} ({{total_return_percent}}%)
- Best Performer: {{best_performer}}
- Needs Attention: {{worst_performer}}

View Detailed Report: {{report_url}}

Keep up the great work! Our AI continues to monitor your portfolio for optimization opportunities.

Best regards,
The Qlib Pro Analytics Team
        """
    
    def _get_security_alert_html_template(self) -> str:
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Security Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%); padding: 30px 20px; text-align: center; color: white; }
        .alert-icon { font-size: 48px; margin-bottom: 20px; }
        .content { padding: 30px 20px; }
        .alert-details { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .security-button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🔒</div>
            <h1>Security Alert</h1>
            <p>{{alert_type}}</p>
        </div>
        
        <div class="content">
            <p>Dear {{user_name}},</p>
            
            <p>We detected unusual activity on your Qlib Pro account and wanted to notify you immediately.</p>
            
            <div class="alert-details">
                <h3>Alert Details</h3>
                <p><strong>Alert Type:</strong> {{alert_type}}</p>
                <p><strong>Time:</strong> {{timestamp}}</p>
                <p><strong>IP Address:</strong> {{ip_address}}</p>
                <p><strong>Location:</strong> {{location}}</p>
            </div>
            
            <p><strong>If this was you:</strong> No action required. Your account remains secure.</p>
            
            <p><strong>If this wasn't you:</strong> Please secure your account immediately by clicking the button below.</p>
            
            <p style="text-align: center;">
                <a href="{{security_url}}" class="security-button">Secure My Account</a>
            </p>
            
            <p>If you have any concerns, please contact our security team immediately at {{support_email}} or {{support_phone}}.</p>
            
            <p>Best regards,<br>The Qlib Pro Security Team</p>
        </div>
        
        <div class="footer">
            <p>{{company_name}}<br>Security is our top priority</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_security_alert_text_template(self) -> str:
        return """
🔒 SECURITY ALERT: {{alert_type}}

Dear {{user_name}},

We detected unusual activity on your Qlib Pro account:

Alert Details:
- Alert Type: {{alert_type}}
- Time: {{timestamp}}
- IP Address: {{ip_address}}
- Location: {{location}}

If this was you: No action required.

If this wasn't you: Secure your account immediately at {{security_url}}

Contact our security team: {{support_email}} or {{support_phone}}

Best regards,
The Qlib Pro Security Team
        """

# ================================
# EMAIL PROVIDERS
# ================================

class EmailProvider:
    """Base email provider interface"""
    
    async def send_email(self, message: NotificationMessage) -> Dict[str, Any]:
        raise NotImplementedError
    
    async def get_delivery_status(self, provider_message_id: str) -> Dict[str, Any]:
        raise NotImplementedError

class SendGridProvider(EmailProvider):
    """SendGrid email provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = sendgrid.SendGridAPIClient(api_key=api_key) if SENDGRID_AVAILABLE else None
    
    async def send_email(self, message: NotificationMessage) -> Dict[str, Any]:
        if not self.client:
            return await self._mock_send_email(message)
        
        try:
            mail = Mail(
                from_email=Email("noreply@qlibpro.com.au", "Qlib Pro"),
                to_emails=To(message.recipient_email),
                subject=message.subject,
                html_content=Content("text/html", message.html_content),
                plain_text_content=Content("text/plain", message.text_content)
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None, self.client.send, mail
            )
            
            return {
                'success': True,
                'provider_message_id': response.headers.get('X-Message-Id'),
                'status_code': response.status_code
            }
        
        except Exception as e:
            logger.error(f"SendGrid email send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _mock_send_email(self, message: NotificationMessage) -> Dict[str, Any]:
        """Mock email sending for testing"""
        await asyncio.sleep(0.1)  # Simulate network delay
        return {
            'success': True,
            'provider_message_id': f"mock_{hashlib.md5(message.message_id.encode()).hexdigest()[:8]}",
            'status_code': 202
        }

class AWSESProvider(EmailProvider):
    """AWS SES email provider"""
    
    def __init__(self, region_name: str = 'ap-southeast-2'):
        self.region_name = region_name
        try:
            self.client = boto3.client('ses', region_name=region_name) if AWS_SES_AVAILABLE else None
        except NoCredentialsError:
            self.client = None
            logger.warning("AWS credentials not configured")
    
    async def send_email(self, message: NotificationMessage) -> Dict[str, Any]:
        if not self.client:
            return await self._mock_send_email(message)
        
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.client.send_email,
                {
                    'Source': 'noreply@qlibpro.com.au',
                    'Destination': {'ToAddresses': [message.recipient_email]},
                    'Message': {
                        'Subject': {'Data': message.subject, 'Charset': 'UTF-8'},
                        'Body': {
                            'Html': {'Data': message.html_content, 'Charset': 'UTF-8'},
                            'Text': {'Data': message.text_content, 'Charset': 'UTF-8'}
                        }
                    }
                }
            )
            
            return {
                'success': True,
                'provider_message_id': response['MessageId'],
                'response_metadata': response.get('ResponseMetadata', {})
            }
        
        except ClientError as e:
            logger.error(f"AWS SES email send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _mock_send_email(self, message: NotificationMessage) -> Dict[str, Any]:
        """Mock email sending for testing"""
        await asyncio.sleep(0.1)
        return {
            'success': True,
            'provider_message_id': f"aws_mock_{hashlib.md5(message.message_id.encode()).hexdigest()[:12]}",
            'response_metadata': {'HTTPStatusCode': 200}
        }

# ================================
# SMS PROVIDER
# ================================

class SMSProvider:
    """SMS notification provider using Twilio"""
    
    def __init__(self, account_sid: str = None, auth_token: str = None, from_number: str = None):
        self.account_sid = account_sid or os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = auth_token or os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = from_number or os.getenv('TWILIO_FROM_NUMBER', '+61400000000')
        
        if TWILIO_AVAILABLE and self.account_sid and self.auth_token:
            self.client = TwilioClient(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            logger.warning("Twilio SMS not configured - using mock mode")
    
    async def send_sms(self, message: NotificationMessage) -> Dict[str, Any]:
        """Send SMS notification"""
        if not self.enabled:
            return await self._mock_send_sms(message)
        
        try:
            # Ensure phone number is in international format
            phone_number = self._format_phone_number(message.recipient_phone)
            
            # Send SMS
            twilio_message = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.messages.create(
                    body=message.text_content[:160],  # SMS length limit
                    from_=self.from_number,
                    to=phone_number
                )
            )
            
            return {
                'success': True,
                'provider_message_id': twilio_message.sid,
                'status': twilio_message.status,
                'price': twilio_message.price
            }
        
        except Exception as e:
            logger.error(f"Twilio SMS send error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _format_phone_number(self, phone: str) -> str:
        """Format phone number to international format"""
        # Remove all non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # Add Australian country code if mobile number
        if len(digits_only) == 10 and digits_only.startswith('04'):
            return f'+61{digits_only[1:]}'
        elif len(digits_only) == 9 and digits_only.startswith('4'):
            return f'+61{digits_only}'
        elif digits_only.startswith('61'):
            return f'+{digits_only}'
        else:
            return f'+{digits_only}'
    
    async def _mock_send_sms(self, message: NotificationMessage) -> Dict[str, Any]:
        """Mock SMS sending for testing"""
        await asyncio.sleep(0.1)
        return {
            'success': True,
            'provider_message_id': f"mock_sms_{hashlib.md5(message.message_id.encode()).hexdigest()[:8]}",
            'status': 'sent',
            'price': '-0.0450'
        }

# ================================
# MAIN NOTIFICATION SERVICE
# ================================

class NotificationService:
    """Comprehensive notification and communication service"""
    
    def __init__(self):
        # Initialize template engine
        self.template_engine = EmailTemplateEngine()
        
        # Initialize email providers
        sendgrid_key = os.getenv('SENDGRID_API_KEY')
        if sendgrid_key:
            self.email_provider = SendGridProvider(sendgrid_key)
            logger.info("SendGrid email provider initialized")
        else:
            self.email_provider = AWSESProvider()
            logger.info("AWS SES email provider initialized (fallback)")
        
        # Initialize SMS provider
        self.sms_provider = SMSProvider()
        
        # In-memory storage (replace with database in production)
        self.user_preferences = {}  # user_id -> NotificationPreferences
        self.notification_history = {}  # message_id -> NotificationMessage
        self.audit_trail = {}  # audit_id -> NotificationAudit
        
        # Australian timezone
        self.australia_tz = pytz.timezone('Australia/Sydney')
        
        logger.info("Notification service initialized successfully")
    
    async def send_notification(self, user_id: str, notification_type: NotificationType,
                              template_data: Dict[str, Any], priority: NotificationPriority = NotificationPriority.MEDIUM,
                              scheduled_at: Optional[datetime] = None) -> str:
        """Send notification to user based on their preferences"""
        
        # Get user preferences
        preferences = await self.get_user_preferences(user_id)
        if not preferences:
            logger.warning(f"No preferences found for user {user_id}")
            return None
        
        # Check if user wants this type of notification
        if not self._should_send_notification(notification_type, preferences, priority):
            logger.info(f"Notification {notification_type} skipped for user {user_id} due to preferences")
            return None
        
        # Check quiet hours
        if self._is_quiet_hours(preferences) and priority != NotificationPriority.CRITICAL:
            logger.info(f"Notification {notification_type} delayed for user {user_id} due to quiet hours")
            # Schedule for after quiet hours
            scheduled_at = self._get_next_send_time(preferences)
        
        # Generate message ID
        message_id = self._generate_message_id(user_id, notification_type)
        
        # Add unsubscribe token to template data
        template_data['unsubscribe_token'] = preferences.unsubscribe_token or self._generate_unsubscribe_token(user_id)
        
        # Determine delivery methods
        delivery_methods = self._get_delivery_methods(notification_type, preferences, priority)
        
        # Send via each delivery method
        for delivery_method in delivery_methods:
            try:
                if delivery_method == DeliveryMethod.EMAIL:
                    await self._send_email_notification(
                        user_id, message_id, notification_type, template_data, preferences, scheduled_at
                    )
                elif delivery_method == DeliveryMethod.SMS:
                    await self._send_sms_notification(
                        user_id, message_id, notification_type, template_data, preferences, scheduled_at
                    )
                
            except Exception as e:
                logger.error(f"Failed to send {delivery_method} notification to {user_id}: {e}")
                await self._log_audit(message_id, user_id, f"send_failed_{delivery_method}", 
                                    {'error': str(e), 'type': notification_type.value})
        
        return message_id
    
    async def _send_email_notification(self, user_id: str, message_id: str, 
                                     notification_type: NotificationType, template_data: Dict[str, Any],
                                     preferences: NotificationPreferences, scheduled_at: Optional[datetime] = None):
        """Send email notification"""
        
        # Get user email (this would come from user service in production)
        user_email = template_data.get('user_email') or f"user{user_id}@example.com"
        
        # Render email template
        rendered = self.template_engine.render_template(notification_type, template_data, DeliveryMethod.EMAIL)
        
        # Create notification message
        message = NotificationMessage(
            message_id=f"{message_id}_email",
            user_id=user_id,
            notification_type=notification_type,
            delivery_method=DeliveryMethod.EMAIL,
            priority=NotificationPriority.MEDIUM,
            recipient_email=user_email,
            subject=rendered['subject'],
            html_content=rendered['html_content'],
            text_content=rendered['text_content'],
            template_data=template_data,
            scheduled_at=scheduled_at.isoformat() if scheduled_at else None,
            created_at=datetime.utcnow().isoformat()
        )
        
        # Store message
        self.notification_history[message.message_id] = message
        
        # Send immediately or schedule
        if scheduled_at and scheduled_at > datetime.utcnow():
            logger.info(f"Email notification {message.message_id} scheduled for {scheduled_at}")
            # In production, use a job queue like Celery
        else:
            await self._send_email_now(message)
    
    async def _send_email_now(self, message: NotificationMessage):
        """Send email immediately"""
        try:
            result = await self.email_provider.send_email(message)
            
            if result['success']:
                message.status = NotificationStatus.SENT
                message.sent_at = datetime.utcnow().isoformat()
                message.provider_message_id = result.get('provider_message_id')
                
                await self._log_audit(message.message_id, message.user_id, "sent", {
                    'provider': 'email',
                    'provider_message_id': result.get('provider_message_id')
                })
                
                logger.info(f"Email sent successfully: {message.message_id}")
            else:
                message.status = NotificationStatus.FAILED
                message.error_message = result.get('error', 'Unknown error')
                
                await self._log_audit(message.message_id, message.user_id, "send_failed", {
                    'provider': 'email',
                    'error': result.get('error')
                })
                
                logger.error(f"Email send failed: {message.message_id} - {result.get('error')}")
        
        except Exception as e:
            message.status = NotificationStatus.FAILED
            message.error_message = str(e)
            logger.error(f"Email send exception: {message.message_id} - {e}")
    
    async def _send_sms_notification(self, user_id: str, message_id: str,
                                   notification_type: NotificationType, template_data: Dict[str, Any],
                                   preferences: NotificationPreferences, scheduled_at: Optional[datetime] = None):
        """Send SMS notification"""
        
        # Get user phone (this would come from user service in production)
        user_phone = template_data.get('user_phone') or '+61400000000'
        
        # Render SMS template
        rendered = self.template_engine.render_template(notification_type, template_data, DeliveryMethod.SMS)
        sms_content = rendered.get('sms_content', 'Qlib Pro notification')
        
        # Create notification message
        message = NotificationMessage(
            message_id=f"{message_id}_sms",
            user_id=user_id,
            notification_type=notification_type,
            delivery_method=DeliveryMethod.SMS,
            priority=NotificationPriority.HIGH,
            recipient_phone=user_phone,
            text_content=sms_content,
            template_data=template_data,
            scheduled_at=scheduled_at.isoformat() if scheduled_at else None,
            created_at=datetime.utcnow().isoformat()
        )
        
        # Store message
        self.notification_history[message.message_id] = message
        
        # Send immediately (SMS are usually time-sensitive)
        await self._send_sms_now(message)
    
    async def _send_sms_now(self, message: NotificationMessage):
        """Send SMS immediately"""
        try:
            result = await self.sms_provider.send_sms(message)
            
            if result['success']:
                message.status = NotificationStatus.SENT
                message.sent_at = datetime.utcnow().isoformat()
                message.provider_message_id = result.get('provider_message_id')
                
                await self._log_audit(message.message_id, message.user_id, "sent", {
                    'provider': 'sms',
                    'provider_message_id': result.get('provider_message_id'),
                    'cost': result.get('price')
                })
                
                logger.info(f"SMS sent successfully: {message.message_id}")
            else:
                message.status = NotificationStatus.FAILED
                message.error_message = result.get('error', 'Unknown error')
                
                await self._log_audit(message.message_id, message.user_id, "send_failed", {
                    'provider': 'sms',
                    'error': result.get('error')
                })
                
                logger.error(f"SMS send failed: {message.message_id} - {result.get('error')}")
        
        except Exception as e:
            message.status = NotificationStatus.FAILED
            message.error_message = str(e)
            logger.error(f"SMS send exception: {message.message_id} - {e}")
    
    def _should_send_notification(self, notification_type: NotificationType, 
                                preferences: NotificationPreferences, priority: NotificationPriority) -> bool:
        """Check if notification should be sent based on user preferences"""
        
        # Always send critical notifications
        if priority == NotificationPriority.CRITICAL:
            return True
        
        # Check general preferences
        if notification_type in [NotificationType.TRADING_SIGNAL_HIGH, NotificationType.TRADING_SIGNAL_MEDIUM]:
            return preferences.trading_signals_email or preferences.trading_signals_sms
        
        if 'PORTFOLIO' in notification_type.value:
            return preferences.portfolio_reports_email
        
        if 'SECURITY' in notification_type.value or 'LOGIN' in notification_type.value:
            return preferences.security_alerts_email or preferences.security_alerts_sms
        
        # Default to user's general email preference
        return preferences.email_enabled
    
    def _get_delivery_methods(self, notification_type: NotificationType, 
                            preferences: NotificationPreferences, priority: NotificationPriority) -> List[DeliveryMethod]:
        """Determine which delivery methods to use"""
        methods = []
        
        # Email delivery
        if preferences.email_enabled:
            if notification_type in [NotificationType.TRADING_SIGNAL_HIGH, NotificationType.TRADING_SIGNAL_MEDIUM]:
                if preferences.trading_signals_email:
                    methods.append(DeliveryMethod.EMAIL)
            elif 'PORTFOLIO' in notification_type.value:
                if preferences.portfolio_reports_email:
                    methods.append(DeliveryMethod.EMAIL)
            elif notification_type in [NotificationType.SECURITY_ALERT, NotificationType.LOGIN_NEW_DEVICE]:
                if preferences.security_alerts_email:
                    methods.append(DeliveryMethod.EMAIL)
            else:
                methods.append(DeliveryMethod.EMAIL)
        
        # SMS delivery for high priority or critical notifications
        if preferences.sms_enabled and priority in [NotificationPriority.HIGH, NotificationPriority.CRITICAL]:
            if notification_type == NotificationType.TRADING_SIGNAL_HIGH and preferences.trading_signals_sms:
                methods.append(DeliveryMethod.SMS)
            elif notification_type in [NotificationType.SECURITY_ALERT, NotificationType.LOGIN_NEW_DEVICE, 
                                     NotificationType.TWO_FA_CODE] and preferences.security_alerts_sms:
                methods.append(DeliveryMethod.SMS)
        
        return methods
    
    def _is_quiet_hours(self, preferences: NotificationPreferences) -> bool:
        """Check if current time is within user's quiet hours"""
        try:
            user_tz = pytz.timezone(preferences.timezone)
            current_time = datetime.now(user_tz).time()
            
            start_time = datetime.strptime(preferences.quiet_hours_start, '%H:%M').time()
            end_time = datetime.strptime(preferences.quiet_hours_end, '%H:%M').time()
            
            if start_time <= end_time:
                return start_time <= current_time <= end_time
            else:
                return current_time >= start_time or current_time <= end_time
        
        except Exception as e:
            logger.error(f"Error checking quiet hours: {e}")
            return False
    
    def _get_next_send_time(self, preferences: NotificationPreferences) -> datetime:
        """Get next available send time after quiet hours"""
        try:
            user_tz = pytz.timezone(preferences.timezone)
            current_dt = datetime.now(user_tz)
            
            end_time = datetime.strptime(preferences.quiet_hours_end, '%H:%M').time()
            next_send = current_dt.replace(hour=end_time.hour, minute=end_time.minute, second=0, microsecond=0)
            
            if next_send <= current_dt:
                next_send += timedelta(days=1)
            
            return next_send.astimezone(pytz.UTC).replace(tzinfo=None)
        
        except Exception as e:
            logger.error(f"Error calculating next send time: {e}")
            return datetime.utcnow() + timedelta(hours=8)  # Default to 8 hours later
    
    def _generate_message_id(self, user_id: str, notification_type: NotificationType) -> str:
        """Generate unique message ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        hash_input = f"{user_id}_{notification_type.value}_{timestamp}_{os.urandom(8).hex()}"
        return f"msg_{hashlib.sha256(hash_input.encode()).hexdigest()[:16]}"
    
    def _generate_unsubscribe_token(self, user_id: str) -> str:
        """Generate secure unsubscribe token"""
        return hashlib.sha256(f"{user_id}_{os.urandom(32).hex()}".encode()).hexdigest()
    
    async def _log_audit(self, message_id: str, user_id: str, action: str, metadata: Dict[str, Any] = None):
        """Log audit trail entry"""
        audit_id = hashlib.sha256(f"{message_id}_{action}_{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
        
        audit = NotificationAudit(
            audit_id=audit_id,
            message_id=message_id,
            user_id=user_id,
            action=action,
            provider=metadata.get('provider', 'unknown'),
            metadata=metadata or {},
            timestamp=datetime.utcnow().isoformat()
        )
        
        self.audit_trail[audit_id] = audit
    
    # ================================
    # USER PREFERENCE MANAGEMENT
    # ================================
    
    async def get_user_preferences(self, user_id: str) -> Optional[NotificationPreferences]:
        """Get user notification preferences"""
        return self.user_preferences.get(user_id)
    
    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> NotificationPreferences:
        """Update user notification preferences"""
        current_prefs = self.user_preferences.get(user_id)
        
        if current_prefs:
            # Update existing preferences
            for key, value in preferences.items():
                if hasattr(current_prefs, key):
                    setattr(current_prefs, key, value)
            current_prefs.updated_at = datetime.utcnow().isoformat()
        else:
            # Create new preferences
            current_prefs = NotificationPreferences(
                user_id=user_id,
                unsubscribe_token=self._generate_unsubscribe_token(user_id),
                created_at=datetime.utcnow().isoformat(),
                **preferences
            )
        
        self.user_preferences[user_id] = current_prefs
        return current_prefs
    
    async def unsubscribe_user(self, unsubscribe_token: str) -> bool:
        """Unsubscribe user using token"""
        for user_id, prefs in self.user_preferences.items():
            if prefs.unsubscribe_token == unsubscribe_token:
                prefs.email_enabled = False
                prefs.marketing_emails = False
                prefs.updated_at = datetime.utcnow().isoformat()
                
                await self._log_audit('unsubscribe', user_id, 'unsubscribed', {
                    'method': 'token',
                    'token': unsubscribe_token[:8] + '...'
                })
                
                logger.info(f"User {user_id} unsubscribed via token")
                return True
        
        return False
    
    # ================================
    # CONVENIENCE METHODS FOR SPECIFIC NOTIFICATIONS
    # ================================
    
    async def send_welcome_email(self, user_id: str, user_name: str, user_email: str) -> str:
        """Send welcome email to new user"""
        return await self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.WELCOME,
            template_data={
                'user_name': user_name,
                'user_email': user_email,
                'login_url': 'https://qlibpro.com.au/login'
            },
            priority=NotificationPriority.MEDIUM
        )
    
    async def send_kyc_status_update(self, user_id: str, user_name: str, user_email: str, 
                                   status: str, verification_date: str = None) -> str:
        """Send KYC status update notification"""
        if status == 'approved':
            notification_type = NotificationType.KYC_APPROVED
            template_data = {
                'user_name': user_name,
                'user_email': user_email,
                'verification_date': verification_date or datetime.now(self.australia_tz).strftime('%d %B %Y'),
                'next_steps_url': 'https://qlibpro.com.au/dashboard'
            }
        elif status == 'rejected':
            notification_type = NotificationType.KYC_REJECTED
            template_data = {
                'user_name': user_name,
                'user_email': user_email,
                'reapply_url': 'https://qlibpro.com.au/kyc'
            }
        else:
            notification_type = NotificationType.KYC_SUBMITTED
            template_data = {
                'user_name': user_name,
                'user_email': user_email,
                'status_url': 'https://qlibpro.com.au/kyc/status'
            }
        
        return await self.send_notification(
            user_id=user_id,
            notification_type=notification_type,
            template_data=template_data,
            priority=NotificationPriority.MEDIUM
        )
    
    async def send_deposit_confirmation(self, user_id: str, user_name: str, user_email: str,
                                      amount: float, currency: str, transaction_id: str, 
                                      new_balance: float) -> str:
        """Send deposit confirmation notification"""
        return await self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.DEPOSIT_CONFIRMATION,
            template_data={
                'user_name': user_name,
                'user_email': user_email,
                'amount': f"{amount:,.2f}",
                'currency': currency.upper(),
                'transaction_id': transaction_id,
                'new_balance': f"{new_balance:,.2f}",
                'timestamp': datetime.now(self.australia_tz).strftime('%d %B %Y at %I:%M %p AEDT')
            },
            priority=NotificationPriority.MEDIUM
        )
    
    async def send_trading_signal(self, user_id: str, user_name: str, user_email: str,
                                symbol: str, signal: str, confidence: float, 
                                current_price: float, target_price: float, reasoning: str,
                                user_phone: str = None) -> str:
        """Send trading signal notification"""
        
        # Determine signal priority based on confidence
        if confidence >= 85:
            notification_type = NotificationType.TRADING_SIGNAL_HIGH
            priority = NotificationPriority.HIGH
        else:
            notification_type = NotificationType.TRADING_SIGNAL_MEDIUM
            priority = NotificationPriority.MEDIUM
        
        return await self.send_notification(
            user_id=user_id,
            notification_type=notification_type,
            template_data={
                'user_name': user_name,
                'user_email': user_email,
                'user_phone': user_phone,
                'symbol': symbol,
                'signal': signal.upper(),
                'confidence': f"{confidence:.1f}",
                'current_price': f"{current_price:.2f}",
                'target_price': f"{target_price:.2f}",
                'reasoning': reasoning
            },
            priority=priority
        )
    
    async def send_security_alert(self, user_id: str, user_name: str, user_email: str,
                                alert_type: str, ip_address: str, location: str,
                                user_phone: str = None) -> str:
        """Send security alert notification"""
        return await self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.SECURITY_ALERT,
            template_data={
                'user_name': user_name,
                'user_email': user_email,
                'user_phone': user_phone,
                'alert_type': alert_type,
                'ip_address': ip_address,
                'location': location,
                'security_url': 'https://qlibpro.com.au/security',
                'timestamp': datetime.now(self.australia_tz).strftime('%d %B %Y at %I:%M %p AEDT')
            },
            priority=NotificationPriority.CRITICAL
        )
    
    async def send_portfolio_report(self, user_id: str, user_name: str, user_email: str,
                                  period: str, total_return: float, total_return_percent: float,
                                  best_performer: str, worst_performer: str) -> str:
        """Send portfolio performance report"""
        
        if period.lower() == 'weekly':
            notification_type = NotificationType.PORTFOLIO_WEEKLY_REPORT
        elif period.lower() == 'monthly':
            notification_type = NotificationType.PORTFOLIO_MONTHLY_REPORT
        else:
            notification_type = NotificationType.PORTFOLIO_DAILY_REPORT
        
        return await self.send_notification(
            user_id=user_id,
            notification_type=notification_type,
            template_data={
                'user_name': user_name,
                'user_email': user_email,
                'period': period.title(),
                'total_return': f"{total_return:,.2f}",
                'total_return_percent': f"{total_return_percent:+.2f}",
                'best_performer': best_performer,
                'worst_performer': worst_performer,
                'report_url': f'https://qlibpro.com.au/portfolio/reports/{period}'
            },
            priority=NotificationPriority.LOW
        )
    
    # ================================
    # MONITORING AND REPORTING
    # ================================
    
    async def get_notification_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get notification history for user"""
        user_notifications = [
            asdict(msg) for msg in self.notification_history.values() 
            if msg.user_id == user_id
        ]
        
        # Sort by creation date, most recent first
        user_notifications.sort(key=lambda x: x['created_at'], reverse=True)
        
        return user_notifications[:limit]
    
    async def get_delivery_statistics(self, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
        """Get delivery statistics"""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=7)
        if not end_date:
            end_date = datetime.utcnow()
        
        stats = {
            'total_messages': 0,
            'sent': 0,
            'delivered': 0,
            'failed': 0,
            'bounced': 0,
            'by_type': {},
            'by_method': {},
            'success_rate': 0.0
        }
        
        for message in self.notification_history.values():
            created_at = datetime.fromisoformat(message.created_at.replace('Z', '+00:00'))
            
            if start_date <= created_at <= end_date:
                stats['total_messages'] += 1
                
                # Count by status
                if message.status == NotificationStatus.SENT:
                    stats['sent'] += 1
                elif message.status == NotificationStatus.DELIVERED:
                    stats['delivered'] += 1
                elif message.status == NotificationStatus.FAILED:
                    stats['failed'] += 1
                elif message.status == NotificationStatus.BOUNCED:
                    stats['bounced'] += 1
                
                # Count by notification type
                type_key = message.notification_type.value
                stats['by_type'][type_key] = stats['by_type'].get(type_key, 0) + 1
                
                # Count by delivery method
                method_key = message.delivery_method.value
                stats['by_method'][method_key] = stats['by_method'].get(method_key, 0) + 1
        
        # Calculate success rate
        successful = stats['sent'] + stats['delivered']
        if stats['total_messages'] > 0:
            stats['success_rate'] = (successful / stats['total_messages']) * 100
        
        return stats

# ================================
# SERVICE INSTANCE
# ================================

# Global service instance
notification_service = NotificationService()

# ================================
# TESTING FUNCTIONS
# ================================

async def test_notification_system():
    """Test the notification system with sample data"""
    print("🧪 Testing Qlib Pro Notification System")
    
    # Create test user preferences
    test_user_id = "test_user_123"
    await notification_service.update_user_preferences(test_user_id, {
        'email_enabled': True,
        'sms_enabled': True,
        'trading_signals_email': True,
        'trading_signals_sms': True,
        'portfolio_reports_email': True,
        'security_alerts_email': True,
        'security_alerts_sms': True,
        'timezone': 'Australia/Sydney'
    })
    
    print(f"✅ Created preferences for user {test_user_id}")
    
    # Test welcome email
    welcome_msg_id = await notification_service.send_welcome_email(
        user_id=test_user_id,
        user_name="John Smith",
        user_email="john.smith@example.com"
    )
    print(f"✅ Welcome email queued: {welcome_msg_id}")
    
    # Test deposit confirmation
    deposit_msg_id = await notification_service.send_deposit_confirmation(
        user_id=test_user_id,
        user_name="John Smith",
        user_email="john.smith@example.com",
        amount=5000.00,
        currency="AUD",
        transaction_id="TXN_123456789",
        new_balance=15000.00
    )
    print(f"✅ Deposit confirmation queued: {deposit_msg_id}")
    
    # Test trading signal
    signal_msg_id = await notification_service.send_trading_signal(
        user_id=test_user_id,
        user_name="John Smith",
        user_email="john.smith@example.com",
        user_phone="+61412345678",
        symbol="CBA.AX",
        signal="BUY",
        confidence=92.5,
        current_price=98.50,
        target_price=105.00,
        reasoning="Strong technical indicators show bullish momentum with RSI oversold recovery and positive earnings outlook."
    )
    print(f"✅ Trading signal queued: {signal_msg_id}")
    
    # Test security alert
    security_msg_id = await notification_service.send_security_alert(
        user_id=test_user_id,
        user_name="John Smith",
        user_email="john.smith@example.com",
        user_phone="+61412345678",
        alert_type="Login from new device",
        ip_address="203.219.45.123",
        location="Sydney, NSW, Australia"
    )
    print(f"✅ Security alert queued: {security_msg_id}")
    
    # Test KYC approval
    kyc_msg_id = await notification_service.send_kyc_status_update(
        user_id=test_user_id,
        user_name="John Smith",
        user_email="john.smith@example.com",
        status="approved"
    )
    print(f"✅ KYC approval queued: {kyc_msg_id}")
    
    # Wait a moment for processing
    await asyncio.sleep(1)
    
    # Get statistics
    stats = await notification_service.get_delivery_statistics()
    print(f"📊 Delivery Statistics: {stats}")
    
    # Get notification history
    history = await notification_service.get_notification_history(test_user_id)
    print(f"📋 Notification History: {len(history)} messages for user")
    
    print("🎉 Notification system test completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_notification_system())