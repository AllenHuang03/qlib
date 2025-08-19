"""
Redis Cache Service for High-Performance Model Predictions
Production-grade caching with intelligent invalidation strategies
"""

import os
import json
import asyncio
import logging
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import redis
import pickle
from pathlib import Path

# Cache configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DEFAULT_TTL = 300  # 5 minutes default TTL
PREDICTION_TTL = 600  # 10 minutes for predictions
MARKET_DATA_TTL = 60  # 1 minute for market data
MODEL_PERFORMANCE_TTL = 3600  # 1 hour for model performance

@dataclass
class CacheMetrics:
    """Cache performance metrics"""
    total_requests: int
    cache_hits: int
    cache_misses: int
    hit_rate: float
    avg_response_time_ms: float
    total_data_mb: float
    keys_count: int
    memory_usage_mb: float

logger = logging.getLogger(__name__)

class RedisCacheService:
    """High-performance Redis caching service with intelligent strategies"""
    
    def __init__(self):
        self.redis_client = None
        self.redis_cluster = None
        self.fallback_cache = {}  # In-memory fallback
        
        # Performance metrics
        self.metrics = {
            'requests': 0,
            'hits': 0,
            'misses': 0,
            'total_response_time': 0
        }
        
        # Cache strategies
        self.cache_strategies = {
            'prediction': {'ttl': PREDICTION_TTL, 'compression': True},
            'market_data': {'ttl': MARKET_DATA_TTL, 'compression': False},
            'model_performance': {'ttl': MODEL_PERFORMANCE_TTL, 'compression': True},
            'user_data': {'ttl': 1800, 'compression': False},
            'analytics': {'ttl': 7200, 'compression': True}
        }
        
        self._initialize_redis()
        logger.info("Redis Cache Service initialized")
    
    def _initialize_redis(self):
        """Initialize Redis connection with retry logic"""
        try:
            # Try Redis connection
            self.redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=False,  # Handle binary data
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            self.redis_client.ping()
            
            # Configure Redis for optimal performance
            self._configure_redis()
            
            logger.info("SUCCESS: Redis cache connected successfully")
            
        except redis.ConnectionError as e:
            logger.warning(f"Redis connection failed: {e}")
            logger.info("Using in-memory fallback cache")
            self.redis_client = None
        except Exception as e:
            logger.error(f"Redis initialization error: {e}")
            self.redis_client = None
    
    def _configure_redis(self):
        """Configure Redis for optimal caching performance"""
        if not self.redis_client:
            return
        
        try:
            # Set memory policy for production
            self.redis_client.config_set('maxmemory-policy', 'allkeys-lru')
            
            # Enable compression for large values
            self.redis_client.config_set('hash-max-ziplist-entries', '512')
            self.redis_client.config_set('hash-max-ziplist-value', '64')
            
            logger.info("Redis configured for optimal performance")
            
        except Exception as e:
            logger.warning(f"Redis configuration warning: {e}")
    
    def _generate_cache_key(self, category: str, identifier: str, **kwargs) -> str:
        """Generate intelligent cache key with namespace"""
        # Create deterministic key from parameters
        key_data = f"{category}:{identifier}"
        
        if kwargs:
            # Sort kwargs for consistent key generation
            sorted_kwargs = sorted(kwargs.items())
            params_str = ":".join([f"{k}={v}" for k, v in sorted_kwargs])
            key_data += f":{params_str}"
        
        # Hash long keys to avoid Redis key size limits
        if len(key_data) > 250:
            key_hash = hashlib.md5(key_data.encode()).hexdigest()
            key_data = f"{category}:{key_hash}"
        
        return key_data
    
    def _serialize_data(self, data: Any, compress: bool = False) -> bytes:
        """Serialize data with optional compression"""
        try:
            if compress:
                # Use pickle for better compression
                return pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
            else:
                # Use JSON for human-readable cache
                if isinstance(data, (dict, list, str, int, float, bool)):
                    return json.dumps(data).encode('utf-8')
                else:
                    return pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
        except Exception as e:
            logger.error(f"Serialization error: {e}")
            return pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
    
    def _deserialize_data(self, data: bytes, compress: bool = False) -> Any:
        """Deserialize cached data"""
        try:
            if compress:
                return pickle.loads(data)
            else:
                # Try JSON first, fall back to pickle
                try:
                    return json.loads(data.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    return pickle.loads(data)
        except Exception as e:
            logger.error(f"Deserialization error: {e}")
            return None
    
    async def get(self, category: str, identifier: str, **kwargs) -> Optional[Any]:
        """Get data from cache with performance tracking"""
        start_time = time.time()
        self.metrics['requests'] += 1
        
        cache_key = self._generate_cache_key(category, identifier, **kwargs)
        strategy = self.cache_strategies.get(category, {'ttl': DEFAULT_TTL, 'compression': False})
        
        try:
            if self.redis_client:
                # Try Redis first
                cached_data = self.redis_client.get(cache_key)
                if cached_data:
                    self.metrics['hits'] += 1
                    result = self._deserialize_data(cached_data, strategy['compression'])
                    
                    response_time = (time.time() - start_time) * 1000
                    self.metrics['total_response_time'] += response_time
                    
                    return result
            
            # Fallback to memory cache
            if cache_key in self.fallback_cache:
                cache_entry = self.fallback_cache[cache_key]
                if cache_entry['expires'] > datetime.now():
                    self.metrics['hits'] += 1
                    return cache_entry['data']
                else:
                    # Remove expired entry
                    del self.fallback_cache[cache_key]
            
            self.metrics['misses'] += 1
            return None
            
        except Exception as e:
            logger.error(f"Cache get error for {cache_key}: {e}")
            self.metrics['misses'] += 1
            return None
    
    async def set(self, category: str, identifier: str, data: Any, ttl: Optional[int] = None, **kwargs) -> bool:
        """Set data in cache with intelligent TTL"""
        cache_key = self._generate_cache_key(category, identifier, **kwargs)
        strategy = self.cache_strategies.get(category, {'ttl': DEFAULT_TTL, 'compression': False})
        
        # Use provided TTL or strategy default
        cache_ttl = ttl if ttl is not None else strategy['ttl']
        
        try:
            serialized_data = self._serialize_data(data, strategy['compression'])
            
            if self.redis_client:
                # Set in Redis with TTL
                result = self.redis_client.setex(cache_key, cache_ttl, serialized_data)
                
                # Also update fallback cache
                self.fallback_cache[cache_key] = {
                    'data': data,
                    'expires': datetime.now() + timedelta(seconds=cache_ttl)
                }
                
                return bool(result)
            else:
                # Use only fallback cache
                self.fallback_cache[cache_key] = {
                    'data': data,
                    'expires': datetime.now() + timedelta(seconds=cache_ttl)
                }
                return True
                
        except Exception as e:
            logger.error(f"Cache set error for {cache_key}: {e}")
            return False
    
    async def delete(self, category: str, identifier: str, **kwargs) -> bool:
        """Delete specific cache entry"""
        cache_key = self._generate_cache_key(category, identifier, **kwargs)
        
        try:
            deleted = False
            
            if self.redis_client:
                result = self.redis_client.delete(cache_key)
                deleted = bool(result)
            
            # Also remove from fallback
            if cache_key in self.fallback_cache:
                del self.fallback_cache[cache_key]
                deleted = True
            
            return deleted
            
        except Exception as e:
            logger.error(f"Cache delete error for {cache_key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete multiple cache entries matching pattern"""
        try:
            deleted_count = 0
            
            if self.redis_client:
                # Get all keys matching pattern
                keys = self.redis_client.keys(pattern)
                if keys:
                    deleted_count = self.redis_client.delete(*keys)
            
            # Clean fallback cache
            fallback_keys_to_delete = [key for key in self.fallback_cache.keys() if pattern.replace('*', '') in key]
            for key in fallback_keys_to_delete:
                del self.fallback_cache[key]
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Cache pattern delete error for {pattern}: {e}")
            return 0
    
    async def invalidate_category(self, category: str) -> int:
        """Invalidate all cache entries for a category"""
        pattern = f"{category}:*"
        return await self.delete_pattern(pattern)
    
    async def cache_prediction(self, model_id: str, symbol: str, prediction_data: Dict) -> bool:
        """Cache model prediction with optimized key"""
        # Include timestamp in key for time-based invalidation
        hour_key = datetime.now().strftime('%Y%m%d_%H')
        return await self.set(
            'prediction', 
            f"{model_id}_{symbol}_{hour_key}", 
            prediction_data,
            ttl=PREDICTION_TTL
        )
    
    async def get_cached_prediction(self, model_id: str, symbol: str) -> Optional[Dict]:
        """Get cached prediction for model and symbol"""
        hour_key = datetime.now().strftime('%Y%m%d_%H')
        return await self.get('prediction', f"{model_id}_{symbol}_{hour_key}")
    
    async def cache_market_data(self, data_type: str, symbol: str, market_data: Dict) -> bool:
        """Cache market data with short TTL"""
        minute_key = datetime.now().strftime('%Y%m%d_%H%M')
        return await self.set(
            'market_data',
            f"{data_type}_{symbol}_{minute_key}",
            market_data,
            ttl=MARKET_DATA_TTL
        )
    
    async def get_cached_market_data(self, data_type: str, symbol: str) -> Optional[Dict]:
        """Get cached market data"""
        minute_key = datetime.now().strftime('%Y%m%d_%H%M')
        return await self.get('market_data', f"{data_type}_{symbol}_{minute_key}")
    
    async def cache_model_performance(self, model_id: str, performance_data: Dict) -> bool:
        """Cache model performance metrics"""
        return await self.set(
            'model_performance',
            model_id,
            performance_data,
            ttl=MODEL_PERFORMANCE_TTL
        )
    
    async def get_cached_model_performance(self, model_id: str) -> Optional[Dict]:
        """Get cached model performance"""
        return await self.get('model_performance', model_id)
    
    async def cache_user_data(self, user_id: str, data_type: str, user_data: Dict) -> bool:
        """Cache user-specific data"""
        return await self.set('user_data', f"{user_id}_{data_type}", user_data)
    
    async def get_cached_user_data(self, user_id: str, data_type: str) -> Optional[Dict]:
        """Get cached user data"""
        return await self.get('user_data', f"{user_id}_{data_type}")
    
    async def warm_cache(self, symbols: List[str], model_ids: List[str]):
        """Pre-warm cache with frequently accessed data"""
        logger.info(f"Warming cache for {len(symbols)} symbols and {len(model_ids)} models")
        
        try:
            # Warm up market data
            for symbol in symbols:
                # Simulate market data fetch and cache
                mock_market_data = {
                    'symbol': symbol,
                    'price': 100.0,
                    'volume': 1000000,
                    'timestamp': datetime.now().isoformat()
                }
                await self.cache_market_data('quote', symbol, mock_market_data)
            
            # Warm up model performance data
            for model_id in model_ids:
                mock_performance = {
                    'model_id': model_id,
                    'accuracy': 85.0,
                    'sharpe_ratio': 1.5,
                    'last_updated': datetime.now().isoformat()
                }
                await self.cache_model_performance(model_id, mock_performance)
            
            logger.info("Cache warming completed successfully")
            
        except Exception as e:
            logger.error(f"Cache warming error: {e}")
    
    async def get_cache_metrics(self) -> CacheMetrics:
        """Get comprehensive cache performance metrics"""
        try:
            hit_rate = (self.metrics['hits'] / max(self.metrics['requests'], 1)) * 100
            avg_response_time = self.metrics['total_response_time'] / max(self.metrics['requests'], 1)
            
            # Redis-specific metrics
            memory_usage = 0
            keys_count = 0
            total_data_mb = 0
            
            if self.redis_client:
                try:
                    info = self.redis_client.info('memory')
                    memory_usage = info.get('used_memory', 0) / (1024 * 1024)  # Convert to MB
                    
                    keys_count = self.redis_client.dbsize()
                    total_data_mb = info.get('used_memory_dataset', 0) / (1024 * 1024)
                    
                except Exception as e:
                    logger.warning(f"Redis metrics error: {e}")
            
            # Add fallback cache metrics
            keys_count += len(self.fallback_cache)
            
            return CacheMetrics(
                total_requests=self.metrics['requests'],
                cache_hits=self.metrics['hits'],
                cache_misses=self.metrics['misses'],
                hit_rate=round(hit_rate, 2),
                avg_response_time_ms=round(avg_response_time, 2),
                total_data_mb=round(total_data_mb, 2),
                keys_count=keys_count,
                memory_usage_mb=round(memory_usage, 2)
            )
            
        except Exception as e:
            logger.error(f"Cache metrics error: {e}")
            return CacheMetrics(0, 0, 0, 0.0, 0.0, 0.0, 0, 0.0)
    
    async def cleanup_expired_entries(self):
        """Clean up expired entries from fallback cache"""
        try:
            current_time = datetime.now()
            expired_keys = []
            
            for key, entry in self.fallback_cache.items():
                if entry['expires'] <= current_time:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.fallback_cache[key]
            
            if expired_keys:
                logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
                
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.ping()
            return True
        except:
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive cache health check"""
        redis_connected = self.is_connected()
        metrics = await self.get_cache_metrics()
        
        return {
            'redis_connected': redis_connected,
            'fallback_cache_active': True,
            'total_requests': metrics.total_requests,
            'hit_rate_percent': metrics.hit_rate,
            'memory_usage_mb': metrics.memory_usage_mb,
            'keys_count': metrics.keys_count,
            'avg_response_time_ms': metrics.avg_response_time_ms,
            'status': 'healthy' if redis_connected else 'degraded'
        }

# Global cache service instance
redis_cache_service = RedisCacheService()