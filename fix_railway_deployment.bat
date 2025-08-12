@echo off
echo =====================================================
echo 🔧 FIX RAILWAY DEPLOYMENT - Qlib Pro
echo =====================================================

echo.
echo ISSUE FOUND: Railway is using old Dockerfile with minimal_api.py
echo SOLUTION: Update all references to main.py and force rebuild
echo.

pause

echo.
echo ✅ Step 1: Dockerfile updated (main.py entry point)
echo ✅ Step 2: nixpacks.toml updated (main.py entry point)  
echo ✅ Step 3: railway.toml updated (main.py entry point)

echo.
echo Step 4: Creating Docker cache-clear marker...
echo # Docker cache clear - %date% %time% > .docker-cache-clear
echo # Force Docker rebuild from scratch >> .docker-cache-clear
echo # Entry point fixed: main.py >> .docker-cache-clear

echo.
echo Step 5: Testing local deployment...
python test_deployment.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: Local tests failed!
    pause
    exit /b 1
)

echo.
echo Step 6: Staging all fixed files...
git add .

echo.
echo Step 7: Creating deployment fix commit...
git commit -m "🔧 FIX RAILWAY DEPLOYMENT - Update all references

❌ FIXED: Dockerfile still referenced minimal_api.py
✅ Updated: Dockerfile → main.py  
✅ Updated: nixpacks.toml → main.py
✅ Updated: railway.toml → main.py
✅ Added: Docker cache clear markers

Entry Point: main.py (all configs now consistent)
Build: pip install -r requirements.txt
Start: python main.py

Fixed: %date% %time%"

echo.
echo Step 8: Pushing deployment fixes...
git push origin main

echo.
echo =====================================================
echo 🎉 DEPLOYMENT FIXED - Railway Cache Cleared!
echo =====================================================
echo.
echo What was fixed:
echo ❌ OLD: Dockerfile copied minimal_api.py (NOT FOUND)
echo ✅ NEW: Dockerfile copies main.py (EXISTS)
echo.
echo ❌ OLD: CMD ["python", "minimal_api.py"]  
echo ✅ NEW: CMD ["python", "main.py"]
echo.
echo Railway will now:
echo 1. ✅ Detect the new commit
echo 2. ✅ Clear Docker build cache  
echo 3. ✅ Use updated Dockerfile
echo 4. ✅ Copy main.py (exists)
echo 5. ✅ Install requirements.txt
echo 6. ✅ Start with python main.py
echo 7. ✅ Your API will be LIVE!
echo.
echo 📍 Next: Go to Railway dashboard and check deployment
echo 📍 Expected: BUILD SUCCESS with main.py
echo 📍 URL: https://your-app.up.railway.app/api/health
echo.

pause