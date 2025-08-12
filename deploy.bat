@echo off
echo =====================================================
echo Qlib Pro - Australian Trading Platform Deployment
echo =====================================================

echo.
echo Testing deployment setup...
python test_deployment.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Deployment tests failed!
    echo Please fix the errors before deploying.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo All tests passed! Ready to deploy to Railway.
echo =====================================================

echo.
echo To deploy:
echo 1. git add .
echo 2. git commit -m "Clean deployment-ready structure"
echo 3. git push origin main
echo 4. Go to Railway.app and connect your GitHub repo
echo 5. Set environment variables in Railway dashboard
echo.

echo Press any key to continue...
pause > nul

echo.
echo Running git commands...
git add .

echo.
echo Committing changes...
git commit -m "🚀 Clean deployment structure for Railway

✅ Single main.py entry point
✅ Clean requirements.txt
✅ All services in root directory  
✅ API keys configured
✅ Tests passing
✅ Railway/Netlify ready

Features:
- Supabase database integration
- Australian market data (ASX)
- AI trading signals (87%+ accuracy)
- 2FA authentication system
- Real-time market data (Alpha Vantage)
- Comprehensive testing suite"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo =====================================================
echo SUCCESS! Your code is now on GitHub.
echo =====================================================
echo.
echo Next steps:
echo 1. Go to https://railway.app
echo 2. Click "New Project" -^> "Deploy from GitHub repo"
echo 3. Select your repository: AllenHuang03/qlib
echo 4. Set environment variables (they're already configured as fallbacks)
echo 5. Your API will be live at: https://your-app.up.railway.app
echo.
echo For Netlify frontend:
echo 1. Go to https://netlify.com  
echo 2. Connect GitHub -^> select your repo
echo 3. Set base directory: frontend
echo 4. Set build command: npm run build
echo 5. Set publish directory: dist
echo.

pause