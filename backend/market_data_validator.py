"""
Real-Time Market Data Validation Framework
Comprehensive validation system for live market data feeds, WebSocket connections,
candlestick data integrity, and trading signal accuracy validation.
"""

import asyncio
import websockets
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import time
import statistics
from collections import defaultdict, deque
import hashlib

logger = logging.getLogger(__name__)

class DataSource(Enum):
    """Market data sources"""
    ASX = "asx"
    ALPHA_VANTAGE = "alpha_vantage"
    YAHOO_FINANCE = "yahoo_finance"
    OPENBB = "openbb"
    WEBSOCKET = "websocket"
    INTERNAL = "internal"

class ValidationSeverity(Enum):
    """Data validation issue severity"""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

class DataQualityMetric(Enum):
    """Data quality metrics"""
    COMPLETENESS = "completeness"
    ACCURACY = "accuracy"
    CONSISTENCY = "consistency"
    TIMELINESS = "timeliness"
    VALIDITY = "validity"

@dataclass
class MarketDataValidationIssue:
    """Individual market data validation issue"""
    severity: ValidationSeverity
    metric: DataQualityMetric
    symbol: str
    field: str
    message: str
    timestamp: datetime
    raw_value: Any = None
    expected_range: Optional[Tuple[float, float]] = None
    source: Optional[DataSource] = None
    suggested_fix: Optional[str] = None

@dataclass
class CandlestickData:
    """OHLCV candlestick data structure"""
    symbol: str
    timestamp: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: int
    source: DataSource
    data_hash: str = None
    
    def __post_init__(self):
        """Generate data hash for integrity checking"""
        if not self.data_hash:
            data_str = f"{self.symbol}_{self.timestamp}_{self.open_price}_{self.high_price}_{self.low_price}_{self.close_price}_{self.volume}"
            self.data_hash = hashlib.sha256(data_str.encode()).hexdigest()[:16]

@dataclass
class TradingSignal:
    """Trading signal structure for validation"""
    signal_id: str
    symbol: str
    signal_type: str  # BUY, SELL, HOLD
    confidence: float
    target_price: float
    current_price: float
    reasoning: List[str]
    model_id: str
    timestamp: datetime
    expires_at: Optional[datetime] = None
    source: DataSource = DataSource.INTERNAL

@dataclass
class WebSocketConnectionHealth:
    """WebSocket connection health metrics"""
    connection_id: str
    url: str
    is_connected: bool
    last_message_time: datetime
    total_messages: int
    error_count: int
    reconnection_count: int
    average_latency_ms: float
    data_quality_score: float
    uptime_percent: float

@dataclass
class MarketDataQualityReport:
    """Comprehensive market data quality report"""
    report_id: str
    symbol: str
    time_period: Tuple[datetime, datetime]
    total_data_points: int
    valid_data_points: int
    issues: List[MarketDataValidationIssue]
    quality_scores: Dict[DataQualityMetric, float]
    data_sources: List[DataSource]
    completeness_percent: float
    accuracy_score: float
    consistency_score: float
    timeliness_score: float
    overall_quality_score: float
    recommendations: List[str]
    generated_at: datetime

class WebSocketDataValidator:
    """WebSocket connection and data validation"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocketConnectionHealth] = {}
        self.message_buffers: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.validation_callbacks: List[Callable] = []
        
    async def validate_websocket_connection(
        self, 
        connection_id: str, 
        url: str,
        expected_message_frequency: int = 1  # Expected messages per second
    ) -> WebSocketConnectionHealth:
        """Validate WebSocket connection health and data flow"""
        
        try:
            # Check if connection exists and is healthy
            if connection_id in self.active_connections:
                health = self.active_connections[connection_id]
                
                # Update health metrics
                time_since_last_message = (datetime.now() - health.last_message_time).total_seconds()
                expected_interval = 1.0 / expected_message_frequency
                
                # Check if connection is stale
                if time_since_last_message > expected_interval * 5:  # 5x tolerance
                    health.is_connected = False
                    logger.warning(f"WebSocket connection {connection_id} appears stale: {time_since_last_message:.1f}s since last message")
                
                # Calculate uptime
                health.uptime_percent = self._calculate_uptime(connection_id)
                
                # Calculate data quality score
                health.data_quality_score = self._calculate_ws_data_quality(connection_id)
                
                return health
            else:
                # Create new connection health record
                health = WebSocketConnectionHealth(
                    connection_id=connection_id,
                    url=url,
                    is_connected=False,
                    last_message_time=datetime.now(),
                    total_messages=0,
                    error_count=0,
                    reconnection_count=0,
                    average_latency_ms=0.0,
                    data_quality_score=0.0,
                    uptime_percent=0.0
                )
                
                self.active_connections[connection_id] = health
                return health
                
        except Exception as e:
            logger.error(f"WebSocket validation error for {connection_id}: {e}")
            raise
    
    async def validate_websocket_message(
        self, 
        connection_id: str, 
        message: Dict[str, Any],
        message_timestamp: Optional[datetime] = None
    ) -> List[MarketDataValidationIssue]:
        """Validate individual WebSocket message content"""
        issues = []
        timestamp = message_timestamp or datetime.now()
        
        try:
            # Update connection health
            if connection_id in self.active_connections:
                health = self.active_connections[connection_id]
                health.total_messages += 1
                health.last_message_time = timestamp
                health.is_connected = True
            
            # Validate message structure
            required_fields = ['symbol', 'price', 'timestamp']
            for field in required_fields:
                if field not in message:
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        metric=DataQualityMetric.COMPLETENESS,
                        symbol=message.get('symbol', 'UNKNOWN'),
                        field=field,
                        message=f"Missing required field: {field}",
                        timestamp=timestamp,
                        source=DataSource.WEBSOCKET,
                        suggested_fix=f"Ensure {field} is included in WebSocket messages"
                    ))
            
            # Validate price data
            if 'price' in message:
                price = message['price']
                if not isinstance(price, (int, float)):
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        metric=DataQualityMetric.VALIDITY,
                        symbol=message.get('symbol', 'UNKNOWN'),
                        field='price',
                        message=f"Price must be numeric, got {type(price).__name__}",
                        timestamp=timestamp,
                        raw_value=price,
                        source=DataSource.WEBSOCKET
                    ))
                elif price <= 0:
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        metric=DataQualityMetric.VALIDITY,
                        symbol=message.get('symbol', 'UNKNOWN'),
                        field='price',
                        message=f"Price must be positive, got {price}",
                        timestamp=timestamp,
                        raw_value=price,
                        source=DataSource.WEBSOCKET
                    ))
                elif price > 100000:  # Sanity check for extremely high prices
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        metric=DataQualityMetric.VALIDITY,
                        symbol=message.get('symbol', 'UNKNOWN'),
                        field='price',
                        message=f"Unusually high price: {price}",
                        timestamp=timestamp,
                        raw_value=price,
                        source=DataSource.WEBSOCKET,
                        suggested_fix="Verify price accuracy"
                    ))
            
            # Validate timestamp
            if 'timestamp' in message:
                msg_timestamp = message['timestamp']
                try:
                    if isinstance(msg_timestamp, str):
                        parsed_timestamp = pd.to_datetime(msg_timestamp)
                    else:
                        parsed_timestamp = pd.to_datetime(msg_timestamp, unit='s')
                    
                    # Check if timestamp is reasonable (not too old or in future)
                    time_diff = abs((timestamp - parsed_timestamp).total_seconds())
                    if time_diff > 300:  # 5 minutes tolerance
                        issues.append(MarketDataValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            metric=DataQualityMetric.TIMELINESS,
                            symbol=message.get('symbol', 'UNKNOWN'),
                            field='timestamp',
                            message=f"Timestamp difference too large: {time_diff:.1f} seconds",
                            timestamp=timestamp,
                            raw_value=msg_timestamp,
                            source=DataSource.WEBSOCKET
                        ))
                        
                except Exception as e:
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        metric=DataQualityMetric.VALIDITY,
                        symbol=message.get('symbol', 'UNKNOWN'),
                        field='timestamp',
                        message=f"Invalid timestamp format: {str(e)}",
                        timestamp=timestamp,
                        raw_value=msg_timestamp,
                        source=DataSource.WEBSOCKET
                    ))
            
            # Store message in buffer for pattern analysis
            self.message_buffers[connection_id].append({
                'message': message,
                'timestamp': timestamp,
                'issues': len(issues)
            })
            
        except Exception as e:
            logger.error(f"Message validation error: {e}")
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                metric=DataQualityMetric.VALIDITY,
                symbol=message.get('symbol', 'UNKNOWN'),
                field='system',
                message=f"Message validation system error: {str(e)}",
                timestamp=timestamp,
                source=DataSource.WEBSOCKET
            ))
        
        return issues
    
    def _calculate_uptime(self, connection_id: str) -> float:
        """Calculate connection uptime percentage"""
        if connection_id not in self.message_buffers:
            return 0.0
            
        messages = list(self.message_buffers[connection_id])
        if len(messages) < 2:
            return 0.0
        
        # Calculate expected vs actual message frequency
        time_span = (messages[-1]['timestamp'] - messages[0]['timestamp']).total_seconds()
        expected_messages = max(1, time_span)  # Expect at least 1 message per second
        actual_messages = len(messages)
        
        return min(100.0, (actual_messages / expected_messages) * 100.0)
    
    def _calculate_ws_data_quality(self, connection_id: str) -> float:
        """Calculate WebSocket data quality score"""
        if connection_id not in self.message_buffers:
            return 0.0
            
        messages = list(self.message_buffers[connection_id])
        if not messages:
            return 0.0
        
        total_issues = sum(msg['issues'] for msg in messages)
        total_messages = len(messages)
        
        # Quality score based on issue rate
        issue_rate = total_issues / total_messages if total_messages > 0 else 1.0
        quality_score = max(0.0, 100.0 - (issue_rate * 50.0))  # Each issue reduces score
        
        return quality_score

class CandlestickDataValidator:
    """Validator for OHLCV candlestick data integrity"""
    
    def __init__(self):
        self.historical_data: Dict[str, List[CandlestickData]] = defaultdict(list)
        self.validation_rules = {
            'ohlc_consistency': True,
            'volume_validation': True,
            'price_continuity': True,
            'temporal_ordering': True,
            'outlier_detection': True
        }
    
    async def validate_candlestick_data(
        self, 
        candlestick: CandlestickData,
        historical_context: bool = True
    ) -> List[MarketDataValidationIssue]:
        """Validate OHLCV candlestick data integrity"""
        issues = []
        
        try:
            # Basic OHLC consistency validation
            ohlc_issues = self._validate_ohlc_consistency(candlestick)
            issues.extend(ohlc_issues)
            
            # Volume validation
            volume_issues = self._validate_volume(candlestick)
            issues.extend(volume_issues)
            
            # Historical context validation
            if historical_context:
                context_issues = await self._validate_historical_context(candlestick)
                issues.extend(context_issues)
            
            # Store for future validation
            self.historical_data[candlestick.symbol].append(candlestick)
            
            # Keep only recent data (last 1000 candles)
            if len(self.historical_data[candlestick.symbol]) > 1000:
                self.historical_data[candlestick.symbol] = self.historical_data[candlestick.symbol][-1000:]
            
        except Exception as e:
            logger.error(f"Candlestick validation error for {candlestick.symbol}: {e}")
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                metric=DataQualityMetric.VALIDITY,
                symbol=candlestick.symbol,
                field='system',
                message=f"Candlestick validation system error: {str(e)}",
                timestamp=candlestick.timestamp,
                source=candlestick.source
            ))
        
        return issues
    
    def _validate_ohlc_consistency(self, candlestick: CandlestickData) -> List[MarketDataValidationIssue]:
        """Validate OHLC price relationships"""
        issues = []
        
        # High should be >= Open, Close, Low
        if candlestick.high_price < candlestick.open_price:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='high_price',
                message=f"High price ({candlestick.high_price}) is less than open price ({candlestick.open_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.high_price,
                expected_range=(candlestick.open_price, float('inf')),
                source=candlestick.source
            ))
        
        if candlestick.high_price < candlestick.close_price:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='high_price',
                message=f"High price ({candlestick.high_price}) is less than close price ({candlestick.close_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.high_price,
                expected_range=(candlestick.close_price, float('inf')),
                source=candlestick.source
            ))
        
        if candlestick.high_price < candlestick.low_price:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='high_price',
                message=f"High price ({candlestick.high_price}) is less than low price ({candlestick.low_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.high_price,
                expected_range=(candlestick.low_price, float('inf')),
                source=candlestick.source
            ))
        
        # Low should be <= Open, Close, High
        if candlestick.low_price > candlestick.open_price:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='low_price',
                message=f"Low price ({candlestick.low_price}) is greater than open price ({candlestick.open_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.low_price,
                expected_range=(0, candlestick.open_price),
                source=candlestick.source
            ))
        
        if candlestick.low_price > candlestick.close_price:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='low_price',
                message=f"Low price ({candlestick.low_price}) is greater than close price ({candlestick.close_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.low_price,
                expected_range=(0, candlestick.close_price),
                source=candlestick.source
            ))
        
        return issues
    
    def _validate_volume(self, candlestick: CandlestickData) -> List[MarketDataValidationIssue]:
        """Validate volume data"""
        issues = []
        
        # Volume should be non-negative
        if candlestick.volume < 0:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.VALIDITY,
                symbol=candlestick.symbol,
                field='volume',
                message=f"Volume cannot be negative: {candlestick.volume}",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.volume,
                expected_range=(0, float('inf')),
                source=candlestick.source
            ))
        
        # Check for unusually high volume (outlier detection)
        if candlestick.symbol in self.historical_data:
            recent_volumes = [c.volume for c in self.historical_data[candlestick.symbol][-20:]]
            if recent_volumes:
                avg_volume = statistics.mean(recent_volumes)
                if avg_volume > 0 and candlestick.volume > avg_volume * 10:  # 10x average
                    issues.append(MarketDataValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        metric=DataQualityMetric.VALIDITY,
                        symbol=candlestick.symbol,
                        field='volume',
                        message=f"Unusually high volume: {candlestick.volume} (avg: {avg_volume:.0f})",
                        timestamp=candlestick.timestamp,
                        raw_value=candlestick.volume,
                        source=candlestick.source,
                        suggested_fix="Verify volume data accuracy"
                    ))
        
        return issues
    
    async def _validate_historical_context(self, candlestick: CandlestickData) -> List[MarketDataValidationIssue]:
        """Validate candlestick against historical context"""
        issues = []
        
        if candlestick.symbol not in self.historical_data:
            return issues
        
        recent_candles = self.historical_data[candlestick.symbol][-10:]
        if not recent_candles:
            return issues
        
        # Check price continuity
        last_candle = recent_candles[-1]
        price_gap = abs(candlestick.open_price - last_candle.close_price) / last_candle.close_price
        
        if price_gap > 0.20:  # 20% gap
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.WARNING,
                metric=DataQualityMetric.CONSISTENCY,
                symbol=candlestick.symbol,
                field='open_price',
                message=f"Large price gap: {price_gap:.1%} from previous close ({last_candle.close_price} to {candlestick.open_price})",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.open_price,
                source=candlestick.source,
                suggested_fix="Check for stock splits, dividends, or data errors"
            ))
        
        # Check temporal ordering
        if candlestick.timestamp <= last_candle.timestamp:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.TIMELINESS,
                symbol=candlestick.symbol,
                field='timestamp',
                message=f"Timestamp not in chronological order: {candlestick.timestamp} <= {last_candle.timestamp}",
                timestamp=candlestick.timestamp,
                raw_value=candlestick.timestamp,
                source=candlestick.source
            ))
        
        return issues

class TradingSignalValidator:
    """Validator for trading signals accuracy and timing"""
    
    def __init__(self):
        self.signal_history: Dict[str, List[TradingSignal]] = defaultdict(list)
        self.performance_tracking: Dict[str, Dict] = defaultdict(dict)
        
    async def validate_trading_signal(
        self, 
        signal: TradingSignal,
        current_market_data: Optional[Dict[str, float]] = None
    ) -> List[MarketDataValidationIssue]:
        """Validate trading signal for accuracy and consistency"""
        issues = []
        
        try:
            # Basic signal validation
            basic_issues = self._validate_basic_signal_data(signal)
            issues.extend(basic_issues)
            
            # Market data consistency validation
            if current_market_data:
                market_issues = self._validate_against_market_data(signal, current_market_data)
                issues.extend(market_issues)
            
            # Historical performance validation
            performance_issues = await self._validate_signal_performance(signal)
            issues.extend(performance_issues)
            
            # Store signal for tracking
            self.signal_history[signal.symbol].append(signal)
            
            # Limit history size
            if len(self.signal_history[signal.symbol]) > 100:
                self.signal_history[signal.symbol] = self.signal_history[signal.symbol][-100:]
            
        except Exception as e:
            logger.error(f"Signal validation error for {signal.symbol}: {e}")
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                metric=DataQualityMetric.VALIDITY,
                symbol=signal.symbol,
                field='system',
                message=f"Signal validation system error: {str(e)}",
                timestamp=signal.timestamp,
                source=signal.source
            ))
        
        return issues
    
    def _validate_basic_signal_data(self, signal: TradingSignal) -> List[MarketDataValidationIssue]:
        """Validate basic signal data integrity"""
        issues = []
        
        # Validate signal type
        valid_signal_types = ['BUY', 'SELL', 'HOLD']
        if signal.signal_type not in valid_signal_types:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.VALIDITY,
                symbol=signal.symbol,
                field='signal_type',
                message=f"Invalid signal type: {signal.signal_type}. Must be one of {valid_signal_types}",
                timestamp=signal.timestamp,
                raw_value=signal.signal_type,
                source=signal.source
            ))
        
        # Validate confidence score
        if not (0.0 <= signal.confidence <= 1.0):
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.VALIDITY,
                symbol=signal.symbol,
                field='confidence',
                message=f"Confidence must be between 0.0 and 1.0, got {signal.confidence}",
                timestamp=signal.timestamp,
                raw_value=signal.confidence,
                expected_range=(0.0, 1.0),
                source=signal.source
            ))
        
        # Validate prices
        if signal.target_price <= 0:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.VALIDITY,
                symbol=signal.symbol,
                field='target_price',
                message=f"Target price must be positive, got {signal.target_price}",
                timestamp=signal.timestamp,
                raw_value=signal.target_price,
                source=signal.source
            ))
        
        if signal.current_price <= 0:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.ERROR,
                metric=DataQualityMetric.VALIDITY,
                symbol=signal.symbol,
                field='current_price',
                message=f"Current price must be positive, got {signal.current_price}",
                timestamp=signal.timestamp,
                raw_value=signal.current_price,
                source=signal.source
            ))
        
        # Check signal expiry
        if signal.expires_at and signal.expires_at <= signal.timestamp:
            issues.append(MarketDataValidationIssue(
                severity=ValidationSeverity.WARNING,
                metric=DataQualityMetric.TIMELINESS,
                symbol=signal.symbol,
                field='expires_at',
                message=f"Signal already expired at generation time",
                timestamp=signal.timestamp,
                raw_value=signal.expires_at,
                source=signal.source,
                suggested_fix="Check signal generation timing"
            ))
        
        return issues
    
    def _validate_against_market_data(
        self, 
        signal: TradingSignal, 
        market_data: Dict[str, float]
    ) -> List[MarketDataValidationIssue]:
        """Validate signal against current market data"""
        issues = []
        
        if signal.symbol in market_data:
            market_price = market_data[signal.symbol]
            price_difference = abs(signal.current_price - market_price) / market_price
            
            # Check if signal's current price matches market data
            if price_difference > 0.05:  # 5% tolerance
                issues.append(MarketDataValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    metric=DataQualityMetric.ACCURACY,
                    symbol=signal.symbol,
                    field='current_price',
                    message=f"Signal price ({signal.current_price}) differs from market price ({market_price}) by {price_difference:.1%}",
                    timestamp=signal.timestamp,
                    raw_value=signal.current_price,
                    source=signal.source,
                    suggested_fix="Update signal with latest market prices"
                ))
            
            # Validate signal logic
            if signal.signal_type == 'BUY' and signal.target_price < market_price:
                issues.append(MarketDataValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    metric=DataQualityMetric.CONSISTENCY,
                    symbol=signal.symbol,
                    field='target_price',
                    message=f"BUY signal target price ({signal.target_price}) is below current market price ({market_price})",
                    timestamp=signal.timestamp,
                    raw_value=signal.target_price,
                    source=signal.source,
                    suggested_fix="Review signal logic and target price calculation"
                ))
            
            elif signal.signal_type == 'SELL' and signal.target_price > market_price:
                issues.append(MarketDataValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    metric=DataQualityMetric.CONSISTENCY,
                    symbol=signal.symbol,
                    field='target_price',
                    message=f"SELL signal target price ({signal.target_price}) is above current market price ({market_price})",
                    timestamp=signal.timestamp,
                    raw_value=signal.target_price,
                    source=signal.source,
                    suggested_fix="Review signal logic and target price calculation"
                ))
        
        return issues
    
    async def _validate_signal_performance(self, signal: TradingSignal) -> List[MarketDataValidationIssue]:
        """Validate signal against historical performance of the model"""
        issues = []
        
        # Check model consistency
        recent_signals = [s for s in self.signal_history[signal.symbol][-10:] 
                         if s.model_id == signal.model_id]
        
        if len(recent_signals) >= 3:
            # Check for signal flip-flopping
            signal_types = [s.signal_type for s in recent_signals[-3:]]
            if len(set(signal_types)) == 3:  # All different
                issues.append(MarketDataValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    metric=DataQualityMetric.CONSISTENCY,
                    symbol=signal.symbol,
                    field='signal_type',
                    message=f"Model {signal.model_id} showing inconsistent signals: {' -> '.join(signal_types)}",
                    timestamp=signal.timestamp,
                    raw_value=signal.signal_type,
                    source=signal.source,
                    suggested_fix="Review model stability and parameters"
                ))
            
            # Check confidence trend
            confidences = [s.confidence for s in recent_signals]
            if all(c < 0.6 for c in confidences):
                issues.append(MarketDataValidationIssue(
                    severity=ValidationSeverity.INFO,
                    metric=DataQualityMetric.ACCURACY,
                    symbol=signal.symbol,
                    field='confidence',
                    message=f"Model {signal.model_id} showing consistently low confidence (avg: {statistics.mean(confidences):.2f})",
                    timestamp=signal.timestamp,
                    raw_value=signal.confidence,
                    source=signal.source,
                    suggested_fix="Consider model retraining or parameter adjustment"
                ))
        
        return issues

class MarketDataValidationFramework:
    """Main framework coordinating all market data validation"""
    
    def __init__(self):
        self.websocket_validator = WebSocketDataValidator()
        self.candlestick_validator = CandlestickDataValidator()
        self.signal_validator = TradingSignalValidator()
        self.validation_reports: Dict[str, MarketDataQualityReport] = {}
        
    async def validate_market_data_stream(
        self, 
        connection_id: str, 
        data_stream: Any,
        validation_config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Validate continuous market data stream"""
        
        config = validation_config or {}
        results = {
            'connection_health': None,
            'data_quality_issues': [],
            'validation_summary': {},
            'recommendations': []
        }
        
        try:
            # Validate WebSocket connection
            ws_health = await self.websocket_validator.validate_websocket_connection(
                connection_id, 
                config.get('websocket_url', 'unknown')
            )
            results['connection_health'] = asdict(ws_health)
            
            # Process data stream validation would go here
            # This is a framework method that would be called with actual streaming data
            
            results['validation_summary'] = {
                'total_validations': 1,
                'critical_issues': 0,
                'warnings': 0,
                'data_quality_score': ws_health.data_quality_score
            }
            
        except Exception as e:
            logger.error(f"Market data stream validation error: {e}")
            results['validation_summary'] = {
                'error': str(e),
                'data_quality_score': 0.0
            }
        
        return results
    
    async def validate_candlestick_batch(
        self, 
        candlesticks: List[CandlestickData]
    ) -> MarketDataQualityReport:
        """Validate batch of candlestick data"""
        
        all_issues = []
        symbols = set()
        
        for candlestick in candlesticks:
            symbols.add(candlestick.symbol)
            issues = await self.candlestick_validator.validate_candlestick_data(candlestick)
            all_issues.extend(issues)
        
        # Generate quality report
        report = MarketDataQualityReport(
            report_id=str(uuid.uuid4()),
            symbol=', '.join(symbols) if len(symbols) <= 3 else f"{len(symbols)} symbols",
            time_period=(
                min(c.timestamp for c in candlesticks),
                max(c.timestamp for c in candlesticks)
            ),
            total_data_points=len(candlesticks),
            valid_data_points=len(candlesticks) - len([i for i in all_issues if i.severity == ValidationSeverity.CRITICAL]),
            issues=all_issues,
            quality_scores=self._calculate_quality_scores(all_issues, len(candlesticks)),
            data_sources=list(set(c.source for c in candlesticks)),
            completeness_percent=100.0,  # All candlesticks provided
            accuracy_score=self._calculate_accuracy_score(all_issues),
            consistency_score=self._calculate_consistency_score(all_issues),
            timeliness_score=self._calculate_timeliness_score(all_issues),
            overall_quality_score=0.0,  # Calculated below
            recommendations=self._generate_recommendations(all_issues),
            generated_at=datetime.now()
        )
        
        # Calculate overall quality score
        report.overall_quality_score = statistics.mean([
            report.accuracy_score,
            report.consistency_score,
            report.timeliness_score,
            report.completeness_percent
        ])
        
        return report
    
    def _calculate_quality_scores(
        self, 
        issues: List[MarketDataValidationIssue], 
        total_data_points: int
    ) -> Dict[DataQualityMetric, float]:
        """Calculate quality scores by metric"""
        
        scores = {}
        for metric in DataQualityMetric:
            metric_issues = [i for i in issues if i.metric == metric]
            penalty = sum(self._get_issue_penalty(issue.severity) for issue in metric_issues)
            
            # Base score 100, reduce by penalties
            score = max(0.0, 100.0 - (penalty / max(total_data_points, 1)) * 100)
            scores[metric] = score
        
        return scores
    
    def _get_issue_penalty(self, severity: ValidationSeverity) -> float:
        """Get penalty weight for issue severity"""
        penalties = {
            ValidationSeverity.CRITICAL: 10.0,
            ValidationSeverity.ERROR: 5.0,
            ValidationSeverity.WARNING: 2.0,
            ValidationSeverity.INFO: 0.5
        }
        return penalties.get(severity, 1.0)
    
    def _calculate_accuracy_score(self, issues: List[MarketDataValidationIssue]) -> float:
        """Calculate data accuracy score"""
        accuracy_issues = [i for i in issues if i.metric == DataQualityMetric.ACCURACY]
        if not accuracy_issues:
            return 100.0
        
        penalty = sum(self._get_issue_penalty(issue.severity) for issue in accuracy_issues)
        return max(0.0, 100.0 - penalty)
    
    def _calculate_consistency_score(self, issues: List[MarketDataValidationIssue]) -> float:
        """Calculate data consistency score"""
        consistency_issues = [i for i in issues if i.metric == DataQualityMetric.CONSISTENCY]
        if not consistency_issues:
            return 100.0
        
        penalty = sum(self._get_issue_penalty(issue.severity) for issue in consistency_issues)
        return max(0.0, 100.0 - penalty)
    
    def _calculate_timeliness_score(self, issues: List[MarketDataValidationIssue]) -> float:
        """Calculate data timeliness score"""
        timeliness_issues = [i for i in issues if i.metric == DataQualityMetric.TIMELINESS]
        if not timeliness_issues:
            return 100.0
        
        penalty = sum(self._get_issue_penalty(issue.severity) for issue in timeliness_issues)
        return max(0.0, 100.0 - penalty)
    
    def _generate_recommendations(self, issues: List[MarketDataValidationIssue]) -> List[str]:
        """Generate actionable recommendations based on validation issues"""
        recommendations = []
        
        # Group issues by type
        critical_issues = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        consistency_issues = [i for i in issues if i.metric == DataQualityMetric.CONSISTENCY]
        accuracy_issues = [i for i in issues if i.metric == DataQualityMetric.ACCURACY]
        
        if critical_issues:
            recommendations.append(f"Address {len(critical_issues)} critical data issues immediately")
        
        if len(consistency_issues) > 2:
            recommendations.append("Review data source consistency - multiple OHLC validation failures detected")
        
        if len(accuracy_issues) > 1:
            recommendations.append("Verify market data feed accuracy - price discrepancies detected")
        
        if not recommendations:
            recommendations.append("Market data quality is good - no major issues detected")
        
        return recommendations

# Global framework instance
market_data_validation_framework = MarketDataValidationFramework()