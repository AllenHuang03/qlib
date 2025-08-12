#!/usr/bin/env python3
"""
COMPREHENSIVE 2FA AUTHENTICATION SERVICE
SMS, Email, and TOTP verification for Australian trading platform
Integrates with Twilio for SMS and AWS SES for email
"""

import os
import secrets
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Twilio SDK (install with: pip install twilio)
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logging.warning("Twilio not installed - SMS features disabled")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# CONFIGURATION
# ================================

# Twilio Configuration (for SMS in Australia)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")  # Your Twilio AU number

# Email Configuration (SMTP or AWS SES)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@qlibpro.com.au")

# AWS SES Configuration (alternative to SMTP)
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")  # Australia region
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Security Configuration
CODE_LENGTH = 6
CODE_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 3
RATE_LIMIT_WINDOW = timedelta(minutes=1)
RATE_LIMIT_MAX_REQUESTS = 5

# ================================
# DATA MODELS
# ================================

@dataclass
class VerificationCode:
    user_id: str
    code: str
    code_type: str  # 'sms', 'email', 'totp'
    expires_at: datetime
    attempts: int = 0
    is_used: bool = False
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

@dataclass
class TwoFactorSetup:
    secret: str
    qr_code: str
    backup_codes: List[str]
    setup_uri: str

@dataclass
class AuthenticationResult:
    success: bool
    user_id: Optional[str] = None
    requires_2fa: bool = False
    message: str = ""
    token: Optional[str] = None

# ================================
# 2FA AUTHENTICATION SERVICE
# ================================

class TwoFactorAuthService:
    """Complete 2FA service for Australian trading platform"""
    
    def __init__(self):
        self.verification_codes: Dict[str, VerificationCode] = {}
        self.rate_limits: Dict[str, List[datetime]] = {}
        self.failed_attempts: Dict[str, int] = {}
        
        # Initialize Twilio client
        self.twilio_client = None
        if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            try:
                self.twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                logger.info("✅ Twilio SMS service initialized")
            except Exception as e:
                logger.error(f"❌ Twilio initialization failed: {e}")
        
        # Check email configuration
        self.email_configured = bool(SMTP_USERNAME and SMTP_PASSWORD)
        if self.email_configured:
            logger.info("✅ Email service configured")
        else:
            logger.warning("⚠️ Email service not configured")
    
    # ================================
    # TOTP (Time-based One-Time Password)
    # ================================
    
    def generate_totp_secret(self, user_email: str) -> TwoFactorSetup:
        """Generate TOTP secret and QR code for authenticator apps"""
        try:
            # Generate secret
            secret = pyotp.random_base32()
            
            # Create TOTP instance
            totp = pyotp.TOTP(secret)
            
            # Generate setup URI for authenticator apps
            setup_uri = totp.provisioning_uri(
                name=user_email,
                issuer_name="Qlib Pro Australia",
                image="https://qlibpro.com.au/logo.png"
            )
            
            # Generate QR code
            qr_code_data = self._generate_qr_code(setup_uri)
            
            # Generate backup codes
            backup_codes = [self._generate_backup_code() for _ in range(8)]
            
            return TwoFactorSetup(
                secret=secret,
                qr_code=qr_code_data,
                backup_codes=backup_codes,
                setup_uri=setup_uri
            )
            
        except Exception as e:
            logger.error(f"Error generating TOTP setup: {e}")
            raise Exception("Failed to generate 2FA setup")
    
    def verify_totp_code(self, secret: str, code: str, user_id: str = None) -> bool:
        """Verify TOTP code from authenticator app"""
        try:
            # Check rate limiting
            if user_id and not self._check_rate_limit(f"totp_{user_id}"):
                logger.warning(f"Rate limit exceeded for TOTP verification: {user_id}")
                return False
            
            # Verify code
            totp = pyotp.TOTP(secret)
            
            # Allow for time drift (±1 window)
            is_valid = totp.verify(code, valid_window=1)
            
            if not is_valid and user_id:
                self._increment_failed_attempts(f"totp_{user_id}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying TOTP: {e}")
            return False
    
    def verify_backup_code(self, user_id: str, code: str, backup_codes: List[str]) -> Tuple[bool, List[str]]:
        """Verify backup code and remove it from the list"""
        try:
            code_upper = code.upper().replace(" ", "").replace("-", "")
            
            for i, backup_code in enumerate(backup_codes):
                if backup_code.replace(" ", "").replace("-", "") == code_upper:
                    # Remove used backup code
                    remaining_codes = backup_codes.copy()
                    remaining_codes.pop(i)
                    return True, remaining_codes
            
            return False, backup_codes
            
        except Exception as e:
            logger.error(f"Error verifying backup code: {e}")
            return False, backup_codes
    
    # ================================
    # SMS VERIFICATION
    # ================================
    
    async def send_sms_code(self, user_id: str, phone_number: str, purpose: str = "verification") -> bool:
        """Send SMS verification code to Australian mobile number"""
        try:
            # Validate Australian phone number
            if not self._validate_au_phone_number(phone_number):
                logger.error(f"Invalid Australian phone number: {phone_number}")
                return False
            
            # Check rate limiting
            rate_key = f"sms_{user_id}"
            if not self._check_rate_limit(rate_key):
                logger.warning(f"SMS rate limit exceeded for user: {user_id}")
                return False
            
            # Generate verification code
            code = self._generate_numeric_code()
            expires_at = datetime.now() + timedelta(minutes=CODE_EXPIRY_MINUTES)
            
            # Store verification code
            self.verification_codes[f"{user_id}_sms"] = VerificationCode(
                user_id=user_id,
                code=code,
                code_type="sms",
                expires_at=expires_at
            )
            
            # Format phone number for Australia
            formatted_phone = self._format_au_phone_number(phone_number)
            
            # Send SMS via Twilio
            if self.twilio_client:
                message_body = self._generate_sms_message(code, purpose)
                
                message = self.twilio_client.messages.create(
                    body=message_body,
                    from_=TWILIO_PHONE_NUMBER,
                    to=formatted_phone
                )
                
                logger.info(f"SMS sent to {formatted_phone}: {message.sid}")
                return True
            
            else:
                # Fallback: Log code for testing (remove in production)
                logger.info(f"SMS fallback - Code for {formatted_phone}: {code}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {e}")
            return False
    
    def verify_sms_code(self, user_id: str, code: str) -> bool:
        """Verify SMS code"""
        try:
            verification_key = f"{user_id}_sms"
            
            if verification_key not in self.verification_codes:
                return False
            
            verification = self.verification_codes[verification_key]
            
            # Check if already used
            if verification.is_used:
                return False
            
            # Check expiry
            if datetime.now() > verification.expires_at:
                del self.verification_codes[verification_key]
                return False
            
            # Check attempts
            verification.attempts += 1
            if verification.attempts > MAX_ATTEMPTS:
                del self.verification_codes[verification_key]
                return False
            
            # Verify code
            if verification.code == code:
                verification.is_used = True
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verifying SMS code: {e}")
            return False
    
    # ================================
    # EMAIL VERIFICATION
    # ================================
    
    async def send_email_code(self, user_id: str, email: str, user_name: str, purpose: str = "verification") -> bool:
        """Send email verification code"""
        try:
            # Check rate limiting
            rate_key = f"email_{user_id}"
            if not self._check_rate_limit(rate_key):
                logger.warning(f"Email rate limit exceeded for user: {user_id}")
                return False
            
            # Generate verification code
            code = self._generate_numeric_code()
            expires_at = datetime.now() + timedelta(minutes=CODE_EXPIRY_MINUTES)
            
            # Store verification code
            self.verification_codes[f"{user_id}_email"] = VerificationCode(
                user_id=user_id,
                code=code,
                code_type="email",
                expires_at=expires_at
            )
            
            # Send email
            if self.email_configured:
                await self._send_verification_email(email, user_name, code, purpose)
                logger.info(f"Verification email sent to {email}")
                return True
            else:
                # Fallback: Log code for testing (remove in production)
                logger.info(f"Email fallback - Code for {email}: {code}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending email to {email}: {e}")
            return False
    
    def verify_email_code(self, user_id: str, code: str) -> bool:
        """Verify email code"""
        try:
            verification_key = f"{user_id}_email"
            
            if verification_key not in self.verification_codes:
                return False
            
            verification = self.verification_codes[verification_key]
            
            # Check if already used
            if verification.is_used:
                return False
            
            # Check expiry
            if datetime.now() > verification.expires_at:
                del self.verification_codes[verification_key]
                return False
            
            # Check attempts
            verification.attempts += 1
            if verification.attempts > MAX_ATTEMPTS:
                del self.verification_codes[verification_key]
                return False
            
            # Verify code
            if verification.code == code:
                verification.is_used = True
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verifying email code: {e}")
            return False
    
    # ================================
    # UTILITY METHODS
    # ================================
    
    def _generate_qr_code(self, data: str) -> str:
        """Generate QR code as base64 image"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_data}"
            
        except Exception as e:
            logger.error(f"Error generating QR code: {e}")
            return ""
    
    def _generate_backup_code(self) -> str:
        """Generate a backup code in format XXXX-XXXX"""
        part1 = f"{secrets.randbelow(10000):04d}"
        part2 = f"{secrets.randbelow(10000):04d}"
        return f"{part1}-{part2}"
    
    def _generate_numeric_code(self) -> str:
        """Generate 6-digit numeric code"""
        return f"{secrets.randbelow(900000) + 100000:06d}"
    
    def _validate_au_phone_number(self, phone: str) -> bool:
        """Validate Australian mobile phone number"""
        # Remove all non-digits
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # Australian mobile numbers: 04XXXXXXXX or 614XXXXXXXX
        if len(digits_only) == 10 and digits_only.startswith('04'):
            return True
        elif len(digits_only) == 12 and digits_only.startswith('614'):
            return True
        elif len(digits_only) == 11 and digits_only.startswith('614'):
            return True
        
        return False
    
    def _format_au_phone_number(self, phone: str) -> str:
        """Format Australian phone number for international SMS"""
        digits_only = ''.join(filter(str.isdigit, phone))
        
        if digits_only.startswith('04'):
            # Convert 04XXXXXXXX to +614XXXXXXXX
            return f"+614{digits_only[2:]}"
        elif digits_only.startswith('614'):
            # Already in international format
            return f"+{digits_only}"
        
        return phone  # Return as-is if can't format
    
    def _generate_sms_message(self, code: str, purpose: str) -> str:
        """Generate SMS message body"""
        app_name = "Qlib Pro Australia"
        
        if purpose == "login":
            return f"Your {app_name} login code is: {code}. Valid for {CODE_EXPIRY_MINUTES} minutes. Don't share this code."
        elif purpose == "2fa_setup":
            return f"Your {app_name} 2FA setup code is: {code}. Valid for {CODE_EXPIRY_MINUTES} minutes."
        else:
            return f"Your {app_name} verification code is: {code}. Valid for {CODE_EXPIRY_MINUTES} minutes."
    
    async def _send_verification_email(self, email: str, name: str, code: str, purpose: str):
        """Send verification email via SMTP"""
        try:
            subject = self._get_email_subject(purpose)
            html_body = self._generate_email_body(name, code, purpose)
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = FROM_EMAIL
            msg['To'] = email
            
            # Add HTML content
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            raise
    
    def _get_email_subject(self, purpose: str) -> str:
        """Get email subject based on purpose"""
        subjects = {
            "login": "Qlib Pro - Login Verification Code",
            "2fa_setup": "Qlib Pro - Two-Factor Authentication Setup",
            "verification": "Qlib Pro - Account Verification"
        }
        return subjects.get(purpose, "Qlib Pro - Verification Code")
    
    def _generate_email_body(self, name: str, code: str, purpose: str) -> str:
        """Generate HTML email body"""
        app_name = "Qlib Pro Australia"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container {{ 
                    font-family: Arial, sans-serif; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{ 
                    background: linear-gradient(135deg, #1e3c72, #2a5298); 
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{ 
                    background: white; 
                    padding: 30px 20px; 
                    border-radius: 0 0 10px 10px;
                }}
                .code-box {{ 
                    background: #f0f4f8; 
                    border: 2px solid #2a5298; 
                    border-radius: 8px; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0;
                }}
                .code {{ 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #1e3c72; 
                    letter-spacing: 5px;
                }}
                .footer {{ 
                    text-align: center; 
                    color: #666; 
                    font-size: 12px; 
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 {app_name}</h1>
                    <p>Secure Trading Platform</p>
                </div>
                <div class="content">
                    <h2>Hello {name}!</h2>
                    <p>Your verification code is ready:</p>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                        <p><small>Enter this code to continue</small></p>
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This code expires in {CODE_EXPIRY_MINUTES} minutes</li>
                        <li>Don't share this code with anyone</li>
                        <li>Our team will never ask for this code</li>
                    </ul>
                    
                    <p>If you didn't request this code, please ignore this email or contact our security team.</p>
                </div>
                <div class="footer">
                    <p>{app_name} - Australian Quantitative Trading Platform</p>
                    <p>📧 support@qlibpro.com.au | 🔒 Secure & Trusted</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _check_rate_limit(self, key: str) -> bool:
        """Check if request is within rate limits"""
        now = datetime.now()
        
        # Clean old entries
        if key in self.rate_limits:
            self.rate_limits[key] = [
                timestamp for timestamp in self.rate_limits[key]
                if now - timestamp < RATE_LIMIT_WINDOW
            ]
        else:
            self.rate_limits[key] = []
        
        # Check limit
        if len(self.rate_limits[key]) >= RATE_LIMIT_MAX_REQUESTS:
            return False
        
        # Add current request
        self.rate_limits[key].append(now)
        return True
    
    def _increment_failed_attempts(self, key: str):
        """Track failed attempts"""
        self.failed_attempts[key] = self.failed_attempts.get(key, 0) + 1
    
    def cleanup_expired_codes(self):
        """Clean up expired verification codes"""
        now = datetime.now()
        expired_keys = []
        
        for key, verification in self.verification_codes.items():
            if now > verification.expires_at:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.verification_codes[key]
        
        logger.info(f"Cleaned up {len(expired_keys)} expired verification codes")

# ================================
# ENHANCED AUTHENTICATION ENDPOINTS
# ================================

class EnhancedAuthService:
    """Enhanced authentication service with 2FA support"""
    
    def __init__(self, twofa_service: TwoFactorAuthService):
        self.twofa_service = twofa_service
    
    async def authenticate_with_2fa(self, email: str, password: str, twofa_code: Optional[str] = None) -> AuthenticationResult:
        """Authenticate user with optional 2FA"""
        try:
            # Step 1: Verify credentials (integrate with your existing auth)
            # This would call your existing authentication logic
            user = await self._verify_credentials(email, password)
            
            if not user:
                return AuthenticationResult(
                    success=False,
                    message="Invalid credentials"
                )
            
            # Step 2: Check if 2FA is enabled
            if not user.get('two_factor_enabled', False):
                # No 2FA required - login successful
                token = self._generate_jwt_token(user)
                return AuthenticationResult(
                    success=True,
                    user_id=user['id'],
                    token=token,
                    message="Login successful"
                )
            
            # Step 3: 2FA is enabled - verify code
            if not twofa_code:
                return AuthenticationResult(
                    success=False,
                    requires_2fa=True,
                    user_id=user['id'],
                    message="2FA code required"
                )
            
            # Verify 2FA code
            is_valid_totp = False
            if user.get('two_factor_secret'):
                is_valid_totp = self.twofa_service.verify_totp_code(
                    user['two_factor_secret'], 
                    twofa_code, 
                    user['id']
                )
            
            # Check backup codes if TOTP fails
            if not is_valid_totp and user.get('backup_codes'):
                is_valid_backup, remaining_codes = self.twofa_service.verify_backup_code(
                    user['id'], 
                    twofa_code, 
                    user['backup_codes']
                )
                
                if is_valid_backup:
                    # Update user's backup codes
                    await self._update_backup_codes(user['id'], remaining_codes)
                    is_valid_totp = True
            
            if is_valid_totp:
                token = self._generate_jwt_token(user)
                return AuthenticationResult(
                    success=True,
                    user_id=user['id'],
                    token=token,
                    message="Login successful with 2FA"
                )
            else:
                return AuthenticationResult(
                    success=False,
                    message="Invalid 2FA code"
                )
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return AuthenticationResult(
                success=False,
                message="Authentication failed"
            )
    
    async def setup_2fa_for_user(self, user_id: str, user_email: str) -> Dict:
        """Setup 2FA for user"""
        try:
            setup = self.twofa_service.generate_totp_secret(user_email)
            
            # Store secret in database (you'll implement this)
            await self._store_2fa_secret(user_id, setup.secret, setup.backup_codes)
            
            return {
                "qr_code": setup.qr_code,
                "secret": setup.secret,
                "backup_codes": setup.backup_codes,
                "setup_uri": setup.setup_uri
            }
            
        except Exception as e:
            logger.error(f"2FA setup error: {e}")
            raise Exception("Failed to setup 2FA")
    
    # Implement these methods based on your database/auth system
    async def _verify_credentials(self, email: str, password: str) -> Optional[Dict]:
        """Verify user credentials - implement with your auth system"""
        pass
    
    async def _store_2fa_secret(self, user_id: str, secret: str, backup_codes: List[str]):
        """Store 2FA secret - implement with your database"""
        pass
    
    async def _update_backup_codes(self, user_id: str, backup_codes: List[str]):
        """Update backup codes - implement with your database"""
        pass
    
    def _generate_jwt_token(self, user: Dict) -> str:
        """Generate JWT token - implement with your JWT system"""
        pass

# ================================
# GLOBAL INSTANCE
# ================================

# Create global instance
twofa_service = TwoFactorAuthService()
enhanced_auth = EnhancedAuthService(twofa_service)

# Export for easy importing
__all__ = ['TwoFactorAuthService', 'EnhancedAuthService', 'twofa_service', 'enhanced_auth']