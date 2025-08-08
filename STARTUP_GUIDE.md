# 🚀 Qlib Pro - Quick Start Guide

This guide will help you get the Qlib Pro frontend running on your Windows machine.

## 📋 Prerequisites

1. **Python 3.8+** - [Download here](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **Git** (optional) - For version control

## 🛠️ Step 1: Backend Setup

### Option A: Using the Batch Script (Recommended)
```bash
cd backend
start_server.bat
```

### Option B: Manual Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server will automatically find an available port (starting from 8001) and display it.

**Expected Output:**
```
INFO:__main__:Starting Qlib Pro Backend API on port 8001
INFO:__main__:Qlib available: False
INFO:__main__:Access the API at: http://localhost:8001
* Running on http://127.0.0.1:8001
```

## 🎨 Step 2: Frontend Setup

Open a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:3000/
Network: use --host to expose
```

## 🌐 Step 3: Access the Application

1. Open your browser to: **http://localhost:3000**
2. Use demo credentials:
   - **Email**: `demo@qlib.com`
   - **Password**: `demo123`

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Port already in use
```
An attempt was made to access a socket in a way forbidden by its access permissions
```
**Solution**: The server will automatically find another port. Check the console output for the actual port being used.

**Problem**: Qlib not available
```
Qlib not available - running in demo mode
```
**Solution**: This is normal for the initial setup. The app works in demo mode with mock data.

### Frontend Issues

**Problem**: Cannot connect to backend
```
ERR_NETWORK
```
**Solution**: 
1. Make sure the backend is running
2. Check the port in the backend console output
3. Update `frontend/.env` if needed:
   ```
   VITE_API_URL=http://localhost:ACTUAL_PORT
   ```

**Problem**: npm install fails
**Solution**: 
1. Delete `node_modules` folder
2. Delete `package-lock.json`  
3. Run `npm install` again

## 📊 Step 4: Explore the Features

### Dashboard
- Portfolio performance overview
- Active models status  
- System health monitoring

### Models
- Create new ML models
- View model performance
- Start/stop model training

### Backtesting
- Test trading strategies
- Analyze performance metrics
- Compare against benchmarks  

### Portfolio
- View current holdings
- Track P&L and performance
- Analyze sector allocation

## 🔄 Installing Qlib (Optional)

To enable full Qlib functionality with real data:

```bash
pip install pyqlib

# Download sample data
python -m qlib.run.get_data qlib_data --target_dir ~/.qlib/qlib_data/cn_data --region cn
```

After installing Qlib, restart the backend server to enable full functionality.

## 🆘 Need Help?

### Common Port Issues on Windows
```bash
# Check what's using port 8000/8001
netstat -ano | findstr :8001

# Kill process if needed (replace PID)
taskkill /PID <PID> /F
```

### Environment Variables
Create `frontend/.env` with:
```
VITE_API_URL=http://localhost:8001
```

Create `backend/.env` with:
```
DEBUG=True
JWT_SECRET_KEY=dev-secret-key
PORT=8001
```

### Reset Everything
```bash
# Stop all servers (Ctrl+C in terminals)
# Clear browser cache
# Restart both backend and frontend
```

## ✅ Success Checklist

- [ ] Backend running on http://localhost:8001 (or similar)  
- [ ] Frontend running on http://localhost:3000
- [ ] Can login with demo@qlib.com / demo123
- [ ] Dashboard loads with charts and data
- [ ] Can navigate between all sections

## 🚀 Next Steps

1. **Explore the Interface**: Try creating models, running backtests
2. **Install Qlib**: For real market data and full functionality  
3. **Customize**: Modify the code to fit your trading strategies
4. **Deploy**: Use Docker for production deployment

---

**Happy Trading!** 📈