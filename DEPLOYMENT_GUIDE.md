# 🚀 Qlib AI Trading Platform - Production Deployment Guide

## Overview

Complete production deployment guide for the AI-powered quantitative trading platform with consumer interface and admin dashboard.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   FastAPI Backend │   │   PostgreSQL    │
│   (Consumer UI)  │────│  (Production API) │───│   (Database)    │
│   Port: 3000     │    │   Port: 8000      │   │   Port: 5432    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Admin Dashboard │    │  Qlib Pipeline   │    │     Redis       │
│  (Admin Panel)   │    │ (AI Training)    │    │   (Cache)       │
│  /admin          │    │  Background      │    │  Port: 6379     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### Local Development:
- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- Redis 7+

### Production Deployment:
- Docker & Docker Compose
- 4GB+ RAM
- SSL certificates (Let's Encrypt recommended)
- Domain name

## 🚀 Quick Start (Development)

### 1. Clone and Setup
```bash
git clone <repository>
cd qlib
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb qlib_prod
psql qlib_prod < database/schema.sql
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://qlib_user:qlib_pass@localhost/qlib_prod"
export REDIS_URL="redis://localhost:6379"
export SECRET_KEY="your-secret-key-here"

# Start backend
python production_api.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Access Application
- **Consumer Interface**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API Documentation**: http://localhost:8000/docs

## 🐳 Production Deployment (Docker)

### 1. Docker Compose Setup
```bash
# Start core services (database, redis, backend, frontend)
docker-compose up -d

# Start with monitoring (optional)
docker-compose --profile monitoring up -d

# Start with production nginx (optional)
docker-compose --profile production up -d
```

### 2. Environment Configuration
Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://qlib_user:CHANGE_THIS_PASSWORD@postgres:5432/qlib_prod

# Redis
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=CHANGE_THIS_SECRET_KEY_IN_PRODUCTION
JWT_SECRET_KEY=CHANGE_THIS_JWT_SECRET

# API
PORT=8000
DEBUG=False

# Frontend
VITE_API_URL=http://localhost:8000
```

### 3. SSL Setup (Production)
```bash
# Generate SSL certificates with Let's Encrypt
mkdir -p nginx/ssl
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/* nginx/ssl/
```

## 👥 User Accounts

### Demo Accounts:
- **Consumer User**: `demo@qlib.com` / `demo123`
- **Admin User**: `admin@qlib.ai` / `admin123`

### Create Production Admin:
```sql
INSERT INTO users (email, password_hash, name, role, status) VALUES
('your-admin@yourdomain.com', '$2b$12$hashed_password', 'Your Name', 'admin', 'active');
```

## 🔧 Configuration

### Database Configuration
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email_gin ON users USING gin(email gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_trading_signals_symbol_date ON trading_signals(symbol, generated_at DESC);
```

### Qlib Setup
```bash
# Initialize Qlib data (optional - for real model training)
python -c "
import qlib
from qlib.utils import init_instance_by_config
from qlib.data import D

# Initialize with your data provider
qlib.init(provider_uri='path/to/your/data', region='CN')
"
```

## 🎯 Features

### Consumer Interface:
- ✅ **Landing Page**: Retail-focused with testimonials
- ✅ **Onboarding**: Goal-setting, risk assessment
- ✅ **Dashboard**: Portfolio value, AI opportunities
- ✅ **AI Explanations**: Transparency with "Why?" buttons
- ✅ **Community**: Social trading, leaderboards
- ✅ **Paper Trading**: Risk-free mode for beginners

### Admin Dashboard:
- ✅ **System Overview**: User stats, model health
- ✅ **Model Management**: Create, train, control AI models
- ✅ **Real-time Training**: Progress tracking with WebSocket
- ✅ **Performance Monitoring**: Accuracy, Sharpe ratio, subscribers
- ✅ **User Analytics**: Trading activity, profits

### Backend API:
- ✅ **Authentication**: JWT with role-based access
- ✅ **Real Market Data**: Yahoo Finance integration
- ✅ **Qlib Integration**: Actual AI model training
- ✅ **Trading Signals**: BUY/SELL/HOLD with reasoning
- ✅ **WebSocket**: Real-time updates
- ✅ **Caching**: Redis for performance

## 📊 Monitoring

### Health Check Endpoints:
- `/api/health` - System health status
- `/api/admin/system/stats` - Detailed system metrics

### Prometheus Metrics:
- API request rates and latencies
- Database connection pool status
- Model training success/failure rates
- User activity metrics

### Grafana Dashboards:
- System performance overview
- Trading signals and accuracy
- User engagement metrics
- Model training progress

## 🔒 Security

### Production Security Checklist:
- [ ] Change all default passwords
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure log monitoring
- [ ] Set up intrusion detection

### Environment Variables:
```bash
# Critical - Change these in production!
SECRET_KEY=generate-secure-random-key
JWT_SECRET_KEY=different-secure-random-key
DATABASE_PASSWORD=strong-database-password
REDIS_PASSWORD=redis-password-if-needed

# Optional but recommended
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues:

#### Backend won't start:
```bash
# Check database connection
python -c "from production_api import engine; print(engine.execute('SELECT 1').scalar())"

# Check Redis connection  
python -c "import redis; r = redis.Redis(); print(r.ping())"
```

#### Frontend can't connect to API:
```bash
# Check CORS settings in production_api.py
# Verify VITE_API_URL in frontend/.env
```

#### Model training fails:
```bash
# Check Qlib installation
python -c "import qlib; print(qlib.__version__)"

# Check data directory permissions
ls -la qlib_data/
```

### Performance Issues:
- **Database**: Add indexes, optimize queries
- **Redis**: Monitor memory usage, set expiration
- **API**: Enable caching, add rate limiting
- **Frontend**: Optimize bundle size, enable compression

## 📈 Scaling

### Horizontal Scaling:
1. **Multiple API instances** behind load balancer
2. **Database read replicas** for query performance
3. **Redis cluster** for high availability
4. **CDN** for frontend assets

### Vertical Scaling:
- **CPU**: Model training is CPU-intensive
- **Memory**: Redis cache and model data
- **Storage**: Market data and user portfolios

## 🔄 Maintenance

### Regular Tasks:
- **Database backups**: Daily automated backups
- **Log rotation**: Prevent disk space issues
- **Model retraining**: Weekly/monthly schedule
- **Security updates**: OS and dependency patches

### Monitoring Alerts:
- API response time > 2 seconds
- Database connection failures
- Model training failures
- High memory/CPU usage

## 📞 Support

### Deployment Support:
1. Check logs: `docker-compose logs -f [service]`
2. Verify health: `curl http://localhost:8000/api/health`
3. Database status: `docker-compose exec postgres pg_isready`

### Development Environment:
- Backend API runs on port 8000
- Frontend dev server on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

## 🎉 Success!

Your AI-powered quantitative trading platform is now ready for production! 

**Consumer Experience:**
- Beautiful retail-focused interface
- AI explanations and transparency  
- Social trading features
- Paper trading for risk-free learning

**Admin Experience:**
- Real AI model training and management
- System monitoring and user analytics
- Production-grade performance tracking

**Technical Foundation:**
- Scalable microservices architecture
- Real market data integration
- Advanced AI pipeline with Qlib
- Production security and monitoring

Ready to revolutionize retail investing with AI! 🚀💰