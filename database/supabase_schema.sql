-- Supabase-optimized schema for Qlib AI Trading Platform
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================
-- USER MANAGEMENT (Supabase Auth Integration)
-- ================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'analyst')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    
    -- User profile info
    location VARCHAR(255),
    risk_tolerance INTEGER CHECK (risk_tolerance BETWEEN 1 AND 5),
    investment_goal VARCHAR(100),
    experience_level VARCHAR(50) CHECK (experience_level IN ('beginner', 'some', 'experienced')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security for user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin users can see all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User portfolios
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('paper', 'real')),
    initial_value DECIMAL(15,2) NOT NULL DEFAULT 100000,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 100000,
    cash_balance DECIMAL(15,2) NOT NULL DEFAULT 100000,
    total_return DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS for portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolios" ON portfolios
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================
-- AI MODELS & STRATEGIES
-- ================================

-- AI models (public read, admin write)
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'training' CHECK (status IN ('training', 'active', 'paused', 'stopped', 'failed')),
    
    -- Performance metrics
    accuracy DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    
    -- Model training info
    training_start TIMESTAMP,
    training_end TIMESTAMP,
    last_retrained TIMESTAMP,
    
    -- Admin fields
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS for models
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Everyone can read models, only admins can modify
CREATE POLICY "Anyone can view models" ON ai_models
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage models" ON ai_models
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- User model subscriptions
CREATE TABLE user_model_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (allocation_percentage BETWEEN 0 AND 100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    subscribed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, model_id, portfolio_id)
);

ALTER TABLE user_model_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON user_model_subscriptions
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================
-- TRADING DATA
-- ================================

-- Trading signals (public read for transparency)
CREATE TABLE trading_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    target_price DECIMAL(10,2),
    current_price DECIMAL(10,2) NOT NULL,
    
    -- AI reasoning
    reasoning TEXT,
    key_factors JSONB DEFAULT '{}',
    
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'executed', 'expired', 'cancelled'))
);

ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trading signals" ON trading_signals
    FOR SELECT USING (true);

CREATE POLICY "Only system can create signals" ON trading_signals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Market data cache
CREATE TABLE market_data_cache (
    symbol VARCHAR(20) PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2),
    change_percentage DECIMAL(5,2),
    volume BIGINT,
    market_cap BIGINT,
    pe_ratio DECIMAL(8,2),
    day_high DECIMAL(10,2),
    day_low DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Public read access for market data
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market data" ON market_data_cache
    FOR SELECT USING (true);

CREATE POLICY "Only system can update market data" ON market_data_cache
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================
-- COMMUNITY FEATURES
-- ================================

-- Community posts
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('win', 'strategy', 'tip', 'question')),
    content TEXT NOT NULL,
    
    -- Optional trade details
    symbol VARCHAR(20),
    profit_amount DECIMAL(10,2),
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON community_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own posts" ON community_posts
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Post likes
CREATE TABLE post_likes (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes" ON post_likes
    FOR ALL USING (user_id = auth.uid());

-- User follows
CREATE TABLE user_follows (
    follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own follows" ON user_follows
    FOR ALL USING (follower_id = auth.uid());

-- ================================
-- SYSTEM CONFIG
-- ================================

-- System configuration
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES user_profiles(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON system_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage config" ON system_config
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================
-- INDEXES
-- ================================

-- Performance indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_trading_signals_model_symbol ON trading_signals(model_id, symbol);
CREATE INDEX idx_trading_signals_generated_at ON trading_signals(generated_at DESC);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);

-- ================================
-- INITIAL DATA
-- ================================

-- Insert system configuration
INSERT INTO system_config (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable maintenance mode'),
('paper_trading_enabled', 'true', 'Allow paper trading'),
('real_trading_enabled', 'false', 'Allow real money trading'),
('max_models_per_user', '5', 'Max models per user'),
('community_enabled', 'true', 'Enable community features');

-- Insert demo AI models
INSERT INTO ai_models (name, display_name, description, model_type, status, accuracy, sharpe_ratio, win_rate) VALUES
('lstm_alpha158_v1', 'AI Stock Picker #1', 'Conservative growth strategy using deep learning', 'LSTM', 'active', 89.2, 1.67, 87.5),
('lightgbm_multifactor_v1', 'AI Value Hunter', 'Undervalued stock detection using gradient boosting', 'LightGBM', 'active', 85.7, 1.43, 84.2),
('transformer_momentum_v1', 'AI Momentum Trader', 'Momentum-based trading using transformer architecture', 'Transformer', 'training', 0, 0, 0);

-- Insert sample trading signals
INSERT INTO trading_signals (model_id, symbol, signal_type, confidence, current_price, target_price, reasoning, key_factors) VALUES
((SELECT id FROM ai_models WHERE name = 'lstm_alpha158_v1'), 'AAPL', 'BUY', 92, 182.50, 195.00, 'Strong earnings momentum detected with positive technical indicators', '{"earnings_growth": 23.4, "technical_score": 89, "sentiment_score": 87}'),
((SELECT id FROM ai_models WHERE name = 'lstm_alpha158_v1'), 'MSFT', 'BUY', 89, 337.20, 355.00, 'AI infrastructure growth driving revenue expansion', '{"earnings_growth": 18.7, "technical_score": 82, "sentiment_score": 91}'),
((SELECT id FROM ai_models WHERE name = 'lightgbm_multifactor_v1'), 'GOOGL', 'HOLD', 76, 134.80, 138.00, 'Market consolidation phase, awaiting clearer signals', '{"earnings_growth": 5.2, "technical_score": 65, "sentiment_score": 72}');

-- Insert sample market data
INSERT INTO market_data_cache (symbol, price, change_amount, change_percentage, volume, market_cap) VALUES
('AAPL', 182.50, 2.30, 1.28, 45678900, 2847000000000),
('MSFT', 337.20, 4.15, 1.25, 23456780, 2506000000000),
('GOOGL', 134.80, -0.65, -0.48, 18765400, 1674000000000),
('TSLA', 248.50, 12.30, 5.20, 89123456, 789000000000),
('NVDA', 821.30, 15.60, 1.94, 34567890, 2026000000000);

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default portfolio for new users
CREATE OR REPLACE FUNCTION create_user_profile_and_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile
    INSERT INTO user_profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'user');
    
    -- Create default paper trading portfolio
    INSERT INTO portfolios (user_id, name, type, initial_value, current_value, cash_balance)
    VALUES (NEW.id, 'Paper Trading Portfolio', 'paper', 100000, 100000, 100000);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_portfolio();

-- ================================
-- VIEWS FOR API
-- ================================

-- User portfolio summary
CREATE VIEW user_portfolio_summary AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.type,
    p.current_value,
    p.total_return,
    p.cash_balance,
    COUNT(ums.id) as active_models,
    p.updated_at
FROM portfolios p
LEFT JOIN user_model_subscriptions ums ON p.id = ums.portfolio_id AND ums.status = 'active'
GROUP BY p.id, p.user_id, p.name, p.type, p.current_value, p.total_return, p.cash_balance, p.updated_at;

-- Model performance with subscriber count
CREATE VIEW model_performance_summary AS
SELECT 
    m.id,
    m.name,
    m.display_name,
    m.model_type,
    m.status,
    m.accuracy,
    m.sharpe_ratio,
    m.win_rate,
    COUNT(DISTINCT ums.user_id) as subscribers,
    COUNT(DISTINCT ts.id) as signals_generated,
    m.updated_at
FROM ai_models m
LEFT JOIN user_model_subscriptions ums ON m.id = ums.model_id AND ums.status = 'active'
LEFT JOIN trading_signals ts ON m.id = ts.model_id
GROUP BY m.id, m.name, m.display_name, m.model_type, m.status, m.accuracy, m.sharpe_ratio, m.win_rate, m.updated_at;

-- Community leaderboard
CREATE VIEW community_leaderboard AS
SELECT 
    up.id,
    up.name,
    up.location,
    COUNT(cp.id) as post_count,
    SUM(cp.likes_count) as total_likes,
    COUNT(f.follower_id) as followers_count,
    up.created_at
FROM user_profiles up
LEFT JOIN community_posts cp ON up.id = cp.user_id
LEFT JOIN user_follows f ON up.id = f.following_id
WHERE up.role = 'user'
GROUP BY up.id, up.name, up.location, up.created_at
ORDER BY total_likes DESC, followers_count DESC;

-- Grant permissions for views
GRANT SELECT ON user_portfolio_summary TO authenticated;
GRANT SELECT ON model_performance_summary TO authenticated;
GRANT SELECT ON community_leaderboard TO authenticated;