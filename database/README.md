# Qlib AI Trading Platform - Database Architecture

## Overview

This database schema is designed to support a production-ready AI trading platform with clear separation between consumer interface and admin management.

## Key Design Principles

### 1. **Consumer vs Admin Separation**
- **Consumer Interface**: Focuses on user experience, portfolio management, and social features
- **Admin Interface**: Handles model training, data management, system monitoring, and user administration

### 2. **Scalability**
- UUID primary keys for better distributed scaling
- Proper indexing for high-traffic queries
- JSONB fields for flexible configuration storage
- Views for complex queries

### 3. **Real Trading Support**
- Supports both paper trading and real money portfolios
- Comprehensive trade execution tracking
- Detailed performance metrics and audit trails

## Database Schema Components

### 👥 **User Management**
```sql
users                    -- User accounts (retail + admin)
portfolios              -- User portfolios (paper + real)
user_follows            -- Social following relationships
```

### 🤖 **AI Models & Strategies**  
```sql
ai_models                    -- Qlib model configurations
user_model_subscriptions     -- Which models each user follows
trading_signals             -- AI-generated buy/sell signals
model_training_logs         -- Training process logs
```

### 💰 **Trading & Performance**
```sql
trades                  -- Executed trades
holdings               -- Current portfolio positions  
backtests              -- Historical strategy testing
performance_data       -- Daily performance tracking
```

### 📊 **Market Data**
```sql
market_data            -- Historical OHLCV data
market_data_realtime   -- Live price feeds
```

### 👥 **Social Features**
```sql
community_posts        -- User posts and wins
post_likes            -- Post engagement
```

### ⚙️ **Admin & System**
```sql
system_config         -- Feature flags and settings
admin_audit_log       -- Admin action tracking
```

## Key Features Supported

### For Consumers:
- ✅ Paper trading with virtual money
- ✅ Real money portfolio management
- ✅ AI model subscriptions and allocation
- ✅ Social features and community
- ✅ Performance tracking and analytics
- ✅ Trading signal transparency (AI explanations)

### For Admins:
- ✅ Model training and management
- ✅ User administration
- ✅ Data pipeline monitoring
- ✅ System configuration
- ✅ Audit trails and compliance
- ✅ Performance analytics across all users

## Performance Optimizations

### Indexes
- User email lookup
- Trading signals by model/date
- Performance data by date ranges
- Community posts by recency

### Views
- `user_portfolio_summary` - Quick portfolio stats
- `model_performance_summary` - Model metrics with subscriber counts  
- `top_performers` - Community leaderboard data

## Data Flow

### Consumer User Journey:
1. **Registration** → `users` table
2. **Onboarding** → Creates paper `portfolio`
3. **Model Selection** → `user_model_subscriptions` 
4. **AI Signals** → `trading_signals` generated
5. **Trade Execution** → `trades` and `holdings` updated
6. **Performance** → `performance_data` tracked daily
7. **Community** → `community_posts` for sharing wins

### Admin Workflow:
1. **Model Training** → Update `ai_models` and `model_training_logs`
2. **Data Management** → Refresh `market_data` tables
3. **User Management** → Monitor `users` and `portfolios`
4. **System Monitoring** → Track via `admin_audit_log`

## Security Considerations

- ✅ UUID primary keys prevent ID enumeration
- ✅ Role-based access control (user/admin/analyst)
- ✅ Audit logging for all admin actions
- ✅ Portfolio type separation (paper/real)
- ✅ User status controls (active/suspended)

## Scalability Features

- **Horizontal scaling**: UUID keys work across distributed systems
- **Read replicas**: Views optimize common queries
- **Data partitioning**: Performance data can be partitioned by date
- **Caching layer**: Real-time market data supports cache invalidation

## Development vs Production

### Development:
- Start with PostgreSQL locally
- Use sample data for testing
- Mock external data feeds

### Production:
- PostgreSQL with read replicas
- Redis for caching and real-time data
- Qlib integration for actual model training
- Live market data feeds

## Next Steps

1. **Setup Database**: Create PostgreSQL instance and run schema
2. **Admin Dashboard**: Build interface for model management
3. **Qlib Integration**: Connect real model training pipeline
4. **API Layer**: Create endpoints connecting frontend to database
5. **Data Pipeline**: Setup market data ingestion
6. **Deployment**: Configure production environment

This schema provides the foundation for a scalable, production-ready AI trading platform that clearly separates consumer and admin functionality while supporting real trading operations.