"""
Payment Service for Qlib Pro
Handles Stripe payment processing for subscriptions and upgrades
"""
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# In production, install with: pip install stripe
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    print("Stripe not available. Install with: pip install stripe")
    STRIPE_AVAILABLE = False

logger = logging.getLogger(__name__)

class PaymentService:
    """Service for handling payment processing"""
    
    def __init__(self):
        self.stripe_enabled = False
        
        if STRIPE_AVAILABLE:
            # In production, use environment variables
            self.stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY', 'pk_test_...')
            self.stripe_secret_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_...')
            
            # Configure Stripe
            stripe.api_key = self.stripe_secret_key
            self.stripe_enabled = True
            logger.info("Stripe payment service initialized")
        
        # Pricing tiers
        self.pricing_tiers = {
            'pro': {
                'name': 'Qlib Pro',
                'price_aud': 2900,  # $29.00 AUD in cents
                'price_usd': 1999,  # $19.99 USD in cents
                'features': [
                    'Advanced AI Models',
                    'Real-time Trading Signals',
                    'Portfolio Management',
                    'Basic Backtesting',
                    'Email Support'
                ]
            },
            'premium': {
                'name': 'Qlib Premium',
                'price_aud': 9900,  # $99.00 AUD in cents
                'price_usd': 6999,  # $69.99 USD in cents
                'features': [
                    'All Pro Features',
                    'Custom Model Training',
                    'Advanced Backtesting',
                    'API Access',
                    'Priority Support',
                    'White-label Options'
                ]
            }
        }
    
    def create_payment_intent(self, amount: int, currency: str = 'aud', 
                            customer_email: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Create a Stripe Payment Intent"""
        if not self.stripe_enabled:
            return self._mock_payment_intent(amount, currency, customer_email, metadata)
        
        try:
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency.lower(),
                automatic_payment_methods={
                    'enabled': True,
                },
                receipt_email=customer_email,
                metadata=metadata or {},
                description=f"Qlib Pro Subscription - {metadata.get('tier', 'Unknown').title()}"
            )
            
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': amount,
                'currency': currency,
                'status': intent.status,
                'created': datetime.fromtimestamp(intent.created).isoformat()
            }
            
        except stripe.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise Exception(f"Payment processing error: {str(e)}")
    
    def _mock_payment_intent(self, amount: int, currency: str, 
                           customer_email: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Mock payment intent for testing without Stripe"""
        return {
            'client_secret': f'pi_mock_{datetime.now().strftime("%Y%m%d%H%M%S")}_secret_mock',
            'payment_intent_id': f'pi_mock_{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'amount': amount,
            'currency': currency,
            'status': 'requires_payment_method',
            'created': datetime.now().isoformat(),
            'mock': True
        }
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a payment and return status"""
        if not self.stripe_enabled:
            return self._mock_payment_confirmation(payment_intent_id)
        
        try:
            # Retrieve payment intent
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount_received': intent.amount_received,
                'currency': intent.currency,
                'customer_email': intent.receipt_email,
                'metadata': intent.metadata,
                'created': datetime.fromtimestamp(intent.created).isoformat(),
                'success': intent.status == 'succeeded'
            }
            
        except stripe.StripeError as e:
            logger.error(f"Error confirming payment: {e}")
            raise Exception(f"Payment confirmation error: {str(e)}")
    
    def _mock_payment_confirmation(self, payment_intent_id: str) -> Dict[str, Any]:
        """Mock payment confirmation for testing"""
        return {
            'payment_intent_id': payment_intent_id,
            'status': 'succeeded',
            'amount_received': 2900,  # Mock amount
            'currency': 'aud',
            'customer_email': 'demo@qlib.com',
            'metadata': {'tier': 'pro'},
            'created': datetime.now().isoformat(),
            'success': True,
            'mock': True
        }
    
    def create_subscription(self, customer_email: str, tier: str, 
                          payment_method_id: str = None) -> Dict[str, Any]:
        """Create a recurring subscription"""
        if not self.stripe_enabled:
            return self._mock_subscription(customer_email, tier)
        
        try:
            # Create or retrieve customer
            customers = stripe.Customer.list(email=customer_email, limit=1)
            
            if customers.data:
                customer = customers.data[0]
            else:
                customer = stripe.Customer.create(
                    email=customer_email,
                    description=f"Qlib Pro Customer - {tier.title()}"
                )
            
            # Get price based on tier
            tier_info = self.pricing_tiers.get(tier)
            if not tier_info:
                raise ValueError(f"Invalid subscription tier: {tier}")
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer.id,
                items=[{
                    'price_data': {
                        'currency': 'aud',
                        'product_data': {
                            'name': tier_info['name'],
                            'description': f"Monthly subscription to {tier_info['name']}"
                        },
                        'unit_amount': tier_info['price_aud'],
                        'recurring': {
                            'interval': 'month'
                        }
                    }
                }],
                payment_behavior='default_incomplete',
                payment_settings={
                    'save_default_payment_method': 'on_subscription'
                },
                expand=['latest_invoice.payment_intent']
            )
            
            return {
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret,
                'customer_id': customer.id,
                'status': subscription.status,
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat()
            }
            
        except stripe.StripeError as e:
            logger.error(f"Subscription creation error: {e}")
            raise Exception(f"Subscription error: {str(e)}")
    
    def _mock_subscription(self, customer_email: str, tier: str) -> Dict[str, Any]:
        """Mock subscription creation for testing"""
        return {
            'subscription_id': f'sub_mock_{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'client_secret': f'seti_mock_{datetime.now().strftime("%Y%m%d%H%M%S")}_secret_mock',
            'customer_id': f'cus_mock_{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'status': 'active',
            'current_period_end': (datetime.now() + timedelta(days=30)).isoformat(),
            'mock': True
        }
    
    def get_pricing_tiers(self) -> Dict[str, Any]:
        """Get available pricing tiers"""
        return self.pricing_tiers
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel a subscription"""
        if not self.stripe_enabled:
            return {'status': 'canceled', 'mock': True}
        
        try:
            subscription = stripe.Subscription.cancel(subscription_id)
            return {
                'subscription_id': subscription_id,
                'status': subscription.status,
                'canceled_at': datetime.fromtimestamp(subscription.canceled_at).isoformat()
            }
        except stripe.StripeError as e:
            logger.error(f"Subscription cancellation error: {e}")
            raise Exception(f"Cancellation error: {str(e)}")
    
    def get_customer_subscriptions(self, customer_email: str) -> Dict[str, Any]:
        """Get all subscriptions for a customer"""
        if not self.stripe_enabled:
            return {
                'subscriptions': [],
                'total': 0,
                'mock': True
            }
        
        try:
            # Find customer
            customers = stripe.Customer.list(email=customer_email, limit=1)
            
            if not customers.data:
                return {'subscriptions': [], 'total': 0}
            
            customer = customers.data[0]
            subscriptions = stripe.Subscription.list(customer=customer.id)
            
            return {
                'subscriptions': [
                    {
                        'id': sub.id,
                        'status': sub.status,
                        'current_period_end': datetime.fromtimestamp(sub.current_period_end).isoformat(),
                        'amount': sub.items.data[0].price.unit_amount,
                        'currency': sub.items.data[0].price.currency
                    }
                    for sub in subscriptions.data
                ],
                'total': len(subscriptions.data)
            }
            
        except stripe.StripeError as e:
            logger.error(f"Error fetching customer subscriptions: {e}")
            return {'subscriptions': [], 'total': 0, 'error': str(e)}
    
    def process_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """Process Stripe webhook events"""
        if not self.stripe_enabled:
            return {'status': 'mock webhook processed'}
        
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            
            # Handle different event types
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                logger.info(f"Payment succeeded: {payment_intent['id']}")
                
            elif event['type'] == 'invoice.payment_succeeded':
                invoice = event['data']['object']
                logger.info(f"Invoice payment succeeded: {invoice['id']}")
                
            elif event['type'] == 'customer.subscription.deleted':
                subscription = event['data']['object']
                logger.info(f"Subscription canceled: {subscription['id']}")
            
            return {
                'event_type': event['type'],
                'processed': True,
                'timestamp': datetime.now().isoformat()
            }
            
        except stripe.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise Exception("Invalid webhook signature")
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            raise Exception(f"Webhook error: {str(e)}")

# Global payment service instance
payment_service = PaymentService()