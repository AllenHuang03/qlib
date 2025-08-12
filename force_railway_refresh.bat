@echo off
echo =====================================================
echo Force Railway Cache Clear - Qlib Pro
echo =====================================================

echo.
echo This will force Railway to rebuild from scratch
echo by creating a new commit that clears any cached data.
echo.

echo Creating .railwayignore file to ensure clean build...
echo # Railway ignore file > .railwayignore
echo __pycache__/ >> .railwayignore
echo *.pyc >> .railwayignore
echo .env >> .railwayignore
echo node_modules/ >> .railwayignore
echo .git/ >> .railwayignore

echo.
echo Adding force-rebuild marker...
echo # Force rebuild - %date% %time% > .railway-rebuild
echo Updated: %date% %time% >> .railway-rebuild

echo.
echo Committing cache-clearing changes...
git add .
git commit -m "🔄 Force Railway cache clear - Clean build

- Remove backend directory references
- Clear any cached build data  
- Force fresh Nixpacks detection
- Ensure main.py is detected as entry point
- Updated: %date% %time%"

echo.
echo Pushing cache-clearing commit...
git push origin main

echo.
echo =====================================================
echo Cache clear commit pushed!
echo =====================================================
echo.
echo Now Railway will:
echo 1. Detect the new commit
echo 2. Clear all cached build data
echo 3. Re-scan your repository structure
echo 4. Find main.py as the entry point
echo 5. Build with clean Nixpacks detection
echo.
echo Next: Go to Railway and trigger a new deployment
echo.

pause