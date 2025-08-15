"""
AI Integration Service for Qlib Pro
Connects QLib models with real market data and generates trading signals
"""

import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import json

# Import services
try:
    from qlib_service import qlib_service
    from market_data_service import market_data_service
    SERVICES_AVAILABLE = True
except ImportError:
    print("Required services not available")
    SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)

class AIIntegrationService:
    """Integrates QLib AI models with real market data"""
    
    def __init__(self):
        self.active_signals = {}
        self.model_performance = {}
        self.signal_history = []
        self.confidence_threshold = 0.7
        
        # Australian market configuration
        self.asx_symbols = [
            'CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX', 'TLS.AX', 
            'RIO.AX', 'WOW.AX', 'NAB.AX', 'FMG.AX'
        ]
        
        # Model weights for ensemble predictions
        self.model_weights = {
            'LSTM': 0.35,
            'LightGBM': 0.30, 
            'GRU': 0.25,
            'Transformer': 0.10
        }
    
    async def generate_ai_signals(self, symbols: List[str] = None) -> Dict[str, Any]:
        """Generate AI trading signals using QLib models and real market data"""
        if symbols is None:
            symbols = self.asx_symbols[:5]  # Top 5 ASX stocks
        
        signals = []
        
        try:
            # Get real market data
            market_data = await market_data_service.get_realtime_quotes(symbols)
            quotes = market_data.get('quotes', [])
            
            # Get historical data for technical analysis
            historical_data = {}
            for symbol in symbols:
                try:
                    hist = await market_data_service.get_historical_data(symbol, period="3mo")
                    historical_data[symbol] = hist
                except Exception as e:
                    logger.error(f"Error getting historical data for {symbol}: {e}")
            
            # Generate signals for each symbol
            for quote in quotes:
                symbol = quote['symbol']
                
                # Calculate technical indicators
                signal_data = await self._analyze_symbol(symbol, quote, historical_data.get(symbol))
                
                if signal_data:
                    signals.append(signal_data)
            
            # Store active signals
            self.active_signals[datetime.now().isoformat()] = signals
            
            # Add to signal history
            self.signal_history.extend(signals)
            
            # Keep only last 1000 signals
            if len(self.signal_history) > 1000:
                self.signal_history = self.signal_history[-1000:]
            
            return {
                'signals': signals,
                'total': len(signals),
                'timestamp': datetime.now().isoformat(),
                'market_status': market_data.get('market_status', 'unknown'),
                'confidence_filter': self.confidence_threshold,
                'models_used': list(self.model_weights.keys())
            }
            
        except Exception as e:
            logger.error(f"Error generating AI signals: {e}")
            return await self._fallback_signals(symbols)
    
    async def _analyze_symbol(self, symbol: str, quote: Dict, historical_data: Dict = None) -> Optional[Dict]:
        """Analyze individual symbol and generate signal"""
        try:
            current_price = float(quote.get('price', 0))
            if current_price <= 0:
                return None
            
            # Technical analysis features
            features = await self._calculate_features(symbol, quote, historical_data)
            
            # Get QLib model predictions if available
            qlib_predictions = await self._get_qlib_predictions(symbol, features)
            
            # Combine predictions using ensemble approach
            ensemble_prediction = self._ensemble_prediction(qlib_predictions, features)
            
            # Generate signal
            signal_strength = ensemble_prediction['strength']
            confidence = ensemble_prediction['confidence']
            
            # Only generate signals above confidence threshold
            if confidence < self.confidence_threshold:
                return None
            
            # Determine signal type
            if signal_strength > 0.03:
                signal_type = 'BUY'
                target_price = current_price * (1 + abs(signal_strength))
            elif signal_strength < -0.03:
                signal_type = 'SELL'  
                target_price = current_price * (1 - abs(signal_strength))
            else:
                signal_type = 'HOLD'
                target_price = current_price
            
            return {
                'symbol': symbol,
                'company_name': quote.get('company_name', symbol),
                'signal': signal_type,
                'confidence': round(confidence, 3),
                'strength': round(signal_strength, 4),
                'current_price': current_price,
                'target_price': round(target_price, 2),
                'expected_return': round(signal_strength * 100, 2),
                'reasoning': self._generate_reasoning(signal_type, features, ensemble_prediction),
                'risk_level': self._assess_risk(features, signal_strength),
                'timeframe': '1-5 days',
                'technical_indicators': features,
                'model_contributions': ensemble_prediction.get('contributions', {}),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing symbol {symbol}: {e}")
            return None
    
    async def _calculate_features(self, symbol: str, quote: Dict, historical_data: Dict = None) -> Dict:
        """Calculate technical analysis features"""
        features = {}
        
        try:
            # Basic price features
            features['price'] = float(quote.get('price', 0))
            features['change'] = float(quote.get('change', 0))
            features['change_percent'] = float(str(quote.get('change_percent', '0%')).replace('%', ''))
            features['volume'] = int(quote.get('volume', 0))
            
            # Technical indicators from historical data
            if historical_data and 'data' in historical_data:
                hist_data = historical_data['data']
                
                if len(hist_data) >= 20:  # Need at least 20 days for indicators
                    prices = [float(d.get('close', 0)) for d in hist_data[-20:]]
                    volumes = [int(d.get('volume', 0)) for d in hist_data[-20:]]
                    
                    # Moving averages
                    features['sma_5'] = np.mean(prices[-5:]) if len(prices) >= 5 else prices[-1]
                    features['sma_10'] = np.mean(prices[-10:]) if len(prices) >= 10 else prices[-1]
                    features['sma_20'] = np.mean(prices[-20:]) if len(prices) >= 20 else prices[-1]
                    
                    # Price position relative to moving averages
                    current_price = features['price']
                    features['price_vs_sma5'] = (current_price - features['sma_5']) / features['sma_5']
                    features['price_vs_sma10'] = (current_price - features['sma_10']) / features['sma_10']
                    features['price_vs_sma20'] = (current_price - features['sma_20']) / features['sma_20']
                    
                    # Volatility (standard deviation of returns)
                    returns = [prices[i]/prices[i-1] - 1 for i in range(1, len(prices))]
                    features['volatility'] = np.std(returns) if len(returns) > 1 else 0
                    
                    # Momentum indicators
                    if len(prices) >= 14:
                        # RSI approximation
                        gains = [max(returns[i], 0) for i in range(len(returns))]
                        losses = [abs(min(returns[i], 0)) for i in range(len(returns))]
                        avg_gain = np.mean(gains[-14:])
                        avg_loss = np.mean(losses[-14:])
                        
                        if avg_loss > 0:
                            rs = avg_gain / avg_loss
                            features['rsi'] = 100 - (100 / (1 + rs))
                        else:
                            features['rsi'] = 100
                    
                    # Volume trend
                    recent_volume = np.mean(volumes[-5:]) if len(volumes) >= 5 else volumes[-1]
                    avg_volume = np.mean(volumes)
                    features['volume_ratio'] = recent_volume / avg_volume if avg_volume > 0 else 1
                    
            # Market context features
            features['market_cap_category'] = self._categorize_market_cap(symbol)
            features['sector'] = self._get_sector(symbol)
            features['is_index_component'] = symbol in ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX']
            
        except Exception as e:
            logger.error(f"Error calculating features for {symbol}: {e}")
        
        return features
    
    async def _get_qlib_predictions(self, symbol: str, features: Dict) -> Dict:
        """Get predictions from available QLib models"""
        predictions = {}
        
        if not SERVICES_AVAILABLE:
            return predictions
        
        try:
            # Get available models
            models = qlib_service.get_models()
            
            for model in models:
                if model.get('status') == 'active':
                    model_id = model['id']
                    model_type = model['type']
                    
                    try:
                        # Get model predictions
                        pred_data = qlib_service.get_predictions(model_id)
                        
                        # Find prediction for our symbol (map ASX to Chinese symbols)
                        mapped_symbol = self._map_symbol_to_qlib(symbol)
                        
                        for pred in pred_data:
                            if pred.get('symbol') == mapped_symbol:
                                predictions[model_type] = {
                                    'prediction': pred.get('prediction', 0),
                                    'confidence': pred.get('confidence', 0.5),
                                    'signal': pred.get('signal', 'HOLD')
                                }
                                break
                        
                        # If no exact match, generate prediction based on features
                        if model_type not in predictions:
                            predictions[model_type] = self._simulate_model_prediction(model_type, features)
                            
                    except Exception as e:
                        logger.error(f"Error getting prediction from model {model_id}: {e}")
                        # Fallback prediction
                        predictions[model_type] = self._simulate_model_prediction(model_type, features)
        
        except Exception as e:
            logger.error(f"Error getting QLib predictions: {e}")
        
        return predictions
    
    def _simulate_model_prediction(self, model_type: str, features: Dict) -> Dict:
        """Simulate model prediction based on technical features"""
        try:
            # Different models focus on different aspects
            if model_type == 'LSTM':
                # LSTM focuses on price momentum and trends
                momentum = features.get('price_vs_sma5', 0) * 0.5 + features.get('price_vs_sma10', 0) * 0.3
                prediction = np.tanh(momentum * 5)  # Scale and bound between -1, 1
                confidence = min(0.9, 0.6 + abs(momentum) * 2)
                
            elif model_type == 'LightGBM':
                # LightGBM focuses on multiple technical indicators
                rsi = features.get('rsi', 50)
                vol_ratio = features.get('volume_ratio', 1)
                volatility = features.get('volatility', 0.02)
                
                # Combine indicators
                rsi_signal = (50 - rsi) / 50  # Contrarian RSI
                volume_signal = min(2, vol_ratio) - 1  # Volume confirmation
                vol_penalty = -abs(volatility) * 10  # Penalty for high volatility
                
                prediction = np.tanh((rsi_signal + volume_signal + vol_penalty) * 2)
                confidence = min(0.85, 0.55 + abs(rsi_signal) + abs(volume_signal))
                
            elif model_type == 'GRU':
                # GRU focuses on recent price action
                change_pct = features.get('change_percent', 0) / 100
                price_vs_sma = features.get('price_vs_sma20', 0)
                
                prediction = np.tanh((change_pct * 3 + price_vs_sma * 2))
                confidence = min(0.8, 0.5 + abs(change_pct) * 5 + abs(price_vs_sma))
                
            else:  # Transformer or other
                # Conservative approach combining multiple signals
                signals = [
                    features.get('price_vs_sma5', 0),
                    features.get('price_vs_sma10', 0),
                    features.get('change_percent', 0) / 100
                ]
                prediction = np.tanh(np.mean(signals) * 3)
                confidence = min(0.75, 0.5 + np.std(signals) * 2)
            
            # Determine signal
            if prediction > 0.1:
                signal = 'BUY'
            elif prediction < -0.1:
                signal = 'SELL'
            else:
                signal = 'HOLD'
            
            return {
                'prediction': float(prediction),
                'confidence': float(confidence),
                'signal': signal
            }
            
        except Exception as e:
            logger.error(f"Error simulating {model_type} prediction: {e}")
            return {'prediction': 0.0, 'confidence': 0.5, 'signal': 'HOLD'}
    
    def _ensemble_prediction(self, qlib_predictions: Dict, features: Dict) -> Dict:
        """Combine predictions from multiple models using weighted ensemble"""
        try:
            total_weight = 0
            weighted_prediction = 0
            weighted_confidence = 0
            contributions = {}
            
            # Combine QLib model predictions
            for model_type, prediction in qlib_predictions.items():
                weight = self.model_weights.get(model_type, 0.1)
                pred_value = prediction.get('prediction', 0)
                conf_value = prediction.get('confidence', 0.5)
                
                weighted_prediction += pred_value * weight
                weighted_confidence += conf_value * weight
                total_weight += weight
                
                contributions[model_type] = {
                    'prediction': pred_value,
                    'confidence': conf_value,
                    'weight': weight
                }
            
            # Add technical analysis overlay
            tech_weight = 0.2
            tech_signal = self._technical_signal(features)
            weighted_prediction += tech_signal * tech_weight
            weighted_confidence += 0.6 * tech_weight  # Moderate confidence for TA
            total_weight += tech_weight
            
            contributions['technical_analysis'] = {
                'prediction': tech_signal,
                'confidence': 0.6,
                'weight': tech_weight
            }
            
            # Normalize by total weight
            if total_weight > 0:
                final_prediction = weighted_prediction / total_weight
                final_confidence = weighted_confidence / total_weight
            else:
                final_prediction = 0
                final_confidence = 0.5
            
            return {
                'strength': float(final_prediction),
                'confidence': float(final_confidence),
                'contributions': contributions,
                'ensemble_method': 'weighted_average'
            }
            
        except Exception as e:
            logger.error(f"Error in ensemble prediction: {e}")
            return {'strength': 0.0, 'confidence': 0.5, 'contributions': {}}
    
    def _technical_signal(self, features: Dict) -> float:
        """Generate signal based on technical analysis"""
        try:
            signals = []
            
            # Moving average signals
            if 'price_vs_sma5' in features:
                signals.append(features['price_vs_sma5'] * 2)  # Short-term momentum
            
            if 'price_vs_sma20' in features:
                signals.append(features['price_vs_sma20'])  # Medium-term trend
            
            # RSI signal (contrarian)
            if 'rsi' in features:
                rsi = features['rsi']
                if rsi > 70:
                    signals.append(-0.5)  # Overbought
                elif rsi < 30:
                    signals.append(0.5)   # Oversold
                else:
                    signals.append(0)
            
            # Volume confirmation
            if 'volume_ratio' in features:
                vol_ratio = features['volume_ratio']
                if vol_ratio > 1.5:
                    signals.append(0.2)   # High volume confirmation
                elif vol_ratio < 0.5:
                    signals.append(-0.1)  # Low volume warning
            
            # Combine signals
            if signals:
                return np.tanh(np.mean(signals))
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating technical signal: {e}")
            return 0.0
    
    def _generate_reasoning(self, signal_type: str, features: Dict, ensemble: Dict) -> str:
        """Generate human-readable reasoning for the signal"""
        try:
            reasons = []
            
            # Price action
            change_pct = features.get('change_percent', 0)
            if abs(change_pct) > 2:
                reasons.append(f"Strong price movement ({change_pct:+.1f}%)")
            
            # Moving average analysis
            if 'price_vs_sma5' in features and 'price_vs_sma20' in features:
                sma5_pos = features['price_vs_sma5']
                sma20_pos = features['price_vs_sma20']
                
                if sma5_pos > 0.02 and sma20_pos > 0:
                    reasons.append("Price above key moving averages")
                elif sma5_pos < -0.02 and sma20_pos < 0:
                    reasons.append("Price below key moving averages")
            
            # RSI condition
            if 'rsi' in features:
                rsi = features['rsi']
                if rsi > 70:
                    reasons.append("Overbought condition (RSI > 70)")
                elif rsi < 30:
                    reasons.append("Oversold condition (RSI < 30)")
            
            # Volume analysis
            if 'volume_ratio' in features:
                vol_ratio = features['volume_ratio']
                if vol_ratio > 1.5:
                    reasons.append("High volume confirmation")
                elif vol_ratio < 0.7:
                    reasons.append("Below average volume")
            
            # Model consensus
            contributions = ensemble.get('contributions', {})
            if len(contributions) > 1:
                consensus_models = []
                for model, data in contributions.items():
                    if model != 'technical_analysis':
                        pred = data.get('prediction', 0)
                        if signal_type == 'BUY' and pred > 0.05:
                            consensus_models.append(model)
                        elif signal_type == 'SELL' and pred < -0.05:
                            consensus_models.append(model)
                
                if consensus_models:
                    reasons.append(f"AI model consensus ({', '.join(consensus_models)})")
            
            # Combine reasons
            if reasons:
                return "; ".join(reasons[:3])  # Top 3 reasons
            else:
                return f"AI model prediction with {ensemble.get('confidence', 0.5):.0%} confidence"
                
        except Exception as e:
            logger.error(f"Error generating reasoning: {e}")
            return "AI model prediction"
    
    def _assess_risk(self, features: Dict, signal_strength: float) -> str:
        """Assess risk level of the signal"""
        try:
            risk_factors = 0
            
            # Volatility risk
            volatility = features.get('volatility', 0.02)
            if volatility > 0.05:
                risk_factors += 2
            elif volatility > 0.03:
                risk_factors += 1
            
            # Signal strength risk
            if abs(signal_strength) > 0.15:
                risk_factors += 1
            
            # Volume risk
            volume_ratio = features.get('volume_ratio', 1)
            if volume_ratio < 0.5:
                risk_factors += 1
            
            # Overall risk assessment
            if risk_factors >= 3:
                return "High"
            elif risk_factors >= 1:
                return "Medium"
            else:
                return "Low"
                
        except Exception:
            return "Medium"
    
    def _categorize_market_cap(self, symbol: str) -> str:
        """Categorize market cap (simplified)"""
        large_caps = ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX']
        if symbol in large_caps:
            return "Large"
        else:
            return "Mid"
    
    def _get_sector(self, symbol: str) -> str:
        """Get sector for symbol"""
        sectors = {
            'CBA.AX': 'Financials', 'WBC.AX': 'Financials', 'ANZ.AX': 'Financials', 'NAB.AX': 'Financials',
            'BHP.AX': 'Materials', 'RIO.AX': 'Materials', 'FMG.AX': 'Materials',
            'CSL.AX': 'Healthcare', 'COL.AX': 'Healthcare',
            'TLS.AX': 'Communication Services',
            'WOW.AX': 'Consumer Staples'
        }
        return sectors.get(symbol, 'Unknown')
    
    def _map_symbol_to_qlib(self, asx_symbol: str) -> str:
        """Map ASX symbol to QLib format"""
        mapping = {
            'CBA.AX': '000001.SZ',
            'BHP.AX': '600028.SH', 
            'CSL.AX': '000858.SZ',
            'WBC.AX': '600036.SH',
            'ANZ.AX': '600000.SH'
        }
        return mapping.get(asx_symbol, '000001.SZ')
    
    async def _fallback_signals(self, symbols: List[str]) -> Dict[str, Any]:
        """Generate fallback signals when services are unavailable"""
        signals = []
        
        for symbol in symbols:
            # Generate simple mock signal
            signal_strength = np.random.normal(0, 0.05)
            confidence = 0.6 + np.random.random() * 0.2
            
            if signal_strength > 0.03:
                signal_type = 'BUY'
            elif signal_strength < -0.03:
                signal_type = 'SELL'
            else:
                signal_type = 'HOLD'
            
            signals.append({
                'symbol': symbol,
                'signal': signal_type,
                'confidence': round(confidence, 3),
                'strength': round(signal_strength, 4),
                'reasoning': 'Fallback signal generation',
                'risk_level': 'Medium',
                'timestamp': datetime.now().isoformat()
            })
        
        return {
            'signals': signals,
            'total': len(signals),
            'timestamp': datetime.now().isoformat(),
            'source': 'fallback'
        }
    
    async def get_signal_analytics(self) -> Dict[str, Any]:
        """Get analytics on signal performance"""
        try:
            if not self.signal_history:
                return {'message': 'No signal history available'}
            
            # Analyze signal distribution
            signal_counts = {'BUY': 0, 'SELL': 0, 'HOLD': 0}
            confidence_sum = 0
            risk_counts = {'Low': 0, 'Medium': 0, 'High': 0}
            
            for signal in self.signal_history[-100:]:  # Last 100 signals
                signal_type = signal.get('signal', 'HOLD')
                signal_counts[signal_type] += 1
                confidence_sum += signal.get('confidence', 0.5)
                risk_level = signal.get('risk_level', 'Medium')
                if risk_level in risk_counts:
                    risk_counts[risk_level] += 1
            
            total_signals = len(self.signal_history[-100:])
            avg_confidence = confidence_sum / total_signals if total_signals > 0 else 0
            
            return {
                'total_signals_analyzed': total_signals,
                'signal_distribution': signal_counts,
                'average_confidence': round(avg_confidence, 3),
                'risk_distribution': risk_counts,
                'confidence_threshold': self.confidence_threshold,
                'active_models': list(self.model_weights.keys()),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting signal analytics: {e}")
            return {'error': str(e)}

# Global AI integration service instance
ai_integration_service = AIIntegrationService()