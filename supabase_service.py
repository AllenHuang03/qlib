#!/usr/bin/env python3
"""
SUPABASE INTEGRATION SERVICE
Complete database service for Australian trading platform
Replaces in-memory storage with production-ready Supabase backend
"""

import os
import asyncio
import hashlib
import secrets
import pyotp
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from supabase import create_client, Client
from postgrest.exceptions import APIError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# CONFIGURATION
# ================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://egbirkjdybtcxlzodclt.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlya2pkeWJ0Y3hsem9kY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTYwMTQsImV4cCI6MjA3MDE5MjAxNH0.xT_eUhF7K5cdRGBFlFHHyyJ7SH5g3UIPBbZ2IJj9irc")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlya2pkeWJ0Y3hsem9kY2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYxNjAxNCwiZXhwIjoyMDcwMTkyMDE0fQ.f09V_u4C63yVPxJqRyrujMclxpaLrSFh3iMCnOBc7pg")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    logger.warning("Supabase credentials not configured - using fallback mode")

# ================================
# DATA MODELS
# ================================

@dataclass
class UserProfile:
    id: str
    email: str
    name: str
    role: str
    status: str
    subscription_tier: str
    paper_trading: bool
    country: str
    timezone: str
    phone_number: Optional[str] = None
    phone_verified: bool = False
    email_verified: bool = False
    two_factor_enabled: bool = False
    preferences: Dict = None
    created_at: str = None
    last_login: Optional[str] = None

@dataclass
class Portfolio:
    id: str
    user_id: str
    name: str
    description: Optional[str]
    is_paper: bool
    starting_balance: float
    current_balance: float
    currency: str
    created_at: str
    updated_at: str

@dataclass
class MarketQuote:
    symbol: str
    price: float
    change_amount: float
    change_percent: float
    volume: int
    currency: str
    source: str
    timestamp: str

@dataclass
class AISignal:
    id: str
    model_id: str
    symbol: str
    signal: str  # BUY, SELL, HOLD
    confidence: float
    target_price: float
    current_price: float
    reasoning: str
    generated_at: str
    expires_at: Optional[str] = None

# ================================
# SUPABASE SERVICE CLASS
# ================================

class SupabaseService:
    """Production-ready Supabase integration for Australian trading platform"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.is_connected = False
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize Supabase connection with error handling"""
        try:
            if SUPABASE_URL and SUPABASE_ANON_KEY:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
                self.is_connected = True
                logger.info("✅ Supabase connection established")
            else:
                logger.warning("⚠️ Supabase not configured - using fallback mode")
                self.is_connected = False
        except Exception as e:
            logger.error(f"❌ Supabase connection failed: {e}")
            self.is_connected = False
    
    # ================================
    # USER MANAGEMENT
    # ================================
    
    async def create_user(self, email: str, password: str, name: str, **kwargs) -> UserProfile:
        """Create new user with Australian defaults"""
        if not self.is_connected:
            raise Exception("Supabase not connected")
        
        try:
            # Hash password
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # Prepare user data with Australian defaults
            user_data = {
                'email': email,
                'name': name,
                'password_hash': password_hash,
                'role': kwargs.get('role', 'user'),
                'status': 'active',
                'subscription_tier': kwargs.get('subscription_tier', 'free'),
                'paper_trading': kwargs.get('paper_trading', True),
                'country': 'AU',  # Australian market focus
                'timezone': 'Australia/Sydney',
                'phone_number': kwargs.get('phone_number'),
                'preferences': {
                    'notifications': True,
                    'paper_mode': True,
                    'risk_tolerance': 'medium',
                    'currency': 'AUD',
                    'theme': 'light'
                }
            }
            
            # Insert user
            result = self.supabase.table('users').insert(user_data).execute()
            
            if result.data:
                user_record = result.data[0]
                
                # Create default portfolio
                await self._create_default_portfolio(user_record['id'])
                
                # Create default watchlist with ASX stocks
                await self._create_default_watchlist(user_record['id'])
                
                return self._map_user_record(user_record)
            
            raise Exception("Failed to create user")
            
        except APIError as e:
            logger.error(f"Database error creating user: {e}")
            raise Exception(f"User creation failed: {e}")
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserProfile]:
        """Authenticate user and update login tracking"""
        if not self.is_connected:
            # Fallback to demo user
            if email == "demo@qlib.com" and password == "demo123":
                return self._get_demo_user()
            return None
        
        try:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # Get user by email and password
            result = self.supabase.table('users').select('*').eq('email', email).eq('password_hash', password_hash).execute()
            
            if result.data:
                user_record = result.data[0]
                
                # Update login tracking
                self.supabase.table('users').update({
                    'last_login': datetime.now().isoformat(),
                    'login_count': user_record.get('login_count', 0) + 1
                }).eq('id', user_record['id']).execute()
                
                return self._map_user_record(user_record)
            
            return None
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get complete user profile"""
        if not self.is_connected:
            return self._get_demo_user() if user_id == "demo-user-1" else None
        
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if result.data:
                return self._map_user_record(result.data[0])
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None
    
    async def update_user_profile(self, user_id: str, updates: Dict) -> bool:
        """Update user profile with validation"""
        if not self.is_connected:
            return True  # Fallback mode
        
        try:
            # Filter allowed updates
            allowed_fields = ['name', 'phone_number', 'preferences', 'two_factor_enabled']
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if not filtered_updates:
                return True
            
            result = self.supabase.table('users').update(filtered_updates).eq('id', user_id).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    # ================================
    # TWO-FACTOR AUTHENTICATION
    # ================================
    
    async def enable_2fa(self, user_id: str) -> Dict[str, str]:
        """Enable 2FA and return setup info"""
        if not self.is_connected:
            return {"secret": "DEMO2FA", "qr_code": "demo-qr-code"}
        
        try:
            # Generate 2FA secret
            secret = pyotp.random_base32()
            
            # Generate backup codes
            backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
            
            # Update user record
            result = self.supabase.table('users').update({
                'two_factor_secret': secret,
                'backup_codes': backup_codes,
                'two_factor_enabled': True
            }).eq('id', user_id).execute()
            
            if result.data:
                user = result.data[0]
                totp = pyotp.TOTP(secret)
                qr_uri = totp.provisioning_uri(
                    name=user['email'],
                    issuer_name="Qlib Pro Australia"
                )
                
                return {
                    "secret": secret,
                    "qr_code": qr_uri,
                    "backup_codes": backup_codes
                }
            
            raise Exception("Failed to enable 2FA")
            
        except Exception as e:
            logger.error(f"Error enabling 2FA: {e}")
            raise
    
    async def verify_2fa_code(self, user_id: str, code: str) -> bool:
        """Verify 2FA code (TOTP or backup code)"""
        if not self.is_connected:
            return code == "123456"  # Demo mode
        
        try:
            user_result = self.supabase.table('users').select('two_factor_secret', 'backup_codes').eq('id', user_id).execute()
            
            if not user_result.data:
                return False
            
            user = user_result.data[0]
            secret = user.get('two_factor_secret')
            backup_codes = user.get('backup_codes', [])
            
            # Check TOTP code
            if secret:
                totp = pyotp.TOTP(secret)
                if totp.verify(code):
                    return True
            
            # Check backup codes
            if code.upper() in backup_codes:
                # Remove used backup code
                backup_codes.remove(code.upper())
                self.supabase.table('users').update({
                    'backup_codes': backup_codes
                }).eq('id', user_id).execute()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verifying 2FA: {e}")
            return False
    
    async def send_sms_verification(self, user_id: str, phone_number: str) -> bool:
        """Send SMS verification code (integrate with Twilio/AWS SNS)"""
        if not self.is_connected:
            return True  # Demo mode
        
        try:
            # Generate 6-digit code
            code = f"{secrets.randbelow(900000) + 100000:06d}"
            expires_at = datetime.now() + timedelta(minutes=5)
            
            # Store verification code
            self.supabase.table('verification_codes').insert({
                'user_id': user_id,
                'code': code,
                'code_type': 'sms',
                'expires_at': expires_at.isoformat()
            }).execute()
            
            # TODO: Integrate with Twilio for Australian SMS
            # For now, log the code (remove in production)
            logger.info(f"SMS code for {phone_number}: {code}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            return False
    
    # ================================
    # PORTFOLIO MANAGEMENT
    # ================================
    
    async def get_user_portfolios(self, user_id: str) -> List[Portfolio]:
        """Get all user portfolios"""
        if not self.is_connected:
            return [self._get_demo_portfolio()]
        
        try:
            result = self.supabase.table('portfolios').select('*').eq('user_id', user_id).execute()
            
            return [self._map_portfolio_record(record) for record in result.data]
            
        except Exception as e:
            logger.error(f"Error fetching portfolios: {e}")
            return []
    
    async def create_portfolio(self, user_id: str, name: str, **kwargs) -> Portfolio:
        """Create new portfolio"""
        if not self.is_connected:
            return self._get_demo_portfolio()
        
        try:
            portfolio_data = {
                'user_id': user_id,
                'name': name,
                'description': kwargs.get('description'),
                'is_paper': kwargs.get('is_paper', True),
                'starting_balance': kwargs.get('starting_balance', 100000.00),
                'current_balance': kwargs.get('current_balance', 100000.00),
                'currency': kwargs.get('currency', 'AUD')
            }
            
            result = self.supabase.table('portfolios').insert(portfolio_data).execute()
            
            if result.data:
                return self._map_portfolio_record(result.data[0])
            
            raise Exception("Failed to create portfolio")
            
        except Exception as e:
            logger.error(f"Error creating portfolio: {e}")
            raise
    
    # ================================
    # WATCHLIST MANAGEMENT
    # ================================
    
    async def get_user_watchlist(self, user_id: str) -> List[str]:
        """Get user's default watchlist symbols"""
        if not self.is_connected:
            return ['CBA.AX', 'BHP.AX', 'CSL.AX']  # Demo ASX stocks
        
        try:
            # Get default watchlist
            watchlist_result = self.supabase.table('watchlists').select('id').eq('user_id', user_id).eq('is_default', True).execute()
            
            if not watchlist_result.data:
                return []
            
            watchlist_id = watchlist_result.data[0]['id']
            
            # Get watchlist items
            items_result = self.supabase.table('watchlist_items').select('symbol').eq('watchlist_id', watchlist_id).execute()
            
            return [item['symbol'] for item in items_result.data]
            
        except Exception as e:
            logger.error(f"Error fetching watchlist: {e}")
            return ['CBA.AX', 'BHP.AX', 'CSL.AX']  # Fallback
    
    async def add_to_watchlist(self, user_id: str, symbol: str) -> bool:
        """Add symbol to user's watchlist"""
        if not self.is_connected:
            return True
        
        try:
            # Get or create default watchlist
            watchlist_id = await self._get_or_create_default_watchlist(user_id)
            
            # Check if symbol already exists
            existing = self.supabase.table('watchlist_items').select('id').eq('watchlist_id', watchlist_id).eq('symbol', symbol).execute()
            
            if existing.data:
                return True  # Already exists
            
            # Add new item
            result = self.supabase.table('watchlist_items').insert({
                'watchlist_id': watchlist_id,
                'symbol': symbol.upper()
            }).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error adding to watchlist: {e}")
            return False
    
    # ================================
    # MARKET DATA & AI SIGNALS
    # ================================
    
    async def store_market_data(self, quotes: List[Dict]) -> bool:
        """Store market data in database"""
        if not self.is_connected:
            return True
        
        try:
            # Prepare market data records
            market_records = []
            for quote_dict in quotes:
                market_records.append({
                    'symbol': quote_dict['symbol'],
                    'price': quote_dict['price'],
                    'change_amount': quote_dict.get('change', 0),
                    'change_percent': float(quote_dict.get('change_percent', '0').replace('%', '')),
                    'volume': quote_dict.get('volume', 0),
                    'currency': quote_dict.get('currency', 'AUD'),
                    'source': quote_dict.get('source', 'alpha_vantage'),
                    'timestamp': quote_dict.get('last_updated', datetime.now().isoformat())
                })
            
            # Batch insert
            result = self.supabase.table('market_data').insert(market_records).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error storing market data: {e}")
            return False
    
    async def store_ai_signals(self, model_id: str, signals: List[Dict]) -> bool:
        """Store AI trading signals"""
        if not self.is_connected:
            return True
        
        try:
            signal_records = []
            for signal_dict in signals:
                expires_at = datetime.now() + timedelta(hours=24)  # Signals expire in 24 hours
                
                signal_records.append({
                    'model_id': model_id,
                    'symbol': signal_dict['symbol'],
                    'signal': signal_dict['signal'],
                    'confidence': signal_dict['confidence'],
                    'target_price': signal_dict.get('target_price'),
                    'current_price': signal_dict['current_price'],
                    'reasoning': signal_dict.get('reasoning', ''),
                    'change_percent': float(signal_dict.get('change_percent', '0').replace('%', '').replace('+', '')),
                    'generated_at': signal_dict.get('generated_at', datetime.now().isoformat()),
                    'expires_at': expires_at.isoformat()
                })
            
            result = self.supabase.table('ai_signals').insert(signal_records).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error storing AI signals: {e}")
            return False
    
    async def get_active_signals(self, user_id: str, symbols: Optional[List[str]] = None) -> List[AISignal]:
        """Get active AI signals for user"""
        if not self.is_connected:
            return []  # Fallback mode
        
        try:
            query = self.supabase.table('v_active_signals').select('*')
            
            if symbols:
                query = query.in_('symbol', symbols)
            
            result = query.limit(50).execute()
            
            return [self._map_signal_record(record) for record in result.data]
            
        except Exception as e:
            logger.error(f"Error fetching signals: {e}")
            return []
    
    # ================================
    # AUSTRALIAN MARKET SPECIFIC
    # ================================
    
    async def get_asx_instruments(self, sector: Optional[str] = None) -> List[Dict]:
        """Get ASX listed instruments"""
        if not self.is_connected:
            return self._get_demo_asx_stocks()
        
        try:
            query = self.supabase.table('au_instruments').select('*').eq('is_active', True)
            
            if sector:
                query = query.eq('sector', sector)
            
            result = query.execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error fetching ASX instruments: {e}")
            return self._get_demo_asx_stocks()
    
    async def get_trading_calendar(self, start_date: str, end_date: str) -> List[Dict]:
        """Get Australian trading calendar"""
        if not self.is_connected:
            return []
        
        try:
            result = self.supabase.table('au_trading_calendar').select('*').gte('date', start_date).lte('date', end_date).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error fetching trading calendar: {e}")
            return []
    
    # ================================
    # HELPER METHODS
    # ================================
    
    async def _create_default_portfolio(self, user_id: str):
        """Create default portfolio for new user"""
        return await self.create_portfolio(
            user_id=user_id,
            name="My Portfolio",
            description="Default portfolio for paper trading",
            is_paper=True,
            starting_balance=100000.00,
            currency="AUD"
        )
    
    async def _create_default_watchlist(self, user_id: str):
        """Create default watchlist with ASX stocks"""
        try:
            # Create watchlist
            watchlist_result = self.supabase.table('watchlists').insert({
                'user_id': user_id,
                'name': 'My Watchlist',
                'is_default': True
            }).execute()
            
            if watchlist_result.data:
                watchlist_id = watchlist_result.data[0]['id']
                
                # Add default ASX stocks
                default_symbols = ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX']
                watchlist_items = [
                    {'watchlist_id': watchlist_id, 'symbol': symbol}
                    for symbol in default_symbols
                ]
                
                self.supabase.table('watchlist_items').insert(watchlist_items).execute()
        
        except Exception as e:
            logger.error(f"Error creating default watchlist: {e}")
    
    async def _get_or_create_default_watchlist(self, user_id: str) -> str:
        """Get or create user's default watchlist ID"""
        result = self.supabase.table('watchlists').select('id').eq('user_id', user_id).eq('is_default', True).execute()
        
        if result.data:
            return result.data[0]['id']
        
        # Create default watchlist
        await self._create_default_watchlist(user_id)
        
        # Try again
        result = self.supabase.table('watchlists').select('id').eq('user_id', user_id).eq('is_default', True).execute()
        return result.data[0]['id'] if result.data else None
    
    def _map_user_record(self, record: Dict) -> UserProfile:
        """Map database record to UserProfile"""
        return UserProfile(
            id=record['id'],
            email=record['email'],
            name=record['name'],
            role=record['role'],
            status=record['status'],
            subscription_tier=record['subscription_tier'],
            paper_trading=record['paper_trading'],
            country=record['country'],
            timezone=record['timezone'],
            phone_number=record.get('phone_number'),
            phone_verified=record.get('phone_verified', False),
            email_verified=record.get('email_verified', False),
            two_factor_enabled=record.get('two_factor_enabled', False),
            preferences=record.get('preferences', {}),
            created_at=record['created_at'],
            last_login=record.get('last_login')
        )
    
    def _map_portfolio_record(self, record: Dict) -> Portfolio:
        """Map database record to Portfolio"""
        return Portfolio(
            id=record['id'],
            user_id=record['user_id'],
            name=record['name'],
            description=record.get('description'),
            is_paper=record['is_paper'],
            starting_balance=float(record['starting_balance']),
            current_balance=float(record['current_balance']),
            currency=record['currency'],
            created_at=record['created_at'],
            updated_at=record['updated_at']
        )
    
    def _map_signal_record(self, record: Dict) -> AISignal:
        """Map database record to AISignal"""
        return AISignal(
            id=record['id'],
            model_id=record.get('model_id', 'demo-model'),
            symbol=record['symbol'],
            signal=record['signal'],
            confidence=float(record['confidence']),
            target_price=float(record['target_price']) if record.get('target_price') else 0,
            current_price=float(record['current_price']),
            reasoning=record.get('reasoning', ''),
            generated_at=record['generated_at']
        )
    
    def _get_demo_user(self) -> UserProfile:
        """Demo user for fallback mode"""
        return UserProfile(
            id="demo-user-1",
            email="demo@qlib.com",
            name="Demo User",
            role="user",
            status="active",
            subscription_tier="free",
            paper_trading=True,
            country="AU",
            timezone="Australia/Sydney",
            preferences={
                "notifications": True,
                "paper_mode": True,
                "risk_tolerance": "medium",
                "currency": "AUD"
            },
            created_at=datetime.now().isoformat()
        )
    
    def _get_demo_portfolio(self) -> Portfolio:
        """Demo portfolio for fallback mode"""
        return Portfolio(
            id="demo-portfolio-1",
            user_id="demo-user-1",
            name="Demo Portfolio",
            description="Paper trading portfolio",
            is_paper=True,
            starting_balance=100000.00,
            current_balance=105000.00,
            currency="AUD",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
    
    def _get_demo_asx_stocks(self) -> List[Dict]:
        """Demo ASX stocks for fallback mode"""
        return [
            {"symbol": "CBA.AX", "name": "Commonwealth Bank of Australia", "sector": "Financials"},
            {"symbol": "BHP.AX", "name": "BHP Group", "sector": "Materials"},
            {"symbol": "CSL.AX", "name": "CSL Limited", "sector": "Healthcare"},
            {"symbol": "WBC.AX", "name": "Westpac Banking Corporation", "sector": "Financials"},
            {"symbol": "ANZ.AX", "name": "Australia and New Zealand Banking Group", "sector": "Financials"}
        ]

# ================================
# GLOBAL INSTANCE
# ================================

# Create global instance for use in API endpoints
supabase_service = SupabaseService()

# Export for easy importing
__all__ = ['SupabaseService', 'supabase_service', 'UserProfile', 'Portfolio', 'MarketQuote', 'AISignal']