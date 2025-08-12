-- ================================
-- SUPABASE SCHEMA FOR QLIB PRO
-- Complete database schema for Australian trading platform
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- USERS & AUTHENTICATION
-- ================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    paper_trading BOOLEAN DEFAULT true,
    country VARCHAR(3) DEFAULT 'AU', -- Australia focus
    timezone VARCHAR(50) DEFAULT 'Australia/Sydney',
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{
        "notifications": true,
        "paper_mode": true,
        "risk_tolerance": "medium",
        "currency": "AUD",
        "theme": "light"
    }'::jsonb
);

-- User sessions for security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- ================================
-- AUSTRALIAN MARKET DATA
-- ================================

-- ASX stocks and AU market instruments
CREATE TABLE au_instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL, -- ASX codes like 'CBA.AX'
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market VARCHAR(10) DEFAULT 'ASX' CHECK (market IN ('ASX', 'NASDAQ', 'NYSE', 'LSE')),
    currency VARCHAR(3) DEFAULT 'AUD',
    is_active BOOLEAN DEFAULT true,
    listing_date DATE,
    market_cap BIGINT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time market data cache
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    change_amount DECIMAL(12,4),
    change_percent DECIMAL(8,4),
    volume BIGINT,
    high_52w DECIMAL(12,4),
    low_52w DECIMAL(12,4),
    market_cap BIGINT,
    pe_ratio DECIMAL(8,2),
    dividend_yield DECIMAL(6,4),
    currency VARCHAR(3) DEFAULT 'AUD',
    source VARCHAR(50) NOT NULL, -- 'alpha_vantage', 'yahoo', 'asx_api'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- USER PORTFOLIOS & WATCHLISTS
-- ================================

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Default Portfolio',
    description TEXT,
    is_paper BOOLEAN DEFAULT true,
    starting_balance DECIMAL(15,2) DEFAULT 100000.00,
    current_balance DECIMAL(15,2) DEFAULT 100000.00,
    currency VARCHAR(3) DEFAULT 'AUD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    average_price DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    total_value DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'AUD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User watchlists
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'My Watchlist',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist items
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AI MODELS & PREDICTIONS
-- ================================

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('LSTM', 'LightGBM', 'Transformer', 'XGBoost', 'GRU', 'CNN')),
    status VARCHAR(50) DEFAULT 'training' CHECK (status IN ('training', 'active', 'paused', 'stopped', 'error')),
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(6,3),
    max_drawdown DECIMAL(6,3),
    description TEXT,
    config JSONB, -- Model hyperparameters
    training_data JSONB, -- Training metadata
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_prediction TIMESTAMP WITH TIME ZONE
);

-- AI trading signals
CREATE TABLE ai_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    signal VARCHAR(10) NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(4,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    target_price DECIMAL(12,4),
    current_price DECIMAL(12,4) NOT NULL,
    reasoning TEXT,
    change_percent DECIMAL(8,4),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- ================================
-- TRADING & BACKTESTING
-- ================================

CREATE TABLE backtests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    symbols TEXT[], -- Array of symbols tested
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_balance DECIMAL(15,2) NOT NULL,
    final_balance DECIMAL(15,2),
    total_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(6,3),
    max_drawdown DECIMAL(6,3),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    results JSONB, -- Detailed backtest results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Trade executions (paper/live)
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'AUD',
    order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop_loss')),
    status VARCHAR(20) DEFAULT 'executed' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- ================================
-- NEWS & SENTIMENT
-- ================================

CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    url VARCHAR(1000),
    source VARCHAR(100) NOT NULL,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(4,3), -- -1 to 1
    symbols TEXT[], -- Related stock symbols
    relevance_score DECIMAL(4,3), -- 0 to 1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AUSTRALIAN SPECIFIC FEATURES
-- ================================

-- ASX market hours and trading calendar
CREATE TABLE au_trading_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    is_trading_day BOOLEAN DEFAULT true,
    market_open TIME DEFAULT '10:00:00', -- AEST
    market_close TIME DEFAULT '16:00:00', -- AEST
    is_half_day BOOLEAN DEFAULT false,
    description VARCHAR(255), -- Holiday name if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Australian dividend tracking
CREATE TABLE au_dividends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    ex_dividend_date DATE NOT NULL,
    payment_date DATE,
    dividend_amount DECIMAL(10,4) NOT NULL,
    dividend_type VARCHAR(20) DEFAULT 'cash' CHECK (dividend_type IN ('cash', 'stock', 'special')),
    franking_percentage DECIMAL(5,2) DEFAULT 0.00, -- Australian franking credits
    currency VARCHAR(3) DEFAULT 'AUD',
    announced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- SECURITY & AUDIT
-- ================================

-- Security audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2FA verification codes
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('sms', 'email', 'totp')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Market data indexes
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_au_instruments_symbol ON au_instruments(symbol);
CREATE INDEX idx_au_instruments_sector ON au_instruments(sector);

-- Portfolio indexes
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_watchlist_user ON watchlists(user_id);
CREATE INDEX idx_watchlist_items ON watchlist_items(watchlist_id);

-- AI model indexes
CREATE INDEX idx_models_user ON ai_models(user_id);
CREATE INDEX idx_models_status ON ai_models(status);
CREATE INDEX idx_signals_model ON ai_signals(model_id);
CREATE INDEX idx_signals_symbol ON ai_signals(symbol);
CREATE INDEX idx_signals_generated ON ai_signals(generated_at DESC);

-- Trading indexes
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_portfolio ON trades(portfolio_id);
CREATE INDEX idx_trades_executed ON trades(executed_at DESC);
CREATE INDEX idx_backtests_user ON backtests(user_id);

-- News indexes
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_sentiment ON news_articles(sentiment);
CREATE INDEX idx_news_symbols ON news_articles USING GIN (symbols);

-- Security indexes
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_verification_user ON verification_codes(user_id);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on user-specific tables
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only access their own data)
CREATE POLICY "Users can access own portfolios" ON portfolios
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can access own watchlists" ON watchlists
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can access own models" ON ai_models
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can access own backtests" ON backtests
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can access own trades" ON trades
    FOR ALL USING (auth.uid()::text = user_id::text);

-- ================================
-- INITIAL DATA FOR AUSTRALIA
-- ================================

-- Insert default Australian instruments
INSERT INTO au_instruments (symbol, name, sector, currency) VALUES
    ('CBA.AX', 'Commonwealth Bank of Australia', 'Financials', 'AUD'),
    ('BHP.AX', 'BHP Group', 'Materials', 'AUD'),
    ('CSL.AX', 'CSL Limited', 'Healthcare', 'AUD'),
    ('WBC.AX', 'Westpac Banking Corporation', 'Financials', 'AUD'),
    ('ANZ.AX', 'Australia and New Zealand Banking Group', 'Financials', 'AUD'),
    ('NAB.AX', 'National Australia Bank', 'Financials', 'AUD'),
    ('WOW.AX', 'Woolworths Group', 'Consumer Staples', 'AUD'),
    ('COL.AX', 'Coles Group', 'Consumer Staples', 'AUD'),
    ('TLS.AX', 'Telstra Corporation', 'Communication Services', 'AUD'),
    ('RIO.AX', 'Rio Tinto', 'Materials', 'AUD'),
    ('WES.AX', 'Wesfarmers', 'Consumer Discretionary', 'AUD'),
    ('MQG.AX', 'Macquarie Group', 'Financials', 'AUD'),
    ('TCL.AX', 'Transurban Group', 'Industrials', 'AUD'),
    ('SYD.AX', 'Sydney Airport', 'Industrials', 'AUD'),
    ('WDS.AX', 'Woodside Energy Group', 'Energy', 'AUD');

-- Insert 2024 Australian trading calendar (key dates)
INSERT INTO au_trading_calendar (date, is_trading_day, description) VALUES
    ('2024-01-01', false, 'New Years Day'),
    ('2024-01-26', false, 'Australia Day'),
    ('2024-03-29', false, 'Good Friday'),
    ('2024-04-01', false, 'Easter Monday'),
    ('2024-04-25', false, 'ANZAC Day'),
    ('2024-06-10', false, 'Kings Birthday'),
    ('2024-12-25', false, 'Christmas Day'),
    ('2024-12-26', false, 'Boxing Day');

-- ================================
-- FUNCTIONS & TRIGGERS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate portfolio values
CREATE OR REPLACE FUNCTION calculate_portfolio_value(portfolio_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total_value DECIMAL(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(quantity * current_price), 0)
    INTO total_value
    FROM portfolio_holdings
    WHERE portfolio_id = portfolio_uuid;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- VIEWS FOR COMMON QUERIES
-- ================================

-- User portfolio summary view
CREATE VIEW v_user_portfolios AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.current_balance,
    p.currency,
    calculate_portfolio_value(p.id) as holdings_value,
    (p.current_balance + calculate_portfolio_value(p.id)) as total_value,
    p.created_at
FROM portfolios p;

-- Active AI signals view
CREATE VIEW v_active_signals AS
SELECT 
    s.id,
    s.symbol,
    s.signal,
    s.confidence,
    s.target_price,
    s.current_price,
    s.reasoning,
    s.generated_at,
    m.name as model_name,
    m.model_type,
    m.accuracy as model_accuracy
FROM ai_signals s
JOIN ai_models m ON s.model_id = m.id
WHERE s.is_active = true
AND s.expires_at > NOW()
ORDER BY s.generated_at DESC;

-- Market performance view
CREATE VIEW v_market_performance AS
SELECT 
    symbol,
    price,
    change_amount,
    change_percent,
    volume,
    pe_ratio,
    dividend_yield,
    currency,
    ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) as rn
FROM market_data
WHERE timestamp > NOW() - INTERVAL '1 day';