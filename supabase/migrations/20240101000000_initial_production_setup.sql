-- Initial Production Database Setup for Qlib Pro
-- This migration creates the core tables and security policies

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'trader', 'admin', 'kyc_staff', 'support_staff');
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium', 'enterprise');
    CREATE TYPE kyc_status AS ENUM ('not_started', 'pending', 'approved', 'rejected', 'expired');
    CREATE TYPE order_status AS ENUM ('pending', 'filled', 'cancelled', 'rejected');
    CREATE TYPE signal_type AS ENUM ('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table with enhanced profile data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    subscription_tier subscription_tier DEFAULT 'free',
    
    -- KYC and Compliance
    kyc_status kyc_status DEFAULT 'not_started',
    kyc_documents JSONB DEFAULT '{}',
    
    -- Trading Profile
    risk_tolerance INTEGER CHECK (risk_tolerance BETWEEN 1 AND 5) DEFAULT 3,
    trading_experience VARCHAR(50) DEFAULT 'beginner',
    investment_goals TEXT[],
    
    -- Security
    password_hash TEXT NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false,
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "notifications": {"email": true, "sms": false},
        "trading": {"paper_mode": true},
        "display": {"currency": "AUD", "timezone": "Australia/Sydney"}
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'paper' CHECK (type IN ('paper', 'live')),
    
    -- Financial Data
    initial_capital DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    cash_balance DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
    currency VARCHAR(3) DEFAULT 'AUD',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Portfolio Holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    shares DECIMAL(10,3) NOT NULL DEFAULT 0,
    average_cost DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    market_value DECIMAL(15,2),
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- Market Data (for caching)
CREATE TABLE IF NOT EXISTS market_quotes_realtime (
    symbol VARCHAR(20) PRIMARY KEY,
    price DECIMAL(12,4) NOT NULL,
    change_amount DECIMAL(12,4),
    change_percentage DECIMAL(6,3),
    volume BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Trading Signals
CREATE TABLE IF NOT EXISTS ai_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    signal_type signal_type NOT NULL,
    confidence DECIMAL(6,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    current_price DECIMAL(12,4) NOT NULL,
    target_price DECIMAL(12,4),
    reasoning TEXT,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    status VARCHAR(50) DEFAULT 'active'
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(12,4),
    total_value DECIMAL(15,2),
    
    status order_status DEFAULT 'pending',
    signal_id UUID REFERENCES ai_signals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own holdings
CREATE POLICY "Users can view own holdings" ON portfolio_holdings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Users can only see their own trades
CREATE POLICY "Users can view own trades" ON trades
    FOR ALL USING (auth.uid() = user_id);

-- Market data is publicly readable
CREATE POLICY "Market data is publicly readable" ON market_quotes_realtime
    FOR SELECT TO authenticated USING (true);

-- AI signals are publicly readable for authenticated users
CREATE POLICY "Authenticated users can view signals" ON ai_signals
    FOR SELECT TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_signals_symbol ON ai_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_signals_generated_at ON ai_signals(generated_at);

-- Insert test data for production testing
INSERT INTO user_profiles (
    id, email, name, role, subscription_tier, kyc_status, 
    password_hash, created_at
) VALUES 
-- Customer Test Accounts
(
    'a0000000-0000-0000-0000-000000000001',
    'newcustomer@test.com',
    'John Novice',
    'customer',
    'free',
    'not_started',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6', -- Test123!
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000002', 
    'verified@test.com',
    'Sarah Verified',
    'customer',
    'pro',
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000003',
    'premium@test.com', 
    'Michael Premium',
    'customer',
    'premium',
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000004',
    'institution@test.com',
    'Corporate Institution',
    'customer', 
    'enterprise',
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
),
-- Staff Test Accounts
(
    'a0000000-0000-0000-0000-000000000005',
    'kyc.staff@test.com',
    'Jennifer KYC',
    'kyc_staff',
    'enterprise',
    'approved', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000006',
    'agent@test.com',
    'Alex Trading',
    'trader',
    'enterprise', 
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000007',
    'admin@test.com',
    'Chris Admin',
    'admin',
    'enterprise',
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6', 
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000008',
    'support@test.com',
    'Lisa Support',
    'support_staff',
    'enterprise',
    'approved',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxkVJSLBjxD.p0JmU7H.2UU8xq6',
    NOW()
);

-- Create test portfolios for verified accounts
INSERT INTO portfolios (user_id, name, type, initial_capital, current_value, cash_balance) VALUES
('a0000000-0000-0000-0000-000000000002', 'My Trading Portfolio', 'paper', 50000.00, 52340.50, 5340.50),
('a0000000-0000-0000-0000-000000000003', 'Premium Strategy', 'paper', 250000.00, 267890.75, 17890.75), 
('a0000000-0000-0000-0000-000000000004', 'Institutional Fund', 'paper', 5000000.00, 5234567.89, 234567.89);

-- Add some sample market data
INSERT INTO market_quotes_realtime (symbol, price, change_amount, change_percentage, volume) VALUES
('CBA.AX', 110.50, 2.30, 2.12, 1250000),
('BHP.AX', 45.20, -0.80, -1.74, 2100000),
('CSL.AX', 295.50, 3.20, 1.10, 850000),
('WBC.AX', 25.20, 0.15, 0.60, 1800000),
('AAPL', 185.50, 1.25, 0.68, 45000000),
('GOOGL', 142.75, -2.15, -1.48, 28000000);

-- Add sample AI signals
INSERT INTO ai_signals (symbol, signal_type, confidence, current_price, target_price, reasoning) VALUES
('CBA.AX', 'BUY', 0.87, 110.50, 115.50, 'Strong momentum breakout with positive earnings outlook'),
('BHP.AX', 'HOLD', 0.72, 45.20, 47.20, 'Commodity prices stabilizing, wait for clearer direction'),
('CSL.AX', 'SELL', 0.78, 295.50, 285.00, 'Overvalued relative to healthcare sector peers');