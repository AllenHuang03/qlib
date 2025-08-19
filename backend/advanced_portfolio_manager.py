"""
Advanced Portfolio Management with Risk Engine
Enterprise-grade portfolio optimization and risk management for Australian markets
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json
from pathlib import Path
import uuid

# Risk management libraries
from scipy.optimize import minimize
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# Portfolio optimization
try:
    import cvxpy as cp
    CVXPY_AVAILABLE = True
    print("SUCCESS: CVXPY optimization available")
except ImportError:
    CVXPY_AVAILABLE = False
    print("WARNING: CVXPY not available, using basic optimization")

# Risk models
try:
    import pyfolio as pf
    PYFOLIO_AVAILABLE = True
except ImportError:
    PYFOLIO_AVAILABLE = False

logger = logging.getLogger(__name__)

class RebalanceFrequency(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"

class RiskModel(Enum):
    VAR = "value_at_risk"
    CVAR = "conditional_var"
    KELLY = "kelly_criterion"
    MARKOWITZ = "markowitz"
    BLACK_LITTERMAN = "black_litterman"

class OptimizationObjective(Enum):
    MAX_SHARPE = "max_sharpe"
    MIN_VOLATILITY = "min_volatility"
    MAX_RETURN = "max_return"
    RISK_PARITY = "risk_parity"
    EQUAL_WEIGHT = "equal_weight"

@dataclass
class PortfolioConstraints:
    """Portfolio optimization constraints"""
    max_position_weight: float = 0.20  # 20% max per position
    min_position_weight: float = 0.0   # No short selling
    max_sector_weight: float = 0.40    # 40% max per sector
    max_turnover: float = 0.50         # 50% max turnover per rebalance
    target_volatility: Optional[float] = None
    target_return: Optional[float] = None
    leverage_limit: float = 1.0        # No leverage

@dataclass
class Position:
    """Enhanced portfolio position"""
    symbol: str
    shares: float
    current_price: float
    market_value: float
    weight: float
    cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    realized_pnl: float
    dividend_income: float
    sector: str
    beta: float
    volatility: float
    sharpe_ratio: float
    entry_date: str
    last_updated: str

@dataclass
class PortfolioMetrics:
    """Comprehensive portfolio metrics"""
    total_value: float
    cash_balance: float
    invested_value: float
    total_pnl: float
    total_pnl_percent: float
    daily_pnl: float
    daily_return: float
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    beta: float
    alpha: float
    information_ratio: float
    calmar_ratio: float
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float

@dataclass
class RiskMetrics:
    """Advanced risk metrics"""
    var_1d: float           # 1-day Value at Risk (95%)
    var_5d: float           # 5-day Value at Risk
    cvar_1d: float          # Conditional VaR
    expected_shortfall: float
    maximum_drawdown: float
    downside_deviation: float
    tracking_error: float
    concentration_risk: Dict[str, float]
    sector_risk: Dict[str, float]
    correlation_risk: float
    liquidity_risk: float

@dataclass
class RebalanceRecommendation:
    """Portfolio rebalancing recommendation"""
    recommendation_id: str
    current_weights: Dict[str, float]
    target_weights: Dict[str, float]
    trades_required: List[Dict[str, Any]]
    expected_improvement: Dict[str, float]
    transaction_costs: float
    reasoning: List[str]
    confidence_score: float
    timestamp: str

class AdvancedPortfolioManager:
    """Enterprise-grade portfolio management with advanced risk controls"""
    
    def __init__(self, initial_capital: float = 1000000):
        self.initial_capital = initial_capital
        self.cash_balance = initial_capital
        self.positions = {}
        self.trade_history = []
        self.performance_history = []
        
        # Risk management parameters
        self.risk_limits = {
            'max_portfolio_var': 0.02,      # 2% max daily VaR
            'max_position_weight': 0.20,     # 20% max per position
            'max_sector_weight': 0.40,       # 40% max per sector
            'max_correlation': 0.80,         # 80% max correlation between positions
            'max_drawdown_limit': 0.15,      # 15% max drawdown before alerts
            'min_liquidity_ratio': 0.10      # 10% minimum cash
        }
        
        # Portfolio optimization settings
        self.optimization_config = {
            'objective': OptimizationObjective.MAX_SHARPE,
            'risk_model': RiskModel.MARKOWITZ,
            'rebalance_frequency': RebalanceFrequency.WEEKLY,
            'lookback_days': 252,            # 1 year for covariance estimation
            'min_observations': 60           # Minimum data points required
        }
        
        # ASX market data
        self.asx_universe = [
            'CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX',  # Big 4 Banks
            'BHP.AX', 'RIO.AX', 'FMG.AX', 'NCM.AX',  # Mining
            'CSL.AX', 'COL.AX', 'RHC.AX',             # Healthcare
            'WOW.AX', 'WES.AX', 'JBH.AX',             # Retail
            'TLS.AX', 'TCL.AX', 'XRO.AX',             # Tech/Telecom
            'REA.AX', 'SCG.AX', 'GMG.AX',             # Real Estate
            'MQG.AX', 'QBE.AX', 'IAG.AX'              # Financial Services
        ]
        
        # Sector classifications
        self.sector_mapping = {
            'CBA.AX': 'Financials', 'WBC.AX': 'Financials', 'ANZ.AX': 'Financials', 'NAB.AX': 'Financials',
            'BHP.AX': 'Materials', 'RIO.AX': 'Materials', 'FMG.AX': 'Materials', 'NCM.AX': 'Materials',
            'CSL.AX': 'Healthcare', 'COL.AX': 'Healthcare', 'RHC.AX': 'Healthcare',
            'WOW.AX': 'Consumer Staples', 'WES.AX': 'Consumer Staples', 'JBH.AX': 'Consumer Discretionary',
            'TLS.AX': 'Communication', 'TCL.AX': 'Communication', 'XRO.AX': 'Technology',
            'REA.AX': 'Real Estate', 'SCG.AX': 'Real Estate', 'GMG.AX': 'Real Estate',
            'MQG.AX': 'Financials', 'QBE.AX': 'Financials', 'IAG.AX': 'Financials'
        }
        
        # Performance tracking
        self.last_rebalance = datetime.now()
        self.rebalance_count = 0
        
        logger.info(f"Advanced Portfolio Manager initialized with ${initial_capital:,.2f}")
    
    async def add_position(self, symbol: str, shares: float, price: float) -> bool:
        """Add new position to portfolio"""
        try:
            trade_value = shares * price
            
            # Check if we have enough cash
            if trade_value > self.cash_balance:
                logger.warning(f"Insufficient cash for {symbol}: ${trade_value:,.2f} > ${self.cash_balance:,.2f}")
                return False
            
            # Risk check before adding position
            if not await self._validate_position_risk(symbol, shares, price):
                logger.warning(f"Position {symbol} failed risk validation")
                return False
            
            # Add or update position
            if symbol in self.positions:
                # Update existing position
                current_pos = self.positions[symbol]
                total_shares = current_pos.shares + shares
                total_cost = (current_pos.shares * current_pos.cost_basis) + (shares * price)
                new_cost_basis = total_cost / total_shares
                
                current_pos.shares = total_shares
                current_pos.cost_basis = new_cost_basis
            else:
                # Create new position
                self.positions[symbol] = Position(
                    symbol=symbol,
                    shares=shares,
                    current_price=price,
                    market_value=shares * price,
                    weight=0,  # Will be calculated in _update_portfolio_metrics
                    cost_basis=price,
                    unrealized_pnl=0,
                    unrealized_pnl_percent=0,
                    realized_pnl=0,
                    dividend_income=0,
                    sector=self.sector_mapping.get(symbol, 'Unknown'),
                    beta=self._get_mock_beta(symbol),
                    volatility=self._get_mock_volatility(symbol),
                    sharpe_ratio=0,
                    entry_date=datetime.now().isoformat(),
                    last_updated=datetime.now().isoformat()
                )
            
            # Update cash balance
            self.cash_balance -= trade_value
            
            # Record trade
            self._record_trade(symbol, shares, price, 'BUY')
            
            # Update portfolio metrics
            await self._update_portfolio_metrics()
            
            logger.info(f"Added position: {shares} shares of {symbol} at ${price:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding position {symbol}: {e}")
            return False
    
    async def remove_position(self, symbol: str, shares: float = None) -> bool:
        """Remove or reduce position"""
        try:
            if symbol not in self.positions:
                logger.warning(f"Position {symbol} not found")
                return False
            
            position = self.positions[symbol]
            
            # Default to selling all shares
            if shares is None:
                shares = position.shares
            
            if shares > position.shares:
                logger.warning(f"Cannot sell {shares} shares of {symbol}, only have {position.shares}")
                return False
            
            # Get current market price
            current_price = await self._get_current_price(symbol)
            trade_value = shares * current_price
            
            # Calculate realized P&L
            realized_pnl = (current_price - position.cost_basis) * shares
            
            if shares == position.shares:
                # Selling entire position
                position.realized_pnl += realized_pnl
                del self.positions[symbol]
            else:
                # Partial sell
                position.shares -= shares
                position.realized_pnl += realized_pnl
            
            # Update cash balance
            self.cash_balance += trade_value
            
            # Record trade
            self._record_trade(symbol, shares, current_price, 'SELL')
            
            # Update portfolio metrics
            await self._update_portfolio_metrics()
            
            logger.info(f"Sold {shares} shares of {symbol} at ${current_price:.2f}")
            return True
            
        except Exception as e:
            logger.error(f"Error removing position {symbol}: {e}")
            return False
    
    async def _validate_position_risk(self, symbol: str, shares: float, price: float) -> bool:
        """Validate position against risk limits"""
        try:
            trade_value = shares * price
            total_portfolio_value = await self._calculate_total_value()
            
            # Check position size limit
            if symbol in self.positions:
                current_value = self.positions[symbol].market_value
                new_position_value = current_value + trade_value
            else:
                new_position_value = trade_value
            
            position_weight = new_position_value / total_portfolio_value
            if position_weight > self.risk_limits['max_position_weight']:
                logger.warning(f"Position weight {position_weight:.2%} exceeds limit {self.risk_limits['max_position_weight']:.2%}")
                return False
            
            # Check sector concentration
            sector = self.sector_mapping.get(symbol, 'Unknown')
            sector_exposure = await self._calculate_sector_exposure()
            
            if sector in sector_exposure:
                new_sector_weight = (sector_exposure[sector] + trade_value) / total_portfolio_value
                if new_sector_weight > self.risk_limits['max_sector_weight']:
                    logger.warning(f"Sector weight {new_sector_weight:.2%} exceeds limit {self.risk_limits['max_sector_weight']:.2%}")
                    return False
            
            # Check liquidity (maintain minimum cash ratio)
            remaining_cash = self.cash_balance - trade_value
            min_cash_required = total_portfolio_value * self.risk_limits['min_liquidity_ratio']
            
            if remaining_cash < min_cash_required:
                logger.warning(f"Trade would violate minimum cash requirement")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Risk validation error: {e}")
            return False
    
    async def _calculate_total_value(self) -> float:
        """Calculate total portfolio value"""
        total_value = self.cash_balance
        
        for symbol, position in self.positions.items():
            current_price = await self._get_current_price(symbol)
            position.current_price = current_price
            position.market_value = position.shares * current_price
            total_value += position.market_value
        
        return total_value
    
    async def _calculate_sector_exposure(self) -> Dict[str, float]:
        """Calculate current sector exposure"""
        sector_exposure = {}
        
        for symbol, position in self.positions.items():
            sector = position.sector
            current_price = await self._get_current_price(symbol)
            market_value = position.shares * current_price
            
            if sector in sector_exposure:
                sector_exposure[sector] += market_value
            else:
                sector_exposure[sector] = market_value
        
        return sector_exposure
    
    async def _update_portfolio_metrics(self):
        """Update all portfolio metrics"""
        try:
            total_value = await self._calculate_total_value()
            
            # Update position weights and metrics
            for symbol, position in self.positions.items():
                current_price = await self._get_current_price(symbol)
                position.current_price = current_price
                position.market_value = position.shares * current_price
                position.weight = position.market_value / total_value
                position.unrealized_pnl = (current_price - position.cost_basis) * position.shares
                position.unrealized_pnl_percent = (position.unrealized_pnl / (position.cost_basis * position.shares)) * 100
                position.last_updated = datetime.now().isoformat()
            
            # Store performance snapshot
            self.performance_history.append({
                'timestamp': datetime.now().isoformat(),
                'total_value': total_value,
                'cash_balance': self.cash_balance,
                'invested_value': total_value - self.cash_balance,
                'num_positions': len(self.positions)
            })
            
            # Keep only last 1000 snapshots
            if len(self.performance_history) > 1000:
                self.performance_history = self.performance_history[-1000:]
                
        except Exception as e:
            logger.error(f"Error updating portfolio metrics: {e}")
    
    async def get_portfolio_metrics(self) -> PortfolioMetrics:
        """Get comprehensive portfolio metrics"""
        try:
            total_value = await self._calculate_total_value()
            invested_value = total_value - self.cash_balance
            
            # Calculate returns
            total_pnl = total_value - self.initial_capital
            total_pnl_percent = (total_pnl / self.initial_capital) * 100
            
            # Calculate daily return if we have performance history
            daily_return = 0
            daily_pnl = 0
            if len(self.performance_history) > 1:
                yesterday_value = self.performance_history[-2]['total_value']
                today_value = total_value
                daily_return = ((today_value - yesterday_value) / yesterday_value) * 100
                daily_pnl = today_value - yesterday_value
            
            # Calculate risk metrics
            returns = []
            if len(self.performance_history) > 30:
                for i in range(1, len(self.performance_history)):
                    prev_val = self.performance_history[i-1]['total_value']
                    curr_val = self.performance_history[i]['total_value']
                    daily_ret = (curr_val - prev_val) / prev_val
                    returns.append(daily_ret)
            
            # Risk calculations
            volatility = np.std(returns) * np.sqrt(252) * 100 if returns else 0  # Annualized
            sharpe_ratio = (np.mean(returns) * 252) / (np.std(returns) * np.sqrt(252)) if returns and np.std(returns) > 0 else 0
            
            # Sortino ratio (downside deviation)
            negative_returns = [r for r in returns if r < 0]
            downside_dev = np.std(negative_returns) if negative_returns else 0
            sortino_ratio = (np.mean(returns) * 252) / (downside_dev * np.sqrt(252)) if downside_dev > 0 else 0
            
            # Maximum drawdown
            if len(self.performance_history) > 1:
                values = [p['total_value'] for p in self.performance_history]
                peak = values[0]
                max_dd = 0
                for value in values:
                    if value > peak:
                        peak = value
                    drawdown = (peak - value) / peak
                    max_dd = max(max_dd, drawdown)
                max_drawdown = max_dd * 100
            else:
                max_drawdown = 0
            
            # Portfolio beta (weighted average of position betas)
            portfolio_beta = 0
            for position in self.positions.values():
                portfolio_beta += position.beta * position.weight
            
            # Win/loss statistics
            winning_trades = len([t for t in self.trade_history if t.get('pnl', 0) > 0])
            total_trades = len(self.trade_history)
            win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
            
            # Average win/loss
            winning_amounts = [t['pnl'] for t in self.trade_history if t.get('pnl', 0) > 0]
            losing_amounts = [t['pnl'] for t in self.trade_history if t.get('pnl', 0) < 0]
            
            avg_win = np.mean(winning_amounts) if winning_amounts else 0
            avg_loss = abs(np.mean(losing_amounts)) if losing_amounts else 0
            profit_factor = abs(sum(winning_amounts) / sum(losing_amounts)) if losing_amounts else 0
            
            return PortfolioMetrics(
                total_value=round(total_value, 2),
                cash_balance=round(self.cash_balance, 2),
                invested_value=round(invested_value, 2),
                total_pnl=round(total_pnl, 2),
                total_pnl_percent=round(total_pnl_percent, 2),
                daily_pnl=round(daily_pnl, 2),
                daily_return=round(daily_return, 2),
                volatility=round(volatility, 2),
                sharpe_ratio=round(sharpe_ratio, 2),
                sortino_ratio=round(sortino_ratio, 2),
                max_drawdown=round(max_drawdown, 2),
                beta=round(portfolio_beta, 2),
                alpha=round(total_pnl_percent - (portfolio_beta * 10), 2),  # Simplified alpha
                information_ratio=round(sharpe_ratio * 0.8, 2),  # Approximation
                calmar_ratio=round(total_pnl_percent / max(max_drawdown, 1), 2),
                win_rate=round(win_rate, 2),
                avg_win=round(avg_win, 2),
                avg_loss=round(avg_loss, 2),
                profit_factor=round(profit_factor, 2)
            )
            
        except Exception as e:
            logger.error(f"Error calculating portfolio metrics: {e}")
            return PortfolioMetrics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    
    async def get_risk_metrics(self) -> RiskMetrics:
        """Get advanced risk metrics"""
        try:
            total_value = await self._calculate_total_value()
            
            # VaR calculations (simplified)
            returns = []
            if len(self.performance_history) > 30:
                for i in range(1, len(self.performance_history)):
                    prev_val = self.performance_history[i-1]['total_value']
                    curr_val = self.performance_history[i]['total_value']
                    daily_ret = (curr_val - prev_val) / prev_val
                    returns.append(daily_ret)
            
            if returns:
                var_95 = np.percentile(returns, 5) * total_value  # 5th percentile
                var_5d = var_95 * np.sqrt(5)  # 5-day VaR
                cvar_95 = np.mean([r for r in returns if r <= np.percentile(returns, 5)]) * total_value
            else:
                var_95 = var_5d = cvar_95 = 0
            
            # Concentration risk
            concentration_risk = {}
            for symbol, position in self.positions.items():
                concentration_risk[symbol] = position.weight
            
            # Sector risk
            sector_exposure = await self._calculate_sector_exposure()
            sector_risk = {sector: value / total_value for sector, value in sector_exposure.items()}
            
            # Correlation risk (simplified)
            correlation_risk = len(self.positions) / 20  # Simplified: more positions = less correlation risk
            
            # Liquidity risk
            liquidity_risk = (total_value - self.cash_balance) / total_value
            
            return RiskMetrics(
                var_1d=round(abs(var_95), 2),
                var_5d=round(abs(var_5d), 2),
                cvar_1d=round(abs(cvar_95), 2),
                expected_shortfall=round(abs(cvar_95), 2),
                maximum_drawdown=round((await self.get_portfolio_metrics()).max_drawdown, 2),
                downside_deviation=round(np.std([r for r in returns if r < 0]) * 100 if returns else 0, 2),
                tracking_error=round(np.std(returns) * np.sqrt(252) * 100 if returns else 0, 2),
                concentration_risk=concentration_risk,
                sector_risk=sector_risk,
                correlation_risk=round(min(correlation_risk, 1.0), 2),
                liquidity_risk=round(liquidity_risk, 2)
            )
            
        except Exception as e:
            logger.error(f"Error calculating risk metrics: {e}")
            return RiskMetrics(0, 0, 0, 0, 0, 0, 0, {}, {}, 0, 0)
    
    async def generate_rebalance_recommendation(self, target_weights: Dict[str, float] = None) -> RebalanceRecommendation:
        """Generate intelligent rebalancing recommendation"""
        try:
            current_weights = {}
            total_value = await self._calculate_total_value()
            
            # Get current weights
            for symbol, position in self.positions.items():
                current_weights[symbol] = position.weight
            
            # Generate target weights if not provided
            if target_weights is None:
                target_weights = await self._optimize_portfolio()
            
            # Calculate required trades
            trades_required = []
            total_cost = 0
            
            for symbol in set(list(current_weights.keys()) + list(target_weights.keys())):
                current_weight = current_weights.get(symbol, 0)
                target_weight = target_weights.get(symbol, 0)
                
                if abs(target_weight - current_weight) > 0.01:  # 1% threshold
                    current_value = current_weight * total_value
                    target_value = target_weight * total_value
                    trade_value = target_value - current_value
                    
                    if symbol in self.positions:
                        current_price = await self._get_current_price(symbol)
                        shares_to_trade = trade_value / current_price
                    else:
                        current_price = await self._get_current_price(symbol)
                        shares_to_trade = trade_value / current_price
                    
                    action = "BUY" if shares_to_trade > 0 else "SELL"
                    
                    trades_required.append({
                        'symbol': symbol,
                        'action': action,
                        'shares': abs(shares_to_trade),
                        'current_weight': current_weight,
                        'target_weight': target_weight,
                        'trade_value': abs(trade_value),
                        'price': current_price
                    })
                    
                    # Estimate transaction costs (0.1% commission)
                    total_cost += abs(trade_value) * 0.001
            
            # Expected improvement metrics
            current_metrics = await self.get_portfolio_metrics()
            expected_improvement = {
                'sharpe_improvement': np.random.uniform(0.01, 0.05),  # Mock improvement
                'risk_reduction': np.random.uniform(0.02, 0.08),
                'diversification_improvement': len(target_weights) / max(len(current_weights), 1)
            }
            
            # Generate reasoning
            reasoning = []
            if len(trades_required) > 0:
                reasoning.append(f"Rebalancing {len(trades_required)} positions to optimize risk-return profile")
                reasoning.append(f"Expected Sharpe ratio improvement: +{expected_improvement['sharpe_improvement']:.2f}")
                reasoning.append(f"Estimated risk reduction: {expected_improvement['risk_reduction']:.1%}")
                reasoning.append(f"Transaction costs: ${total_cost:.2f}")
            else:
                reasoning.append("Portfolio is well-balanced, no immediate rebalancing required")
            
            # Confidence score based on expected improvement vs costs
            confidence_score = min(0.95, (sum(expected_improvement.values()) * 100) / max(total_cost, 1))
            
            return RebalanceRecommendation(
                recommendation_id=str(uuid.uuid4()),
                current_weights=current_weights,
                target_weights=target_weights,
                trades_required=trades_required,
                expected_improvement=expected_improvement,
                transaction_costs=total_cost,
                reasoning=reasoning,
                confidence_score=round(confidence_score, 3),
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error generating rebalance recommendation: {e}")
            return RebalanceRecommendation("error", {}, {}, [], {}, 0, ["Error generating recommendation"], 0, datetime.now().isoformat())
    
    async def _optimize_portfolio(self) -> Dict[str, float]:
        """Optimize portfolio using modern portfolio theory"""
        try:
            # Use current positions as universe
            symbols = list(self.positions.keys())
            
            if len(symbols) < 2:
                # Not enough assets to optimize
                if symbols:
                    return {symbols[0]: 1.0}
                return {}
            
            # Generate mock expected returns and covariance matrix
            returns = {}
            for symbol in symbols:
                returns[symbol] = np.random.normal(0.08, 0.15)  # 8% mean return, 15% vol
            
            # Mock covariance matrix
            n = len(symbols)
            correlation_matrix = np.random.uniform(0.2, 0.7, (n, n))
            np.fill_diagonal(correlation_matrix, 1.0)
            correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2  # Make symmetric
            
            volatilities = [0.15 + np.random.uniform(-0.05, 0.05) for _ in symbols]
            cov_matrix = np.outer(volatilities, volatilities) * correlation_matrix
            
            if CVXPY_AVAILABLE:
                # Use CVXPY for optimization
                w = cp.Variable(n)
                expected_return = cp.sum([returns[symbols[i]] * w[i] for i in range(n)])
                risk = cp.quad_form(w, cov_matrix)
                
                constraints = [
                    cp.sum(w) == 1,  # Weights sum to 1
                    w >= 0,          # No short selling
                    w <= 0.25        # Max 25% per position
                ]
                
                # Maximize Sharpe ratio (approximation)
                objective = cp.Maximize(expected_return - 0.5 * risk)
                problem = cp.Problem(objective, constraints)
                problem.solve(verbose=False)
                
                if w.value is not None:
                    weights = {symbols[i]: max(0, w.value[i]) for i in range(n)}
                else:
                    # Fallback to equal weights
                    weights = {symbol: 1.0/n for symbol in symbols}
            else:
                # Fallback optimization using scipy
                def objective(weights):
                    portfolio_return = sum(returns[symbols[i]] * weights[i] for i in range(n))
                    portfolio_var = np.dot(weights, np.dot(cov_matrix, weights))
                    return -portfolio_return / np.sqrt(portfolio_var)  # Negative Sharpe
                
                constraints = [
                    {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Weights sum to 1
                ]
                bounds = [(0, 0.25) for _ in range(n)]  # No short selling, max 25%
                
                result = minimize(objective, [1.0/n]*n, method='SLSQP', bounds=bounds, constraints=constraints)
                
                if result.success:
                    weights = {symbols[i]: max(0, result.x[i]) for i in range(n)}
                else:
                    weights = {symbol: 1.0/n for symbol in symbols}
            
            # Normalize weights
            total_weight = sum(weights.values())
            if total_weight > 0:
                weights = {symbol: weight/total_weight for symbol, weight in weights.items()}
            
            return weights
            
        except Exception as e:
            logger.error(f"Portfolio optimization error: {e}")
            # Fallback to equal weights
            symbols = list(self.positions.keys())
            if symbols:
                return {symbol: 1.0/len(symbols) for symbol in symbols}
            return {}
    
    async def execute_rebalance(self, recommendation: RebalanceRecommendation) -> bool:
        """Execute rebalancing trades"""
        try:
            executed_trades = 0
            
            for trade in recommendation.trades_required:
                symbol = trade['symbol']
                action = trade['action']
                shares = trade['shares']
                
                if action == "BUY":
                    success = await self.add_position(symbol, shares, trade['price'])
                else:  # SELL
                    success = await self.remove_position(symbol, shares)
                
                if success:
                    executed_trades += 1
                else:
                    logger.warning(f"Failed to execute {action} {shares} shares of {symbol}")
            
            if executed_trades > 0:
                self.last_rebalance = datetime.now()
                self.rebalance_count += 1
                logger.info(f"Rebalancing completed: {executed_trades}/{len(recommendation.trades_required)} trades executed")
            
            return executed_trades == len(recommendation.trades_required)
            
        except Exception as e:
            logger.error(f"Error executing rebalance: {e}")
            return False
    
    def _record_trade(self, symbol: str, shares: float, price: float, action: str):
        """Record trade in history"""
        trade = {
            'timestamp': datetime.now().isoformat(),
            'symbol': symbol,
            'shares': shares,
            'price': price,
            'action': action,
            'value': shares * price,
            'pnl': 0  # Will be calculated when position is closed
        }
        self.trade_history.append(trade)
    
    async def _get_current_price(self, symbol: str) -> float:
        """Get current market price (mock implementation)"""
        # Mock price with realistic movement
        base_prices = {
            'CBA.AX': 110.50, 'WBC.AX': 25.20, 'ANZ.AX': 27.30, 'NAB.AX': 32.50,
            'BHP.AX': 45.20, 'RIO.AX': 124.30, 'FMG.AX': 19.85, 'NCM.AX': 28.40,
            'CSL.AX': 295.50, 'COL.AX': 285.40, 'RHC.AX': 45.60,
            'WOW.AX': 37.80, 'WES.AX': 65.20, 'JBH.AX': 55.30,
            'TLS.AX': 4.05, 'TCL.AX': 15.80, 'XRO.AX': 135.20,
            'REA.AX': 185.40, 'SCG.AX': 14.50, 'GMG.AX': 25.80,
            'MQG.AX': 185.60, 'QBE.AX': 15.45, 'IAG.AX': 5.85
        }
        
        base_price = base_prices.get(symbol, 50.0)
        # Add realistic price movement (0.5% daily volatility)
        price_change = np.random.normal(0, 0.005)
        return base_price * (1 + price_change)
    
    def _get_mock_beta(self, symbol: str) -> float:
        """Get mock beta for symbol"""
        sector_betas = {
            'Financials': 1.2, 'Materials': 1.3, 'Healthcare': 0.8,
            'Consumer Staples': 0.7, 'Consumer Discretionary': 1.1,
            'Communication': 0.9, 'Technology': 1.4, 'Real Estate': 1.0
        }
        sector = self.sector_mapping.get(symbol, 'Unknown')
        base_beta = sector_betas.get(sector, 1.0)
        return base_beta + np.random.uniform(-0.2, 0.2)
    
    def _get_mock_volatility(self, symbol: str) -> float:
        """Get mock volatility for symbol"""
        sector_volatilities = {
            'Financials': 0.20, 'Materials': 0.25, 'Healthcare': 0.18,
            'Consumer Staples': 0.15, 'Consumer Discretionary': 0.22,
            'Communication': 0.19, 'Technology': 0.30, 'Real Estate': 0.21
        }
        sector = self.sector_mapping.get(symbol, 'Unknown')
        base_vol = sector_volatilities.get(sector, 0.20)
        return base_vol + np.random.uniform(-0.05, 0.05)
    
    async def get_positions(self) -> List[Dict]:
        """Get all current positions"""
        await self._update_portfolio_metrics()
        return [asdict(position) for position in self.positions.values()]
    
    async def get_trade_history(self, limit: int = 100) -> List[Dict]:
        """Get trade history"""
        return self.trade_history[-limit:]
    
    def get_portfolio_summary(self) -> Dict[str, Any]:
        """Get portfolio summary"""
        return {
            'initial_capital': self.initial_capital,
            'cash_balance': self.cash_balance,
            'positions_count': len(self.positions),
            'last_rebalance': self.last_rebalance.isoformat(),
            'rebalance_count': self.rebalance_count,
            'trades_executed': len(self.trade_history)
        }

# Global portfolio manager instance
advanced_portfolio_manager = AdvancedPortfolioManager()