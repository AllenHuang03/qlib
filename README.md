# Qlib Pro - Commercial Frontend

A modern, professional frontend for the Qlib AI-powered quantitative trading platform.

## 🚀 Features

### Core Functionality
- **Dashboard**: Real-time portfolio performance, active models, and system status
- **Model Management**: Create, train, and manage ML/DL models (LSTM, Transformer, LightGBM, etc.)
- **Backtesting Engine**: Comprehensive strategy testing with detailed analytics
- **Portfolio Management**: Holdings tracking, P&L analysis, sector allocation
- **Data Management**: Dataset handling, data quality monitoring, sync status
- **User Authentication**: Secure login with JWT tokens

### Technical Stack
- **Frontend**: React 18, TypeScript, Material-UI
- **Charts**: Recharts, Plotly.js for advanced visualizations  
- **State Management**: Zustand for lightweight state management
- **Backend**: Flask API with Qlib integration
- **Data**: Real-time data sync with Qlib data infrastructure

### Advanced Features
- **50+ ML Models**: Support for all Qlib benchmark models
- **Real-time Updates**: Live portfolio and model status updates
- **Professional UI**: Clean, intuitive interface designed for traders
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Export/Import**: Model configurations and backtest results

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+ 
- Qlib installed and configured
- Financial data (CSI300, Alpha158/Alpha360 datasets)

## 🛠️ Quick Start (Windows)

### Option 1: One-Click Setup
```bash
# Run the automated setup script
quick_start.bat
```

### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The server will automatically find an available port (8001-8100)*

**Frontend Setup (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```
*Frontend starts on http://localhost:3000*

### Option 3: Health Check
```bash
# Test if everything is working
python test_setup.py
```

### Qlib Data Setup

Follow the [Qlib documentation](https://qlib.readthedocs.io/) to:
1. Install Qlib: `pip install pyqlib`
2. Download data: `python -m qlib.run.get_data qlib_data --target_dir ~/.qlib/qlib_data/cn_data --region cn`
3. Initialize Qlib with your data path

## 🔧 Configuration

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:8000
```

**Backend (.env)**:
```
DEBUG=True
JWT_SECRET_KEY=your-secret-key-here
QLIB_DATA_PATH=~/.qlib/qlib_data/cn_data
PORT=8000
```

### Qlib Configuration

The backend automatically initializes Qlib with:
- Data provider: Local file storage
- Region: China (REG_CN)
- Features: Alpha158, Alpha360 datasets

## 📊 Usage

### Demo Login
- Email: `demo@qlib.com`
- Password: `demo123`

### Key Workflows

1. **Model Training**: 
   - Go to Models → Create Model
   - Select model type (LSTM, LightGBM, etc.)
   - Choose dataset (Alpha158/Alpha360)
   - Train and monitor progress

2. **Backtesting**:
   - Navigate to Backtesting → New Backtest  
   - Select trained model and date range
   - Analyze performance metrics and charts

3. **Portfolio Monitoring**:
   - View real-time holdings in Portfolio section
   - Monitor P&L, sector allocation, risk metrics
   - Export reports and analysis

## 🏗️ Architecture

```
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API integration
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── backend/                 # Flask Python backend
│   ├── app.py              # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── models/             # ML model integration
└── README.md
```

### API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/dashboard/metrics` - Dashboard overview
- `GET /api/models` - List all models  
- `POST /api/models` - Create new model
- `GET /api/backtests` - List backtests
- `POST /api/backtests` - Start new backtest
- `GET /api/portfolio/holdings` - Portfolio data
- `GET /api/qlib/data` - Qlib market data

## 🚀 Production Deployment

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d
```

### Manual Deployment

1. **Frontend**:
   ```bash
   npm run build
   # Deploy dist/ folder to web server
   ```

2. **Backend**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

### Environment Setup
- Set production environment variables
- Configure HTTPS/SSL certificates  
- Set up database for user management
- Configure external data sources

## 🔍 Monitoring & Analytics

The platform includes built-in monitoring for:
- Model performance tracking
- System health checks
- Data quality monitoring  
- User activity analytics
- API response times

## 🛡️ Security

- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Secure API endpoints
- Production security headers

## 📈 Performance

- Lazy loading of components
- Efficient data caching
- Optimized chart rendering
- Compressed assets
- CDN-ready static files

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@qlib-pro.com
- 📚 Documentation: [docs.qlib-pro.com](https://docs.qlib-pro.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/qlib-frontend/issues)

## 🙏 Acknowledgments

- [Microsoft Qlib](https://github.com/microsoft/qlib) - Core quantitative platform
- [Material-UI](https://mui.com/) - UI component library
- [Recharts](https://recharts.org/) - Chart visualization library

---

Built with ❤️ for the quantitative trading community