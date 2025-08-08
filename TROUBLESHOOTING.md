# 🔧 Troubleshooting Guide

This guide helps resolve common issues with the Qlib Pro frontend.

## 🚨 Issue: Frontend buttons not working, backend seems disconnected

### Symptoms
- Frontend loads at http://localhost:3007
- Navigation works but buttons don't respond
- Dashboard shows "Loading..." or connection errors
- Browser console shows network errors

### Quick Diagnosis

**Step 1: Check Backend Status**
```bash
# Run this from the qlib root directory
python debug_setup.py
```

**Step 2: Find Active Backend**
```bash
netstat -ano | findstr :800
```
Look for LISTENING ports in the 8000+ range.

### Solution Steps

#### Option A: Restart Everything (Recommended)
```bash
# 1. Stop frontend (Ctrl+C in frontend terminal)
# 2. Stop backend (Ctrl+C in backend terminal)

# 3. Start backend
cd backend
python app.py
# Note the port it displays (e.g., "Access the API at: http://localhost:8002")

# 4. Update frontend config
# Edit frontend/.env and set: VITE_API_URL=http://localhost:XXXX

# 5. Start frontend
cd frontend
npm run dev
```

#### Option B: Use Automated Scripts
```bash
# Start backend with auto port detection
python start_backend_simple.py

# In another terminal, start frontend
cd frontend && npm run dev
```

### Common Port Issues

**Problem**: Port conflicts
```
An attempt was made to access a socket in a way forbidden by its access permissions
```

**Solution**: The backend automatically finds available ports. Check the console output for the actual port being used.

**Problem**: Wrong port in frontend config
```
Failed to connect to backend
```

**Solution**: 
1. Check backend console for actual port
2. Update `frontend/.env`: `VITE_API_URL=http://localhost:ACTUAL_PORT`
3. Restart frontend

### Browser Debugging

**Open Developer Tools (F12)**

1. **Console Tab**: Look for errors like:
   ```
   Failed to load resource: net::ERR_CONNECTION_REFUSED
   ```
   This means frontend can't reach backend.

2. **Network Tab**: 
   - Refresh the page
   - Look for failed requests (red entries)
   - Check if API calls are going to the right port

3. **Application Tab**:
   - Go to Local Storage
   - Clear `auth-storage` if login issues persist

### Manual API Testing

**Test backend health:**
```bash
# Replace 8002 with your actual backend port
curl http://localhost:8002/api/health

# Or use PowerShell
Invoke-RestMethod http://localhost:8002/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "qlib_available": false,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8002
```

**Backend (.env)** (optional)
```
DEBUG=True
PORT=8002
JWT_SECRET_KEY=dev-secret-key
```

## 🔍 Detailed Debugging Steps

### 1. Verify File Structure
```
qlib/
├── frontend/
│   ├── .env ✓
│   ├── package.json ✓
│   └── src/ ✓
└── backend/
    ├── app.py ✓
    └── requirements.txt ✓
```

### 2. Check Dependencies
```bash
# Backend
cd backend && pip list | grep -i flask

# Frontend  
cd frontend && npm list react
```

### 3. Clear Cache
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
pip install -r requirements.txt --force-reinstall
```

### 4. Port Management
```bash
# Windows: Kill process on specific port
netstat -ano | findstr :8002
taskkill /PID <PID> /F

# Check if port is free
telnet localhost 8002
```

## 📱 Frontend-Specific Issues

### Issue: Login doesn't work
**Symptoms**: Login form submits but nothing happens

**Solution**:
1. Open browser dev tools → Network tab
2. Try to login and watch for API calls
3. If no calls are made, check console for JavaScript errors
4. If calls fail, verify backend is running on correct port

### Issue: Dashboard shows "Loading..." forever
**Cause**: API calls failing due to backend connection

**Solution**:
1. Check connection status indicator on dashboard
2. Use "Scan Ports" button to find active backend
3. Update `.env` file and restart frontend

### Issue: Navigation works but content doesn't load
**Cause**: Authentication issues or API failures

**Solution**:
1. Clear browser local storage
2. Try login again
3. Check browser network tab for 401/403 errors

## 🛠️ Production Issues

### Issue: Docker deployment not working
**Check**:
- Docker services are running
- Ports are correctly mapped in docker-compose.yml
- Environment variables are set correctly

### Issue: Nginx serving issues
**Check**:
- Build artifacts exist in `frontend/dist/`
- Nginx config points to correct directory
- API proxy is configured correctly

## ✅ Verification Checklist

After fixing issues, verify:
- [ ] Backend responds to http://localhost:PORT/api/health
- [ ] Frontend loads at http://localhost:3007 (or 3000)
- [ ] Login works with demo@qlib.com / demo123
- [ ] Dashboard shows data (not "Loading...")
- [ ] Navigation between pages works
- [ ] Buttons and forms are responsive

## 🆘 Still Having Issues?

1. **Run full diagnosis**: `python debug_setup.py`
2. **Check logs**: Look at browser console and terminal output
3. **Try clean restart**: Kill all processes, restart in order
4. **Check ports**: Make sure no other services conflict

### Common Working Configurations

**Configuration 1:**
- Backend: http://localhost:8002
- Frontend: http://localhost:3007
- API URL: http://localhost:8002

**Configuration 2:**
- Backend: http://localhost:8001  
- Frontend: http://localhost:3000
- API URL: http://localhost:8001

The key is ensuring frontend `.env` matches the actual backend port!