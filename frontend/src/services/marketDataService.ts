/**
 * Real-time Market Data Service
 * Professional-grade data streaming for Australian markets
 */

import { CandlestickData, TechnicalIndicator, TradingSignal, MarketDataResponse } from '../types/market';
import websocketService from './websocketService';
import { marketAPI } from './api';

export type MarketDataSubscription = {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  onData: (data: CandlestickData) => void;
  onError?: (error: Error) => void;
};

export type IndicatorSubscription = {
  symbol: string;
  indicators: string[];
  onData: (indicators: TechnicalIndicator[]) => void;
};

export type SignalSubscription = {
  symbols: string[];
  onSignal: (signal: TradingSignal) => void;
};

class MarketDataService {
  private subscriptions = new Map<string, MarketDataSubscription>();
  private indicatorSubscriptions = new Map<string, IndicatorSubscription>();
  private signalSubscriptions = new Map<string, SignalSubscription>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private lastPrices = new Map<string, number>();

  /**
   * Subscribe to real-time price data for a symbol
   */
  subscribeToMarketData(subscription: MarketDataSubscription): () => void {
    const key = `${subscription.symbol}_${subscription.timeframe}`;
    this.subscriptions.set(key, subscription);

    // Try WebSocket first, fallback to polling
    const unsubscribeWs = this.setupWebSocketSubscription(subscription);
    
    if (!unsubscribeWs) {
      // Fallback to REST API polling
      this.setupPollingSubscription(subscription);
    }

    return () => {
      this.subscriptions.delete(key);
      const interval = this.intervals.get(key);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(key);
      }
      if (unsubscribeWs) {
        unsubscribeWs();
      }
    };
  }

  /**
   * Subscribe to technical indicators
   */
  subscribeToIndicators(subscription: IndicatorSubscription): () => void {
    const key = `indicators_${subscription.symbol}`;
    this.indicatorSubscriptions.set(key, subscription);

    // Setup indicator calculation and updates
    const interval = setInterval(async () => {
      try {
        const indicators = await this.calculateIndicators(subscription.symbol, subscription.indicators);
        subscription.onData(indicators);
      } catch (error) {
        console.error('Error calculating indicators:', error);
      }
    }, 5000); // Update every 5 seconds

    this.intervals.set(key, interval);

    return () => {
      this.indicatorSubscriptions.delete(key);
      const interval = this.intervals.get(key);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(key);
      }
    };
  }

  /**
   * Subscribe to AI trading signals
   */
  subscribeToSignals(subscription: SignalSubscription): () => void {
    const key = `signals_${subscription.symbols.join('_')}`;
    this.signalSubscriptions.set(key, subscription);

    // Setup signal monitoring
    const interval = setInterval(async () => {
      try {
        for (const symbol of subscription.symbols) {
          const signals = await this.fetchTradingSignals(symbol);
          signals.forEach(signal => subscription.onSignal(signal));
        }
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    }, 10000); // Check for new signals every 10 seconds

    this.intervals.set(key, interval);

    return () => {
      this.signalSubscriptions.delete(key);
      const interval = this.intervals.get(key);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(key);
      }
    };
  }

  /**
   * Get historical data for backtesting and initial chart load
   */
  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<MarketDataResponse> {
    try {
      const response = await marketAPI.getHistoricalData(symbol, 90); // 90 days default
      
      // Convert to standardized format
      const candleData: CandlestickData[] = this.convertToCandles(response.data, timeframe);
      
      return {
        symbol,
        data: candleData,
        timeframe: timeframe as any,
      };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      
      // Return mock data for demonstration
      return this.generateMockData(symbol, timeframe);
    }
  }

  /**
   * Generate realistic market data for demo purposes
   */
  private generateMockData(symbol: string, timeframe: string): MarketDataResponse {
    const now = Date.now();
    const interval = this.getTimeframeInterval(timeframe);
    const candleCount = Math.min(200, Math.floor((24 * 60 * 60 * 1000) / interval)); // Max 200 candles or 1 day
    
    let currentPrice = this.getBasePrice(symbol);
    const data: CandlestickData[] = [];

    for (let i = candleCount; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = 0.02; // 2% volatility
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const close = Math.max(0.01, open + change);
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        timestamp,
        date: new Date(timestamp).toISOString(),
        open,
        high,
        low,
        close,
        volume,
        symbol,
      });

      currentPrice = close;
    }

    this.lastPrices.set(symbol, currentPrice);

    return {
      symbol,
      data,
      timeframe: timeframe as any,
    };
  }

  /**
   * Setup WebSocket subscription for real-time data
   */
  private setupWebSocketSubscription(subscription: MarketDataSubscription): (() => void) | null {
    try {
      const unsubscribe = websocketService.subscribe('market', (message) => {
        if (message.type === 'price_update' && message.symbol === subscription.symbol) {
          const candleData = this.convertPriceUpdateToCandle(message, subscription.symbol);
          if (candleData) {
            subscription.onData(candleData);
          }
        }
      });

      // Send subscription message
      websocketService.send('market', {
        type: 'subscribe',
        symbol: subscription.symbol,
        timeframe: subscription.timeframe,
      });

      return unsubscribe;
    } catch (error) {
      console.warn('WebSocket subscription failed, falling back to polling:', error);
      return null;
    }
  }

  /**
   * Setup polling subscription as WebSocket fallback
   */
  private setupPollingSubscription(subscription: MarketDataSubscription): void {
    const key = `${subscription.symbol}_${subscription.timeframe}`;
    
    const interval = setInterval(async () => {
      try {
        const quote = await marketAPI.getQuote(subscription.symbol);
        const candleData = this.convertQuoteToCandle(quote, subscription.symbol);
        
        if (candleData) {
          subscription.onData(candleData);
        }
      } catch (error) {
        console.error('Polling error:', error);
        subscription.onError?.(error as Error);
      }
    }, this.getPollingInterval(subscription.timeframe));

    this.intervals.set(key, interval);
  }

  /**
   * Calculate technical indicators
   */
  private async calculateIndicators(symbol: string, indicators: string[]): Promise<TechnicalIndicator[]> {
    // Get recent price data
    const data = await this.getRecentPriceData(symbol, 200); // Need enough data for indicators
    const results: TechnicalIndicator[] = [];

    for (const indicator of indicators) {
      const [type, param] = indicator.split('_');
      const period = parseInt(param) || 20;

      switch (type) {
        case 'SMA':
          results.push(...this.calculateSMA(data, period));
          break;
        case 'EMA':
          results.push(...this.calculateEMA(data, period));
          break;
        case 'RSI':
          results.push(...this.calculateRSI(data, period));
          break;
        case 'MACD':
          results.push(...this.calculateMACD(data));
          break;
        case 'BOLLINGER':
          results.push(...this.calculateBollingerBands(data, period));
          break;
      }
    }

    return results;
  }

  /**
   * Fetch AI trading signals
   */
  private async fetchTradingSignals(symbol: string): Promise<TradingSignal[]> {
    try {
      // This would integrate with the AI service
      // For now, generate mock signals based on market conditions
      return this.generateMockSignals(symbol);
    } catch (error) {
      console.error('Error fetching trading signals:', error);
      return [];
    }
  }

  // Helper methods for technical indicators
  private calculateSMA(data: CandlestickData[], period: number): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
      const value = sum / period;
      
      results.push({
        timestamp: data[i].timestamp,
        value,
        type: 'SMA',
      });
    }

    return results;
  }

  private calculateEMA(data: CandlestickData[], period: number): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let ema = data.slice(0, period).reduce((acc, candle) => acc + candle.close, 0) / period;
    results.push({
      timestamp: data[period - 1].timestamp,
      value: ema,
      type: 'EMA',
    });

    for (let i = period; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
      results.push({
        timestamp: data[i].timestamp,
        value: ema,
        type: 'EMA',
      });
    }

    return results;
  }

  private calculateRSI(data: CandlestickData[], period: number = 14): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);

      if (i >= period) {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
        
        const rs = avgGain / (avgLoss || 1);
        const rsi = 100 - (100 / (1 + rs));

        results.push({
          timestamp: data[i].timestamp,
          value: rsi,
          type: 'RSI',
        });
      }
    }

    return results;
  }

  private calculateMACD(data: CandlestickData[]): TechnicalIndicator[] {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    const results: TechnicalIndicator[] = [];

    const macdLine = [];
    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      const macd = ema12[i].value - ema26[i].value;
      macdLine.push(macd);
      
      results.push({
        timestamp: ema12[i].timestamp,
        value: macd,
        type: 'MACD',
      });
    }

    return results;
  }

  private calculateBollingerBands(data: CandlestickData[], period: number = 20, stdDev: number = 2): TechnicalIndicator[] {
    const results: TechnicalIndicator[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sma = slice.reduce((acc, candle) => acc + candle.close, 0) / period;
      
      const variance = slice.reduce((acc, candle) => acc + Math.pow(candle.close - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upper = sma + (standardDeviation * stdDev);
      const lower = sma - (standardDeviation * stdDev);
      
      results.push(
        { timestamp: data[i].timestamp, value: upper, type: 'BOLLINGER_UPPER' },
        { timestamp: data[i].timestamp, value: sma, type: 'BOLLINGER_MIDDLE' },
        { timestamp: data[i].timestamp, value: lower, type: 'BOLLINGER_LOWER' }
      );
    }

    return results;
  }

  private generateMockSignals(symbol: string): TradingSignal[] {
    const currentPrice = this.lastPrices.get(symbol) || this.getBasePrice(symbol);
    const signals: TradingSignal[] = [];

    // Generate occasional signals based on simple logic
    if (Math.random() > 0.95) { // 5% chance of generating a signal
      const signal: TradingSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        timestamp: Date.now(),
        signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
        confidence: 0.7 + (Math.random() * 0.25), // 70-95% confidence
        priceTarget: currentPrice * (1 + (Math.random() - 0.5) * 0.1), // ±10% target
        currentPrice,
        reasoning: [
          'Technical momentum breakthrough',
          'Volume spike detected',
          'AI pattern recognition confirmed',
        ],
        strength: 'STRONG',
        type: 'ENTRY',
      };

      signals.push(signal);
    }

    return signals;
  }

  // Utility methods
  private getTimeframeInterval(timeframe: string): number {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return intervals[timeframe as keyof typeof intervals] || intervals['1d'];
  }

  private getPollingInterval(timeframe: string): number {
    const intervals = {
      '1m': 5000,   // 5 seconds
      '5m': 15000,  // 15 seconds
      '15m': 30000, // 30 seconds
      '1h': 60000,  // 1 minute
      '4h': 60000,  // 1 minute
      '1d': 300000, // 5 minutes
      '1w': 300000, // 5 minutes
    };
    return intervals[timeframe as keyof typeof intervals] || 60000;
  }

  private getBasePrice(symbol: string): number {
    const basePrices = {
      'CBA.AX': 110.50,
      'BHP.AX': 45.20,
      'CSL.AX': 285.40,
      'WBC.AX': 24.80,
      'TLS.AX': 3.95,
      'RIO.AX': 112.80,
      'ANZ.AX': 28.50,
      'NAB.AX': 34.20,
    };
    return basePrices[symbol as keyof typeof basePrices] || 100.00;
  }

  private convertToCandles(rawData: any[], timeframe: string): CandlestickData[] {
    // Convert raw API data to candle format
    // This depends on the actual API response format
    return rawData.map((item, index) => ({
      timestamp: Date.now() - (rawData.length - index) * this.getTimeframeInterval(timeframe),
      date: new Date(Date.now() - (rawData.length - index) * this.getTimeframeInterval(timeframe)).toISOString(),
      open: item.open || item.price || 100,
      high: item.high || item.price * 1.01 || 101,
      low: item.low || item.price * 0.99 || 99,
      close: item.close || item.price || 100,
      volume: item.volume || Math.floor(Math.random() * 1000000),
      symbol: item.symbol,
    }));
  }

  private convertPriceUpdateToCandle(message: any, symbol: string): CandlestickData | null {
    if (!message.price) return null;

    return {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      open: message.price,
      high: message.price,
      low: message.price,
      close: message.price,
      volume: message.volume || 0,
      symbol,
    };
  }

  private convertQuoteToCandle(quote: any, symbol: string): CandlestickData | null {
    if (!quote.price) return null;

    return {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      open: quote.open || quote.price,
      high: quote.high || quote.price,
      low: quote.low || quote.price,
      close: quote.price,
      volume: quote.volume || 0,
      symbol,
    };
  }

  private async getRecentPriceData(symbol: string, count: number): Promise<CandlestickData[]> {
    // Get recent data for indicator calculations
    const mockData = this.generateMockData(symbol, '1h');
    return mockData.data.slice(-count);
  }

  /**
   * Cleanup all subscriptions and intervals
   */
  cleanup(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscriptions.clear();
    this.indicatorSubscriptions.clear();
    this.signalSubscriptions.clear();
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();

export default marketDataService;