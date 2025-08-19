# 🚀 Qlib Pro Production Deployment Guide

## Overview

This guide walks you through deploying the Qlib Pro trading platform to production using Railway (backend), Netlify (frontend), and Supabase (database).

## 📋 Prerequisites

### Required Tools
```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Netlify CLI  
npm install -g netlify-cli

# Ensure Node.js 18+ and Python 3.8+ are installed
node --version
python --version
```

### Required Accounts
- ✅ **Railway Account**: https://railway.app
- ✅ **Netlify Account**: https://netlify.com  
- ✅ **Supabase Account**: https://supabase.com
- ✅ **SendGrid Account**: https://sendgrid.com (for email notifications)
- ✅ **Alpha Vantage API Key**: https://alphavantage.co

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
```bash
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "qlib-pro-production"
4. Generate a strong password
5. Select region: "Asia Pacific (ap-southeast-1)" for Australia
```

### 1.2 Run Database Migration
```sql
-- Go to SQL Editor in Supabase Dashboard
-- Copy and paste the contents of:
-- supabase/migrations/20240101000000_initial_production_setup.sql
-- Click "Run" to execute
```

### 1.3 Configure RLS and Security
```sql
-- Enable Row Level Security (RLS) - already included in migration
-- Set up JWT authentication
-- Configure API keys and service roles
```

### 1.4 Get Connection Details
```bash
# Save these values for environment variables:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## 🔧 Step 2: Backend Deployment (Railway)

### 2.1 Login to Railway
```bash
railway login
```

### 2.2 Create Railway Project
```bash
# In the backend directory
cd backend
railway init qlib-backend-production
```

### 2.3 Configure Environment Variables
```bash
# Set environment variables in Railway dashboard or CLI
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_KEY="your-anon-key"
railway variables set DATABASE_URL="your-database-url"
railway variables set SECRET_KEY="your-super-secret-jwt-key"
railway variables set ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
railway variables set REDIS_URL="redis://default:password@host:port"
railway variables set SENDGRID_API_KEY="your-sendgrid-key"
```

### 2.4 Deploy Backend
```bash
railway deploy
```

### 2.5 Get Backend URL
```bash
# Your backend will be available at:
# https://qlib-backend-production.up.railway.app
railway domain
```

## 🌐 Step 3: Frontend Deployment (Netlify)

### 3.1 Login to Netlify
```bash
netlify login
```

### 3.2 Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 3.3 Deploy to Netlify
```bash
netlify init
netlify deploy --prod --dir=dist
```

### 3.4 Configure Environment Variables
```bash
# In Netlify dashboard, set environment variables:
REACT_APP_API_BASE_URL=https://qlib-backend-production.up.railway.app
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GA_TRACKING_ID=your-google-analytics-id
```

### 3.5 Configure Domain (Optional)
```bash
# Set up custom domain if desired
# qlib-pro.com -> Netlify site
```

## 📊 Step 4: Monitoring Setup

### 4.1 Health Check Endpoints
```bash
# Backend health checks
curl https://qlib-backend-production.up.railway.app/health
curl https://qlib-backend-production.up.railway.app/health/detailed

# Frontend accessibility
curl https://qlib-pro.netlify.app
```

### 4.2 Set Up Alerts
```bash
# Configure monitoring alerts for:
- API response times > 2 seconds
- Database connection failures
- Cache hit rate < 80%
- System resource usage > 85%
```

## 🧪 Step 5: Testing

### 5.1 Test Account Verification
```bash
# Test all 8 test accounts:
newcustomer@test.com    # Password: Test123!
verified@test.com       # Password: Test123!
premium@test.com        # Password: Test123!
institution@test.com    # Password: Test123!
kyc.staff@test.com      # Password: Test123!
agent@test.com          # Password: Test123!
admin@test.com          # Password: Test123!
support@test.com        # Password: Test123!
```

### 5.2 Run Automated Tests
```bash
# Run the comprehensive test suite
cd backend
python -m pytest tests/test_continuous_integration.py -v

# Load testing
python load_test.py --users 100 --spawn-rate 10
```

### 5.3 User Journey Testing
```bash
# Test each customer journey:
1. New Customer: Registration → KYC → Dashboard
2. Verified Customer: Portfolio Upload → AI Analysis
3. Premium Customer: Advanced Features → Custom Strategies  
4. Institutional: Bulk Operations → Compliance Reports
```

## 🔒 Step 6: Security Configuration

### 6.1 SSL Certificates
```bash
# SSL is automatically configured by Railway and Netlify
# Verify HTTPS is working for both domains
```

### 6.2 Security Headers
```bash
# Verify security headers are set:
curl -I https://qlib-pro.netlify.app
# Should include:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Referrer-Policy: strict-origin-when-cross-origin
```

### 6.3 CORS Configuration
```python
# Verify CORS is properly configured in production_api.py
# Frontend domain should be whitelisted
```

## 📈 Step 7: Performance Optimization

### 7.1 Database Optimization
```sql
-- Verify all indexes are created
-- Monitor query performance
-- Set up connection pooling
```

### 7.2 Caching Strategy
```bash
# Verify Redis caching is working
# Monitor cache hit rates
# Set up cache warming for critical data
```

### 7.3 CDN Configuration
```bash
# Static assets are automatically cached by Netlify CDN
# Verify proper cache headers are set
```

## 🎯 Step 8: Go-Live Checklist

### Pre-Launch
- ✅ All tests pass
- ✅ Health checks return healthy status
- ✅ SSL certificates are active
- ✅ Environment variables are set
- ✅ Database is accessible
- ✅ External APIs are responding
- ✅ Monitoring is configured
- ✅ Test accounts work properly

### Launch Day
- ✅ Monitor system performance
- ✅ Watch error rates and response times
- ✅ Check user registration flow
- ✅ Verify payment processing
- ✅ Monitor server resources
- ✅ Have support team ready

### Post-Launch
- ✅ Daily health check monitoring
- ✅ Weekly performance reviews
- ✅ Monthly security audits
- ✅ Quarterly disaster recovery tests

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check logs
railway logs

# Common causes:
- Missing environment variables
- Database connection issues
- Port binding problems
```

#### Frontend Build Failures
```bash
# Check build logs
netlify deploy --prod --dir=dist

# Common causes:
- Missing environment variables
- TypeScript compilation errors
- Dependency conflicts
```

#### Database Connection Issues
```bash
# Test database connection
python -c "import asyncpg; print('Database accessible')"

# Common causes:
- Wrong connection string
- Network connectivity issues
- Authentication failures
```

## 📞 Support Contacts

### Technical Support
- **Railway Support**: https://railway.app/help
- **Netlify Support**: https://netlify.com/support
- **Supabase Support**: https://supabase.com/support

### Emergency Procedures
```bash
# If critical issues arise:
1. Check health endpoints
2. Review error logs
3. Rollback if necessary
4. Contact support team
5. Communicate with stakeholders
```

## 🎉 Deployment Success

Once all steps are completed successfully, you will have:

✅ **Fully Functional Production Environment**
- Backend API: https://qlib-backend-production.up.railway.app
- Frontend App: https://qlib-pro.netlify.app
- Database: Supabase production instance
- Monitoring: Health checks and alerts

✅ **Comprehensive Testing**
- 8 test accounts across all user types
- Automated CI/CD pipeline
- Performance monitoring
- Security scanning

✅ **Production-Ready Features**
- Real-time market data
- AI trading signals  
- Professional charting
- Multi-user roles
- Australian compliance

**🚀 Congratulations! Qlib Pro is now live in production! 🚀**

---

For additional support or questions, please refer to the technical documentation or contact the development team.