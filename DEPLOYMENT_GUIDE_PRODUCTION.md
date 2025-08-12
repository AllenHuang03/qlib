# 🚀 **Qlib Pro - Production Deployment Guide**

## **Australian Trading Platform - Complete Deployment Setup**

### 🎯 **Overview**
This guide covers deploying your Qlib Pro trading platform to production using **Railway** (backend) and **Netlify** (frontend) with Australian market focus.

---

## 📋 **Prerequisites**

### **Required Accounts**
- [ ] Railway account (https://railway.app)
- [ ] Netlify account (https://netlify.com)
- [ ] Supabase account (https://supabase.com)
- [ ] Alpha Vantage API key (https://alphavantage.co)
- [ ] News API key (https://newsapi.org)

### **Optional Services**
- [ ] Twilio account (for SMS 2FA in Australia)
- [ ] AWS account (for SES email service)
- [ ] Domain name (.com.au recommended for Australian focus)

---

## 🗄️ **Step 1: Database Setup (Supabase)**

### **1.1 Create Supabase Project**
1. Go to [Supabase](https://supabase.com) and create new project
2. Choose **Asia Pacific (Southeast)** region for Australia
3. Note your project URL and anon key

### **1.2 Run Database Schema**
1. Go to Supabase SQL Editor
2. Execute the schema from `database/supabase_integration.sql`
3. Verify all tables are created successfully

### **1.3 Configure Authentication**
```sql
-- Enable email authentication
UPDATE auth.config SET enable_signup = true;

-- Set up Australian-specific settings
INSERT INTO auth.config (site_url, jwt_expiry) 
VALUES ('https://your-app.netlify.app', 3600);
```

### **1.4 Environment Variables**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here  # For admin operations
```

---

## 🚂 **Step 2: Backend Deployment (Railway)**

### **2.1 Connect Repository**
1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your qlib repository
4. Railway will auto-detect the backend structure

### **2.2 Set Environment Variables**
In Railway dashboard, add these environment variables:

```bash
# Core API Configuration
PORT=8000
PYTHONPATH=/app
ENVIRONMENT=production

# Market Data APIs
ALPHA_VANTAGE_KEY=your-alpha-vantage-key
NEWS_API_KEY=your-news-api-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 2FA Services (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token  
TWILIO_PHONE_NUMBER=+61xxxxxxxxx  # Australian number
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@qlibpro.com.au

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-here
```

### **2.3 Deploy Backend**
1. Railway will automatically build and deploy
2. Your API will be available at: `https://your-app.up.railway.app`
3. Test health: `https://your-app.up.railway.app/api/health`

### **2.4 Custom Domain (Optional)**
1. Add custom domain in Railway dashboard
2. Configure DNS records with your domain provider
3. Example: `api.qlibpro.com.au`

---

## 🌐 **Step 3: Frontend Deployment (Netlify)**

### **3.1 Connect Repository**
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub and select your repository

### **3.2 Build Settings**
```bash
# Build command
npm run build

# Publish directory  
dist

# Base directory
frontend
```

### **3.3 Environment Variables**
In Netlify dashboard, add:

```bash
# Point to your Railway API
VITE_API_URL=https://your-app.up.railway.app

# Environment
VITE_ENVIRONMENT=production

# Node configuration
NODE_VERSION=18
NPM_VERSION=9
```

### **3.4 Deploy Frontend**
1. Netlify will automatically build and deploy
2. Your app will be available at: `https://your-app.netlify.app`
3. Test login with demo credentials

### **3.5 Custom Domain**
1. Add custom domain in Netlify dashboard
2. Configure DNS: `www.qlibpro.com.au` → Netlify
3. Enable HTTPS (automatic with Netlify)

---

## 🔐 **Step 4: Security Configuration**

### **4.1 CORS Configuration**
Update your backend CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.netlify.app", "https://qlibpro.com.au"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **4.2 Content Security Policy**
Already configured in `netlify.toml`:
```toml
Content-Security-Policy = "default-src 'self'; connect-src 'self' https://your-app.up.railway.app https://api.alphavantage.co"
```

### **4.3 Rate Limiting**
Consider adding rate limiting to your API endpoints for production use.

---

## 📱 **Step 5: Australian Services Integration**

### **5.1 SMS Service (Twilio)**
For Australian phone numbers:
```bash
# Australian Twilio phone number
TWILIO_PHONE_NUMBER=+61xxxxxxxxx

# Test SMS sending
curl -X POST "https://your-app.up.railway.app/api/auth/send-sms" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+61400000000", "user_id": "test"}'
```

### **5.2 Email Service**
Configure SMTP or AWS SES for Australian users:
```bash
# Gmail SMTP (for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-business-email@gmail.com
SMTP_PASSWORD=your-app-password

# Professional email
FROM_EMAIL=noreply@qlibpro.com.au
```

### **5.3 Australian Market Data**
Your platform supports both US and Australian markets:
- **US Markets**: Alpha Vantage (AAPL, MSFT, GOOGL)
- **Australian Markets**: Ready for ASX integration (CBA.AX, BHP.AX, etc.)

---

## 🧪 **Step 6: Testing Production**

### **6.1 Run Comprehensive Tests**
```bash
# Set test environment
export TEST_API_URL=https://your-app.up.railway.app

# Run all scenarios  
python run_tests.py

# Check test report
cat test_report.md
```

### **6.2 Test Key Workflows**
1. **User Registration**: `demo+test@qlibpro.com.au`
2. **Authentication**: Login with demo credentials
3. **Market Data**: Verify real-time quotes working
4. **AI Signals**: Check signal generation
5. **Portfolio**: Test dashboard metrics
6. **2FA Setup**: Test SMS/email verification

### **6.3 Performance Testing**
```bash
# Load testing (install hey first)
hey -n 100 -c 10 https://your-app.up.railway.app/api/health

# Check response times
curl -w "@curl-format.txt" https://your-app.up.railway.app/api/market/quotes
```

---

## 📊 **Step 7: Monitoring & Analytics**

### **7.1 Railway Monitoring**
- **Metrics**: CPU, memory, network usage
- **Logs**: Real-time application logs
- **Alerts**: Set up for downtime/errors

### **7.2 Netlify Analytics**
- **Performance**: Core Web Vitals
- **Usage**: Page views, user sessions
- **Forms**: Contact form submissions

### **7.3 Custom Monitoring**
```python
# Add to your backend
import logging
logger = logging.getLogger("qlib_pro")

# Log key events
logger.info(f"User login: {user_email}")
logger.info(f"AI signals generated: {len(signals)}")
logger.error(f"Market data fetch failed: {symbol}")
```

---

## 🔧 **Step 8: Maintenance & Updates**

### **8.1 Automated Deployments**
Both Railway and Netlify automatically deploy when you push to GitHub:

```bash
# Update and deploy
git add .
git commit -m "Update AI model accuracy"
git push origin main

# Railway will auto-deploy backend
# Netlify will auto-deploy frontend
```

### **8.2 Database Migrations**
```sql
-- Add new features to Supabase
ALTER TABLE users ADD COLUMN premium_expires TIMESTAMP;

-- Update through Supabase dashboard
UPDATE users SET subscription_tier = 'premium' WHERE id = 'user-123';
```

### **8.3 Feature Flags**
```bash
# Environment-based features
ENABLE_2FA=true
ENABLE_PAPER_TRADING=true
ENABLE_LIVE_TRADING=false  # For production safety
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

**❌ CORS Errors**
```bash
# Check backend CORS configuration
# Verify frontend URL in allow_origins
```

**❌ Database Connection**
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/users \
  -H "apikey: your-anon-key"
```

**❌ Market Data Not Loading**
```bash
# Test Alpha Vantage
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=your-key"
```

**❌ Build Failures**
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 **Scaling & Optimization**

### **Performance Tips**
1. **Caching**: Redis for market data caching
2. **CDN**: Use Netlify's global CDN
3. **Database**: Optimize queries with indexes
4. **API**: Rate limiting and request optimization

### **Cost Optimization**
- **Railway**: Monitor usage, upgrade plan as needed
- **Netlify**: Static hosting is very cost-effective  
- **Supabase**: Free tier supports significant usage
- **APIs**: Alpha Vantage free tier: 5 calls/minute

---

## ✅ **Go-Live Checklist**

Before launching to Australian users:

- [ ] All tests passing (run `python run_tests.py`)
- [ ] SSL certificates configured
- [ ] Custom domain configured (.com.au recommended)
- [ ] Database backups enabled in Supabase
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] 2FA SMS working with Australian numbers
- [ ] Market data APIs working
- [ ] AI signals generating correctly
- [ ] Error monitoring in place
- [ ] Legal compliance (ASIC if required)

---

## 🎉 **You're Live!**

Your Australian trading platform is now deployed and ready for users!

- **Frontend**: `https://qlibpro.com.au`
- **API**: `https://api.qlibpro.com.au`
- **Admin**: Supabase dashboard for database management

### **Next Steps**
1. Monitor usage and performance
2. Gather user feedback
3. Add advanced features (options trading, crypto)
4. Scale infrastructure based on demand
5. Consider mobile app development

---

**Need Help?** Check the troubleshooting section or create an issue in your repository.

**🇦🇺 Built for Australian traders, powered by AI, deployed globally!**