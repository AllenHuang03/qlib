"""
Model Checkpointing and Versioning System
Comprehensive model lifecycle management with automatic checkpointing, versioning, and deployment
"""

import os
import asyncio
import logging
import pickle
import joblib
import hashlib
import shutil
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import uuid
from enum import Enum
import sqlite3
import zipfile

# Git-like versioning
import git
from git import Repo, InvalidGitRepositoryError

# Model serialization
import cloudpickle

# Database integration
try:
    from supabase_service import supabase_service
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Cloud storage integration
try:
    from cloud_storage_service import cloud_storage_service
    STORAGE_SERVICE_AVAILABLE = True
except ImportError:
    STORAGE_SERVICE_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# ENUMS AND DATA CLASSES
# ================================

class ModelStatus(Enum):
    TRAINING = "training"
    COMPLETED = "completed"
    DEPLOYED = "deployed"
    ARCHIVED = "archived"
    FAILED = "failed"

class VersionType(Enum):
    MAJOR = "major"  # Breaking changes, new architecture
    MINOR = "minor"  # Feature additions, improvements
    PATCH = "patch"  # Bug fixes, small tweaks
    CHECKPOINT = "checkpoint"  # Training checkpoints

class DeploymentStage(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"

@dataclass
class ModelVersion:
    """Model version metadata"""
    version_id: str
    model_id: str
    version_number: str  # e.g., "1.2.3"
    version_type: VersionType
    status: ModelStatus
    deployment_stage: DeploymentStage
    
    # Model metadata
    model_name: str
    model_type: str
    architecture_hash: str
    parameters_hash: str
    training_config_hash: str
    
    # Performance metrics
    performance_score: float
    validation_accuracy: float
    sharpe_ratio: float
    max_drawdown: float
    
    # File paths
    model_path: str
    checkpoint_path: Optional[str]
    config_path: str
    metadata_path: str
    
    # Versioning info
    parent_version_id: Optional[str]
    created_by: str
    created_at: str
    commit_message: str
    tags: List[str]
    
    # Deployment info
    deployed_at: Optional[str] = None
    deployment_notes: Optional[str] = None
    
    # Model size and stats
    model_size_mb: float = 0.0
    training_time_hours: float = 0.0
    feature_count: int = 0

@dataclass
class ModelCheckpoint:
    """Training checkpoint metadata"""
    checkpoint_id: str
    model_id: str
    version_id: str
    epoch: int
    step: int
    
    # Performance at checkpoint
    train_loss: float
    valid_loss: float
    train_accuracy: float
    valid_accuracy: float
    learning_rate: float
    
    # File paths
    checkpoint_path: str
    optimizer_path: Optional[str]
    scheduler_path: Optional[str]
    
    # Checkpoint metadata
    created_at: str
    is_best: bool
    early_stop_patience: int
    
    # Additional metrics
    metrics: Dict[str, float]

@dataclass
class DeploymentRecord:
    """Model deployment record"""
    deployment_id: str
    version_id: str
    model_id: str
    stage: DeploymentStage
    
    # Deployment details
    deployed_by: str
    deployed_at: str
    deployment_config: Dict[str, Any]
    rollback_version_id: Optional[str]
    
    # Status
    is_active: bool
    health_check_url: Optional[str]
    monitoring_enabled: bool
    
    # Performance tracking
    requests_served: int = 0
    avg_latency_ms: float = 0.0
    error_rate: float = 0.0
    
    # Rollback info
    rolled_back_at: Optional[str] = None
    rollback_reason: Optional[str] = None

# ================================
# MODEL VERSIONING SYSTEM
# ================================

class ModelVersioningSystem:
    """Comprehensive model versioning and lifecycle management system"""
    
    def __init__(self):
        self.base_path = Path(__file__).parent / "model_versions"
        self.checkpoints_path = self.base_path / "checkpoints"
        self.deployments_path = self.base_path / "deployments"
        self.archive_path = self.base_path / "archive"
        
        # Create directories
        for path in [self.base_path, self.checkpoints_path, self.deployments_path, self.archive_path]:
            path.mkdir(exist_ok=True, parents=True)
        
        # Initialize database
        self.db_path = self.base_path / "versioning.db"
        self._setup_database()
        
        # Initialize git repository for version control
        self.repo_path = self.base_path / "repository"
        self._setup_git_repository()
        
        # Version tracking
        self.versions = {}
        self.checkpoints = {}
        self.deployments = {}
        
        # Load existing versions
        asyncio.create_task(self._load_existing_versions())
        
        logger.info("Model Versioning System initialized")
    
    def _setup_database(self):
        """Setup SQLite database for versioning metadata"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Model versions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS model_versions (
                    version_id TEXT PRIMARY KEY,
                    model_id TEXT NOT NULL,
                    version_number TEXT NOT NULL,
                    version_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    deployment_stage TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    model_type TEXT NOT NULL,
                    architecture_hash TEXT NOT NULL,
                    parameters_hash TEXT NOT NULL,
                    training_config_hash TEXT NOT NULL,
                    performance_score REAL NOT NULL,
                    validation_accuracy REAL NOT NULL,
                    sharpe_ratio REAL NOT NULL,
                    max_drawdown REAL NOT NULL,
                    model_path TEXT NOT NULL,
                    checkpoint_path TEXT,
                    config_path TEXT NOT NULL,
                    metadata_path TEXT NOT NULL,
                    parent_version_id TEXT,
                    created_by TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    commit_message TEXT NOT NULL,
                    tags TEXT,
                    deployed_at TIMESTAMP,
                    deployment_notes TEXT,
                    model_size_mb REAL DEFAULT 0.0,
                    training_time_hours REAL DEFAULT 0.0,
                    feature_count INTEGER DEFAULT 0,
                    FOREIGN KEY (parent_version_id) REFERENCES model_versions (version_id)
                )
            ''')
            
            # Model checkpoints table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS model_checkpoints (
                    checkpoint_id TEXT PRIMARY KEY,
                    model_id TEXT NOT NULL,
                    version_id TEXT NOT NULL,
                    epoch INTEGER NOT NULL,
                    step INTEGER NOT NULL,
                    train_loss REAL NOT NULL,
                    valid_loss REAL NOT NULL,
                    train_accuracy REAL NOT NULL,
                    valid_accuracy REAL NOT NULL,
                    learning_rate REAL NOT NULL,
                    checkpoint_path TEXT NOT NULL,
                    optimizer_path TEXT,
                    scheduler_path TEXT,
                    created_at TIMESTAMP NOT NULL,
                    is_best BOOLEAN DEFAULT FALSE,
                    early_stop_patience INTEGER DEFAULT 0,
                    metrics TEXT,
                    FOREIGN KEY (version_id) REFERENCES model_versions (version_id)
                )
            ''')
            
            # Deployments table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS deployments (
                    deployment_id TEXT PRIMARY KEY,
                    version_id TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    deployed_by TEXT NOT NULL,
                    deployed_at TIMESTAMP NOT NULL,
                    deployment_config TEXT NOT NULL,
                    rollback_version_id TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    health_check_url TEXT,
                    monitoring_enabled BOOLEAN DEFAULT TRUE,
                    requests_served INTEGER DEFAULT 0,
                    avg_latency_ms REAL DEFAULT 0.0,
                    error_rate REAL DEFAULT 0.0,
                    rolled_back_at TIMESTAMP,
                    rollback_reason TEXT,
                    FOREIGN KEY (version_id) REFERENCES model_versions (version_id),
                    FOREIGN KEY (rollback_version_id) REFERENCES model_versions (version_id)
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_model_versions_model_id ON model_versions (model_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_model_versions_status ON model_versions (status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_deployments_stage ON deployments (stage)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_deployments_active ON deployments (is_active)')
            
            conn.commit()
            conn.close()
            
            logger.info("Versioning database initialized")
            
        except Exception as e:
            logger.error(f"Failed to setup versioning database: {e}")
    
    def _setup_git_repository(self):
        """Setup git repository for version control"""
        try:
            self.repo_path.mkdir(exist_ok=True)
            
            try:
                self.repo = Repo(self.repo_path)
                logger.info("Existing git repository found")
            except InvalidGitRepositoryError:
                # Initialize new repository
                self.repo = Repo.init(self.repo_path)
                
                # Create initial commit
                gitignore_content = """
# Model artifacts
*.pkl
*.joblib
*.h5
*.pt
*.pth
__pycache__/
*.pyc

# Large files
*.bin
*.onnx

# Temporary files
*.tmp
*.temp
"""
                gitignore_path = self.repo_path / ".gitignore"
                with open(gitignore_path, 'w') as f:
                    f.write(gitignore_content)
                
                self.repo.index.add(['.gitignore'])
                self.repo.index.commit("Initial commit: Setup model versioning repository")
                
                logger.info("New git repository initialized")
                
        except Exception as e:
            logger.error(f"Failed to setup git repository: {e}")
            self.repo = None
    
    async def create_version(self, 
                           model_id: str,
                           model_object: Any,
                           training_config: Dict[str, Any],
                           performance_metrics: Dict[str, float],
                           version_type: VersionType = VersionType.MINOR,
                           commit_message: str = "",
                           created_by: str = "system",
                           parent_version_id: Optional[str] = None) -> ModelVersion:
        """Create a new model version"""
        try:
            logger.info(f"Creating new version for model {model_id}")
            
            # Generate version ID and number
            version_id = str(uuid.uuid4())
            version_number = await self._generate_version_number(model_id, version_type, parent_version_id)
            
            # Calculate hashes for change detection
            architecture_hash = self._calculate_architecture_hash(model_object)
            parameters_hash = self._calculate_parameters_hash(model_object)
            training_config_hash = self._calculate_config_hash(training_config)
            
            # Create version directory
            version_dir = self.base_path / model_id / version_number
            version_dir.mkdir(parents=True, exist_ok=True)
            
            # Save model artifacts
            model_path = version_dir / "model.pkl"
            config_path = version_dir / "config.json"
            metadata_path = version_dir / "metadata.json"
            
            # Serialize model
            await self._save_model(model_object, model_path)
            
            # Save configuration
            with open(config_path, 'w') as f:
                json.dump(training_config, f, indent=2, default=str)
            
            # Calculate model statistics
            model_size_mb = model_path.stat().st_size / (1024 * 1024) if model_path.exists() else 0.0
            feature_count = training_config.get('feature_count', 0)
            training_time_hours = training_config.get('training_time', 0) / 3600
            
            # Create version metadata
            version = ModelVersion(
                version_id=version_id,
                model_id=model_id,
                version_number=version_number,
                version_type=version_type,
                status=ModelStatus.COMPLETED,
                deployment_stage=DeploymentStage.DEVELOPMENT,
                model_name=training_config.get('model_name', f'Model {model_id}'),
                model_type=training_config.get('model_type', 'Unknown'),
                architecture_hash=architecture_hash,
                parameters_hash=parameters_hash,
                training_config_hash=training_config_hash,
                performance_score=performance_metrics.get('performance_score', 0.0),
                validation_accuracy=performance_metrics.get('accuracy', 0.0),
                sharpe_ratio=performance_metrics.get('sharpe_ratio', 0.0),
                max_drawdown=performance_metrics.get('max_drawdown', 0.0),
                model_path=str(model_path),
                checkpoint_path=None,
                config_path=str(config_path),
                metadata_path=str(metadata_path),
                parent_version_id=parent_version_id,
                created_by=created_by,
                created_at=datetime.now().isoformat(),
                commit_message=commit_message or f"Create version {version_number}",
                tags=[],
                model_size_mb=model_size_mb,
                training_time_hours=training_time_hours,
                feature_count=feature_count
            )
            
            # Save metadata
            with open(metadata_path, 'w') as f:
                json.dump(asdict(version), f, indent=2, default=str)
            
            # Store in database
            await self._store_version(version)
            
            # Git commit
            if self.repo:
                await self._git_commit_version(version)
            
            # Store in cloud if available
            if STORAGE_SERVICE_AVAILABLE:
                await self._upload_version_to_cloud(version)
            
            # Update cache
            self.versions[version_id] = version
            
            logger.info(f"Version {version_number} created successfully for model {model_id}")
            return version
            
        except Exception as e:
            logger.error(f"Failed to create version: {e}")
            raise
    
    async def create_checkpoint(self,
                              model_id: str,
                              version_id: str,
                              model_state: Dict[str, Any],
                              optimizer_state: Optional[Dict[str, Any]] = None,
                              scheduler_state: Optional[Dict[str, Any]] = None,
                              epoch: int = 0,
                              step: int = 0,
                              metrics: Optional[Dict[str, float]] = None,
                              is_best: bool = False) -> ModelCheckpoint:
        """Create a training checkpoint"""
        try:
            checkpoint_id = str(uuid.uuid4())
            
            # Create checkpoint directory
            checkpoint_dir = self.checkpoints_path / model_id / version_id / f"checkpoint_{epoch:03d}_{step:06d}"
            checkpoint_dir.mkdir(parents=True, exist_ok=True)
            
            # Save checkpoint files
            checkpoint_path = checkpoint_dir / "checkpoint.pkl"
            optimizer_path = checkpoint_dir / "optimizer.pkl" if optimizer_state else None
            scheduler_path = checkpoint_dir / "scheduler.pkl" if scheduler_state else None
            
            # Save model state
            with open(checkpoint_path, 'wb') as f:
                cloudpickle.dump(model_state, f)
            
            # Save optimizer state
            if optimizer_state and optimizer_path:
                with open(optimizer_path, 'wb') as f:
                    cloudpickle.dump(optimizer_state, f)
            
            # Save scheduler state
            if scheduler_state and scheduler_path:
                with open(scheduler_path, 'wb') as f:
                    cloudpickle.dump(scheduler_state, f)
            
            # Create checkpoint metadata
            checkpoint = ModelCheckpoint(
                checkpoint_id=checkpoint_id,
                model_id=model_id,
                version_id=version_id,
                epoch=epoch,
                step=step,
                train_loss=metrics.get('train_loss', 0.0) if metrics else 0.0,
                valid_loss=metrics.get('valid_loss', 0.0) if metrics else 0.0,
                train_accuracy=metrics.get('train_accuracy', 0.0) if metrics else 0.0,
                valid_accuracy=metrics.get('valid_accuracy', 0.0) if metrics else 0.0,
                learning_rate=metrics.get('learning_rate', 0.001) if metrics else 0.001,
                checkpoint_path=str(checkpoint_path),
                optimizer_path=str(optimizer_path) if optimizer_path else None,
                scheduler_path=str(scheduler_path) if scheduler_path else None,
                created_at=datetime.now().isoformat(),
                is_best=is_best,
                early_stop_patience=metrics.get('early_stop_patience', 0) if metrics else 0,
                metrics=metrics or {}
            )
            
            # Store in database
            await self._store_checkpoint(checkpoint)
            
            # Update cache
            self.checkpoints[checkpoint_id] = checkpoint
            
            # Clean up old checkpoints (keep only last 10 per version)
            await self._cleanup_old_checkpoints(model_id, version_id)
            
            logger.info(f"Checkpoint created: epoch {epoch}, step {step}")
            return checkpoint
            
        except Exception as e:
            logger.error(f"Failed to create checkpoint: {e}")
            raise
    
    async def deploy_version(self,
                           version_id: str,
                           stage: DeploymentStage,
                           deployed_by: str,
                           deployment_config: Optional[Dict[str, Any]] = None,
                           rollback_version_id: Optional[str] = None) -> DeploymentRecord:
        """Deploy a model version to a specific stage"""
        try:
            logger.info(f"Deploying version {version_id} to {stage.value}")
            
            # Get version
            version = await self.get_version(version_id)
            if not version:
                raise ValueError(f"Version {version_id} not found")
            
            # Check if model is ready for deployment
            if version.status != ModelStatus.COMPLETED:
                raise ValueError(f"Version {version_id} is not ready for deployment (status: {version.status})")
            
            # Deactivate current deployments for this stage (if any)
            await self._deactivate_current_deployments(version.model_id, stage)
            
            # Create deployment directory
            deployment_dir = self.deployments_path / stage.value / version.model_id / version.version_number
            deployment_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy model artifacts to deployment directory
            await self._copy_version_artifacts(version, deployment_dir)
            
            # Create deployment record
            deployment_id = str(uuid.uuid4())
            deployment = DeploymentRecord(
                deployment_id=deployment_id,
                version_id=version_id,
                model_id=version.model_id,
                stage=stage,
                deployed_by=deployed_by,
                deployed_at=datetime.now().isoformat(),
                deployment_config=deployment_config or {},
                rollback_version_id=rollback_version_id,
                is_active=True,
                health_check_url=f"/api/models/{version.model_id}/health",
                monitoring_enabled=True
            )
            
            # Store deployment record
            await self._store_deployment(deployment)
            
            # Update version status
            version.deployment_stage = stage
            version.deployed_at = deployment.deployed_at
            await self._update_version(version)
            
            # Update cache
            self.deployments[deployment_id] = deployment
            
            logger.info(f"Version {version.version_number} deployed to {stage.value} successfully")
            return deployment
            
        except Exception as e:
            logger.error(f"Failed to deploy version: {e}")
            raise
    
    async def rollback_deployment(self,
                                deployment_id: str,
                                rollback_to_version_id: Optional[str] = None,
                                reason: str = "Manual rollback") -> DeploymentRecord:
        """Rollback a deployment to a previous version"""
        try:
            # Get current deployment
            deployment = await self.get_deployment(deployment_id)
            if not deployment:
                raise ValueError(f"Deployment {deployment_id} not found")
            
            if not deployment.is_active:
                raise ValueError(f"Deployment {deployment_id} is not active")
            
            # Determine rollback version
            rollback_version_id = rollback_to_version_id or deployment.rollback_version_id
            if not rollback_version_id:
                # Find previous version
                previous_deployments = await self._get_previous_deployments(
                    deployment.model_id, deployment.stage
                )
                if previous_deployments:
                    rollback_version_id = previous_deployments[0].version_id
                else:
                    raise ValueError("No rollback version specified and no previous deployments found")
            
            logger.info(f"Rolling back deployment {deployment_id} to version {rollback_version_id}")
            
            # Mark current deployment as rolled back
            deployment.is_active = False
            deployment.rolled_back_at = datetime.now().isoformat()
            deployment.rollback_reason = reason
            await self._update_deployment(deployment)
            
            # Deploy the rollback version
            rollback_deployment = await self.deploy_version(
                rollback_version_id,
                deployment.stage,
                "system_rollback",
                deployment.deployment_config,
                deployment.version_id
            )
            
            logger.info(f"Rollback completed: deployment {deployment_id} -> {rollback_deployment.deployment_id}")
            return rollback_deployment
            
        except Exception as e:
            logger.error(f"Failed to rollback deployment: {e}")
            raise
    
    async def get_version(self, version_id: str) -> Optional[ModelVersion]:
        """Get a specific model version"""
        try:
            # Check cache first
            if version_id in self.versions:
                return self.versions[version_id]
            
            # Query database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM model_versions WHERE version_id = ?
            ''', (version_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                version = self._row_to_version(result)
                self.versions[version_id] = version
                return version
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get version: {e}")
            return None
    
    async def get_model_versions(self, 
                               model_id: str,
                               limit: int = 50,
                               status_filter: Optional[ModelStatus] = None) -> List[ModelVersion]:
        """Get all versions for a model"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = '''
                SELECT * FROM model_versions 
                WHERE model_id = ?
            '''
            params = [model_id]
            
            if status_filter:
                query += ' AND status = ?'
                params.append(status_filter.value)
            
            query += ' ORDER BY created_at DESC LIMIT ?'
            params.append(limit)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            conn.close()
            
            versions = [self._row_to_version(result) for result in results]
            
            # Update cache
            for version in versions:
                self.versions[version.version_id] = version
            
            return versions
            
        except Exception as e:
            logger.error(f"Failed to get model versions: {e}")
            return []
    
    async def get_deployed_versions(self, 
                                  stage: Optional[DeploymentStage] = None) -> List[DeploymentRecord]:
        """Get all currently deployed versions"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = '''
                SELECT * FROM deployments 
                WHERE is_active = TRUE
            '''
            params = []
            
            if stage:
                query += ' AND stage = ?'
                params.append(stage.value)
            
            query += ' ORDER BY deployed_at DESC'
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            conn.close()
            
            deployments = [self._row_to_deployment(result) for result in results]
            return deployments
            
        except Exception as e:
            logger.error(f"Failed to get deployed versions: {e}")
            return []
    
    async def load_model_version(self, version_id: str) -> Optional[Any]:
        """Load a model from a specific version"""
        try:
            version = await self.get_version(version_id)
            if not version:
                return None
            
            model_path = Path(version.model_path)
            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return None
            
            # Load model based on file extension
            if model_path.suffix == '.pkl':
                with open(model_path, 'rb') as f:
                    return cloudpickle.load(f)
            elif model_path.suffix == '.joblib':
                return joblib.load(model_path)
            else:
                logger.error(f"Unsupported model file format: {model_path.suffix}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to load model version: {e}")
            return None
    
    async def compare_versions(self, 
                             version_id_1: str, 
                             version_id_2: str) -> Dict[str, Any]:
        """Compare two model versions"""
        try:
            version1 = await self.get_version(version_id_1)
            version2 = await self.get_version(version_id_2)
            
            if not version1 or not version2:
                raise ValueError("One or both versions not found")
            
            comparison = {
                'version_1': {
                    'id': version1.version_id,
                    'number': version1.version_number,
                    'created_at': version1.created_at,
                    'performance_score': version1.performance_score,
                    'validation_accuracy': version1.validation_accuracy,
                    'sharpe_ratio': version1.sharpe_ratio,
                    'max_drawdown': version1.max_drawdown
                },
                'version_2': {
                    'id': version2.version_id,
                    'number': version2.version_number,
                    'created_at': version2.created_at,
                    'performance_score': version2.performance_score,
                    'validation_accuracy': version2.validation_accuracy,
                    'sharpe_ratio': version2.sharpe_ratio,
                    'max_drawdown': version2.max_drawdown
                },
                'differences': {
                    'architecture_changed': version1.architecture_hash != version2.architecture_hash,
                    'parameters_changed': version1.parameters_hash != version2.parameters_hash,
                    'config_changed': version1.training_config_hash != version2.training_config_hash,
                    'performance_delta': version2.performance_score - version1.performance_score,
                    'accuracy_delta': version2.validation_accuracy - version1.validation_accuracy,
                    'sharpe_delta': version2.sharpe_ratio - version1.sharpe_ratio,
                    'drawdown_delta': version2.max_drawdown - version1.max_drawdown
                },
                'recommendation': self._generate_comparison_recommendation(version1, version2)
            }
            
            return comparison
            
        except Exception as e:
            logger.error(f"Failed to compare versions: {e}")
            return {}
    
    # Helper methods...
    
    async def _save_model(self, model_object: Any, model_path: Path):
        """Save model object to file"""
        try:
            with open(model_path, 'wb') as f:
                cloudpickle.dump(model_object, f)
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise
    
    def _calculate_architecture_hash(self, model_object: Any) -> str:
        """Calculate hash of model architecture"""
        try:
            # Simplified hash calculation
            architecture_info = str(type(model_object))
            if hasattr(model_object, 'get_config'):
                architecture_info += str(model_object.get_config())
            return hashlib.md5(architecture_info.encode()).hexdigest()
        except:
            return hashlib.md5(str(type(model_object)).encode()).hexdigest()
    
    def _calculate_parameters_hash(self, model_object: Any) -> str:
        """Calculate hash of model parameters"""
        try:
            # Simplified parameter hash
            if hasattr(model_object, 'state_dict'):
                param_str = str(list(model_object.state_dict().keys()))
            elif hasattr(model_object, 'get_params'):
                param_str = str(model_object.get_params())
            else:
                param_str = str(vars(model_object)) if hasattr(model_object, '__dict__') else str(model_object)
            
            return hashlib.md5(param_str.encode()).hexdigest()
        except:
            return hashlib.md5(str(type(model_object)).encode()).hexdigest()
    
    def _calculate_config_hash(self, config: Dict[str, Any]) -> str:
        """Calculate hash of training configuration"""
        try:
            config_str = json.dumps(config, sort_keys=True, default=str)
            return hashlib.md5(config_str.encode()).hexdigest()
        except:
            return hashlib.md5(str(config).encode()).hexdigest()
    
    async def _generate_version_number(self, 
                                     model_id: str, 
                                     version_type: VersionType,
                                     parent_version_id: Optional[str]) -> str:
        """Generate next version number"""
        try:
            # Get latest version
            latest_versions = await self.get_model_versions(model_id, limit=1)
            
            if not latest_versions:
                return "1.0.0"
            
            latest_version = latest_versions[0]
            major, minor, patch = map(int, latest_version.version_number.split('.'))
            
            if version_type == VersionType.MAJOR:
                major += 1
                minor = 0
                patch = 0
            elif version_type == VersionType.MINOR:
                minor += 1
                patch = 0
            elif version_type == VersionType.PATCH:
                patch += 1
            elif version_type == VersionType.CHECKPOINT:
                patch += 1
            
            return f"{major}.{minor}.{patch}"
            
        except Exception as e:
            logger.error(f"Failed to generate version number: {e}")
            return "1.0.0"
    
    # Database helper methods...
    
    def _row_to_version(self, row) -> ModelVersion:
        """Convert database row to ModelVersion object"""
        return ModelVersion(
            version_id=row[0],
            model_id=row[1],
            version_number=row[2],
            version_type=VersionType(row[3]),
            status=ModelStatus(row[4]),
            deployment_stage=DeploymentStage(row[5]),
            model_name=row[6],
            model_type=row[7],
            architecture_hash=row[8],
            parameters_hash=row[9],
            training_config_hash=row[10],
            performance_score=row[11],
            validation_accuracy=row[12],
            sharpe_ratio=row[13],
            max_drawdown=row[14],
            model_path=row[15],
            checkpoint_path=row[16],
            config_path=row[17],
            metadata_path=row[18],
            parent_version_id=row[19],
            created_by=row[20],
            created_at=row[21],
            commit_message=row[22],
            tags=json.loads(row[23]) if row[23] else [],
            deployed_at=row[24],
            deployment_notes=row[25],
            model_size_mb=row[26] or 0.0,
            training_time_hours=row[27] or 0.0,
            feature_count=row[28] or 0
        )

# ================================
# GLOBAL INSTANCE
# ================================

# Global instance for use throughout the application
model_versioning_system = ModelVersioningSystem()