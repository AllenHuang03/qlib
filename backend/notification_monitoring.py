#!/usr/bin/env python3
"""
NOTIFICATION MONITORING & TESTING SYSTEM
Comprehensive monitoring, testing, and performance tracking for notification system
"""

import asyncio
import logging
import time
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json

# Import notification services
try:
    from notification_service import notification_service, NotificationType, NotificationPriority, NotificationStatus
    from notification_compliance import compliance_manager
    SERVICES_AVAILABLE = True
except ImportError:
    SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# MONITORING ENUMS & MODELS
# ================================

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    DOWN = "down"

class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class TestType(str, Enum):
    UNIT = "unit"
    INTEGRATION = "integration"
    LOAD = "load"
    SMOKE = "smoke"
    COMPLIANCE = "compliance"

@dataclass
class PerformanceMetric:
    """Performance metric tracking"""
    metric_name: str
    value: float
    unit: str
    timestamp: str
    tags: Dict[str, str] = None

@dataclass
class HealthCheck:
    """System health check result"""
    service_name: str
    status: HealthStatus
    response_time_ms: float
    message: str
    timestamp: str
    details: Dict[str, Any] = None

@dataclass
class TestResult:
    """Test execution result"""
    test_id: str
    test_type: TestType
    test_name: str
    status: str  # passed, failed, skipped
    duration_ms: float
    executed_at: str
    error_message: Optional[str] = None
    details: Dict[str, Any] = None

@dataclass
class MonitoringAlert:
    """Monitoring alert"""
    alert_id: str
    alert_level: AlertLevel
    service: str
    metric: str
    message: str
    threshold_value: float
    current_value: float
    triggered_at: str
    resolved_at: Optional[str] = None
    acknowledged: bool = False

# ================================
# NOTIFICATION MONITORING SERVICE
# ================================

class NotificationMonitoringService:
    """Comprehensive monitoring for notification system"""
    
    def __init__(self):
        self.metrics: Dict[str, List[PerformanceMetric]] = {}
        self.health_checks: Dict[str, HealthCheck] = {}
        self.alerts: Dict[str, MonitoringAlert] = {}
        self.test_results: Dict[str, TestResult] = {}
        
        # Performance thresholds
        self.thresholds = {
            'email_send_time_ms': 2000,
            'sms_send_time_ms': 1500,
            'template_render_time_ms': 100,
            'queue_processing_time_ms': 500,
            'delivery_success_rate_percent': 95.0,
            'bounce_rate_percent': 5.0,
            'unsubscribe_rate_percent': 2.0
        }
        
        # Start monitoring tasks
        if SERVICES_AVAILABLE:
            asyncio.create_task(self._start_monitoring_loop())
        
        logger.info("Notification monitoring service initialized")
    
    # ================================
    # PERFORMANCE METRICS
    # ================================
    
    def record_metric(self, metric_name: str, value: float, unit: str, tags: Dict[str, str] = None):
        """Record performance metric"""
        metric = PerformanceMetric(
            metric_name=metric_name,
            value=value,
            unit=unit,
            timestamp=datetime.utcnow().isoformat(),
            tags=tags or {}
        )
        
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        
        self.metrics[metric_name].append(metric)
        
        # Keep only last 1000 metrics per type
        if len(self.metrics[metric_name]) > 1000:
            self.metrics[metric_name] = self.metrics[metric_name][-1000:]
        
        # Check thresholds and create alerts
        self._check_metric_thresholds(metric_name, value)
    
    def get_metric_statistics(self, metric_name: str, hours: int = 24) -> Dict[str, Any]:
        """Get statistical analysis of metrics"""
        if metric_name not in self.metrics:
            return {'error': f'Metric {metric_name} not found'}
        
        # Filter by time range
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics[metric_name]
            if datetime.fromisoformat(m.timestamp.replace('Z', '+00:00')) > cutoff
        ]
        
        if not recent_metrics:
            return {'error': 'No recent metrics found'}
        
        values = [m.value for m in recent_metrics]
        
        return {
            'metric_name': metric_name,
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'std_dev': statistics.stdev(values) if len(values) > 1 else 0,
            'percentile_95': self._percentile(values, 95),
            'percentile_99': self._percentile(values, 99),
            'unit': recent_metrics[0].unit,
            'period_hours': hours,
            'calculated_at': datetime.utcnow().isoformat()
        }
    
    def _percentile(self, values: List[float], percentile: int) -> float:
        """Calculate percentile"""
        sorted_values = sorted(values)
        k = (len(sorted_values) - 1) * percentile / 100
        f = int(k)
        c = k - f
        if f == len(sorted_values) - 1:
            return sorted_values[f]
        return sorted_values[f] * (1 - c) + sorted_values[f + 1] * c
    
    # ================================
    # HEALTH CHECKS
    # ================================
    
    async def run_health_checks(self) -> Dict[str, HealthCheck]:
        """Run comprehensive health checks"""
        checks = {}
        
        # Email provider health
        checks['email_provider'] = await self._check_email_provider_health()
        
        # SMS provider health
        checks['sms_provider'] = await self._check_sms_provider_health()
        
        # Template engine health
        checks['template_engine'] = await self._check_template_engine_health()
        
        # Database health (compliance system)
        checks['compliance_system'] = await self._check_compliance_system_health()
        
        # Overall system health
        checks['overall_system'] = self._calculate_overall_health(checks)
        
        # Store results
        self.health_checks.update(checks)
        
        return checks
    
    async def _check_email_provider_health(self) -> HealthCheck:
        """Check email provider health"""
        start_time = time.time()
        
        try:
            if not SERVICES_AVAILABLE or not notification_service.email_provider:
                return HealthCheck(
                    service_name="email_provider",
                    status=HealthStatus.DOWN,
                    response_time_ms=0,
                    message="Email provider not available",
                    timestamp=datetime.utcnow().isoformat()
                )
            
            # Test email provider connection (mock test)
            await asyncio.sleep(0.1)  # Simulate provider check
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheck(
                service_name="email_provider",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                message="Email provider operational",
                timestamp=datetime.utcnow().isoformat(),
                details={'provider_type': 'mock' if not hasattr(notification_service.email_provider, 'client') else 'live'}
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                service_name="email_provider",
                status=HealthStatus.CRITICAL,
                response_time_ms=response_time,
                message=f"Email provider error: {str(e)}",
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def _check_sms_provider_health(self) -> HealthCheck:
        """Check SMS provider health"""
        start_time = time.time()
        
        try:
            if not SERVICES_AVAILABLE or not notification_service.sms_provider:
                return HealthCheck(
                    service_name="sms_provider",
                    status=HealthStatus.DOWN,
                    response_time_ms=0,
                    message="SMS provider not available",
                    timestamp=datetime.utcnow().isoformat()
                )
            
            # Test SMS provider connection
            await asyncio.sleep(0.1)  # Simulate provider check
            
            response_time = (time.time() - start_time) * 1000
            
            status = HealthStatus.HEALTHY if notification_service.sms_provider.enabled else HealthStatus.WARNING
            message = "SMS provider operational" if notification_service.sms_provider.enabled else "SMS provider in mock mode"
            
            return HealthCheck(
                service_name="sms_provider",
                status=status,
                response_time_ms=response_time,
                message=message,
                timestamp=datetime.utcnow().isoformat(),
                details={'enabled': notification_service.sms_provider.enabled}
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                service_name="sms_provider",
                status=HealthStatus.CRITICAL,
                response_time_ms=response_time,
                message=f"SMS provider error: {str(e)}",
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def _check_template_engine_health(self) -> HealthCheck:
        """Check template engine health"""
        start_time = time.time()
        
        try:
            if not SERVICES_AVAILABLE or not notification_service.template_engine:
                return HealthCheck(
                    service_name="template_engine",
                    status=HealthStatus.DOWN,
                    response_time_ms=0,
                    message="Template engine not available",
                    timestamp=datetime.utcnow().isoformat()
                )
            
            # Test template rendering
            test_data = {'user_name': 'Test User', 'current_year': 2024}
            rendered = notification_service.template_engine.render_template(
                NotificationType.WELCOME, test_data
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if 'subject' in rendered and 'html_content' in rendered:
                return HealthCheck(
                    service_name="template_engine",
                    status=HealthStatus.HEALTHY,
                    response_time_ms=response_time,
                    message="Template engine operational",
                    timestamp=datetime.utcnow().isoformat(),
                    details={'templates_loaded': len(notification_service.template_engine.templates)}
                )
            else:
                return HealthCheck(
                    service_name="template_engine",
                    status=HealthStatus.WARNING,
                    response_time_ms=response_time,
                    message="Template engine partially functional",
                    timestamp=datetime.utcnow().isoformat()
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                service_name="template_engine",
                status=HealthStatus.CRITICAL,
                response_time_ms=response_time,
                message=f"Template engine error: {str(e)}",
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def _check_compliance_system_health(self) -> HealthCheck:
        """Check compliance system health"""
        start_time = time.time()
        
        try:
            if not SERVICES_AVAILABLE or not compliance_manager:
                return HealthCheck(
                    service_name="compliance_system",
                    status=HealthStatus.DOWN,
                    response_time_ms=0,
                    message="Compliance system not available",
                    timestamp=datetime.utcnow().isoformat()
                )
            
            # Test compliance system
            test_consent = compliance_manager.record_consent(
                user_id="health_check_user",
                consent_type=compliance_manager.__class__.__dict__['ConsentType'].DATA_PROCESSING if hasattr(compliance_manager, 'ConsentType') else 'data_processing',
                granted=True
            )
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheck(
                service_name="compliance_system",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                message="Compliance system operational",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    'consent_records': len(compliance_manager.consent_records),
                    'audit_events': len(compliance_manager.audit_events)
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                service_name="compliance_system",
                status=HealthStatus.CRITICAL,
                response_time_ms=response_time,
                message=f"Compliance system error: {str(e)}",
                timestamp=datetime.utcnow().isoformat()
            )
    
    def _calculate_overall_health(self, checks: Dict[str, HealthCheck]) -> HealthCheck:
        """Calculate overall system health"""
        if not checks:
            return HealthCheck(
                service_name="overall_system",
                status=HealthStatus.DOWN,
                response_time_ms=0,
                message="No health checks available",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # Count statuses
        status_counts = {}
        total_response_time = 0
        
        for check in checks.values():
            if check.service_name == "overall_system":
                continue
                
            status_counts[check.status] = status_counts.get(check.status, 0) + 1
            total_response_time += check.response_time_ms
        
        avg_response_time = total_response_time / len([c for c in checks.values() if c.service_name != "overall_system"])
        
        # Determine overall status
        if HealthStatus.CRITICAL in status_counts:
            overall_status = HealthStatus.CRITICAL
            message = f"{status_counts[HealthStatus.CRITICAL]} critical service(s)"
        elif HealthStatus.DOWN in status_counts:
            overall_status = HealthStatus.DOWN  
            message = f"{status_counts[HealthStatus.DOWN]} service(s) down"
        elif HealthStatus.WARNING in status_counts:
            overall_status = HealthStatus.WARNING
            message = f"{status_counts[HealthStatus.WARNING]} service(s) with warnings"
        else:
            overall_status = HealthStatus.HEALTHY
            message = "All services operational"
        
        return HealthCheck(
            service_name="overall_system",
            status=overall_status,
            response_time_ms=avg_response_time,
            message=message,
            timestamp=datetime.utcnow().isoformat(),
            details=status_counts
        )
    
    # ================================
    # ALERTING SYSTEM
    # ================================
    
    def _check_metric_thresholds(self, metric_name: str, value: float):
        """Check metric against thresholds and create alerts"""
        threshold = self.thresholds.get(metric_name)
        if not threshold:
            return
        
        # Determine if this is a "lower is better" or "higher is better" metric
        lower_is_better = any(keyword in metric_name for keyword in ['time', 'latency', 'bounce', 'error'])
        
        if lower_is_better and value > threshold:
            self._create_alert(
                service="notification_system",
                metric=metric_name,
                message=f"{metric_name} exceeded threshold: {value} > {threshold}",
                threshold_value=threshold,
                current_value=value,
                alert_level=AlertLevel.WARNING if value < threshold * 1.5 else AlertLevel.ERROR
            )
        elif not lower_is_better and value < threshold:
            self._create_alert(
                service="notification_system",
                metric=metric_name,
                message=f"{metric_name} below threshold: {value} < {threshold}",
                threshold_value=threshold,
                current_value=value,
                alert_level=AlertLevel.WARNING if value > threshold * 0.8 else AlertLevel.ERROR
            )
    
    def _create_alert(self, service: str, metric: str, message: str, 
                     threshold_value: float, current_value: float, 
                     alert_level: AlertLevel = AlertLevel.WARNING):
        """Create monitoring alert"""
        alert_id = f"{service}_{metric}_{int(time.time())}"
        
        # Check if similar alert already exists
        similar_alerts = [
            alert for alert in self.alerts.values()
            if alert.service == service and alert.metric == metric and not alert.resolved_at
        ]
        
        if similar_alerts:
            # Update existing alert
            existing_alert = similar_alerts[0]
            existing_alert.current_value = current_value
            existing_alert.message = message
            return existing_alert.alert_id
        
        # Create new alert
        alert = MonitoringAlert(
            alert_id=alert_id,
            alert_level=alert_level,
            service=service,
            metric=metric,
            message=message,
            threshold_value=threshold_value,
            current_value=current_value,
            triggered_at=datetime.utcnow().isoformat()
        )
        
        self.alerts[alert_id] = alert
        logger.warning(f"Alert created: {alert_id} - {message}")
        
        return alert_id
    
    def resolve_alert(self, alert_id: str, resolution_notes: str = None) -> bool:
        """Resolve monitoring alert"""
        alert = self.alerts.get(alert_id)
        if alert:
            alert.resolved_at = datetime.utcnow().isoformat()
            if resolution_notes:
                alert.message += f" | Resolved: {resolution_notes}"
            logger.info(f"Alert resolved: {alert_id}")
            return True
        return False
    
    def get_active_alerts(self, alert_level: AlertLevel = None) -> List[MonitoringAlert]:
        """Get active alerts"""
        active_alerts = [
            alert for alert in self.alerts.values()
            if not alert.resolved_at
        ]
        
        if alert_level:
            active_alerts = [a for a in active_alerts if a.alert_level == alert_level]
        
        return sorted(active_alerts, key=lambda a: a.triggered_at, reverse=True)
    
    # ================================
    # TESTING FRAMEWORK
    # ================================
    
    async def run_smoke_tests(self) -> List[TestResult]:
        """Run smoke tests for critical functionality"""
        tests = [
            self._test_email_template_rendering,
            self._test_sms_template_rendering,
            self._test_notification_preferences,
            self._test_consent_management,
            self._test_compliance_validation
        ]
        
        results = []
        for test in tests:
            try:
                result = await test()
                results.append(result)
            except Exception as e:
                results.append(TestResult(
                    test_id=f"smoke_{test.__name__}",
                    test_type=TestType.SMOKE,
                    test_name=test.__name__,
                    status="failed",
                    duration_ms=0,
                    executed_at=datetime.utcnow().isoformat(),
                    error_message=str(e)
                ))
        
        return results
    
    async def _test_email_template_rendering(self) -> TestResult:
        """Test email template rendering"""
        start_time = time.time()
        test_id = "smoke_email_template_rendering"
        
        try:
            if not SERVICES_AVAILABLE:
                raise Exception("Services not available")
            
            # Test template rendering
            test_data = {
                'user_name': 'Test User',
                'user_email': 'test@example.com',
                'current_year': 2024
            }
            
            rendered = notification_service.template_engine.render_template(
                NotificationType.WELCOME, test_data
            )
            
            # Validate rendered content
            assert 'subject' in rendered
            assert 'html_content' in rendered
            assert 'text_content' in rendered
            assert 'Test User' in rendered['html_content']
            assert 'Test User' in rendered['text_content']
            
            duration = (time.time() - start_time) * 1000
            
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Email Template Rendering",
                status="passed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                details={'rendered_fields': list(rendered.keys())}
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Email Template Rendering",
                status="failed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
    
    async def _test_sms_template_rendering(self) -> TestResult:
        """Test SMS template rendering"""
        start_time = time.time()
        test_id = "smoke_sms_template_rendering"
        
        try:
            if not SERVICES_AVAILABLE:
                raise Exception("Services not available")
            
            # Test SMS template rendering
            test_data = {
                'user_name': 'Test User',
                'symbol': 'CBA.AX',
                'signal': 'BUY',
                'confidence': '88.5',
                'current_price': '95.20',
                'target_price': '102.00'
            }
            
            rendered = notification_service.template_engine.render_template(
                NotificationType.TRADING_SIGNAL_HIGH, test_data, 'sms'
            )
            
            # Validate rendered content
            assert 'sms_content' in rendered
            assert 'CBA.AX' in rendered['sms_content']
            assert 'BUY' in rendered['sms_content']
            assert len(rendered['sms_content']) <= 160  # SMS length limit
            
            duration = (time.time() - start_time) * 1000
            
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="SMS Template Rendering",
                status="passed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                details={'sms_length': len(rendered['sms_content'])}
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="SMS Template Rendering",
                status="failed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
    
    async def _test_notification_preferences(self) -> TestResult:
        """Test notification preferences management"""
        start_time = time.time()
        test_id = "smoke_notification_preferences"
        
        try:
            if not SERVICES_AVAILABLE:
                raise Exception("Services not available")
            
            test_user_id = f"test_user_{int(time.time())}"
            
            # Test creating preferences
            prefs = await notification_service.update_user_preferences(test_user_id, {
                'email_enabled': True,
                'sms_enabled': False,
                'trading_signals_email': True
            })
            
            assert prefs.user_id == test_user_id
            assert prefs.email_enabled == True
            assert prefs.sms_enabled == False
            
            # Test getting preferences
            retrieved_prefs = await notification_service.get_user_preferences(test_user_id)
            assert retrieved_prefs.user_id == test_user_id
            assert retrieved_prefs.email_enabled == True
            
            duration = (time.time() - start_time) * 1000
            
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Notification Preferences",
                status="passed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                details={'test_user_id': test_user_id}
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Notification Preferences",
                status="failed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
    
    async def _test_consent_management(self) -> TestResult:
        """Test consent management system"""
        start_time = time.time()
        test_id = "smoke_consent_management"
        
        try:
            if not SERVICES_AVAILABLE:
                raise Exception("Services not available")
            
            test_user_id = f"test_consent_user_{int(time.time())}"
            
            # Import consent types
            from notification_compliance import ConsentType
            
            # Test recording consent
            consent_id = compliance_manager.record_consent(
                user_id=test_user_id,
                consent_type=ConsentType.EMAIL_MARKETING,
                granted=True,
                ip_address="127.0.0.1"
            )
            
            assert consent_id is not None
            
            # Test checking consent
            has_consent = compliance_manager.check_consent(test_user_id, ConsentType.EMAIL_MARKETING)
            assert has_consent == True
            
            # Test withdrawing consent
            withdrawn = compliance_manager.withdraw_consent(test_user_id, ConsentType.EMAIL_MARKETING)
            assert withdrawn == True
            
            # Verify consent is withdrawn
            has_consent_after = compliance_manager.check_consent(test_user_id, ConsentType.EMAIL_MARKETING)
            assert has_consent_after == False
            
            duration = (time.time() - start_time) * 1000
            
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Consent Management",
                status="passed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                details={'test_user_id': test_user_id, 'consent_id': consent_id}
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Consent Management",
                status="failed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
    
    async def _test_compliance_validation(self) -> TestResult:
        """Test compliance validation"""
        start_time = time.time()
        test_id = "smoke_compliance_validation"
        
        try:
            if not SERVICES_AVAILABLE:
                raise Exception("Services not available")
            
            test_user_id = f"test_compliance_user_{int(time.time())}"
            
            # Test compliance validation
            compliance_result = compliance_manager.validate_notification_compliance(
                user_id=test_user_id,
                notification_type="marketing_email",
                is_marketing=True
            )
            
            assert 'compliant' in compliance_result
            assert 'violations' in compliance_result
            assert 'required_elements' in compliance_result
            
            # Should be non-compliant without consent
            assert compliance_result['compliant'] == False
            assert len(compliance_result['violations']) > 0
            
            duration = (time.time() - start_time) * 1000
            
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Compliance Validation",
                status="passed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                details={'violations_found': len(compliance_result['violations'])}
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return TestResult(
                test_id=test_id,
                test_type=TestType.SMOKE,
                test_name="Compliance Validation",
                status="failed",
                duration_ms=duration,
                executed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
    
    async def run_load_tests(self, concurrent_users: int = 10, duration_seconds: int = 30) -> List[TestResult]:
        """Run load tests for notification system"""
        start_time = time.time()
        
        # Create multiple concurrent notification sending tasks
        tasks = []
        for i in range(concurrent_users):
            task = asyncio.create_task(self._load_test_user(f"load_test_user_{i}", duration_seconds))
            tasks.append(task)
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        total_duration = (time.time() - start_time) * 1000
        successful_users = sum(1 for r in results if isinstance(r, dict) and r.get('success'))
        failed_users = len(results) - successful_users
        total_notifications = sum(r.get('notifications_sent', 0) for r in results if isinstance(r, dict))
        
        return [TestResult(
            test_id="load_test_aggregate",
            test_type=TestType.LOAD,
            test_name=f"Load Test - {concurrent_users} Users",
            status="passed" if failed_users == 0 else "failed",
            duration_ms=total_duration,
            executed_at=datetime.utcnow().isoformat(),
            details={
                'concurrent_users': concurrent_users,
                'successful_users': successful_users,
                'failed_users': failed_users,
                'total_notifications': total_notifications,
                'notifications_per_second': total_notifications / (total_duration / 1000) if total_duration > 0 else 0
            }
        )]
    
    async def _load_test_user(self, user_id: str, duration_seconds: int) -> Dict[str, Any]:
        """Simulate load test for single user"""
        end_time = time.time() + duration_seconds
        notifications_sent = 0
        errors = 0
        
        try:
            # Set up user preferences
            await notification_service.update_user_preferences(user_id, {
                'email_enabled': True,
                'trading_signals_email': True
            })
            
            while time.time() < end_time:
                try:
                    # Send various types of notifications
                    message_id = await notification_service.send_notification(
                        user_id=user_id,
                        notification_type=NotificationType.TRADING_SIGNAL_MEDIUM,
                        template_data={
                            'user_name': f'Load Test User {user_id}',
                            'user_email': f'{user_id}@loadtest.com',
                            'symbol': 'TEST.AX',
                            'signal': 'BUY',
                            'confidence': '75.0',
                            'current_price': '100.00',
                            'target_price': '110.00',
                            'reasoning': 'Load test signal'
                        }
                    )
                    
                    if message_id:
                        notifications_sent += 1
                    
                    # Small delay between notifications
                    await asyncio.sleep(0.1)
                
                except Exception as e:
                    errors += 1
                    logger.error(f"Load test error for {user_id}: {e}")
            
            return {
                'success': True,
                'user_id': user_id,
                'notifications_sent': notifications_sent,
                'errors': errors
            }
        
        except Exception as e:
            return {
                'success': False,
                'user_id': user_id,
                'error': str(e),
                'notifications_sent': notifications_sent,
                'errors': errors
            }
    
    # ================================
    # MONITORING LOOP
    # ================================
    
    async def _start_monitoring_loop(self):
        """Start continuous monitoring loop"""
        while True:
            try:
                # Run health checks every 5 minutes
                await self.run_health_checks()
                
                # Calculate and record system metrics
                await self._calculate_system_metrics()
                
                # Sleep for 5 minutes
                await asyncio.sleep(300)
            
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(60)  # Shorter sleep on error
    
    async def _calculate_system_metrics(self):
        """Calculate and record system-wide metrics"""
        if not SERVICES_AVAILABLE:
            return
        
        # Calculate delivery success rate
        total_messages = len(notification_service.notification_history)
        if total_messages > 0:
            successful_messages = sum(
                1 for msg in notification_service.notification_history.values()
                if msg.status in [NotificationStatus.SENT, NotificationStatus.DELIVERED]
            )
            success_rate = (successful_messages / total_messages) * 100
            self.record_metric('delivery_success_rate_percent', success_rate, 'percent')
            
            # Calculate bounce rate
            bounced_messages = sum(
                1 for msg in notification_service.notification_history.values()
                if msg.status == NotificationStatus.BOUNCED
            )
            bounce_rate = (bounced_messages / total_messages) * 100
            self.record_metric('bounce_rate_percent', bounce_rate, 'percent')
        
        # Record queue sizes
        self.record_metric('notification_history_size', len(notification_service.notification_history), 'count')
        self.record_metric('user_preferences_count', len(notification_service.user_preferences), 'count')
        
        # Record compliance metrics
        self.record_metric('consent_records_count', len(compliance_manager.consent_records), 'count')
        self.record_metric('audit_events_count', len(compliance_manager.audit_events), 'count')
        self.record_metric('compliance_violations_count', len(compliance_manager.compliance_violations), 'count')
    
    # ================================
    # REPORTING
    # ================================
    
    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data"""
        
        # Get recent metrics
        metrics_summary = {}
        for metric_name in self.metrics.keys():
            stats = self.get_metric_statistics(metric_name, hours=24)
            if 'error' not in stats:
                metrics_summary[metric_name] = {
                    'current': stats['mean'],
                    'trend': 'stable',  # Could calculate trend here
                    'status': 'normal' if stats['mean'] < self.thresholds.get(metric_name, float('inf')) else 'warning'
                }
        
        # Get health status summary
        health_summary = {}
        for service_name, health_check in self.health_checks.items():
            health_summary[service_name] = {
                'status': health_check.status,
                'response_time_ms': health_check.response_time_ms,
                'last_check': health_check.timestamp
            }
        
        # Get active alerts summary
        active_alerts = self.get_active_alerts()
        alerts_summary = {
            'total': len(active_alerts),
            'critical': len([a for a in active_alerts if a.alert_level == AlertLevel.CRITICAL]),
            'error': len([a for a in active_alerts if a.alert_level == AlertLevel.ERROR]),
            'warning': len([a for a in active_alerts if a.alert_level == AlertLevel.WARNING])
        }
        
        # Get test results summary
        recent_tests = [t for t in self.test_results.values() 
                       if datetime.fromisoformat(t.executed_at.replace('Z', '+00:00')) > datetime.utcnow() - timedelta(hours=24)]
        test_summary = {
            'total': len(recent_tests),
            'passed': len([t for t in recent_tests if t.status == 'passed']),
            'failed': len([t for t in recent_tests if t.status == 'failed']),
            'last_run': max([t.executed_at for t in recent_tests]) if recent_tests else None
        }
        
        return {
            'dashboard_generated_at': datetime.utcnow().isoformat(),
            'overall_health': self.health_checks.get('overall_system', {}).status if 'overall_system' in self.health_checks else 'unknown',
            'metrics': metrics_summary,
            'health_checks': health_summary,
            'alerts': alerts_summary,
            'tests': test_summary,
            'active_alerts': [asdict(alert) for alert in active_alerts[:10]]  # Latest 10 alerts
        }

# ================================
# SERVICE INSTANCE
# ================================

# Global monitoring service instance
monitoring_service = NotificationMonitoringService()

# Export monitoring service and key classes
__all__ = [
    'NotificationMonitoringService',
    'HealthStatus',
    'AlertLevel',
    'TestType',
    'PerformanceMetric',
    'HealthCheck',
    'TestResult',
    'MonitoringAlert',
    'monitoring_service'
]