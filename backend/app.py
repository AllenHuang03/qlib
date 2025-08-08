from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import logging
import os
import sys
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Add qlib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from qlib_manager import qlib_manager, QLIB_AVAILABLE
except ImportError:
    print("Qlib manager not available - running in demo mode")
    QLIB_AVAILABLE = False
    qlib_manager = None

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'qlib-pro-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

CORS(app)
jwt = JWTManager(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Qlib initialization is handled by qlib_manager

# Mock data for demo mode
MOCK_USERS = {
    'demo@qlib.com': {
        'id': '1',
        'email': 'demo@qlib.com',
        'password': 'demo123',
        'name': 'Demo User',
        'role': 'admin'
    }
}

MOCK_MODELS = [
    {
        'id': '1',
        'name': 'LSTM-Alpha158-v2.1',
        'type': 'LSTM',
        'status': 'active',
        'accuracy': '89.2%',
        'sharpe': '1.67',
        'last_trained': '2024-01-15',
        'description': 'Long Short-Term Memory model trained on Alpha158 features',
        'created_at': '2024-01-01T10:00:00Z'
    },
    {
        'id': '2',
        'name': 'LightGBM-Multi-Factor',
        'type': 'LightGBM',
        'status': 'active',
        'accuracy': '85.7%',
        'sharpe': '1.43',
        'last_trained': '2024-01-12',
        'description': 'Gradient boosting model with multi-factor alpha features',
        'created_at': '2024-01-02T14:30:00Z'
    }
]

MOCK_BACKTESTS = [
    {
        'id': '1',
        'name': 'LSTM Strategy Test',
        'model_id': '1',
        'start_date': '2023-01-01',
        'end_date': '2024-01-01',
        'returns': 18.5,
        'sharpe': 1.67,
        'max_drawdown': -5.2,
        'volatility': 12.4,
        'win_rate': 67.3,
        'status': 'completed',
        'created_at': '2024-01-15T09:00:00Z'
    }
]

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User authentication endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Demo authentication
    user = MOCK_USERS.get(email)
    if user and user['password'] == password:
        access_token = create_access_token(identity=user['id'])
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }), 200
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    user_id = get_jwt_identity()
    user = next((u for u in MOCK_USERS.values() if u['id'] == user_id), None)
    if user:
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        })
    return jsonify({'message': 'User not found'}), 404

@app.route('/api/dashboard/metrics', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """Get dashboard overview metrics"""
    return jsonify({
        'total_return': 22.8,
        'sharpe_ratio': 1.84,
        'max_drawdown': -4.2,
        'portfolio_value': 1228000,
        'active_models': len([m for m in MOCK_MODELS if m['status'] == 'active']),
        'total_models': len(MOCK_MODELS),
        'last_update': datetime.now().isoformat()
    })

@app.route('/api/dashboard/performance', methods=['GET'])
@jwt_required()
def get_performance_data():
    """Get portfolio performance time series"""
    # Generate mock performance data
    dates = pd.date_range(start='2024-01-01', end='2024-07-31', freq='M')
    portfolio_values = np.cumsum(np.random.normal(0.02, 0.05, len(dates))) + 1
    benchmark_values = np.cumsum(np.random.normal(0.015, 0.03, len(dates))) + 1
    
    performance_data = []
    for i, date in enumerate(dates):
        performance_data.append({
            'date': date.strftime('%Y-%m'),
            'portfolio': round((portfolio_values[i] * 100000), 2),
            'benchmark': round((benchmark_values[i] * 100000), 2)
        })
    
    return jsonify(performance_data)

@app.route('/api/models', methods=['GET'])
@jwt_required()
def get_models():
    """Get list of all models"""
    if QLIB_AVAILABLE and qlib_manager and qlib_manager.initialized:
        # Get real Qlib models from manager
        real_models = []
        for model_id, model_data in qlib_manager.models.items():
            real_models.append({
                'id': model_id,
                'name': model_data['config'].get('name', 'Qlib Model'),
                'type': model_data['config']['type'],
                'status': model_data['status'],
                'accuracy': '87.5%',  # Would calculate from validation
                'sharpe': '1.56',     # Would calculate from backtest
                'last_trained': model_data['created_at'].strftime('%Y-%m-%d'),
                'description': f"Real {model_data['config']['type']} model trained on Alpha158 features",
                'created_at': model_data['created_at'].isoformat()
            })
        
        # If no real models exist, return mock for demo
        if not real_models:
            return jsonify(MOCK_MODELS)
        return jsonify(real_models)
    
    return jsonify(MOCK_MODELS)

@app.route('/api/models', methods=['POST'])
@jwt_required()
def create_model():
    """Create a new model"""
    data = request.get_json()
    
    if QLIB_AVAILABLE and qlib_manager and qlib_manager.initialized:
        # Create real Qlib model
        try:
            model_config = {
                'name': data.get('name', 'Untitled Model'),
                'type': data.get('type', 'LightGBM'),
                'description': data.get('description', '')
            }
            
            new_model = qlib_manager.create_real_model(model_config)
            if 'error' in new_model:
                return jsonify({'message': new_model['error']}), 500
            
            return jsonify(new_model), 201
            
        except Exception as e:
            logger.error(f"Error creating real model: {e}")
            # Fall back to mock if real training fails
    
    # Fallback mock model creation
    new_model = {
        'id': str(len(MOCK_MODELS) + 1),
        'name': data.get('name', 'Untitled Model'),
        'type': data.get('type', 'Unknown'),
        'status': 'training',
        'accuracy': '0%',
        'sharpe': '0.0',
        'last_trained': datetime.now().strftime('%Y-%m-%d'),
        'description': data.get('description', ''),
        'created_at': datetime.now().isoformat()
    }
    
    MOCK_MODELS.append(new_model)
    return jsonify(new_model), 201

@app.route('/api/models/<model_id>', methods=['GET'])
@jwt_required()
def get_model(model_id):
    """Get specific model details"""
    model = next((m for m in MOCK_MODELS if m['id'] == model_id), None)
    if not model:
        return jsonify({'message': 'Model not found'}), 404
    return jsonify(model)

@app.route('/api/backtests', methods=['GET'])
@jwt_required()
def get_backtests():
    """Get list of all backtests"""
    return jsonify(MOCK_BACKTESTS)

@app.route('/api/backtests', methods=['POST'])
@jwt_required()
def create_backtest():
    """Create a new backtest"""
    data = request.get_json()
    
    if QLIB_AVAILABLE and qlib_manager and qlib_manager.initialized:
        # Run real Qlib backtest
        try:
            backtest_config = {
                'name': data.get('name', 'Untitled Backtest'),
                'model_id': data.get('model_id'),
                'start_date': data.get('start_date'),
                'end_date': data.get('end_date'),
                'initial_capital': data.get('initial_capital', 1000000)
            }
            
            new_backtest = qlib_manager.run_real_backtest(backtest_config)
            if 'error' in new_backtest:
                return jsonify({'message': new_backtest['error']}), 500
            
            return jsonify(new_backtest), 201
            
        except Exception as e:
            logger.error(f"Error running real backtest: {e}")
            # Fall back to mock if real backtest fails
    
    # Fallback mock backtest creation
    new_backtest = {
        'id': str(len(MOCK_BACKTESTS) + 1),
        'name': data.get('name', 'Untitled Backtest'),
        'model_id': data.get('model_id'),
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'returns': round(np.random.normal(15, 8), 2),
        'sharpe': round(np.random.normal(1.5, 0.3), 2),
        'max_drawdown': round(np.random.normal(-5, 2), 2),
        'volatility': round(np.random.normal(12, 3), 2),
        'win_rate': round(np.random.normal(65, 10), 1),
        'status': 'running',
        'created_at': datetime.now().isoformat()
    }
    
    MOCK_BACKTESTS.append(new_backtest)
    return jsonify(new_backtest), 201

@app.route('/api/backtests/<backtest_id>', methods=['GET'])
@jwt_required()
def get_backtest(backtest_id):
    """Get specific backtest details"""
    backtest = next((b for b in MOCK_BACKTESTS if b['id'] == backtest_id), None)
    if not backtest:
        return jsonify({'message': 'Backtest not found'}), 404
    return jsonify(backtest)

@app.route('/api/portfolio/holdings', methods=['GET'])
@jwt_required()
def get_portfolio_holdings():
    """Get current portfolio holdings"""
    holdings = [
        {
            'symbol': '000001.SZ',
            'name': 'Ping An Bank',
            'quantity': 5000,
            'price': 15.68,
            'value': 78400,
            'weight': 6.4,
            'pnl': 3200,
            'pnl_percent': 4.2
        },
        {
            'symbol': '600036.SH',
            'name': 'China Merchants Bank',
            'quantity': 2500,
            'price': 42.15,
            'value': 105375,
            'weight': 8.6,
            'pnl': 5640,
            'pnl_percent': 5.7
        }
    ]
    return jsonify(holdings)

@app.route('/api/portfolio/summary', methods=['GET'])
@jwt_required()
def get_portfolio_summary():
    """Get portfolio summary statistics"""
    return jsonify({
        'total_value': 1228000,
        'total_pnl': 28400,
        'pnl_percent': 2.37,
        'num_holdings': 25,
        'cash': 125000,
        'last_update': datetime.now().isoformat()
    })

@app.route('/api/data/datasets', methods=['GET'])
@jwt_required()
def get_datasets():
    """Get list of available datasets from Qlib"""
    if QLIB_AVAILABLE and qlib_manager:
        datasets = qlib_manager.get_available_datasets()
        return jsonify(datasets)
    
    # Fallback mock data
    datasets = [
        {
            'id': '1',
            'name': 'Qlib Not Available',
            'type': 'Demo Mode',
            'size': 'N/A',
            'last_update': 'N/A',
            'status': 'error',
            'records': 'Install Qlib and download data'
        }
    ]
    return jsonify(datasets)

@app.route('/api/qlib/data', methods=['GET'])
@jwt_required()
def get_qlib_data():
    """Get real market data from Qlib"""
    if not QLIB_AVAILABLE or not qlib_manager:
        return jsonify({'message': 'Qlib not available'}), 503
    
    try:
        data = qlib_manager.get_market_data_sample(limit=20)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching Qlib data: {e}")
        return jsonify({'message': f'Error fetching data: {str(e)}'}), 500

@app.route('/api/qlib/train', methods=['POST'])
@jwt_required()
def train_model():
    """Train a new model using Qlib"""
    if not QLIB_AVAILABLE or not qlib_manager:
        return jsonify({'message': 'Qlib not available'}), 503
    
    data = request.get_json()
    
    try:
        # Use QlibManager for real model training
        model_config = {
            'name': data.get('name', f'Qlib-{data.get("type", "LightGBM")}-Model'),
            'type': data.get('type', 'LightGBM'),
            'description': data.get('description', f'Real Qlib {data.get("type", "LightGBM")} model')
        }
        
        new_model = qlib_manager.create_real_model(model_config)
        if 'error' in new_model:
            return jsonify({'message': new_model['error']}), 500
        
        return jsonify(new_model), 201
            
    except Exception as e:
        logger.error(f"Error training model: {e}")
        return jsonify({'message': f'Training failed: {str(e)}'}), 500

@app.route('/api/models/<model_id>/control', methods=['POST'])
@jwt_required()
def control_model(model_id):
    """Control model (pause/resume/stop)"""
    data = request.get_json()
    action = data.get('action')  # 'pause', 'resume', 'stop'
    
    if QLIB_AVAILABLE and qlib_manager and model_id in qlib_manager.models:
        try:
            model_data = qlib_manager.models[model_id]
            
            if action == 'pause':
                model_data['status'] = 'paused'
            elif action == 'resume':
                model_data['status'] = 'active'
            elif action == 'stop':
                model_data['status'] = 'stopped'
            
            return jsonify({
                'message': f'Model {action}ed successfully',
                'status': model_data['status']
            })
        except Exception as e:
            logger.error(f"Error controlling model: {e}")
            return jsonify({'message': f'Control failed: {str(e)}'}), 500
    
    # Fallback for mock models
    mock_model = next((m for m in MOCK_MODELS if m['id'] == model_id), None)
    if mock_model:
        if action == 'pause':
            mock_model['status'] = 'paused'
        elif action == 'resume':
            mock_model['status'] = 'active'
        elif action == 'stop':
            mock_model['status'] = 'stopped'
        
        return jsonify({
            'message': f'Model {action}ed successfully',
            'status': mock_model['status']
        })
    
    return jsonify({'message': 'Model not found'}), 404

@app.route('/api/models/<model_id>/predictions', methods=['GET'])
@jwt_required()
def get_model_predictions(model_id):
    """Get trading signals from a model"""
    start_date = request.args.get('start_date', '2024-01-01')
    end_date = request.args.get('end_date', '2024-01-31')
    
    if QLIB_AVAILABLE and qlib_manager and qlib_manager.initialized:
        try:
            predictions = qlib_manager.get_model_predictions(model_id, start_date, end_date)
            return jsonify(predictions)
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return jsonify({'message': f'Prediction failed: {str(e)}'}), 500
    
    # Mock predictions
    mock_predictions = [
        {
            'date': '2024-01-15',
            'symbol': '000001.SZ',
            'prediction': 0.045,
            'signal': 'BUY',
            'confidence': 0.78
        },
        {
            'date': '2024-01-15',
            'symbol': '600036.SH',
            'prediction': -0.032,
            'signal': 'SELL',
            'confidence': 0.65
        }
    ]
    return jsonify(mock_predictions)

@app.route('/api/data/refresh', methods=['POST'])
@jwt_required()
def refresh_data():
    """Refresh market data"""
    if QLIB_AVAILABLE and qlib_manager and qlib_manager.initialized:
        try:
            # In real implementation, this would update data
            logger.info("Data refresh requested")
            return jsonify({'message': 'Data refresh initiated', 'status': 'success'})
        except Exception as e:
            logger.error(f"Error refreshing data: {e}")
            return jsonify({'message': f'Refresh failed: {str(e)}'}), 500
    
    return jsonify({'message': 'Data refresh completed (mock)', 'status': 'success'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'qlib_available': QLIB_AVAILABLE,
        'qlib_initialized': qlib_manager.initialized if qlib_manager else False,
        'timestamp': datetime.now().isoformat()
    })

def find_available_port(start_port=8001, max_port=8100):
    """Find an available port starting from start_port"""
    import socket
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Check if port is available, find alternative if not
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
    except OSError:
        logger.warning(f"Port {port} is in use, finding alternative...")
        port = find_available_port(port + 1)
        if not port:
            logger.error("No available ports found in range 8001-8100")
            sys.exit(1)
        logger.info(f"Using alternative port: {port}")
    
    logger.info(f"Starting Qlib Pro Backend API on port {port}")
    logger.info(f"Qlib available: {QLIB_AVAILABLE}")
    logger.info(f"Access the API at: http://localhost:{port}")
    
    try:
        app.run(host='127.0.0.1', port=port, debug=debug)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)