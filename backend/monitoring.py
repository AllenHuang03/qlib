"""
Production Monitoring and Health Checks for Qlib Pro
Provides comprehensive system health monitoring and alerts
"""

import asyncio
import time
import psutil
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from dataclasses import dataclass
import aioredis
import httpx

# Prometheus Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
SYSTEM_CPU_USAGE = Gauge('system_cpu_usage_percent', 'System CPU usage')
SYSTEM_MEMORY_USAGE = Gauge('system_memory_usage_percent', 'System memory usage')
DATABASE_CONNECTIONS = Gauge('database_connections_active', 'Active database connections')
CACHE_HIT_RATE = Gauge('cache_hit_rate_percent', 'Cache hit rate percentage')

logger = logging.getLogger(__name__)

@dataclass
class HealthStatus:
    service: str
    status: str  # 'healthy', 'degraded', 'unhealthy'
    response_time_ms: float
    message: str
    timestamp: datetime

class ProductionMonitoring:
    """Comprehensive production monitoring system"""
    
    def __init__(self):
        self.health_checks = {}
        self.alerts = []
        self.metrics_cache = {}
        
    async def check_database_health(self) -> HealthStatus:
        """Check Supabase database connectivity and performance"""
        start_time = time.time()
        
        try:
            # Simple query to check database responsiveness
            # In production, this would use your actual database connection
            await asyncio.sleep(0.01)  # Simulate DB query
            
            response_time = (time.time() - start_time) * 1000
            
            if response_time < 100:
                status = "healthy"
                message = f"Database responding in {response_time:.1f}ms"
            elif response_time < 500:
                status = "degraded"  
                message = f"Database slow response: {response_time:.1f}ms"
            else:
                status = "unhealthy"
                message = f"Database timeout: {response_time:.1f}ms"
                
            return HealthStatus("database", status, response_time, message, datetime.now())
            
        except Exception as e:
            return HealthStatus(
                "database", "unhealthy", 
                (time.time() - start_time) * 1000,
                f"Database error: {str(e)}", 
                datetime.now()
            )
    
    async def check_cache_health(self) -> HealthStatus:
        """Check Redis cache connectivity and performance"""
        start_time = time.time()
        
        try:
            # Test Redis connection
            # In production, this would use your actual Redis connection
            await asyncio.sleep(0.005)  # Simulate cache operation
            
            response_time = (time.time() - start_time) * 1000
            
            # Calculate cache hit rate (simulated)
            hit_rate = 85.5  # This would come from actual Redis stats
            CACHE_HIT_RATE.set(hit_rate)
            
            if response_time < 10 and hit_rate > 80:
                status = "healthy"
                message = f"Cache responding in {response_time:.1f}ms, hit rate: {hit_rate:.1f}%"
            elif response_time < 50:
                status = "degraded"
                message = f"Cache performance degraded: {response_time:.1f}ms"
            else:
                status = "unhealthy"
                message = f"Cache issues: {response_time:.1f}ms"
                
            return HealthStatus("cache", status, response_time, message, datetime.now())
            
        except Exception as e:
            return HealthStatus(
                "cache", "unhealthy",
                (time.time() - start_time) * 1000,
                f"Cache error: {str(e)}",
                datetime.now()
            )
    
    async def check_external_apis(self) -> List[HealthStatus]:
        """Check external API dependencies"""
        apis_to_check = [
            {"name": "alpha_vantage", "url": "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=1min&apikey=demo"},
            {"name": "yahoo_finance", "url": "https://query1.finance.yahoo.com/v8/finance/chart/AAPL"},
        ]
        
        results = []
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for api in apis_to_check:
                start_time = time.time()
                try:
                    response = await client.get(api["url"])
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status_code == 200 and response_time < 2000:
                        status = "healthy"
                        message = f"API responding in {response_time:.1f}ms"
                    elif response.status_code == 200:
                        status = "degraded"
                        message = f"API slow: {response_time:.1f}ms"
                    else:
                        status = "unhealthy"
                        message = f"API error: HTTP {response.status_code}"
                        
                    results.append(HealthStatus(
                        api["name"], status, response_time, message, datetime.now()
                    ))
                    
                except Exception as e:
                    response_time = (time.time() - start_time) * 1000
                    results.append(HealthStatus(
                        api["name"], "unhealthy", response_time,
                        f"API connection failed: {str(e)}", datetime.now()
                    ))
        
        return results
    
    async def check_system_resources(self) -> HealthStatus:
        """Monitor system resource usage"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            disk_percent = psutil.disk_usage('/').percent
            
            # Update Prometheus metrics
            SYSTEM_CPU_USAGE.set(cpu_percent)
            SYSTEM_MEMORY_USAGE.set(memory_percent)
            
            if cpu_percent < 80 and memory_percent < 80 and disk_percent < 85:
                status = "healthy"
                message = f"Resources OK: CPU {cpu_percent:.1f}%, RAM {memory_percent:.1f}%, Disk {disk_percent:.1f}%"
            elif cpu_percent < 90 and memory_percent < 90 and disk_percent < 95:
                status = "degraded" 
                message = f"Resource pressure: CPU {cpu_percent:.1f}%, RAM {memory_percent:.1f}%, Disk {disk_percent:.1f}%"
            else:
                status = "unhealthy"
                message = f"Resource critical: CPU {cpu_percent:.1f}%, RAM {memory_percent:.1f}%, Disk {disk_percent:.1f}%"
                
            return HealthStatus("system", status, 0, message, datetime.now())
            
        except Exception as e:
            return HealthStatus(
                "system", "unhealthy", 0,
                f"System monitoring error: {str(e)}", 
                datetime.now()
            )
    
    async def perform_comprehensive_health_check(self) -> Dict[str, Any]:
        """Perform all health checks and return comprehensive status"""
        
        # Run all health checks concurrently
        db_check = asyncio.create_task(self.check_database_health())
        cache_check = asyncio.create_task(self.check_cache_health())
        api_checks = asyncio.create_task(self.check_external_apis())
        system_check = asyncio.create_task(self.check_system_resources())
        
        # Wait for all checks to complete
        db_status = await db_check
        cache_status = await cache_check
        api_statuses = await api_checks
        system_status = await system_check
        
        # Compile results
        all_checks = [db_status, cache_status, system_status] + api_statuses
        
        # Determine overall health
        healthy_count = sum(1 for check in all_checks if check.status == "healthy")
        degraded_count = sum(1 for check in all_checks if check.status == "degraded") 
        unhealthy_count = sum(1 for check in all_checks if check.status == "unhealthy")
        
        if unhealthy_count > 0:
            overall_status = "unhealthy"
        elif degraded_count > 0:
            overall_status = "degraded"
        else:
            overall_status = "healthy"
        
        # Check if we need to trigger alerts
        if overall_status != "healthy":
            await self.trigger_alert(overall_status, all_checks)
        
        return {
            "overall_status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_checks": len(all_checks),
                "healthy": healthy_count,
                "degraded": degraded_count, 
                "unhealthy": unhealthy_count
            },
            "details": {
                "database": {
                    "status": db_status.status,
                    "response_time_ms": db_status.response_time_ms,
                    "message": db_status.message
                },
                "cache": {
                    "status": cache_status.status,
                    "response_time_ms": cache_status.response_time_ms,
                    "message": cache_status.message
                },
                "system": {
                    "status": system_status.status,
                    "message": system_status.message
                },
                "external_apis": [
                    {
                        "service": api.service,
                        "status": api.status,
                        "response_time_ms": api.response_time_ms,
                        "message": api.message
                    }
                    for api in api_statuses
                ]
            }
        }
    
    async def trigger_alert(self, severity: str, failed_checks: List[HealthStatus]):
        """Trigger alerts for system issues"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "severity": severity,
            "message": f"System health check failed: {severity}",
            "failed_services": [
                check.service for check in failed_checks 
                if check.status != "healthy"
            ]
        }
        
        self.alerts.append(alert)
        logger.error(f"ALERT: {alert}")
        
        # In production, this would send notifications via:
        # - Slack webhook
        # - Email alerts
        # - PagerDuty
        # - SMS notifications
    
    def get_metrics(self) -> str:
        """Return Prometheus metrics"""
        return generate_latest()

# Initialize monitoring
monitoring = ProductionMonitoring()

# FastAPI routes for health checks
def setup_monitoring_routes(app: FastAPI):
    """Add monitoring routes to FastAPI app"""
    
    @app.get("/health")
    async def health_check():
        """Basic health check endpoint"""
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}
    
    @app.get("/health/detailed")
    async def detailed_health_check():
        """Comprehensive health check with all services"""
        return await monitoring.perform_comprehensive_health_check()
    
    @app.get("/metrics")
    async def prometheus_metrics():
        """Prometheus metrics endpoint"""
        return monitoring.get_metrics()
    
    @app.get("/health/database")
    async def database_health():
        """Database-specific health check"""
        status = await monitoring.check_database_health()
        return {
            "service": status.service,
            "status": status.status,
            "response_time_ms": status.response_time_ms,
            "message": status.message,
            "timestamp": status.timestamp.isoformat()
        }
    
    @app.get("/alerts")
    async def get_alerts():
        """Get recent system alerts"""
        return {
            "alerts": monitoring.alerts[-10:],  # Last 10 alerts
            "total_alerts": len(monitoring.alerts)
        }
    
    @app.middleware("http")
    async def metrics_middleware(request, call_next):
        """Middleware to collect request metrics"""
        start_time = time.time()
        
        response = await call_next(request)
        
        # Record metrics
        duration = time.time() - start_time
        REQUEST_DURATION.observe(duration)
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        return response