// Export all customer journey components
export { default as CustomerJourneyOrchestrator } from './CustomerJourneyOrchestrator';
export { default as NewCustomerOnboarding } from './NewCustomerOnboarding';
export { default as VerifiedCustomerFlow } from './VerifiedCustomerFlow';
export { default as PremiumCustomerFlow } from './PremiumCustomerFlow';
export { default as InstitutionalClientFlow } from './InstitutionalClientFlow';

// Export types if needed
export interface CustomerJourneyProps {
  user: any;
  onJourneyComplete?: (journeyType: string) => void;
}

export interface CustomerFlowProps {
  user: any;
  onStartKYC?: () => void;
}