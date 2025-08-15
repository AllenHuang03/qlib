"""
WebSocket Manager for Real-time Updates
Handles model training progress, market data updates, and system notifications
"""
import asyncio
import json
import logging
from typing import Dict, Set, List
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import threading
import time

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        # Store active connections by type
        self.connections: Dict[str, Set[WebSocket]] = {
            'training': set(),      # Model training updates
            'market': set(),        # Market data updates  
            'system': set(),        # System notifications
            'general': set()        # General updates
        }
        self.model_progress: Dict[str, Dict] = {}  # Track model training progress
        self.is_running = True
        
        # Start background tasks
        self._start_background_tasks()
    
    def _start_background_tasks(self):
        """Start background threads for periodic updates"""
        # Market data updates every 30 seconds
        market_thread = threading.Thread(target=self._market_data_updater, daemon=True)
        market_thread.start()
        
        # Training progress updates every 5 seconds
        training_thread = threading.Thread(target=self._training_progress_updater, daemon=True)
        training_thread.start()
    
    async def connect(self, websocket: WebSocket, connection_type: str = 'general'):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.connections[connection_type].add(websocket)
        
        # Send initial data
        await self._send_initial_data(websocket, connection_type)
        
        logger.info(f"WebSocket connected: {connection_type}, total: {len(self.connections[connection_type])}")
    
    async def disconnect(self, websocket: WebSocket, connection_type: str = 'general'):
        """Remove a WebSocket connection"""
        self.connections[connection_type].discard(websocket)
        logger.info(f"WebSocket disconnected: {connection_type}, remaining: {len(self.connections[connection_type])}")
    
    async def _send_initial_data(self, websocket: WebSocket, connection_type: str):
        """Send initial data to newly connected client"""
        if connection_type == 'training':
            # Send current training progress
            for model_id, progress in self.model_progress.items():
                await self._send_to_websocket(websocket, {
                    'type': 'training_progress',
                    'model_id': model_id,
                    'progress': progress['progress'],
                    'status': progress['status'],
                    'metrics': progress.get('metrics', {}),
                    'timestamp': datetime.now().isoformat()
                })
        
        elif connection_type == 'market':
            # Send initial market status
            await self._send_to_websocket(websocket, {
                'type': 'market_status',
                'status': 'connected',
                'last_update': datetime.now().isoformat(),
                'active_symbols': ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX']
            })
    
    async def _send_to_websocket(self, websocket: WebSocket, data: dict):
        """Send data to a specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.error(f"Error sending to websocket: {e}")
    
    async def broadcast(self, connection_type: str, data: dict):
        """Broadcast data to all connections of a specific type"""
        if connection_type not in self.connections:
            return
        
        disconnected = set()
        for websocket in self.connections[connection_type].copy():
            try:
                await websocket.send_text(json.dumps(data))
            except WebSocketDisconnect:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Error broadcasting to websocket: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        self.connections[connection_type] -= disconnected
    
    def start_model_training(self, model_id: str, model_name: str):
        """Start tracking a model's training progress"""
        self.model_progress[model_id] = {
            'model_name': model_name,
            'status': 'training',
            'progress': 0,
            'start_time': datetime.now().isoformat(),
            'metrics': {
                'loss': 0.0,
                'accuracy': 0.0,
                'epoch': 0,
                'total_epochs': 100
            }
        }
        
        # Start training simulation in background
        training_thread = threading.Thread(
            target=self._simulate_training, 
            args=(model_id,), 
            daemon=True
        )
        training_thread.start()
    
    def _simulate_training(self, model_id: str):
        """Simulate model training progress"""
        if model_id not in self.model_progress:
            return
            
        progress_data = self.model_progress[model_id]
        total_epochs = progress_data['metrics']['total_epochs']
        
        for epoch in range(1, total_epochs + 1):
            if not self.is_running or model_id not in self.model_progress:
                break
                
            # Simulate training metrics
            loss = max(0.1, 2.0 - (epoch * 1.8 / total_epochs) + (0.1 * (epoch % 5) / 5))
            accuracy = min(95.0, (epoch * 85.0 / total_epochs) + (5.0 * (epoch % 3) / 3))
            progress = int((epoch / total_epochs) * 100)
            
            # Update progress
            progress_data.update({
                'progress': progress,
                'metrics': {
                    'loss': round(loss, 4),
                    'accuracy': round(accuracy, 2),
                    'epoch': epoch,
                    'total_epochs': total_epochs,
                    'learning_rate': 0.001 * (0.95 ** (epoch // 10))
                }
            })
            
            # Broadcast update
            asyncio.create_task(self.broadcast('training', {
                'type': 'training_progress',
                'model_id': model_id,
                'model_name': progress_data['model_name'],
                'progress': progress,
                'status': 'training',
                'metrics': progress_data['metrics'],
                'timestamp': datetime.now().isoformat()
            }))
            
            # Sleep between epochs (faster for demo)
            time.sleep(0.5)  # 30 seconds of training = 15 seconds real time
        
        # Mark as completed
        if model_id in self.model_progress:
            progress_data['status'] = 'completed'
            progress_data['progress'] = 100
            progress_data['end_time'] = datetime.now().isoformat()
            
            asyncio.create_task(self.broadcast('training', {
                'type': 'training_complete',
                'model_id': model_id,
                'model_name': progress_data['model_name'],
                'progress': 100,
                'status': 'completed',
                'metrics': progress_data['metrics'],
                'duration': 'Training completed successfully',
                'timestamp': datetime.now().isoformat()
            }))
    
    def _market_data_updater(self):
        """Background task to send periodic market data updates"""
        while self.is_running:
            try:
                # Simulate market data update
                market_data = {
                    'type': 'market_update',
                    'symbols': [
                        {
                            'symbol': 'CBA.AX',
                            'price': round(110.50 + (time.time() % 100 - 50) * 0.1, 2),
                            'change': round((time.time() % 10 - 5) * 0.2, 2),
                            'volume': int(1250000 + (time.time() % 1000000))
                        },
                        {
                            'symbol': 'BHP.AX', 
                            'price': round(45.20 + (time.time() % 80 - 40) * 0.05, 2),
                            'change': round((time.time() % 8 - 4) * 0.3, 2),
                            'volume': int(2100000 + (time.time() % 500000))
                        }
                    ],
                    'timestamp': datetime.now().isoformat()
                }
                
                # Log market data instead of broadcasting from thread
                if self.connections.get('market'):
                    logger.info(f"Market data ready for {len(self.connections['market'])} connections")
                time.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Market data update error: {e}")
                time.sleep(60)
    
    def _training_progress_updater(self):
        """Background task to check training progress"""
        while self.is_running:
            try:
                # Send periodic training status updates
                active_trainings = {k: v for k, v in self.model_progress.items() 
                                  if v['status'] == 'training'}
                
                if active_trainings:
                    # Log training status instead of broadcasting from thread
                    logger.info(f"Training status: {len(active_trainings)} models currently training")
                
                time.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Training progress update error: {e}")
                time.sleep(10)
    
    def stop_model_training(self, model_id: str):
        """Stop tracking a model's training"""
        if model_id in self.model_progress:
            self.model_progress[model_id]['status'] = 'stopped'
            logger.info(f'Training stopped for model {model_id}')
    
    def pause_model_training(self, model_id: str):
        """Pause a model's training"""
        if model_id in self.model_progress:
            self.model_progress[model_id]['status'] = 'paused'
            asyncio.create_task(self.broadcast('training', {
                'type': 'training_paused',
                'model_id': model_id,
                'status': 'paused',
                'timestamp': datetime.now().isoformat()
            }))
    
    def resume_model_training(self, model_id: str):
        """Resume a model's training"""
        if model_id in self.model_progress:
            self.model_progress[model_id]['status'] = 'training'
            asyncio.create_task(self.broadcast('training', {
                'type': 'training_resumed',
                'model_id': model_id,
                'status': 'training',
                'timestamp': datetime.now().isoformat()
            }))
    
    def shutdown(self):
        """Shutdown the WebSocket manager"""
        self.is_running = False
        logger.info("WebSocket manager shutting down")

# Global WebSocket manager instance
websocket_manager = WebSocketManager()