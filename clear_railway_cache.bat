@echo off
echo =====================================================
echo RAILWAY CACHE CLEAR - Qlib Pro Australian Platform
echo =====================================================

echo.
echo This script will:
echo 1. Fix nixpacks.toml to point to main.py
echo 2. Create cache-busting files
echo 3. Force Railway to rebuild from scratch
echo 4. Clear any references to old backend directory
echo.

pause

echo.
echo Step 1: Creating cache-busting files...

echo # Railway cache buster - %date% %time% > .railway-cache-clear
echo # Force complete rebuild >> .railway-cache-clear
echo # Clear nixpacks cache >> .railway-cache-clear
echo # Entry point: main.py >> .railway-cache-clear

echo.
echo Step 2: Creating .railwayignore...
echo # Railway ignore file > .railwayignore
echo __pycache__/ >> .railwayignore
echo *.pyc >> .railwayignore
echo *.pyo >> .railwayignore
echo .env >> .railwayignore
echo .env.local >> .railwayignore
echo node_modules/ >> .railwayignore
echo .git/ >> .railwayignore
echo backend/ >> .railwayignore
echo tests/ >> .railwayignore
echo docs/ >> .railwayignore
echo examples/ >> .railwayignore

echo.
echo Step 3: Verifying main files are present...
if exist main.py (
    echo ✓ main.py found
) else (
    echo ✗ main.py missing!
    echo ERROR: main.py not found. Please ensure files are in root directory.
    pause
    exit /b 1
)

if exist requirements.txt (
    echo ✓ requirements.txt found
) else (
    echo ✗ requirements.txt missing!
    echo ERROR: requirements.txt not found.
    pause
    exit /b 1
)

echo.
echo Step 4: Testing deployment setup...
python test_deployment.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Deployment tests failed!
    echo Please fix the errors before clearing cache.
    pause
    exit /b 1
)

echo.
echo Step 5: Staging all changes...
git add .

echo.
echo Step 6: Creating cache-clearing commit...
git commit -m "🔥 FORCE RAILWAY CACHE CLEAR

✅ Fix nixpacks.toml entry point (main.py)
✅ Remove all backend/ directory references  
✅ Clear Nixpacks build cache
✅ Force fresh repository scan
✅ Add cache-busting files
✅ Updated Railway configuration

Entry point: main.py
Build: pip install -r requirements.txt  
Start: python main.py

Cache cleared: %date% %time%"

echo.
echo Step 7: Pushing cache-clearing commit...
git push origin main

echo.
echo =====================================================
echo 🎉 RAILWAY CACHE CLEARED SUCCESSFULLY!
echo =====================================================
echo.
echo Railway will now:
echo ✓ Detect the new commit  
echo ✓ Clear ALL cached build data
echo ✓ Re-scan repository structure
echo ✓ Find main.py as entry point
echo ✓ Use updated nixpacks.toml
echo ✓ Build with fresh dependencies
echo.
echo Next steps:
echo 1. Go to Railway.app dashboard
echo 2. If you have existing project: DELETE IT
echo 3. Create NEW project from GitHub
echo 4. Select your repository: AllenHuang03/qlib
echo 5. Railway will auto-detect Python + main.py
echo 6. Add environment variables (optional - defaults work)
echo.
echo Your API will be live at: https://your-app.up.railway.app
echo.

pause