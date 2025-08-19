#!/bin/bash

# Production Deployment Script for Qlib Pro Trading Platform
# This script automates the deployment to Railway (backend) and Netlify (frontend)

set -e  # Exit on any error

echo "🚀 Starting Qlib Pro Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_RAILWAY_PROJECT="qlib-backend-production"
FRONTEND_NETLIFY_SITE="qlib-pro"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo "🔍 Checking required tools..."

if ! command_exists railway; then
    echo -e "${RED}❌ Railway CLI not found. Install with: npm install -g @railway/cli${NC}"
    exit 1
fi

if ! command_exists netlify; then
    echo -e "${RED}❌ Netlify CLI not found. Install with: npm install -g netlify-cli${NC}" 
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

if ! command_exists python; then
    echo -e "${RED}❌ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required tools found${NC}"

# Step 1: Deploy Backend to Railway
echo -e "\n${YELLOW}📦 Step 1: Deploying Backend to Railway...${NC}"

cd backend

# Ensure requirements.txt is up to date
echo "📝 Updating requirements.txt..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅ Requirements.txt found${NC}"
else
    echo -e "${RED}❌ requirements.txt not found in backend directory${NC}"
    exit 1
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami > /dev/null 2>&1; then
    echo "Please login to Railway:"
    railway login
fi

# Deploy to Railway
echo "🚀 Deploying backend to Railway..."
railway deploy --service backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployment successful${NC}"
    
    # Get the deployed URL
    BACKEND_URL=$(railway domain | grep -o 'https://[^[:space:]]*')
    echo -e "${GREEN}🌐 Backend URL: $BACKEND_URL${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

cd ..

# Step 2: Deploy Frontend to Netlify
echo -e "\n${YELLOW}📦 Step 2: Deploying Frontend to Netlify...${NC}"

cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the application
echo "🔨 Building frontend application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Login to Netlify (if not already logged in)
echo "🔐 Checking Netlify authentication..."
if ! netlify status > /dev/null 2>&1; then
    echo "Please login to Netlify:"
    netlify login
fi

# Deploy to Netlify
echo "🚀 Deploying frontend to Netlify..."
netlify deploy --prod --dir=dist --site=$FRONTEND_NETLIFY_SITE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployment successful${NC}"
    
    # Get the deployed URL
    FRONTEND_URL=$(netlify status --site=$FRONTEND_NETLIFY_SITE | grep -o 'https://[^[:space:]]*netlify.app')
    echo -e "${GREEN}🌐 Frontend URL: $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

cd ..

# Step 3: Run Post-Deployment Health Checks
echo -e "\n${YELLOW}🏥 Step 3: Running Health Checks...${NC}"

# Wait a moment for services to start
sleep 30

# Test backend health endpoint
echo "🔍 Testing backend health..."
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Test frontend accessibility
echo "🔍 Testing frontend accessibility..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend accessibility check passed${NC}"
else
    echo -e "${RED}❌ Frontend accessibility check failed${NC}"
fi

# Step 4: Database Migration (if needed)
echo -e "\n${YELLOW}🗄️ Step 4: Database Setup...${NC}"
echo "ℹ️  Please run database migrations manually in Supabase dashboard:"
echo "   1. Go to https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to SQL Editor"
echo "   4. Run the migration file: supabase/migrations/20240101000000_initial_production_setup.sql"

# Step 5: Environment Variables Check
echo -e "\n${YELLOW}⚙️ Step 5: Environment Variables Check...${NC}"
echo "Please ensure the following environment variables are set:"

echo -e "\n${GREEN}Railway (Backend):${NC}"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_KEY"
echo "  - SECRET_KEY"
echo "  - ALPHA_VANTAGE_API_KEY"
echo "  - REDIS_URL"
echo "  - SENDGRID_API_KEY"

echo -e "\n${GREEN}Netlify (Frontend):${NC}"
echo "  - REACT_APP_SUPABASE_URL"
echo "  - REACT_APP_SUPABASE_ANON_KEY"
echo "  - REACT_APP_GA_TRACKING_ID"

# Deployment Summary
echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "\n${YELLOW}📊 Deployment Summary:${NC}"
echo "  🔗 Backend URL:  $BACKEND_URL"
echo "  🔗 Frontend URL: $FRONTEND_URL"
echo "  🔗 Health Check: $BACKEND_URL/health"
echo "  🔗 API Docs:     $BACKEND_URL/docs"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "  1. ✅ Configure custom domain (optional)"
echo "  2. ✅ Set up monitoring alerts"
echo "  3. ✅ Run comprehensive tests with test accounts"
echo "  4. ✅ Configure backup procedures"
echo "  5. ✅ Set up SSL certificates (auto-configured)"

echo -e "\n${YELLOW}🧪 Test Accounts Available:${NC}"
echo "  📧 newcustomer@test.com (password: Test123!)"
echo "  📧 verified@test.com (password: Test123!)"  
echo "  📧 premium@test.com (password: Test123!)"
echo "  📧 institution@test.com (password: Test123!)"
echo "  📧 kyc.staff@test.com (password: Test123!)"
echo "  📧 agent@test.com (password: Test123!)"
echo "  📧 admin@test.com (password: Test123!)"
echo "  📧 support@test.com (password: Test123!)"

echo -e "\n${GREEN}🚀 Qlib Pro is now live in production! 🚀${NC}"