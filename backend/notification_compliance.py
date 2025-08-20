#!/usr/bin/env python3
"""
AUSTRALIAN COMPLIANCE & AUDIT SYSTEM
Comprehensive compliance framework for notification system following Australian regulations
"""

import logging
import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from enum import Enum
import pytz

logger = logging.getLogger(__name__)

# ================================
# COMPLIANCE REGULATIONS & ENUMS
# ================================

class ComplianceRegulation(str, Enum):
    """Australian compliance regulations"""
    ASIC_FINANCIAL_SERVICES = "asic_financial_services"
    PRIVACY_ACT_1988 = "privacy_act_1988"
    SPAM_ACT_2003 = "spam_act_2003"
    AML_CTF_ACT_2006 = "aml_ctf_act_2006"
    CORPORATIONS_ACT_2001 = "corporations_act_2001"
    CONSUMER_DATA_RIGHT = "consumer_data_right"

class ConsentType(str, Enum):
    """Types of user consent required"""
    EMAIL_MARKETING = "email_marketing"
    SMS_MARKETING = "sms_marketing"
    DATA_PROCESSING = "data_processing"
    THIRD_PARTY_SHARING = "third_party_sharing"
    ANALYTICS_TRACKING = "analytics_tracking"
    PERSONALISATION = "personalisation"

class AuditEventType(str, Enum):
    """Types of audit events"""
    NOTIFICATION_SENT = "notification_sent"
    NOTIFICATION_DELIVERED = "notification_delivered"
    NOTIFICATION_BOUNCED = "notification_bounced"
    NOTIFICATION_FAILED = "notification_failed"
    USER_UNSUBSCRIBED = "user_unsubscribed"
    PREFERENCE_CHANGED = "preference_changed"
    CONSENT_GRANTED = "consent_granted"
    CONSENT_WITHDRAWN = "consent_withdrawn"
    DATA_ACCESSED = "data_accessed"
    DATA_EXPORTED = "data_exported"
    DATA_DELETED = "data_deleted"
    COMPLIANCE_VIOLATION = "compliance_violation"

class DataRetentionPeriod(str, Enum):
    """Data retention periods per regulation"""
    NOTIFICATION_HISTORY = "2_years"
    AUDIT_LOGS = "7_years"
    CONSENT_RECORDS = "7_years"
    PERSONAL_DATA = "until_consent_withdrawn"
    FINANCIAL_COMMUNICATIONS = "7_years"

# ================================
# DATA MODELS
# ================================

@dataclass
class ConsentRecord:
    """User consent record for compliance tracking"""
    consent_id: str
    user_id: str
    consent_type: ConsentType
    granted: bool
    granted_at: Optional[str] = None
    withdrawn_at: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    legal_basis: Optional[str] = None
    purpose: Optional[str] = None
    source: Optional[str] = None  # web, mobile, api, etc.
    metadata: Dict[str, Any] = None

@dataclass
class ComplianceAuditEvent:
    """Detailed audit event for compliance tracking"""
    event_id: str
    event_type: AuditEventType
    user_id: str
    timestamp: str
    regulation_context: List[ComplianceRegulation]
    data_subjects: List[str]  # List of data subject IDs
    processing_purposes: List[str]
    legal_basis: str
    retention_period: str
    security_classification: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    details: Dict[str, Any] = None
    risk_score: int = 0  # 0-100, higher is riskier

@dataclass
class ComplianceViolation:
    """Record of compliance violations"""
    violation_id: str
    violation_type: str
    regulation: ComplianceRegulation
    severity: str  # low, medium, high, critical
    user_id: Optional[str]
    description: str
    detected_at: str
    resolved_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    reported_to_authority: bool = False
    authority_reference: Optional[str] = None

@dataclass
class DataSubjectRights:
    """Track data subject rights requests"""
    request_id: str
    user_id: str
    request_type: str  # access, rectification, erasure, portability
    submitted_at: str
    status: str  # pending, processing, completed, rejected
    processed_at: Optional[str] = None
    completed_at: Optional[str] = None
    response_data: Optional[Dict[str, Any]] = None
    rejection_reason: Optional[str] = None

# ================================
# COMPLIANCE MANAGER
# ================================

class AustralianComplianceManager:
    """Comprehensive compliance management for Australian regulations"""
    
    def __init__(self):
        # In-memory storage (replace with secure database in production)
        self.consent_records: Dict[str, ConsentRecord] = {}
        self.audit_events: Dict[str, ComplianceAuditEvent] = {}
        self.compliance_violations: Dict[str, ComplianceViolation] = {}
        self.data_subject_requests: Dict[str, DataSubjectRights] = {}
        
        # Australian timezone
        self.australia_tz = pytz.timezone('Australia/Sydney')
        
        # Compliance configuration
        self.config = self._load_compliance_config()
        
        logger.info("Australian compliance manager initialized")
    
    def _load_compliance_config(self) -> Dict[str, Any]:
        """Load compliance configuration"""
        return {
            'company_details': {
                'name': 'Qlib Pro Trading Platform Pty Ltd',
                'abn': '12 345 678 901',
                'afsl': '123456',
                'address': 'Level 10, 123 Collins Street, Melbourne VIC 3000, Australia',
                'contact_email': 'privacy@qlibpro.com.au',
                'contact_phone': '+61 3 9000 0000',
                'dpo_email': 'dpo@qlibpro.com.au'
            },
            'retention_periods': {
                DataRetentionPeriod.NOTIFICATION_HISTORY: 730,  # 2 years in days
                DataRetentionPeriod.AUDIT_LOGS: 2555,          # 7 years in days
                DataRetentionPeriod.CONSENT_RECORDS: 2555,     # 7 years in days
                DataRetentionPeriod.FINANCIAL_COMMUNICATIONS: 2555  # 7 years in days
            },
            'required_consents': {
                'marketing_emails': ConsentType.EMAIL_MARKETING,
                'marketing_sms': ConsentType.SMS_MARKETING,
                'data_processing': ConsentType.DATA_PROCESSING,
                'analytics': ConsentType.ANALYTICS_TRACKING
            },
            'notification_compliance': {
                'include_unsubscribe_link': True,
                'include_company_details': True,
                'include_privacy_notice': True,
                'max_marketing_frequency': 5,  # per week
                'require_opt_in': True
            }
        }
    
    # ================================
    # CONSENT MANAGEMENT
    # ================================
    
    def record_consent(self, user_id: str, consent_type: ConsentType, granted: bool,
                      ip_address: str = None, user_agent: str = None, 
                      legal_basis: str = None, source: str = None) -> str:
        """Record user consent for compliance tracking"""
        
        consent_id = self._generate_consent_id(user_id, consent_type)
        
        consent_record = ConsentRecord(
            consent_id=consent_id,
            user_id=user_id,
            consent_type=consent_type,
            granted=granted,
            granted_at=datetime.utcnow().isoformat() if granted else None,
            withdrawn_at=None if granted else datetime.utcnow().isoformat(),
            ip_address=ip_address,
            user_agent=user_agent,
            legal_basis=legal_basis or ('consent' if granted else 'withdrawal'),
            purpose=self._get_consent_purpose(consent_type),
            source=source or 'web',
            metadata={}
        )
        
        self.consent_records[consent_id] = consent_record
        
        # Create audit event
        self._create_audit_event(
            event_type=AuditEventType.CONSENT_GRANTED if granted else AuditEventType.CONSENT_WITHDRAWN,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988, ComplianceRegulation.SPAM_ACT_2003],
            legal_basis=legal_basis or 'consent',
            details={
                'consent_type': consent_type.value,
                'consent_id': consent_id,
                'granted': granted
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"Consent {'granted' if granted else 'withdrawn'} for user {user_id}: {consent_type.value}")
        return consent_id
    
    def check_consent(self, user_id: str, consent_type: ConsentType) -> bool:
        """Check if user has given consent for specific type"""
        for consent_record in self.consent_records.values():
            if (consent_record.user_id == user_id and 
                consent_record.consent_type == consent_type and 
                consent_record.granted and 
                consent_record.withdrawn_at is None):
                return True
        return False
    
    def get_user_consents(self, user_id: str) -> List[ConsentRecord]:
        """Get all consent records for a user"""
        return [
            consent for consent in self.consent_records.values()
            if consent.user_id == user_id
        ]
    
    def withdraw_consent(self, user_id: str, consent_type: ConsentType,
                        ip_address: str = None, user_agent: str = None) -> bool:
        """Withdraw user consent"""
        # Find active consent
        for consent_record in self.consent_records.values():
            if (consent_record.user_id == user_id and 
                consent_record.consent_type == consent_type and 
                consent_record.granted and 
                consent_record.withdrawn_at is None):
                
                # Mark as withdrawn
                consent_record.granted = False
                consent_record.withdrawn_at = datetime.utcnow().isoformat()
                
                # Create audit event
                self._create_audit_event(
                    event_type=AuditEventType.CONSENT_WITHDRAWN,
                    user_id=user_id,
                    regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988],
                    legal_basis='consent_withdrawal',
                    details={
                        'consent_type': consent_type.value,
                        'consent_id': consent_record.consent_id
                    },
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                
                logger.info(f"Consent withdrawn for user {user_id}: {consent_type.value}")
                return True
        
        return False
    
    # ================================
    # NOTIFICATION COMPLIANCE
    # ================================
    
    def validate_notification_compliance(self, user_id: str, notification_type: str,
                                       is_marketing: bool = False) -> Dict[str, Any]:
        """Validate notification compliance before sending"""
        
        compliance_result = {
            'compliant': True,
            'violations': [],
            'warnings': [],
            'required_elements': [],
            'consent_required': []
        }
        
        # Check SPAM Act 2003 compliance for marketing
        if is_marketing:
            if not self.check_consent(user_id, ConsentType.EMAIL_MARKETING):
                compliance_result['compliant'] = False
                compliance_result['violations'].append('No marketing email consent under SPAM Act 2003')
                compliance_result['consent_required'].append(ConsentType.EMAIL_MARKETING)
        
        # Check Privacy Act 1988 compliance
        if not self.check_consent(user_id, ConsentType.DATA_PROCESSING):
            compliance_result['warnings'].append('No explicit data processing consent recorded')
        
        # Required elements for all notifications
        compliance_result['required_elements'] = [
            'company_name_and_address',
            'unsubscribe_mechanism',
            'privacy_notice_link',
            'contact_details'
        ]
        
        # ASIC requirements for financial communications
        if 'trading' in notification_type.lower() or 'financial' in notification_type.lower():
            compliance_result['required_elements'].extend([
                'afsl_number',
                'financial_services_guide_link',
                'risk_warning',
                'general_advice_disclaimer'
            ])
        
        return compliance_result
    
    def add_compliance_footer(self, html_content: str, notification_type: str) -> str:
        """Add compliant footer to notification content"""
        
        company = self.config['company_details']
        
        footer = f"""
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
            <h4 style="color: #495057; margin-bottom: 15px;">Important Information</h4>
            
            <p><strong>{company['name']}</strong><br>
            {company['address']}<br>
            ABN: {company['abn']} | AFSL: {company['afsl']}</p>
            
            <p>This communication is issued by {company['name']}, holder of Australian Financial Services Licence {company['afsl']}. 
               Please consider our <a href="https://qlibpro.com.au/fsg">Financial Services Guide</a> and 
               <a href="https://qlibpro.com.au/pds">Product Disclosure Statement</a> before making investment decisions.</p>
            
            <p><strong>General Advice Warning:</strong> The information in this email is general in nature and does not constitute 
               personal financial advice. It has been prepared without taking into account your objectives, financial situation or needs. 
               Before acting on this information, you should consider the appropriateness of the information having regard to your own 
               objectives, financial situation and needs.</p>
            
            <p><strong>Risk Warning:</strong> All investments carry risk. Past performance does not guarantee future results. 
               You may lose some or all of your capital.</p>
            
            <p>For support, contact us at {company['contact_email']} or {company['contact_phone']}.</p>
            
            <p><strong>Privacy:</strong> We handle your personal information in accordance with our 
               <a href="https://qlibpro.com.au/privacy">Privacy Policy</a>. 
               To manage your communication preferences or unsubscribe, 
               <a href="https://qlibpro.com.au/preferences">click here</a>.</p>
            
            <p>© {datetime.now().year} {company['name']}. All rights reserved.</p>
        </div>
        """
        
        # Insert footer before closing body tag
        if '</body>' in html_content:
            html_content = html_content.replace('</body>', footer + '</body>')
        else:
            html_content += footer
        
        return html_content
    
    # ================================
    # AUDIT SYSTEM
    # ================================
    
    def _create_audit_event(self, event_type: AuditEventType, user_id: str,
                           regulation_context: List[ComplianceRegulation],
                           legal_basis: str, details: Dict[str, Any] = None,
                           ip_address: str = None, user_agent: str = None,
                           session_id: str = None) -> str:
        """Create comprehensive audit event"""
        
        event_id = self._generate_audit_id(event_type, user_id)
        
        audit_event = ComplianceAuditEvent(
            event_id=event_id,
            event_type=event_type,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat(),
            regulation_context=regulation_context,
            data_subjects=[user_id],
            processing_purposes=self._get_processing_purposes(event_type),
            legal_basis=legal_basis,
            retention_period=self._get_retention_period(event_type),
            security_classification='internal',
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            details=details or {},
            risk_score=self._calculate_risk_score(event_type, details)
        )
        
        self.audit_events[event_id] = audit_event
        
        # Check for potential compliance violations
        self._check_compliance_violations(audit_event)
        
        return event_id
    
    def audit_notification_sent(self, user_id: str, notification_data: Dict[str, Any]) -> str:
        """Audit notification sent event"""
        return self._create_audit_event(
            event_type=AuditEventType.NOTIFICATION_SENT,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988, ComplianceRegulation.SPAM_ACT_2003],
            legal_basis='consent' if notification_data.get('is_marketing') else 'legitimate_interest',
            details={
                'notification_type': notification_data.get('type'),
                'delivery_method': notification_data.get('delivery_method'),
                'message_id': notification_data.get('message_id'),
                'recipient': notification_data.get('recipient'),
                'is_marketing': notification_data.get('is_marketing', False),
                'provider': notification_data.get('provider')
            }
        )
    
    def audit_data_access(self, user_id: str, accessed_by: str, data_type: str,
                         purpose: str, ip_address: str = None) -> str:
        """Audit data access event"""
        return self._create_audit_event(
            event_type=AuditEventType.DATA_ACCESSED,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988, ComplianceRegulation.CONSUMER_DATA_RIGHT],
            legal_basis='legitimate_interest',
            details={
                'accessed_by': accessed_by,
                'data_type': data_type,
                'purpose': purpose,
                'timestamp': datetime.utcnow().isoformat()
            },
            ip_address=ip_address
        )
    
    # ================================
    # DATA SUBJECT RIGHTS
    # ================================
    
    def process_data_subject_request(self, user_id: str, request_type: str,
                                   additional_data: Dict[str, Any] = None) -> str:
        """Process data subject rights request"""
        
        request_id = self._generate_request_id(user_id, request_type)
        
        request = DataSubjectRights(
            request_id=request_id,
            user_id=user_id,
            request_type=request_type,
            submitted_at=datetime.utcnow().isoformat(),
            status='pending'
        )
        
        self.data_subject_requests[request_id] = request
        
        # Create audit event
        self._create_audit_event(
            event_type=AuditEventType.DATA_ACCESSED,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988, ComplianceRegulation.CONSUMER_DATA_RIGHT],
            legal_basis='data_subject_rights',
            details={
                'request_id': request_id,
                'request_type': request_type,
                'additional_data': additional_data
            }
        )
        
        logger.info(f"Data subject rights request submitted: {request_id} for user {user_id}")
        return request_id
    
    def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data for portability request"""
        
        exported_data = {
            'user_id': user_id,
            'export_date': datetime.utcnow().isoformat(),
            'consent_records': [
                asdict(consent) for consent in self.consent_records.values()
                if consent.user_id == user_id
            ],
            'audit_events': [
                asdict(event) for event in self.audit_events.values()
                if user_id in event.data_subjects
            ],
            'data_subject_requests': [
                asdict(request) for request in self.data_subject_requests.values()
                if request.user_id == user_id
            ]
        }
        
        # Audit the export
        self._create_audit_event(
            event_type=AuditEventType.DATA_EXPORTED,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988, ComplianceRegulation.CONSUMER_DATA_RIGHT],
            legal_basis='data_subject_rights',
            details={
                'export_size_bytes': len(json.dumps(exported_data)),
                'records_exported': len(exported_data['consent_records']) + len(exported_data['audit_events'])
            }
        )
        
        return exported_data
    
    def delete_user_data(self, user_id: str, reason: str = 'user_request') -> Dict[str, Any]:
        """Delete user data while maintaining audit trail"""
        
        deleted_count = 0
        retained_count = 0
        
        # Delete consent records (after retention period)
        for consent_id, consent in list(self.consent_records.items()):
            if consent.user_id == user_id:
                if self._can_delete_record(consent.granted_at or consent.withdrawn_at, DataRetentionPeriod.CONSENT_RECORDS):
                    del self.consent_records[consent_id]
                    deleted_count += 1
                else:
                    retained_count += 1
        
        # Audit events are never deleted, only anonymized
        for event in self.audit_events.values():
            if user_id in event.data_subjects:
                event.data_subjects = ['anonymized']
                event.details = {'anonymized': True}
                retained_count += 1
        
        # Create deletion audit event
        self._create_audit_event(
            event_type=AuditEventType.DATA_DELETED,
            user_id=user_id,
            regulation_context=[ComplianceRegulation.PRIVACY_ACT_1988],
            legal_basis='data_subject_rights',
            details={
                'deletion_reason': reason,
                'records_deleted': deleted_count,
                'records_retained': retained_count,
                'deletion_method': 'hard_delete_with_audit'
            }
        )
        
        logger.info(f"User data deletion completed for {user_id}: {deleted_count} deleted, {retained_count} retained")
        
        return {
            'user_id': user_id,
            'deleted_count': deleted_count,
            'retained_count': retained_count,
            'deletion_date': datetime.utcnow().isoformat()
        }
    
    # ================================
    # VIOLATION DETECTION
    # ================================
    
    def _check_compliance_violations(self, audit_event: ComplianceAuditEvent):
        """Check for potential compliance violations"""
        
        violations = []
        
        # Check for excessive marketing frequency
        if audit_event.event_type == AuditEventType.NOTIFICATION_SENT:
            if audit_event.details.get('is_marketing'):
                recent_marketing = self._count_recent_marketing_notifications(
                    audit_event.user_id, 
                    days=7
                )
                
                if recent_marketing > self.config['notification_compliance']['max_marketing_frequency']:
                    violations.append({
                        'type': 'excessive_marketing_frequency',
                        'regulation': ComplianceRegulation.SPAM_ACT_2003,
                        'severity': 'medium',
                        'description': f'User received {recent_marketing} marketing notifications in 7 days, exceeding limit of 5'
                    })
        
        # Check for notifications without consent
        if audit_event.event_type == AuditEventType.NOTIFICATION_SENT:
            if audit_event.legal_basis == 'consent' and audit_event.details.get('is_marketing'):
                if not self.check_consent(audit_event.user_id, ConsentType.EMAIL_MARKETING):
                    violations.append({
                        'type': 'notification_without_consent',
                        'regulation': ComplianceRegulation.SPAM_ACT_2003,
                        'severity': 'high',
                        'description': 'Marketing notification sent without valid consent'
                    })
        
        # Record violations
        for violation_data in violations:
            self._record_compliance_violation(audit_event, violation_data)
    
    def _record_compliance_violation(self, audit_event: ComplianceAuditEvent, 
                                   violation_data: Dict[str, Any]):
        """Record compliance violation"""
        
        violation_id = self._generate_violation_id(violation_data['type'], audit_event.user_id)
        
        violation = ComplianceViolation(
            violation_id=violation_id,
            violation_type=violation_data['type'],
            regulation=violation_data['regulation'],
            severity=violation_data['severity'],
            user_id=audit_event.user_id,
            description=violation_data['description'],
            detected_at=datetime.utcnow().isoformat()
        )
        
        self.compliance_violations[violation_id] = violation
        
        logger.warning(f"Compliance violation detected: {violation_id} - {violation_data['description']}")
        
        # Auto-resolve low severity violations
        if violation_data['severity'] == 'low':
            self._resolve_violation(violation_id, 'auto_resolved', 'Low severity violation auto-resolved')
    
    def _resolve_violation(self, violation_id: str, resolution_method: str, notes: str):
        """Resolve compliance violation"""
        
        violation = self.compliance_violations.get(violation_id)
        if violation:
            violation.resolved_at = datetime.utcnow().isoformat()
            violation.resolution_notes = f"{resolution_method}: {notes}"
            
            logger.info(f"Compliance violation resolved: {violation_id}")
    
    # ================================
    # UTILITY METHODS
    # ================================
    
    def _generate_consent_id(self, user_id: str, consent_type: ConsentType) -> str:
        """Generate unique consent ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        hash_input = f"{user_id}_{consent_type.value}_{timestamp}"
        return f"consent_{hashlib.sha256(hash_input.encode()).hexdigest()[:12]}"
    
    def _generate_audit_id(self, event_type: AuditEventType, user_id: str) -> str:
        """Generate unique audit ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        hash_input = f"{event_type.value}_{user_id}_{timestamp}"
        return f"audit_{hashlib.sha256(hash_input.encode()).hexdigest()[:16]}"
    
    def _generate_request_id(self, user_id: str, request_type: str) -> str:
        """Generate unique request ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        hash_input = f"{user_id}_{request_type}_{timestamp}"
        return f"dsr_{hashlib.sha256(hash_input.encode()).hexdigest()[:12]}"
    
    def _generate_violation_id(self, violation_type: str, user_id: str) -> str:
        """Generate unique violation ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        hash_input = f"{violation_type}_{user_id}_{timestamp}"
        return f"violation_{hashlib.sha256(hash_input.encode()).hexdigest()[:12]}"
    
    def _get_consent_purpose(self, consent_type: ConsentType) -> str:
        """Get purpose description for consent type"""
        purposes = {
            ConsentType.EMAIL_MARKETING: 'Send marketing and promotional emails',
            ConsentType.SMS_MARKETING: 'Send marketing and promotional SMS messages',
            ConsentType.DATA_PROCESSING: 'Process personal data for service delivery',
            ConsentType.THIRD_PARTY_SHARING: 'Share data with trusted third parties',
            ConsentType.ANALYTICS_TRACKING: 'Track usage for analytics and improvement',
            ConsentType.PERSONALISATION: 'Personalise content and recommendations'
        }
        return purposes.get(consent_type, 'General data processing')
    
    def _get_processing_purposes(self, event_type: AuditEventType) -> List[str]:
        """Get processing purposes for audit event"""
        purpose_map = {
            AuditEventType.NOTIFICATION_SENT: ['Service delivery', 'Customer communication'],
            AuditEventType.CONSENT_GRANTED: ['Consent management', 'Legal compliance'],
            AuditEventType.DATA_ACCESSED: ['Service delivery', 'System administration'],
            AuditEventType.DATA_EXPORTED: ['Data portability', 'User rights'],
            AuditEventType.DATA_DELETED: ['Data erasure', 'User rights']
        }
        return purpose_map.get(event_type, ['General processing'])
    
    def _get_retention_period(self, event_type: AuditEventType) -> str:
        """Get retention period for audit event"""
        if event_type in [AuditEventType.NOTIFICATION_SENT, AuditEventType.NOTIFICATION_DELIVERED]:
            return DataRetentionPeriod.NOTIFICATION_HISTORY
        else:
            return DataRetentionPeriod.AUDIT_LOGS
    
    def _calculate_risk_score(self, event_type: AuditEventType, details: Dict[str, Any]) -> int:
        """Calculate risk score for audit event"""
        base_scores = {
            AuditEventType.NOTIFICATION_SENT: 10,
            AuditEventType.CONSENT_GRANTED: 5,
            AuditEventType.CONSENT_WITHDRAWN: 15,
            AuditEventType.DATA_ACCESSED: 25,
            AuditEventType.DATA_EXPORTED: 50,
            AuditEventType.DATA_DELETED: 75,
            AuditEventType.COMPLIANCE_VIOLATION: 90
        }
        
        score = base_scores.get(event_type, 10)
        
        # Increase score for marketing notifications
        if details and details.get('is_marketing'):
            score += 10
        
        # Increase score for sensitive data
        if details and 'financial' in str(details).lower():
            score += 20
        
        return min(score, 100)
    
    def _count_recent_marketing_notifications(self, user_id: str, days: int) -> int:
        """Count recent marketing notifications for user"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        count = 0
        
        for event in self.audit_events.values():
            if (event.user_id == user_id and 
                event.event_type == AuditEventType.NOTIFICATION_SENT and
                event.details.get('is_marketing') and
                datetime.fromisoformat(event.timestamp.replace('Z', '+00:00')) > cutoff):
                count += 1
        
        return count
    
    def _can_delete_record(self, record_date: str, retention_period: DataRetentionPeriod) -> bool:
        """Check if record can be deleted based on retention policy"""
        if not record_date:
            return False
        
        record_datetime = datetime.fromisoformat(record_date.replace('Z', '+00:00'))
        retention_days = self.config['retention_periods'].get(retention_period, 2555)
        cutoff = datetime.utcnow() - timedelta(days=retention_days)
        
        return record_datetime < cutoff
    
    # ================================
    # REPORTING METHODS
    # ================================
    
    def get_compliance_report(self, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Filter events by date range
        relevant_events = [
            event for event in self.audit_events.values()
            if start_date <= datetime.fromisoformat(event.timestamp.replace('Z', '+00:00')) <= end_date
        ]
        
        # Filter violations by date range
        relevant_violations = [
            violation for violation in self.compliance_violations.values()
            if start_date <= datetime.fromisoformat(violation.detected_at.replace('Z', '+00:00')) <= end_date
        ]
        
        report = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'audit_summary': {
                'total_events': len(relevant_events),
                'events_by_type': {},
                'events_by_regulation': {},
                'high_risk_events': 0
            },
            'consent_summary': {
                'total_consents': len(self.consent_records),
                'consents_granted': 0,
                'consents_withdrawn': 0,
                'consent_types': {}
            },
            'compliance_violations': {
                'total_violations': len(relevant_violations),
                'violations_by_severity': {},
                'violations_by_regulation': {},
                'resolved_violations': 0
            },
            'data_subject_requests': {
                'total_requests': len(self.data_subject_requests),
                'requests_by_type': {},
                'pending_requests': 0
            }
        }
        
        # Populate audit summary
        for event in relevant_events:
            event_type = event.event_type.value
            report['audit_summary']['events_by_type'][event_type] = \
                report['audit_summary']['events_by_type'].get(event_type, 0) + 1
            
            for reg in event.regulation_context:
                reg_name = reg.value
                report['audit_summary']['events_by_regulation'][reg_name] = \
                    report['audit_summary']['events_by_regulation'].get(reg_name, 0) + 1
            
            if event.risk_score >= 70:
                report['audit_summary']['high_risk_events'] += 1
        
        # Populate consent summary
        for consent in self.consent_records.values():
            if consent.granted:
                report['consent_summary']['consents_granted'] += 1
            else:
                report['consent_summary']['consents_withdrawn'] += 1
            
            consent_type = consent.consent_type.value
            report['consent_summary']['consent_types'][consent_type] = \
                report['consent_summary']['consent_types'].get(consent_type, 0) + 1
        
        # Populate violations summary
        for violation in relevant_violations:
            severity = violation.severity
            report['compliance_violations']['violations_by_severity'][severity] = \
                report['compliance_violations']['violations_by_severity'].get(severity, 0) + 1
            
            regulation = violation.regulation.value
            report['compliance_violations']['violations_by_regulation'][regulation] = \
                report['compliance_violations']['violations_by_regulation'].get(regulation, 0) + 1
            
            if violation.resolved_at:
                report['compliance_violations']['resolved_violations'] += 1
        
        # Populate data subject requests
        for request in self.data_subject_requests.values():
            request_type = request.request_type
            report['data_subject_requests']['requests_by_type'][request_type] = \
                report['data_subject_requests']['requests_by_type'].get(request_type, 0) + 1
            
            if request.status == 'pending':
                report['data_subject_requests']['pending_requests'] += 1
        
        return report

# ================================
# SERVICE INSTANCE
# ================================

# Global compliance manager instance
compliance_manager = AustralianComplianceManager()

# Export compliance manager and key classes
__all__ = [
    'AustralianComplianceManager',
    'ComplianceRegulation',
    'ConsentType',
    'AuditEventType',
    'ConsentRecord',
    'ComplianceAuditEvent',
    'ComplianceViolation',
    'DataSubjectRights',
    'compliance_manager'
]