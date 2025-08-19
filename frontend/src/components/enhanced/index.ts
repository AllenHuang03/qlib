/**
 * Enhanced Trading Components Export
 * Professional-grade candlestick charting and trading interface components
 */

// Main Trading Interfaces
export { default as ProfessionalTradingDashboard } from './ProfessionalTradingDashboard';
export { default as EnhancedPremiumTradingInterface } from './EnhancedPremiumTradingInterface';
export { default as PremiumTradingInterface } from './PremiumTradingInterface';
export { default as PremiumDashboard } from './PremiumDashboard';

// Chart Components
export { default as CandlestickChart } from './CandlestickChart';
export { default as ChartToolbar } from './ChartToolbar';
export { default as ChartInteractionLayer } from './ChartInteractionLayer';
export { default as ChartPerformanceMonitor } from './ChartPerformanceMonitor';

// Technical Analysis
export { default as TechnicalIndicators } from './TechnicalIndicators';
export { default as SupportResistanceLevels } from './SupportResistanceLevels';
export { default as TradingSignalOverlay } from './TradingSignalOverlay';

// Market Data & Volume
export { default as VolumePanel } from './VolumePanel';

// Hooks
export { useChartPerformance } from '../../hooks/useChartPerformance';

// Services
export { default as marketDataService } from '../../services/marketDataService';

// Types
export * from '../../types/market';