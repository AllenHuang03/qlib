#!/usr/bin/env python3
"""
QLIB PRO - DATABASE SETUP SCRIPT
Initializes Supabase database with Australian trading platform schema
"""

import os
import asyncio
import httpx
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://egbirkjdybtcxlzodclt.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlya2pkeWJ0Y3hsem9kY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTYwMTQsImV4cCI6MjA3MDE5MjAxNH0.xT_eUhF7K5cdRGBFlFHHyyJ7SH5g3UIPBbZ2IJj9irc"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYmlya2pkeWJ0Y3hsem9kY2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYxNjAxNCwiZXhwIjoyMDcwMTkyMDE0fQ.f09V_u4C63yVPxJqRyrujMclxpaLrSFh3iMCnOBc7pg"

# API Keys
ALPHA_VANTAGE_KEY = "YR3O8FBCPDC5IVEX"
NEWS_API_KEY = "96ded78b5ae44522acc383bf0df3a27a"

class DatabaseSetup:
    """Setup and initialize the Supabase database for Qlib Pro"""
    
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.anon_key = SUPABASE_ANON_KEY
        self.service_key = SUPABASE_SERVICE_KEY
        
    async def test_connections(self):
        """Test all API connections"""
        logger.info("🔗 Testing API connections...")
        
        results = {
            "supabase": await self._test_supabase(),
            "alpha_vantage": await self._test_alpha_vantage(),
            "news_api": await self._test_news_api()
        }
        
        # Display results
        for service, status in results.items():
            emoji = "✅" if status else "❌"
            logger.info(f"{emoji} {service.replace('_', ' ').title()}: {'Connected' if status else 'Failed'}")
        
        return results
    
    async def _test_supabase(self):
        """Test Supabase connection"""
        try:
            headers = {
                "apikey": self.anon_key,
                "Authorization": f"Bearer {self.anon_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/",
                    headers=headers
                )
                return response.status_code in [200, 404]  # 404 is OK, means no tables yet
                
        except Exception as e:
            logger.error(f"Supabase test failed: {e}")
            return False
    
    async def _test_alpha_vantage(self):
        """Test Alpha Vantage API"""
        try:
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": "AAPL",
                "apikey": ALPHA_VANTAGE_KEY
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    "https://www.alphavantage.co/query",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return "Global Quote" in data and data["Global Quote"]
                
                return False
                
        except Exception as e:
            logger.error(f"Alpha Vantage test failed: {e}")
            return False
    
    async def _test_news_api(self):
        """Test News API"""
        try:
            params = {
                "q": "stocks",
                "apiKey": NEWS_API_KEY,
                "pageSize": 1,
                "sortBy": "publishedAt"
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    "https://newsapi.org/v2/everything",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("status") == "ok" and len(data.get("articles", [])) > 0
                
                return False
                
        except Exception as e:
            logger.error(f"News API test failed: {e}")
            return False
    
    async def check_database_schema(self):
        """Check if database schema is properly set up"""
        logger.info("📋 Checking database schema...")
        
        try:
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            }
            
            # Check if key tables exist by trying to query them
            tables_to_check = ["users", "portfolios", "ai_models", "au_instruments"]
            existing_tables = []
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                for table in tables_to_check:
                    try:
                        response = await client.get(
                            f"{self.supabase_url}/rest/v1/{table}?limit=1",
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            existing_tables.append(table)
                            logger.info(f"✅ Table '{table}' exists")
                        else:
                            logger.warning(f"❌ Table '{table}' missing")
                    except Exception:
                        logger.warning(f"❌ Table '{table}' missing or inaccessible")
            
            if len(existing_tables) == len(tables_to_check):
                logger.info("🎉 All required tables exist!")
                return True
            else:
                logger.warning(f"⚠️ Only {len(existing_tables)}/{len(tables_to_check)} tables found")
                logger.info("📝 Please run the schema from database/supabase_integration.sql in Supabase SQL Editor")
                return False
                
        except Exception as e:
            logger.error(f"Schema check failed: {e}")
            return False
    
    async def seed_demo_data(self):
        """Seed database with demo data for testing"""
        logger.info("🌱 Seeding demo data...")
        
        try:
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            }
            
            # Check if demo user exists
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to get demo user
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/users?email=eq.demo@qlib.com",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if len(data) > 0:
                        logger.info("✅ Demo user already exists")
                        return True
                    else:
                        logger.info("📝 Demo data seeding requires manual schema setup")
                        return False
                else:
                    logger.warning("⚠️ Cannot check for demo user - schema may not be set up")
                    return False
                    
        except Exception as e:
            logger.error(f"Demo data seeding failed: {e}")
            return False
    
    async def run_setup(self):
        """Run complete setup process"""
        logger.info("🚀 Starting Qlib Pro Database Setup...")
        logger.info("🇦🇺 Australian Trading Platform Configuration")
        logger.info("=" * 60)
        
        # Test API connections
        connections = await self.test_connections()
        
        # Check database schema
        schema_ready = await self.check_database_schema()
        
        # Seed demo data if schema is ready
        demo_seeded = False
        if schema_ready:
            demo_seeded = await self.seed_demo_data()
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 SETUP SUMMARY")
        logger.info("=" * 60)
        
        logger.info(f"🗄️ Supabase Connection: {'✅ Connected' if connections['supabase'] else '❌ Failed'}")
        logger.info(f"📈 Alpha Vantage API: {'✅ Connected' if connections['alpha_vantage'] else '❌ Failed'}")
        logger.info(f"📰 News API: {'✅ Connected' if connections['news_api'] else '❌ Failed'}")
        logger.info(f"🏗️ Database Schema: {'✅ Ready' if schema_ready else '❌ Needs Setup'}")
        logger.info(f"🌱 Demo Data: {'✅ Ready' if demo_seeded else '❌ Needs Setup'}")
        
        # Instructions
        logger.info("\n📋 NEXT STEPS:")
        
        if not schema_ready:
            logger.info("1. 🗄️ Set up database schema:")
            logger.info("   • Go to Supabase SQL Editor")
            logger.info("   • Run the schema from: database/supabase_integration.sql")
            logger.info("   • This will create all required tables and relationships")
        
        if not connections['alpha_vantage']:
            logger.info("2. 📈 Check Alpha Vantage API key")
            logger.info("   • Verify your API key is correct")
            logger.info("   • Check rate limits (5 requests/minute for free tier)")
        
        if not connections['news_api']:
            logger.info("3. 📰 Check News API key")
            logger.info("   • Verify your API key is correct")
            logger.info("   • Check rate limits")
        
        if all(connections.values()) and schema_ready:
            logger.info("🎉 Setup complete! Your platform is ready to use:")
            logger.info("   • Run: python backend/production_api.py")
            logger.info("   • Test: python run_tests.py")
            logger.info("   • Deploy: Push to Railway/Netlify")
        
        logger.info(f"\n⏰ Setup completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

async def main():
    """Main setup function"""
    setup = DatabaseSetup()
    await setup.run_setup()

if __name__ == "__main__":
    asyncio.run(main())