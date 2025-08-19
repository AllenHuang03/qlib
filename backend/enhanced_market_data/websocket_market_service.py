"""
WebSocket Market Data Service
Real-time market data streaming with sub-100ms latency
Professional-grade WebSocket implementation for live trading
"""

import asyncio
import json
import logging
import time
from typing import Dict, Set, List, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import uuid
from dataclasses import asdict
from .live_market_engine import live_market_engine, MarketDataPoint, TechnicalIndicator, TradingSignal

logger = logging.getLogger(__name__)

class WebSocketConnection:
    """Represents a WebSocket connection with metadata"""
    
    def __init__(self, websocket: WebSocket, connection_id: str):
        self.websocket = websocket
        self.connection_id = connection_id
        self.subscriptions: Set[str] = set()
        self.connected_at = datetime.now()
        self.last_ping = time.time()
        self.user_id: Optional[str] = None
        self.permissions: Set[str] = set()
        
class WebSocketMarketService:
    """Professional WebSocket service for real-time market data"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocketConnection] = {}
        self.symbol_subscribers: Dict[str, Set[str]] = {}  # symbol -> connection_ids
        self.message_queue = asyncio.Queue()
        self.running = False
        
        # Performance monitoring
        self.messages_sent = 0
        self.total_connections = 0
        self.active_subscriptions = 0
        
        # Rate limiting
        self.rate_limits: Dict[str, List[float]] = {}  # connection_id -> timestamps
        self.max_messages_per_second = 100
        
    async def start(self):
        """Start the WebSocket service"""
        logger.info("Starting WebSocket Market Service...")
        self.running = True
        
        # Start the market data engine
        await live_market_engine.start()
        
        # Start background tasks
        asyncio.create_task(self._message_broadcaster())
        asyncio.create_task(self._ping_checker())
        asyncio.create_task(self._cleanup_task())
        
        logger.info("WebSocket Market Service started successfully")
        
    async def stop(self):
        """Stop the WebSocket service"""
        logger.info("Stopping WebSocket Market Service...")
        self.running = False
        
        # Close all connections
        for connection in list(self.connections.values()):
            await self._disconnect_client(connection.connection_id)
            
        # Stop the market data engine
        await live_market_engine.stop()
        
        logger.info("WebSocket Market Service stopped")
        
    async def connect_client(self, websocket: WebSocket, user_id: Optional[str] = None) -> str:
        """Connect a new WebSocket client"""
        connection_id = str(uuid.uuid4())
        
        await websocket.accept()
        
        connection = WebSocketConnection(websocket, connection_id)
        connection.user_id = user_id
        connection.permissions = self._get_user_permissions(user_id)
        
        self.connections[connection_id] = connection
        self.total_connections += 1
        
        # Send initial connection message
        await self._send_to_connection(connection_id, {
            'type': 'connection_established',
            'connection_id': connection_id,
            'timestamp': datetime.now().isoformat(),
            'server_time': time.time(),
            'available_symbols': self._get_available_symbols(),
            'market_status': self._get_market_overview()
        })
        
        logger.info(f"WebSocket client connected: {connection_id} (user: {user_id})")
        return connection_id
        
    async def disconnect_client(self, connection_id: str):
        """Disconnect a WebSocket client"""
        await self._disconnect_client(connection_id)
        
    async def _disconnect_client(self, connection_id: str):
        """Internal method to disconnect a client"""
        if connection_id not in self.connections:
            return
            
        connection = self.connections[connection_id]
        
        # Unsubscribe from all symbols
        for symbol in list(connection.subscriptions):
            await self._unsubscribe_from_symbol(connection_id, symbol)
            
        # Close WebSocket
        try:
            await connection.websocket.close()
        except Exception as e:
            logger.error(f"Error closing WebSocket for {connection_id}: {e}")
            
        # Remove from connections
        del self.connections[connection_id]
        
        # Clean up rate limiting
        if connection_id in self.rate_limits:
            del self.rate_limits[connection_id]
            
        logger.info(f"WebSocket client disconnected: {connection_id}")
        
    async def handle_message(self, connection_id: str, message: dict):
        """Handle incoming WebSocket message"""
        if not self._check_rate_limit(connection_id):
            await self._send_error(connection_id, "Rate limit exceeded")
            return
            
        message_type = message.get('type')
        
        try:
            if message_type == 'subscribe':
                await self._handle_subscribe(connection_id, message)
            elif message_type == 'unsubscribe':
                await self._handle_unsubscribe(connection_id, message)
            elif message_type == 'get_historical':
                await self._handle_get_historical(connection_id, message)
            elif message_type == 'get_indicators':
                await self._handle_get_indicators(connection_id, message)
            elif message_type == 'get_signals':
                await self._handle_get_signals(connection_id, message)
            elif message_type == 'ping':
                await self._handle_ping(connection_id, message)
            else:
                await self._send_error(connection_id, f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message from {connection_id}: {e}")
            await self._send_error(connection_id, "Internal server error")
            
    async def _handle_subscribe(self, connection_id: str, message: dict):
        """Handle symbol subscription request"""
        symbols = message.get('symbols', [])
        if isinstance(symbols, str):
            symbols = [symbols]
            
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        for symbol in symbols:
            if not self._has_permission(connection, 'market_data', symbol):
                await self._send_error(connection_id, f"No permission for symbol: {symbol}")
                continue
                
            await self._subscribe_to_symbol(connection_id, symbol)
            
        await self._send_to_connection(connection_id, {
            'type': 'subscription_confirmed',
            'symbols': symbols,
            'timestamp': datetime.now().isoformat()
        })
        
    async def _handle_unsubscribe(self, connection_id: str, message: dict):
        """Handle symbol unsubscription request"""
        symbols = message.get('symbols', [])
        if isinstance(symbols, str):
            symbols = [symbols]
            
        for symbol in symbols:
            await self._unsubscribe_from_symbol(connection_id, symbol)
            
        await self._send_to_connection(connection_id, {
            'type': 'unsubscription_confirmed',
            'symbols': symbols,
            'timestamp': datetime.now().isoformat()
        })
        
    async def _handle_get_historical(self, connection_id: str, message: dict):
        """Handle historical data request"""
        symbol = message.get('symbol')
        days = message.get('days', 30)
        
        if not symbol:
            await self._send_error(connection_id, "Symbol required")
            return
            
        connection = self.connections.get(connection_id)
        if not connection or not self._has_permission(connection, 'historical_data', symbol):
            await self._send_error(connection_id, "No permission for historical data")
            return
            
        try:
            historical_data = await live_market_engine.get_historical_data(symbol, days)
            
            await self._send_to_connection(connection_id, {
                'type': 'historical_data',
                'symbol': symbol,
                'days': days,
                'data': [asdict(point) for point in historical_data],
                'count': len(historical_data),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {e}")
            await self._send_error(connection_id, "Failed to get historical data")
            
    async def _handle_get_indicators(self, connection_id: str, message: dict):
        """Handle technical indicators request"""
        symbol = message.get('symbol')
        
        if not symbol:
            await self._send_error(connection_id, "Symbol required")
            return
            
        connection = self.connections.get(connection_id)
        if not connection or not self._has_permission(connection, 'indicators', symbol):
            await self._send_error(connection_id, "No permission for indicators")
            return
            
        indicators = live_market_engine.get_current_indicators(symbol)
        
        await self._send_to_connection(connection_id, {
            'type': 'indicators',
            'symbol': symbol,
            'indicators': {k: asdict(v) for k, v in indicators.items()},
            'timestamp': datetime.now().isoformat()
        })
        
    async def _handle_get_signals(self, connection_id: str, message: dict):
        """Handle trading signals request"""
        symbol = message.get('symbol')
        
        if not symbol:
            await self._send_error(connection_id, "Symbol required")
            return
            
        connection = self.connections.get(connection_id)
        if not connection or not self._has_permission(connection, 'signals', symbol):
            await self._send_error(connection_id, "No permission for signals")
            return
            
        signals = live_market_engine.get_current_signals(symbol)
        
        await self._send_to_connection(connection_id, {
            'type': 'signals',
            'symbol': symbol,
            'signals': [asdict(signal) for signal in signals],
            'timestamp': datetime.now().isoformat()
        })
        
    async def _handle_ping(self, connection_id: str, message: dict):
        """Handle ping request"""
        connection = self.connections.get(connection_id)
        if connection:
            connection.last_ping = time.time()
            
        await self._send_to_connection(connection_id, {
            'type': 'pong',
            'timestamp': datetime.now().isoformat(),
            'server_time': time.time()
        })
        
    async def _subscribe_to_symbol(self, connection_id: str, symbol: str):
        """Subscribe a connection to a symbol"""
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        # Add to connection subscriptions
        connection.subscriptions.add(symbol)
        
        # Add to symbol subscribers
        if symbol not in self.symbol_subscribers:
            self.symbol_subscribers[symbol] = set()
            # Start collecting data for this symbol
            live_market_engine.subscribe_to_symbol(symbol, 
                lambda data_point: asyncio.create_task(self._broadcast_market_data(symbol, data_point)))
                
        self.symbol_subscribers[symbol].add(connection_id)
        self.active_subscriptions += 1
        
        logger.info(f"Connection {connection_id} subscribed to {symbol}")
        
    async def _unsubscribe_from_symbol(self, connection_id: str, symbol: str):
        """Unsubscribe a connection from a symbol"""
        connection = self.connections.get(connection_id)
        if connection:
            connection.subscriptions.discard(symbol)
            
        if symbol in self.symbol_subscribers:
            self.symbol_subscribers[symbol].discard(connection_id)
            
            # If no more subscribers, stop collecting data
            if not self.symbol_subscribers[symbol]:
                live_market_engine.unsubscribe_from_symbol(symbol, None)
                del self.symbol_subscribers[symbol]
                
        self.active_subscriptions = max(0, self.active_subscriptions - 1)
        
        logger.info(f"Connection {connection_id} unsubscribed from {symbol}")
        
    async def _broadcast_market_data(self, symbol: str, data_point: MarketDataPoint):
        """Broadcast market data to all subscribers"""
        if symbol not in self.symbol_subscribers:
            return
            
        message = {
            'type': 'market_data',
            'symbol': symbol,
            'data': asdict(data_point),
            'timestamp': datetime.now().isoformat()
        }
        
        # Broadcast to all subscribers of this symbol
        subscribers = list(self.symbol_subscribers[symbol])
        for connection_id in subscribers:
            await self._send_to_connection(connection_id, message)
            
    async def _send_to_connection(self, connection_id: str, message: dict):
        """Send message to a specific connection"""
        connection = self.connections.get(connection_id)
        if not connection:
            return
            
        try:
            await connection.websocket.send_text(json.dumps(message, default=str))
            self.messages_sent += 1
        except WebSocketDisconnect:
            await self._disconnect_client(connection_id)
        except Exception as e:
            logger.error(f"Error sending message to {connection_id}: {e}")
            await self._disconnect_client(connection_id)
            
    async def _send_error(self, connection_id: str, error: str):
        """Send error message to a connection"""
        await self._send_to_connection(connection_id, {
            'type': 'error',
            'error': error,
            'timestamp': datetime.now().isoformat()
        })
        
    async def _message_broadcaster(self):
        """Background task to handle message broadcasting"""
        while self.running:
            try:
                # Process any queued messages
                while not self.message_queue.empty():
                    message_data = await self.message_queue.get()
                    # Process message...
                    
                await asyncio.sleep(0.001)  # Very short sleep for high performance
            except Exception as e:
                logger.error(f"Error in message broadcaster: {e}")
                await asyncio.sleep(1)
                
    async def _ping_checker(self):
        """Background task to check connection health"""
        while self.running:
            try:
                current_time = time.time()
                stale_connections = []
                
                for connection_id, connection in self.connections.items():
                    # Check if connection hasn't pinged in 30 seconds
                    if current_time - connection.last_ping > 30:
                        stale_connections.append(connection_id)
                        
                # Disconnect stale connections
                for connection_id in stale_connections:
                    logger.warning(f"Disconnecting stale connection: {connection_id}")
                    await self._disconnect_client(connection_id)
                    
                await asyncio.sleep(10)  # Check every 10 seconds
            except Exception as e:
                logger.error(f"Error in ping checker: {e}")
                await asyncio.sleep(30)
                
    async def _cleanup_task(self):
        """Background cleanup task"""
        while self.running:
            try:
                # Clean up rate limiting data
                current_time = time.time()
                for connection_id in list(self.rate_limits.keys()):
                    # Remove timestamps older than 1 second
                    self.rate_limits[connection_id] = [
                        ts for ts in self.rate_limits[connection_id]
                        if current_time - ts < 1.0
                    ]
                    
                    if not self.rate_limits[connection_id]:
                        del self.rate_limits[connection_id]
                        
                await asyncio.sleep(30)  # Cleanup every 30 seconds
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
                await asyncio.sleep(60)
                
    def _check_rate_limit(self, connection_id: str) -> bool:
        """Check if connection is within rate limits"""
        current_time = time.time()
        
        if connection_id not in self.rate_limits:
            self.rate_limits[connection_id] = []
            
        # Remove old timestamps
        self.rate_limits[connection_id] = [
            ts for ts in self.rate_limits[connection_id]
            if current_time - ts < 1.0
        ]
        
        # Check if under limit
        if len(self.rate_limits[connection_id]) >= self.max_messages_per_second:
            return False
            
        # Add current timestamp
        self.rate_limits[connection_id].append(current_time)
        return True
        
    def _get_user_permissions(self, user_id: Optional[str]) -> Set[str]:
        """Get user permissions (would integrate with auth system)"""
        # For now, all users get basic permissions
        return {'market_data', 'historical_data', 'indicators', 'signals'}
        
    def _has_permission(self, connection: WebSocketConnection, permission: str, symbol: str = None) -> bool:
        """Check if connection has permission for an operation"""
        return permission in connection.permissions
        
    def _get_available_symbols(self) -> List[str]:
        """Get list of available symbols"""
        return live_market_engine.asx_symbols + live_market_engine.crypto_symbols
        
    def _get_market_overview(self) -> dict:
        """Get market overview data"""
        return {
            'asx_status': live_market_engine.get_market_status('CBA.AX').value,
            'crypto_status': live_market_engine.get_market_status('BTC.AX').value,
            'active_symbols': len(self.symbol_subscribers),
            'total_connections': len(self.connections)
        }
        
    def get_service_stats(self) -> dict:
        """Get service statistics"""
        return {
            'total_connections': self.total_connections,
            'active_connections': len(self.connections),
            'active_subscriptions': self.active_subscriptions,
            'messages_sent': self.messages_sent,
            'subscribed_symbols': len(self.symbol_subscribers),
            'uptime': (datetime.now() - getattr(self, 'start_time', datetime.now())).total_seconds()
        }

# Global service instance
websocket_market_service = WebSocketMarketService()