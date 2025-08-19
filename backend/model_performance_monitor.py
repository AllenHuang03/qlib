"""
Comprehensive Model Performance Monitoring System
Real-time performance tracking, alerting, and visualization for trading models
"""

import os
import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import json
import sqlite3
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# Performance calculation libraries
from scipy import stats
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Database integration
try:
    from supabase_service import supabase_service
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# WebSocket integration for real-time updates
try:
    from websocket_manager import websocket_manager
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# ENUMS AND DATA CLASSES
# ================================

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MetricType(Enum):
    RETURN_BASED = "return_based"
    CLASSIFICATION = "classification"
    RISK = "risk"
    TRADING = "trading"
    OPERATIONAL = "operational"

@dataclass
class PerformanceMetrics:
    """Comprehensive performance metrics for a trading model"""
    model_id: str
    model_name: str
    evaluation_date: str
    
    # Return-based metrics
    total_return: float
    annual_return: float
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    recovery_factor: float
    profit_factor: float
    
    # Information ratios
    information_ratio: float
    treynor_ratio: float
    jensen_alpha: float
    
    # Classification metrics
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    
    # Trading metrics
    total_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    win_loss_ratio: float
    avg_trade_duration: float
    turnover: float
    
    # Risk metrics
    var_95: float
    cvar_95: float
    downside_deviation: float
    upside_capture: float
    downside_capture: float
    beta: float
    correlation_to_market: float
    tracking_error: float
    
    # Model-specific metrics
    ic_mean: float
    ic_std: float
    ic_ir: float
    rank_ic_mean: float
    rank_ic_std: float
    rank_ic_ir: float
    
    # Operational metrics
    prediction_latency: float
    model_size_mb: float
    feature_importance_stability: float
    data_quality_score: float

@dataclass
class PerformanceAlert:
    """Performance alert for model monitoring"""
    alert_id: str
    model_id: str
    model_name: str
    metric_name: str
    current_value: float
    threshold_value: float
    severity: AlertSeverity
    message: str
    created_at: str
    resolved: bool = False
    resolved_at: Optional[str] = None

@dataclass
class ModelHealthScore:
    """Overall health score for a model"""
    model_id: str
    model_name: str
    overall_score: float  # 0-100
    component_scores: Dict[str, float]
    health_status: str  # "healthy", "warning", "critical"
    last_updated: str
    issues: List[str]
    recommendations: List[str]

# ================================
# PERFORMANCE MONITOR CLASS
# ================================

class ModelPerformanceMonitor:
    """Comprehensive model performance monitoring system"""
    
    def __init__(self):
        self.monitoring_data = {}
        self.performance_history = {}
        self.active_alerts = {}
        self.health_scores = {}
        
        # Performance thresholds
        self.performance_thresholds = self._load_performance_thresholds()
        
        # Database setup
        self.local_db_path = Path(__file__).parent / "performance_monitoring.db"
        self._setup_local_database()
        
        # Monitoring intervals
        self.monitoring_intervals = {
            'realtime': timedelta(minutes=1),
            'hourly': timedelta(hours=1),
            'daily': timedelta(days=1),
            'weekly': timedelta(weeks=1)
        }
        
        # Start background monitoring
        self.is_monitoring = True
        asyncio.create_task(self._start_monitoring_loop())
        
        logger.info("Model Performance Monitor initialized")
    
    def _load_performance_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Load performance alert thresholds"""
        return {
            'return_metrics': {
                'sharpe_ratio_min': 1.0,
                'max_drawdown_max': 0.15,
                'annual_return_min': 0.08,
                'volatility_max': 0.25
            },
            'classification_metrics': {
                'accuracy_min': 0.55,
                'precision_min': 0.50,
                'recall_min': 0.50,
                'f1_score_min': 0.50
            },
            'trading_metrics': {
                'win_rate_min': 0.45,
                'profit_factor_min': 1.2,
                'turnover_max': 10.0
            },
            'risk_metrics': {
                'var_95_max': 0.05,
                'beta_max': 1.5,
                'tracking_error_max': 0.08
            },
            'operational_metrics': {
                'prediction_latency_max': 1.0,  # seconds
                'data_quality_min': 0.85
            }
        }
    
    def _setup_local_database(self):
        """Setup local SQLite database for performance history"""
        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            # Performance metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    evaluation_date TEXT NOT NULL,
                    metrics_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS performance_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT UNIQUE NOT NULL,
                    model_id TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    metric_name TEXT NOT NULL,
                    current_value REAL NOT NULL,
                    threshold_value REAL NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TIMESTAMP
                )
            ''')
            
            # Health scores table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS health_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    overall_score REAL NOT NULL,
                    component_scores_json TEXT NOT NULL,
                    health_status TEXT NOT NULL,
                    issues_json TEXT,
                    recommendations_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("Local performance database initialized")
            
        except Exception as e:
            logger.error(f"Failed to setup local database: {e}")
    
    async def evaluate_model_performance(self, 
                                       model_id: str, 
                                       model_name: str,
                                       predictions: pd.DataFrame,
                                       actual_returns: pd.DataFrame,
                                       market_data: pd.DataFrame) -> PerformanceMetrics:
        """Comprehensive model performance evaluation"""
        try:
            logger.info(f"Evaluating performance for model {model_name}")
            
            # Calculate return-based metrics
            return_metrics = self._calculate_return_metrics(predictions, actual_returns)
            
            # Calculate classification metrics
            classification_metrics = self._calculate_classification_metrics(predictions, actual_returns)
            
            # Calculate trading metrics
            trading_metrics = self._calculate_trading_metrics(predictions, actual_returns, market_data)
            
            # Calculate risk metrics
            risk_metrics = self._calculate_risk_metrics(predictions, actual_returns, market_data)
            
            # Calculate Information Coefficient metrics
            ic_metrics = self._calculate_ic_metrics(predictions, actual_returns)
            
            # Calculate operational metrics
            operational_metrics = await self._calculate_operational_metrics(model_id)
            
            # Combine all metrics
            performance_metrics = PerformanceMetrics(
                model_id=model_id,
                model_name=model_name,
                evaluation_date=datetime.now().isoformat(),
                
                # Return metrics
                **return_metrics,
                
                # Classification metrics
                **classification_metrics,
                
                # Trading metrics
                **trading_metrics,
                
                # Risk metrics
                **risk_metrics,
                
                # IC metrics
                **ic_metrics,
                
                # Operational metrics
                **operational_metrics
            )
            
            # Store performance metrics
            await self._store_performance_metrics(performance_metrics)
            
            # Check for alerts
            await self._check_performance_alerts(performance_metrics)
            
            # Update health score
            await self._update_health_score(performance_metrics)
            
            # Broadcast performance update
            if WEBSOCKET_AVAILABLE:
                await self._broadcast_performance_update(performance_metrics)
            
            return performance_metrics
            
        except Exception as e:
            logger.error(f"Performance evaluation failed: {e}")
            raise
    
    def _calculate_return_metrics(self, 
                                predictions: pd.DataFrame, 
                                actual_returns: pd.DataFrame) -> Dict[str, float]:
        """Calculate return-based performance metrics"""
        try:
            # Generate portfolio returns based on predictions
            portfolio_returns = self._generate_portfolio_returns(predictions, actual_returns)
            
            # Basic return metrics
            total_return = (1 + portfolio_returns).prod() - 1
            annual_return = (1 + total_return) ** (252 / len(portfolio_returns)) - 1
            volatility = portfolio_returns.std() * np.sqrt(252)
            
            # Risk-adjusted returns
            sharpe_ratio = annual_return / volatility if volatility > 0 else 0
            
            # Downside metrics
            downside_returns = portfolio_returns[portfolio_returns < 0]
            downside_deviation = downside_returns.std() * np.sqrt(252) if len(downside_returns) > 0 else 0
            sortino_ratio = annual_return / downside_deviation if downside_deviation > 0 else 0
            
            # Drawdown metrics
            cumulative_returns = (1 + portfolio_returns).cumprod()
            rolling_max = cumulative_returns.expanding().max()
            drawdowns = (cumulative_returns - rolling_max) / rolling_max
            max_drawdown = abs(drawdowns.min())
            
            # Recovery factor
            recovery_factor = total_return / max_drawdown if max_drawdown > 0 else 0
            
            # Calmar ratio
            calmar_ratio = annual_return / max_drawdown if max_drawdown > 0 else 0
            
            # Profit factor
            positive_returns = portfolio_returns[portfolio_returns > 0].sum()
            negative_returns = abs(portfolio_returns[portfolio_returns < 0].sum())
            profit_factor = positive_returns / negative_returns if negative_returns > 0 else 0
            
            return {
                'total_return': round(total_return, 4),
                'annual_return': round(annual_return, 4),
                'volatility': round(volatility, 4),
                'sharpe_ratio': round(sharpe_ratio, 4),
                'sortino_ratio': round(sortino_ratio, 4),
                'calmar_ratio': round(calmar_ratio, 4),
                'max_drawdown': round(max_drawdown, 4),
                'recovery_factor': round(recovery_factor, 4),
                'profit_factor': round(profit_factor, 4)
            }
            
        except Exception as e:
            logger.error(f"Return metrics calculation failed: {e}")
            return self._get_default_return_metrics()
    
    def _calculate_classification_metrics(self, 
                                        predictions: pd.DataFrame,
                                        actual_returns: pd.DataFrame) -> Dict[str, float]:
        """Calculate classification performance metrics"""
        try:
            # Convert to binary classification (up/down)
            y_true = (actual_returns['return_1d'] > 0).astype(int)
            y_pred = (predictions['prediction'] > 0).astype(int)
            
            # Remove NaN values
            valid_idx = ~(y_true.isna() | y_pred.isna())
            y_true = y_true[valid_idx]
            y_pred = y_pred[valid_idx]
            
            if len(y_true) == 0:
                return self._get_default_classification_metrics()
            
            # Calculate metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, zero_division=0)
            recall = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            
            # AUC-ROC (if we have prediction probabilities)
            try:
                if 'confidence' in predictions.columns:
                    auc_roc = roc_auc_score(y_true, predictions['confidence'][valid_idx])
                else:
                    auc_roc = 0.5
            except:
                auc_roc = 0.5
            
            return {
                'accuracy': round(accuracy, 4),
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1_score': round(f1, 4),
                'auc_roc': round(auc_roc, 4)
            }
            
        except Exception as e:
            logger.error(f"Classification metrics calculation failed: {e}")
            return self._get_default_classification_metrics()
    
    def _calculate_trading_metrics(self, 
                                 predictions: pd.DataFrame,
                                 actual_returns: pd.DataFrame,
                                 market_data: pd.DataFrame) -> Dict[str, float]:
        """Calculate trading simulation metrics"""
        try:
            # Generate trading signals
            signals = self._generate_trading_signals(predictions)
            
            # Simulate trades
            trades = self._simulate_trades(signals, actual_returns, market_data)
            
            if len(trades) == 0:
                return self._get_default_trading_metrics()
            
            # Calculate trading metrics
            total_trades = len(trades)
            winning_trades = len([t for t in trades if t['pnl'] > 0])
            win_rate = winning_trades / total_trades
            
            # Average win/loss
            winning_pnl = [t['pnl'] for t in trades if t['pnl'] > 0]
            losing_pnl = [t['pnl'] for t in trades if t['pnl'] < 0]
            
            avg_win = np.mean(winning_pnl) if winning_pnl else 0
            avg_loss = abs(np.mean(losing_pnl)) if losing_pnl else 0
            win_loss_ratio = avg_win / avg_loss if avg_loss > 0 else 0
            
            # Average trade duration
            durations = [t['duration'] for t in trades if 'duration' in t]
            avg_trade_duration = np.mean(durations) if durations else 5.0
            
            # Turnover (simplified)
            turnover = total_trades * 0.1  # Approximate
            
            return {
                'total_trades': total_trades,
                'win_rate': round(win_rate, 4),
                'avg_win': round(avg_win, 4),
                'avg_loss': round(avg_loss, 4),
                'win_loss_ratio': round(win_loss_ratio, 4),
                'avg_trade_duration': round(avg_trade_duration, 1),
                'turnover': round(turnover, 2)
            }
            
        except Exception as e:
            logger.error(f"Trading metrics calculation failed: {e}")
            return self._get_default_trading_metrics()
    
    def _calculate_risk_metrics(self, 
                              predictions: pd.DataFrame,
                              actual_returns: pd.DataFrame,
                              market_data: pd.DataFrame) -> Dict[str, float]:
        """Calculate risk metrics"""
        try:
            portfolio_returns = self._generate_portfolio_returns(predictions, actual_returns)
            
            # VaR and CVaR
            var_95 = portfolio_returns.quantile(0.05)
            cvar_95 = portfolio_returns[portfolio_returns <= var_95].mean()
            
            # Downside deviation
            downside_returns = portfolio_returns[portfolio_returns < 0]
            downside_deviation = downside_returns.std() if len(downside_returns) > 0 else 0
            
            # Beta and correlation to market
            if 'market_return' in market_data.columns:
                market_returns = market_data['market_return']
                valid_idx = ~(portfolio_returns.isna() | market_returns.isna())
                
                if valid_idx.sum() > 10:  # Minimum observations
                    correlation = portfolio_returns[valid_idx].corr(market_returns[valid_idx])
                    
                    # Beta calculation
                    covariance = np.cov(portfolio_returns[valid_idx], market_returns[valid_idx])[0,1]
                    market_variance = market_returns[valid_idx].var()
                    beta = covariance / market_variance if market_variance > 0 else 1.0
                    
                    # Tracking error
                    tracking_error = (portfolio_returns[valid_idx] - market_returns[valid_idx]).std()
                else:
                    correlation = 0.5
                    beta = 1.0
                    tracking_error = 0.05
            else:
                correlation = 0.5
                beta = 1.0
                tracking_error = 0.05
            
            # Information ratio components
            excess_returns = portfolio_returns - 0.02/252  # Assume 2% risk-free rate
            information_ratio = excess_returns.mean() / excess_returns.std() if excess_returns.std() > 0 else 0
            
            # Capture ratios (simplified)
            upside_capture = 1.1
            downside_capture = 0.9
            
            # Treynor ratio
            treynor_ratio = excess_returns.mean() / beta if beta > 0 else 0
            
            # Jensen's alpha (simplified)
            jensen_alpha = portfolio_returns.mean() - (0.02/252 + beta * (0.08/252 - 0.02/252))
            
            return {
                'var_95': round(abs(var_95), 4),
                'cvar_95': round(abs(cvar_95), 4),
                'downside_deviation': round(downside_deviation, 4),
                'upside_capture': round(upside_capture, 4),
                'downside_capture': round(downside_capture, 4),
                'beta': round(beta, 4),
                'correlation_to_market': round(correlation, 4),
                'tracking_error': round(tracking_error, 4),
                'information_ratio': round(information_ratio, 4),
                'treynor_ratio': round(treynor_ratio, 4),
                'jensen_alpha': round(jensen_alpha, 4)
            }
            
        except Exception as e:
            logger.error(f"Risk metrics calculation failed: {e}")
            return self._get_default_risk_metrics()
    
    def _calculate_ic_metrics(self, 
                            predictions: pd.DataFrame,
                            actual_returns: pd.DataFrame) -> Dict[str, float]:
        """Calculate Information Coefficient metrics"""
        try:
            # Align predictions and returns
            valid_idx = ~(predictions['prediction'].isna() | actual_returns['return_1d'].isna())
            pred_values = predictions['prediction'][valid_idx]
            actual_values = actual_returns['return_1d'][valid_idx]
            
            if len(pred_values) < 30:  # Minimum observations
                return self._get_default_ic_metrics()
            
            # Information Coefficient (Pearson correlation)
            ic_values = []
            rank_ic_values = []
            
            # Rolling IC calculation
            window_size = 20
            for i in range(window_size, len(pred_values)):
                window_pred = pred_values.iloc[i-window_size:i]
                window_actual = actual_values.iloc[i-window_size:i]
                
                # Pearson IC
                ic = window_pred.corr(window_actual)
                if not pd.isna(ic):
                    ic_values.append(ic)
                
                # Rank IC (Spearman correlation)
                rank_ic = window_pred.corr(window_actual, method='spearman')
                if not pd.isna(rank_ic):
                    rank_ic_values.append(rank_ic)
            
            # Calculate statistics
            ic_mean = np.mean(ic_values) if ic_values else 0
            ic_std = np.std(ic_values) if ic_values else 0
            ic_ir = ic_mean / ic_std if ic_std > 0 else 0
            
            rank_ic_mean = np.mean(rank_ic_values) if rank_ic_values else 0
            rank_ic_std = np.std(rank_ic_values) if rank_ic_values else 0
            rank_ic_ir = rank_ic_mean / rank_ic_std if rank_ic_std > 0 else 0
            
            return {
                'ic_mean': round(ic_mean, 4),
                'ic_std': round(ic_std, 4),
                'ic_ir': round(ic_ir, 4),
                'rank_ic_mean': round(rank_ic_mean, 4),
                'rank_ic_std': round(rank_ic_std, 4),
                'rank_ic_ir': round(rank_ic_ir, 4)
            }
            
        except Exception as e:
            logger.error(f"IC metrics calculation failed: {e}")
            return self._get_default_ic_metrics()
    
    async def _calculate_operational_metrics(self, model_id: str) -> Dict[str, float]:
        """Calculate operational performance metrics"""
        try:
            # Simulate operational metrics (in production, would be measured)
            prediction_latency = np.random.uniform(0.01, 0.1)  # seconds
            model_size_mb = np.random.uniform(10, 100)  # MB
            feature_importance_stability = np.random.uniform(0.7, 0.95)
            data_quality_score = np.random.uniform(0.85, 0.98)
            
            return {
                'prediction_latency': round(prediction_latency, 4),
                'model_size_mb': round(model_size_mb, 2),
                'feature_importance_stability': round(feature_importance_stability, 4),
                'data_quality_score': round(data_quality_score, 4)
            }
            
        except Exception as e:
            logger.error(f"Operational metrics calculation failed: {e}")
            return {
                'prediction_latency': 0.05,
                'model_size_mb': 25.0,
                'feature_importance_stability': 0.8,
                'data_quality_score': 0.9
            }
    
    async def _store_performance_metrics(self, metrics: PerformanceMetrics):
        """Store performance metrics in database"""
        try:
            # Store in local database
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO performance_metrics 
                (model_id, model_name, evaluation_date, metrics_json)
                VALUES (?, ?, ?, ?)
            ''', (
                metrics.model_id,
                metrics.model_name,
                metrics.evaluation_date,
                json.dumps(asdict(metrics))
            ))
            
            conn.commit()
            conn.close()
            
            # Store in Supabase if available
            if SUPABASE_AVAILABLE:
                await self._store_metrics_supabase(metrics)
            
            # Update in-memory cache
            self.performance_history[metrics.model_id] = metrics
            
            logger.info(f"Performance metrics stored for model {metrics.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to store performance metrics: {e}")
    
    async def _check_performance_alerts(self, metrics: PerformanceMetrics):
        """Check for performance alert conditions"""
        try:
            alerts = []
            
            # Return metrics alerts
            if metrics.sharpe_ratio < self.performance_thresholds['return_metrics']['sharpe_ratio_min']:
                alerts.append(self._create_alert(
                    metrics, 'sharpe_ratio', metrics.sharpe_ratio,
                    self.performance_thresholds['return_metrics']['sharpe_ratio_min'],
                    AlertSeverity.HIGH, "Sharpe ratio below threshold"
                ))
            
            if metrics.max_drawdown > self.performance_thresholds['return_metrics']['max_drawdown_max']:
                alerts.append(self._create_alert(
                    metrics, 'max_drawdown', metrics.max_drawdown,
                    self.performance_thresholds['return_metrics']['max_drawdown_max'],
                    AlertSeverity.CRITICAL, "Maximum drawdown exceeded threshold"
                ))
            
            # Classification metrics alerts
            if metrics.accuracy < self.performance_thresholds['classification_metrics']['accuracy_min']:
                alerts.append(self._create_alert(
                    metrics, 'accuracy', metrics.accuracy,
                    self.performance_thresholds['classification_metrics']['accuracy_min'],
                    AlertSeverity.MEDIUM, "Model accuracy below threshold"
                ))
            
            # Trading metrics alerts
            if metrics.win_rate < self.performance_thresholds['trading_metrics']['win_rate_min']:
                alerts.append(self._create_alert(
                    metrics, 'win_rate', metrics.win_rate,
                    self.performance_thresholds['trading_metrics']['win_rate_min'],
                    AlertSeverity.MEDIUM, "Win rate below threshold"
                ))
            
            # Risk metrics alerts
            if metrics.var_95 > self.performance_thresholds['risk_metrics']['var_95_max']:
                alerts.append(self._create_alert(
                    metrics, 'var_95', metrics.var_95,
                    self.performance_thresholds['risk_metrics']['var_95_max'],
                    AlertSeverity.HIGH, "Value at Risk exceeded threshold"
                ))
            
            # Operational metrics alerts
            if metrics.prediction_latency > self.performance_thresholds['operational_metrics']['prediction_latency_max']:
                alerts.append(self._create_alert(
                    metrics, 'prediction_latency', metrics.prediction_latency,
                    self.performance_thresholds['operational_metrics']['prediction_latency_max'],
                    AlertSeverity.MEDIUM, "Prediction latency too high"
                ))
            
            # Store and broadcast alerts
            for alert in alerts:
                await self._store_alert(alert)
                if WEBSOCKET_AVAILABLE:
                    await self._broadcast_alert(alert)
            
        except Exception as e:
            logger.error(f"Performance alert check failed: {e}")
    
    async def _update_health_score(self, metrics: PerformanceMetrics):
        """Update model health score"""
        try:
            # Calculate component scores
            return_score = self._calculate_return_score(metrics)
            classification_score = self._calculate_classification_score(metrics)
            risk_score = self._calculate_risk_score(metrics)
            operational_score = self._calculate_operational_score(metrics)
            
            component_scores = {
                'returns': return_score,
                'classification': classification_score,
                'risk': risk_score,
                'operational': operational_score
            }
            
            # Overall score (weighted average)
            weights = {'returns': 0.3, 'classification': 0.2, 'risk': 0.3, 'operational': 0.2}
            overall_score = sum(score * weights[component] for component, score in component_scores.items())
            
            # Determine health status
            if overall_score >= 80:
                health_status = "healthy"
            elif overall_score >= 60:
                health_status = "warning"
            else:
                health_status = "critical"
            
            # Generate issues and recommendations
            issues = self._identify_issues(metrics)
            recommendations = self._generate_recommendations(metrics, issues)
            
            health_score = ModelHealthScore(
                model_id=metrics.model_id,
                model_name=metrics.model_name,
                overall_score=round(overall_score, 1),
                component_scores={k: round(v, 1) for k, v in component_scores.items()},
                health_status=health_status,
                last_updated=datetime.now().isoformat(),
                issues=issues,
                recommendations=recommendations
            )
            
            # Store health score
            await self._store_health_score(health_score)
            
            # Update cache
            self.health_scores[metrics.model_id] = health_score
            
        except Exception as e:
            logger.error(f"Health score update failed: {e}")
    
    async def get_model_performance_history(self, 
                                          model_id: str, 
                                          days: int = 30) -> List[PerformanceMetrics]:
        """Get performance history for a model"""
        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT metrics_json FROM performance_metrics 
                WHERE model_id = ? 
                AND evaluation_date >= date('now', '-{} days')
                ORDER BY evaluation_date DESC
            '''.format(days), (model_id,))
            
            results = cursor.fetchall()
            conn.close()
            
            history = []
            for result in results:
                metrics_dict = json.loads(result[0])
                metrics = PerformanceMetrics(**metrics_dict)
                history.append(metrics)
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to get performance history: {e}")
            return []
    
    async def get_active_alerts(self, model_id: Optional[str] = None) -> List[PerformanceAlert]:
        """Get active performance alerts"""
        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            query = '''
                SELECT alert_id, model_id, model_name, metric_name, current_value, 
                       threshold_value, severity, message, created_at, resolved, resolved_at
                FROM performance_alerts 
                WHERE resolved = FALSE
            '''
            params = ()
            
            if model_id:
                query += ' AND model_id = ?'
                params = (model_id,)
            
            query += ' ORDER BY created_at DESC'
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            conn.close()
            
            alerts = []
            for result in results:
                alert = PerformanceAlert(
                    alert_id=result[0],
                    model_id=result[1],
                    model_name=result[2],
                    metric_name=result[3],
                    current_value=result[4],
                    threshold_value=result[5],
                    severity=AlertSeverity(result[6]),
                    message=result[7],
                    created_at=result[8],
                    resolved=bool(result[9]),
                    resolved_at=result[10]
                )
                alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to get active alerts: {e}")
            return []
    
    async def get_model_health_score(self, model_id: str) -> Optional[ModelHealthScore]:
        """Get current health score for a model"""
        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT model_id, model_name, overall_score, component_scores_json, 
                       health_status, issues_json, recommendations_json, created_at
                FROM health_scores 
                WHERE model_id = ?
                ORDER BY created_at DESC LIMIT 1
            ''', (model_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                health_score = ModelHealthScore(
                    model_id=result[0],
                    model_name=result[1],
                    overall_score=result[2],
                    component_scores=json.loads(result[3]),
                    health_status=result[4],
                    last_updated=result[7],
                    issues=json.loads(result[5]) if result[5] else [],
                    recommendations=json.loads(result[6]) if result[6] else []
                )
                return health_score
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get health score: {e}")
            return None
    
    # Additional helper methods...
    # (Implementation continues with helper methods for calculations, storage, etc.)
    
    def _generate_portfolio_returns(self, predictions: pd.DataFrame, actual_returns: pd.DataFrame) -> pd.Series:
        """Generate portfolio returns from predictions"""
        # Simplified portfolio construction
        # In production, this would use proper portfolio optimization
        weights = predictions['prediction'] / predictions['prediction'].abs().sum()
        portfolio_returns = (weights * actual_returns['return_1d']).sum(axis=1)
        return portfolio_returns.fillna(0)
    
    def _get_default_return_metrics(self) -> Dict[str, float]:
        """Default return metrics when calculation fails"""
        return {
            'total_return': 0.0, 'annual_return': 0.0, 'volatility': 0.0,
            'sharpe_ratio': 0.0, 'sortino_ratio': 0.0, 'calmar_ratio': 0.0,
            'max_drawdown': 0.0, 'recovery_factor': 0.0, 'profit_factor': 0.0
        }
    
    def _get_default_classification_metrics(self) -> Dict[str, float]:
        """Default classification metrics when calculation fails"""
        return {
            'accuracy': 0.5, 'precision': 0.5, 'recall': 0.5,
            'f1_score': 0.5, 'auc_roc': 0.5
        }
    
    # ... (Additional helper methods would continue here)

# ================================
# GLOBAL INSTANCE
# ================================

# Global instance for use throughout the application
model_performance_monitor = ModelPerformanceMonitor()