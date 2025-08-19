/**
 * Market Data Types for Trading Interface
 */

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlestickData extends OHLCV {
  date: string;
  symbol?: string;
}

export interface TechnicalIndicator {
  timestamp: number;
  value: number;
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER_UPPER' | 'BOLLINGER_LOWER' | 'BOLLINGER_MIDDLE';
}

export interface TradingSignal {
  id: string;
  symbol: string;
  timestamp: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  priceTarget: number;
  currentPrice: number;
  reasoning: string[];
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  type: 'ENTRY' | 'EXIT' | 'ALERT';
}

export interface SupportResistanceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  touches: number;
}

export interface MarketDataResponse {
  symbol: string;
  data: CandlestickData[];
  indicators?: TechnicalIndicator[];
  signals?: TradingSignal[];
  levels?: SupportResistanceLevel[];
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
}

export interface ChartConfig {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  indicators: string[];
  showVolume: boolean;
  showSignals: boolean;
  showLevels: boolean;
  theme: 'light' | 'dark';
  autoUpdate: boolean;
}

export interface ChartInteraction {
  type: 'ZOOM' | 'PAN' | 'CROSSHAIR' | 'SELECT';
  startTime?: number;
  endTime?: number;
  price?: number;
}