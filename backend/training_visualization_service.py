"""
Training Progress Visualization Service
Real-time visualization components and data processing for model training progress
"""

import asyncio
import logging
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import uuid

# Visualization and plotting
try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False

# WebSocket integration
try:
    from websocket_manager import websocket_manager
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False

# Database integration
try:
    from supabase_service import supabase_service
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Model training integration
try:
    from quant_model_trainer import quant_model_trainer
    MODEL_TRAINER_AVAILABLE = True
except ImportError:
    MODEL_TRAINER_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# DATA CLASSES
# ================================

@dataclass
class TrainingVisualization:
    """Training visualization data structure"""
    visualization_id: str
    training_id: str
    model_name: str
    chart_type: str
    data: Dict[str, Any]
    config: Dict[str, Any]
    created_at: str
    updated_at: str

@dataclass
class MetricsChart:
    """Training metrics chart data"""
    chart_id: str
    title: str
    chart_type: str  # line, bar, heatmap, scatter
    x_data: List[Any]
    y_data: List[Any]
    series_data: Dict[str, List[Any]]
    config: Dict[str, Any]
    last_updated: str

@dataclass
class FeatureImportanceChart:
    """Feature importance visualization"""
    chart_id: str
    feature_names: List[str]
    importance_scores: List[float]
    model_type: str
    feature_groups: Dict[str, List[str]]
    chart_config: Dict[str, Any]
    last_updated: str

@dataclass
class PerformanceComparison:
    """Model performance comparison visualization"""
    comparison_id: str
    model_names: List[str]
    metrics: Dict[str, List[float]]
    benchmark_metrics: Optional[Dict[str, float]]
    chart_config: Dict[str, Any]
    last_updated: str

# ================================
# TRAINING VISUALIZATION SERVICE
# ================================

class TrainingVisualizationService:
    """Service for generating and managing training visualizations"""
    
    def __init__(self):
        self.visualizations = {}
        self.charts_cache = {}
        self.active_training_sessions = {}
        
        # Chart configurations
        self.chart_configs = self._load_chart_configurations()
        
        # Storage paths
        self.charts_path = Path(__file__).parent / "training_charts"
        self.charts_path.mkdir(exist_ok=True)
        
        # WebSocket update interval
        self.update_interval = 2  # seconds
        
        # Start background visualization updates
        if WEBSOCKET_AVAILABLE:
            asyncio.create_task(self._start_visualization_updates())
        
        logger.info("Training Visualization Service initialized")
    
    def _load_chart_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Load chart configuration templates"""
        return {
            'training_metrics': {
                'title': 'Training Progress',
                'type': 'line',
                'y_axes': ['loss', 'accuracy'],
                'colors': ['#e74c3c', '#2ecc71'],
                'update_frequency': 'real_time'
            },
            'loss_curves': {
                'title': 'Loss Curves',
                'type': 'line',
                'y_axes': ['train_loss', 'valid_loss'],
                'colors': ['#3498db', '#e67e22'],
                'update_frequency': 'real_time'
            },
            'accuracy_curves': {
                'title': 'Accuracy Progress',
                'type': 'line', 
                'y_axes': ['train_accuracy', 'valid_accuracy'],
                'colors': ['#2ecc71', '#f39c12'],
                'update_frequency': 'real_time'
            },
            'feature_importance': {
                'title': 'Feature Importance',
                'type': 'bar',
                'orientation': 'horizontal',
                'colors': ['#9b59b6'],
                'update_frequency': 'on_completion'
            },
            'learning_rate': {
                'title': 'Learning Rate Schedule',
                'type': 'line',
                'y_axes': ['learning_rate'],
                'colors': ['#34495e'],
                'update_frequency': 'real_time'
            },
            'performance_comparison': {
                'title': 'Model Performance Comparison',
                'type': 'radar',
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score', 'sharpe_ratio'],
                'update_frequency': 'on_completion'
            },
            'prediction_confidence': {
                'title': 'Prediction Confidence Distribution',
                'type': 'histogram',
                'bins': 50,
                'colors': ['#1abc9c'],
                'update_frequency': 'on_completion'
            },
            'correlation_heatmap': {
                'title': 'Feature Correlation Heatmap',
                'type': 'heatmap',
                'colormap': 'RdBu_r',
                'update_frequency': 'on_completion'
            }
        }
    
    async def create_training_visualization(self, 
                                          training_id: str, 
                                          model_name: str,
                                          chart_types: List[str]) -> List[TrainingVisualization]:
        """Create visualization components for a training session"""
        try:
            visualizations = []
            
            for chart_type in chart_types:
                if chart_type not in self.chart_configs:
                    logger.warning(f"Unknown chart type: {chart_type}")
                    continue
                
                visualization_id = str(uuid.uuid4())
                config = self.chart_configs[chart_type].copy()
                
                visualization = TrainingVisualization(
                    visualization_id=visualization_id,
                    training_id=training_id,
                    model_name=model_name,
                    chart_type=chart_type,
                    data={},
                    config=config,
                    created_at=datetime.now().isoformat(),
                    updated_at=datetime.now().isoformat()
                )
                
                visualizations.append(visualization)
                self.visualizations[visualization_id] = visualization
            
            # Track this training session
            self.active_training_sessions[training_id] = {
                'model_name': model_name,
                'visualizations': [v.visualization_id for v in visualizations],
                'created_at': datetime.now().isoformat()
            }
            
            logger.info(f"Created {len(visualizations)} visualizations for training {training_id}")
            return visualizations
            
        except Exception as e:
            logger.error(f"Failed to create training visualizations: {e}")
            return []
    
    async def update_training_metrics_chart(self, 
                                          training_id: str,
                                          epoch: int,
                                          metrics: Dict[str, float]) -> Optional[MetricsChart]:
        """Update training metrics chart with new data"""
        try:
            # Find training metrics visualization
            viz = None
            for v in self.visualizations.values():
                if v.training_id == training_id and v.chart_type == 'training_metrics':
                    viz = v
                    break
            
            if not viz:
                return None
            
            # Initialize data structure if empty
            if not viz.data:
                viz.data = {
                    'epochs': [],
                    'train_loss': [],
                    'valid_loss': [],
                    'train_accuracy': [],
                    'valid_accuracy': [],
                    'learning_rate': []
                }
            
            # Add new data point
            viz.data['epochs'].append(epoch)
            viz.data['train_loss'].append(metrics.get('train_loss', 0.0))
            viz.data['valid_loss'].append(metrics.get('valid_loss', 0.0))
            viz.data['train_accuracy'].append(metrics.get('train_accuracy', 0.0))
            viz.data['valid_accuracy'].append(metrics.get('valid_accuracy', 0.0))
            viz.data['learning_rate'].append(metrics.get('learning_rate', 0.001))
            
            viz.updated_at = datetime.now().isoformat()
            
            # Create chart object
            chart = MetricsChart(
                chart_id=viz.visualization_id,
                title=viz.config['title'],
                chart_type='line',
                x_data=viz.data['epochs'],
                y_data=[],  # Will be populated by specific metrics
                series_data={
                    'Train Loss': viz.data['train_loss'],
                    'Valid Loss': viz.data['valid_loss'],
                    'Train Accuracy': [x * 100 for x in viz.data['train_accuracy']],
                    'Valid Accuracy': [x * 100 for x in viz.data['valid_accuracy']],
                    'Learning Rate': viz.data['learning_rate']
                },
                config=viz.config,
                last_updated=viz.updated_at
            )
            
            # Cache the chart
            self.charts_cache[f"metrics_{training_id}"] = chart
            
            # Broadcast update via WebSocket
            if WEBSOCKET_AVAILABLE:
                await self._broadcast_chart_update(chart, training_id)
            
            return chart
            
        except Exception as e:
            logger.error(f"Failed to update training metrics chart: {e}")
            return None
    
    async def create_feature_importance_chart(self, 
                                            model_name: str,
                                            feature_names: List[str],
                                            importance_scores: List[float],
                                            model_type: str = "Unknown") -> FeatureImportanceChart:
        """Create feature importance visualization"""
        try:
            chart_id = str(uuid.uuid4())
            
            # Sort features by importance
            sorted_data = sorted(zip(feature_names, importance_scores), 
                               key=lambda x: abs(x[1]), reverse=True)
            
            # Take top 20 features for visualization
            top_features = sorted_data[:20]
            sorted_names = [x[0] for x in top_features]
            sorted_scores = [x[1] for x in top_features]
            
            # Group features by type (simplified)
            feature_groups = self._group_features_by_type(sorted_names)
            
            chart = FeatureImportanceChart(
                chart_id=chart_id,
                feature_names=sorted_names,
                importance_scores=sorted_scores,
                model_type=model_type,
                feature_groups=feature_groups,
                chart_config=self.chart_configs['feature_importance'],
                last_updated=datetime.now().isoformat()
            )
            
            # Cache the chart
            self.charts_cache[f"importance_{model_name}"] = chart
            
            logger.info(f"Created feature importance chart for {model_name}")
            return chart
            
        except Exception as e:
            logger.error(f"Failed to create feature importance chart: {e}")
            raise
    
    async def create_performance_comparison_chart(self, 
                                                models_data: List[Dict[str, Any]]) -> PerformanceComparison:
        """Create model performance comparison chart"""
        try:
            comparison_id = str(uuid.uuid4())
            
            # Extract model names and metrics
            model_names = [model['name'] for model in models_data]
            metrics = {
                'accuracy': [model.get('accuracy', 0.0) for model in models_data],
                'precision': [model.get('precision', 0.0) for model in models_data],
                'recall': [model.get('recall', 0.0) for model in models_data],
                'f1_score': [model.get('f1_score', 0.0) for model in models_data],
                'sharpe_ratio': [model.get('sharpe_ratio', 0.0) for model in models_data]
            }
            
            # Benchmark metrics (optional)
            benchmark_metrics = {
                'accuracy': 0.6,
                'precision': 0.6,
                'recall': 0.6,
                'f1_score': 0.6,
                'sharpe_ratio': 1.0
            }
            
            comparison = PerformanceComparison(
                comparison_id=comparison_id,
                model_names=model_names,
                metrics=metrics,
                benchmark_metrics=benchmark_metrics,
                chart_config=self.chart_configs['performance_comparison'],
                last_updated=datetime.now().isoformat()
            )
            
            # Cache the chart
            self.charts_cache[f"comparison_{comparison_id}"] = comparison
            
            logger.info(f"Created performance comparison chart for {len(model_names)} models")
            return comparison
            
        except Exception as e:
            logger.error(f"Failed to create performance comparison chart: {e}")
            raise
    
    async def generate_plotly_chart(self, chart_data: Any) -> Optional[Dict[str, Any]]:
        """Generate Plotly chart JSON for frontend consumption"""
        try:
            if not PLOTTING_AVAILABLE:
                logger.warning("Plotting libraries not available")
                return None
            
            if isinstance(chart_data, MetricsChart):
                return await self._create_plotly_metrics_chart(chart_data)
            elif isinstance(chart_data, FeatureImportanceChart):
                return await self._create_plotly_importance_chart(chart_data)
            elif isinstance(chart_data, PerformanceComparison):
                return await self._create_plotly_comparison_chart(chart_data)
            else:
                logger.warning(f"Unknown chart data type: {type(chart_data)}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to generate Plotly chart: {e}")
            return None
    
    async def _create_plotly_metrics_chart(self, chart: MetricsChart) -> Dict[str, Any]:
        """Create Plotly metrics chart"""
        try:
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=('Loss Curves', 'Accuracy Curves', 'Learning Rate', 'Combined Metrics'),
                specs=[[{"secondary_y": False}, {"secondary_y": False}],
                       [{"secondary_y": False}, {"secondary_y": False}]]
            )
            
            # Loss curves
            if 'Train Loss' in chart.series_data and 'Valid Loss' in chart.series_data:
                fig.add_trace(
                    go.Scatter(x=chart.x_data, y=chart.series_data['Train Loss'],
                              name='Train Loss', line=dict(color='#3498db')),
                    row=1, col=1
                )
                fig.add_trace(
                    go.Scatter(x=chart.x_data, y=chart.series_data['Valid Loss'],
                              name='Valid Loss', line=dict(color='#e67e22')),
                    row=1, col=1
                )
            
            # Accuracy curves
            if 'Train Accuracy' in chart.series_data and 'Valid Accuracy' in chart.series_data:
                fig.add_trace(
                    go.Scatter(x=chart.x_data, y=chart.series_data['Train Accuracy'],
                              name='Train Accuracy', line=dict(color='#2ecc71')),
                    row=1, col=2
                )
                fig.add_trace(
                    go.Scatter(x=chart.x_data, y=chart.series_data['Valid Accuracy'],
                              name='Valid Accuracy', line=dict(color='#f39c12')),
                    row=1, col=2
                )
            
            # Learning rate
            if 'Learning Rate' in chart.series_data:
                fig.add_trace(
                    go.Scatter(x=chart.x_data, y=chart.series_data['Learning Rate'],
                              name='Learning Rate', line=dict(color='#34495e')),
                    row=2, col=1
                )
            
            # Combined metrics (normalized)
            if len(chart.series_data) > 0:
                # Normalize metrics for comparison
                for i, (name, data) in enumerate(chart.series_data.items()):
                    if name not in ['Learning Rate']:
                        normalized_data = [(x - min(data)) / (max(data) - min(data)) if max(data) != min(data) else [0] * len(data) for x in data]
                        fig.add_trace(
                            go.Scatter(x=chart.x_data, y=normalized_data,
                                      name=f'{name} (norm)', opacity=0.7),
                            row=2, col=2
                        )
            
            # Update layout
            fig.update_layout(
                height=600,
                title_text=chart.title,
                showlegend=True,
                template="plotly_white"
            )
            
            fig.update_xaxes(title_text="Epoch")
            fig.update_yaxes(title_text="Loss", row=1, col=1)
            fig.update_yaxes(title_text="Accuracy (%)", row=1, col=2)
            fig.update_yaxes(title_text="Learning Rate", row=2, col=1)
            fig.update_yaxes(title_text="Normalized Value", row=2, col=2)
            
            return fig.to_dict()
            
        except Exception as e:
            logger.error(f"Failed to create Plotly metrics chart: {e}")
            return {}
    
    async def _create_plotly_importance_chart(self, chart: FeatureImportanceChart) -> Dict[str, Any]:
        """Create Plotly feature importance chart"""
        try:
            fig = go.Figure()
            
            # Create horizontal bar chart
            fig.add_trace(go.Bar(
                y=chart.feature_names[::-1],  # Reverse for top-to-bottom display
                x=chart.importance_scores[::-1],
                orientation='h',
                marker=dict(
                    color=chart.importance_scores[::-1],
                    colorscale='Viridis',
                    showscale=True
                ),
                text=[f'{score:.4f}' for score in chart.importance_scores[::-1]],
                textposition='auto'
            ))
            
            fig.update_layout(
                title=f'Top {len(chart.feature_names)} Feature Importance - {chart.model_type}',
                xaxis_title='Importance Score',
                yaxis_title='Features',
                height=max(400, len(chart.feature_names) * 25),
                template="plotly_white",
                margin=dict(l=150)  # Left margin for feature names
            )
            
            return fig.to_dict()
            
        except Exception as e:
            logger.error(f"Failed to create Plotly importance chart: {e}")
            return {}
    
    async def _create_plotly_comparison_chart(self, comparison: PerformanceComparison) -> Dict[str, Any]:
        """Create Plotly performance comparison chart"""
        try:
            # Create radar chart
            fig = go.Figure()
            
            metrics = list(comparison.metrics.keys())
            
            # Add trace for each model
            for i, model_name in enumerate(comparison.model_names):
                values = [comparison.metrics[metric][i] for metric in metrics]
                values.append(values[0])  # Close the radar chart
                
                fig.add_trace(go.Scatterpolar(
                    r=values,
                    theta=metrics + [metrics[0]],
                    fill='toself',
                    name=model_name,
                    opacity=0.6
                ))
            
            # Add benchmark if available
            if comparison.benchmark_metrics:
                benchmark_values = [comparison.benchmark_metrics[metric] for metric in metrics]
                benchmark_values.append(benchmark_values[0])
                
                fig.add_trace(go.Scatterpolar(
                    r=benchmark_values,
                    theta=metrics + [metrics[0]],
                    fill='toself',
                    name='Benchmark',
                    line=dict(dash='dash'),
                    opacity=0.4
                ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 1]
                    )),
                title="Model Performance Comparison",
                template="plotly_white",
                height=500
            )
            
            return fig.to_dict()
            
        except Exception as e:
            logger.error(f"Failed to create Plotly comparison chart: {e}")
            return {}
    
    async def get_training_dashboard_data(self, training_id: str) -> Dict[str, Any]:
        """Get comprehensive dashboard data for a training session"""
        try:
            dashboard_data = {
                'training_id': training_id,
                'charts': {},
                'summary': {},
                'last_updated': datetime.now().isoformat()
            }
            
            # Get training session data
            if training_id in self.active_training_sessions:
                session_data = self.active_training_sessions[training_id]
                dashboard_data['model_name'] = session_data['model_name']
                
                # Get all visualizations for this training
                for viz_id in session_data['visualizations']:
                    if viz_id in self.visualizations:
                        viz = self.visualizations[viz_id]
                        
                        # Generate chart data
                        if viz.chart_type == 'training_metrics':
                            chart = self.charts_cache.get(f"metrics_{training_id}")
                            if chart:
                                plotly_chart = await self.generate_plotly_chart(chart)
                                dashboard_data['charts']['metrics'] = plotly_chart
                        
                        elif viz.chart_type == 'feature_importance':
                            chart = self.charts_cache.get(f"importance_{session_data['model_name']}")
                            if chart:
                                plotly_chart = await self.generate_plotly_chart(chart)
                                dashboard_data['charts']['importance'] = plotly_chart
            
            # Add summary statistics
            if training_id in self.active_training_sessions:
                dashboard_data['summary'] = await self._get_training_summary(training_id)
            
            return dashboard_data
            
        except Exception as e:
            logger.error(f"Failed to get training dashboard data: {e}")
            return {}
    
    async def _get_training_summary(self, training_id: str) -> Dict[str, Any]:
        """Get training session summary statistics"""
        try:
            # Get training progress if available
            if MODEL_TRAINER_AVAILABLE:
                progress = await quant_model_trainer.get_training_progress(training_id)
                if progress:
                    return {
                        'status': progress.status.value,
                        'progress_percent': progress.progress_percent,
                        'current_epoch': progress.current_epoch,
                        'total_epochs': progress.total_epochs,
                        'elapsed_time': progress.elapsed_time,
                        'estimated_remaining': progress.estimated_remaining,
                        'best_metrics': asdict(progress.best_metrics) if progress.best_metrics else {}
                    }
            
            # Fallback summary
            return {
                'status': 'unknown',
                'progress_percent': 0.0,
                'current_epoch': 0,
                'total_epochs': 100,
                'elapsed_time': 0.0,
                'estimated_remaining': 0.0,
                'best_metrics': {}
            }
            
        except Exception as e:
            logger.error(f"Failed to get training summary: {e}")
            return {}
    
    async def _start_visualization_updates(self):
        """Background task for periodic visualization updates"""
        while True:
            try:
                # Update all active training visualizations
                for training_id in self.active_training_sessions.keys():
                    await self._update_training_visualizations(training_id)
                
                await asyncio.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"Visualization update error: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    async def _update_training_visualizations(self, training_id: str):
        """Update visualizations for a specific training session"""
        try:
            if not MODEL_TRAINER_AVAILABLE:
                return
            
            # Get current training progress
            progress = await quant_model_trainer.get_training_progress(training_id)
            if not progress or not progress.current_metrics:
                return
            
            # Update metrics chart
            await self.update_training_metrics_chart(
                training_id,
                progress.current_epoch,
                asdict(progress.current_metrics)
            )
            
        except Exception as e:
            logger.error(f"Failed to update training visualizations: {e}")
    
    async def _broadcast_chart_update(self, chart: Any, training_id: str):
        """Broadcast chart update via WebSocket"""
        try:
            if not WEBSOCKET_AVAILABLE:
                return
            
            # Generate Plotly chart data
            plotly_data = await self.generate_plotly_chart(chart)
            if not plotly_data:
                return
            
            # Broadcast update
            await websocket_manager.broadcast('training', {
                'type': 'chart_update',
                'training_id': training_id,
                'chart_type': chart.chart_id,
                'chart_data': plotly_data,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to broadcast chart update: {e}")
    
    def _group_features_by_type(self, feature_names: List[str]) -> Dict[str, List[str]]:
        """Group features by type for better visualization"""
        groups = {
            'price': [],
            'volume': [],
            'technical': [],
            'fundamental': [],
            'other': []
        }
        
        for feature in feature_names:
            feature_lower = feature.lower()
            if any(keyword in feature_lower for keyword in ['price', 'close', 'open', 'high', 'low']):
                groups['price'].append(feature)
            elif any(keyword in feature_lower for keyword in ['volume', 'vol']):
                groups['volume'].append(feature)
            elif any(keyword in feature_lower for keyword in ['ma', 'ema', 'rsi', 'macd', 'bb']):
                groups['technical'].append(feature)
            elif any(keyword in feature_lower for keyword in ['pe', 'pb', 'roe', 'debt', 'revenue']):
                groups['fundamental'].append(feature)
            else:
                groups['other'].append(feature)
        
        # Remove empty groups
        return {k: v for k, v in groups.items() if v}
    
    async def cleanup_training_session(self, training_id: str):
        """Clean up visualization data for completed training session"""
        try:
            if training_id in self.active_training_sessions:
                session_data = self.active_training_sessions[training_id]
                
                # Remove visualizations from cache
                for viz_id in session_data['visualizations']:
                    if viz_id in self.visualizations:
                        del self.visualizations[viz_id]
                
                # Remove from active sessions
                del self.active_training_sessions[training_id]
                
                # Clean up chart cache
                cache_keys_to_remove = [k for k in self.charts_cache.keys() if training_id in k]
                for key in cache_keys_to_remove:
                    del self.charts_cache[key]
                
                logger.info(f"Cleaned up visualizations for training {training_id}")
                
        except Exception as e:
            logger.error(f"Failed to cleanup training session: {e}")

# ================================
# GLOBAL INSTANCE
# ================================

# Global instance for use throughout the application
training_visualization_service = TrainingVisualizationService()