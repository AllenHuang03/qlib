export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'trader' | 'admin';
  userType: 'kyc_staff' | 'trading_agent' | 'admin' | 'support_staff';
  department: string;
  permissions: string[];
}

export interface KYCApplication {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'additional_info_required';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submissionDate: string;
  reviewDate?: string;
  reviewerId?: string;
  riskScore: number;
  documents: KYCDocument[];
  verificationNotes: string[];
  complianceFlags: ComplianceFlag[];
}

export interface KYCDocument {
  id: string;
  type: 'passport' | 'drivers_license' | 'proof_of_address' | 'bank_statement' | 'income_proof' | 'other';
  filename: string;
  uploadDate: string;
  status: 'pending' | 'verified' | 'rejected' | 'needs_clarification';
  aiAnalysis?: {
    confidence: number;
    extractedData: Record<string, any>;
    anomalies: string[];
    suggestions: string[];
  };
  reviewNotes?: string;
}

export interface ComplianceFlag {
  id: string;
  type: 'sanctions_check' | 'pep_check' | 'adverse_media' | 'high_risk_country' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  createdDate: string;
  resolvedDate?: string;
}

export interface ClientPortfolio {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalValue: number;
  cash: number;
  positions: Position[];
  performance: PerformanceMetrics;
  riskMetrics: RiskMetrics;
  lastUpdate: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  sector: string;
  assetClass: 'equity' | 'bond' | 'commodity' | 'currency' | 'crypto';
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  expectedShortfall: number;
  portfolioVolatility: number;
  concentrationRisk: number;
  correlationRisk: number;
}

export interface TradingModel {
  id: string;
  name: string;
  type: 'momentum' | 'value' | 'quality' | 'volatility' | 'multi_factor' | 'ml_based';
  status: 'active' | 'inactive' | 'training' | 'testing' | 'paused';
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    avgTrade: number;
  };
  allocatedCapital: number;
  lastTradeDate: string;
  createdDate: string;
  backtestResults?: BacktestResults;
  riskLimits: RiskLimits;
}

export interface BacktestResults {
  period: string;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  avgHoldingPeriod: number;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxSectorExposure: number;
  maxVaR: number;
  maxDrawdown: number;
  stopLoss: number;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
  targetPrice?: number;
  stopLoss?: number;
  generatedDate: string;
  expiryDate: string;
  modelId: string;
  executionStatus: 'pending' | 'executed' | 'cancelled' | 'expired';
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  category: 'technical' | 'account' | 'trading' | 'billing' | 'compliance' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo?: string;
  createdDate: string;
  lastUpdate: string;
  responses: TicketResponse[];
  escalationLevel: number;
  resolutionTime?: number;
  customerSatisfaction?: number;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'customer' | 'staff';
  message: string;
  attachments?: string[];
  timestamp: string;
  isInternal: boolean;
}

export interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'maintenance' | 'compliance' | 'trading';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  affectedSystems: string[];
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  createdDate: string;
  resolvedDate?: string;
  assignedTo?: string;
  actionsTaken?: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export interface DashboardMetrics {
  timestamp: string;
  metrics: Record<string, number | string>;
}

export interface StaffDashboard {
  userType: 'kyc_staff' | 'trading_agent' | 'admin' | 'support_staff';
  permissions: string[];
  tools: string[];
  metrics: DashboardMetrics;
}