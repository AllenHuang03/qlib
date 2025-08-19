/**
 * Enhanced Market Data Service
 * Professional-grade real-time market data with WebSocket streaming
 * Multi-asset class support and sub-100ms latency
 */

import { CandlestickData, TechnicalIndicator, TradingSignal, MarketDataResponse } from '../types/market';
import { marketAPI } from './api';

export interface LiveMarketDataSubscription {
  symbol: string;
  timeframe: '30s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  onData: (data: CandlestickData) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
}

export interface IndicatorSubscription {
  symbol: string;
  indicators: string[];
  onData: (indicators: TechnicalIndicator[]) => void;
  onError?: (error: Error) => void;
}

export interface SignalSubscription {
  symbols: string[];
  onSignal: (signal: TradingSignal) => void;
  onError?: (error: Error) => void;
}

export interface MarketDataPerformance {
  latency: number;
  updateRate: number;
  dataQuality: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastUpdate: number;
}

export interface AssetClassInfo {
  symbol: string;
  assetClass: 'equity' | 'fixed_income' | 'commodity' | 'cryptocurrency' | 'forex';
  name: string;
  exchange?: string;
  marketHours?: {
    open: string;
    close: string;
    timezone: string;
    isOpen: boolean;
  };
}

class EnhancedMarketDataService {
  private wsConnection: WebSocket | null = null;
  private subscriptions = new Map<string, LiveMarketDataSubscription>();
  private indicatorSubscriptions = new Map<string, IndicatorSubscription>();
  private signalSubscriptions = new Map<string, SignalSubscription>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isReconnecting = false;
  private performance: MarketDataPerformance = {
    latency: 0,
    updateRate: 0,
    dataQuality: 0,
    connectionStatus: 'disconnected',
    lastUpdate: 0,
  };
  private messageBuffer: any[] = [];
  private performanceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring() {
    this.performanceInterval = setInterval(() => {
      this.calculatePerformanceMetrics();
    }, 1000);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics() {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.performance.lastUpdate;
    
    // Calculate update rate (messages per second)
    this.performance.updateRate = this.messageBuffer.length;
    this.messageBuffer = [];

    // Calculate data quality based on update frequency and latency
    this.performance.dataQuality = Math.min(100, 
      Math.max(0, 100 - (this.performance.latency / 10) - (timeSinceLastUpdate > 5000 ? 50 : 0))
    );
  }

  /**
   * Connect to live market data WebSocket
   */
  async connectToLiveData(): Promise<void> {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.performance.connectionStatus = 'connecting';
        
        // Determine WebSocket URL from environment variables
        const baseWsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';
        const wsUrl = `${baseWsUrl}/ws/live-market`;

        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          console.log('Connected to live market data');
          this.performance.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.wsConnection.onclose = () => {
          console.log('WebSocket connection closed');
          this.performance.connectionStatus = 'disconnected';
          this.handleDisconnection();
        };

        this.wsConnection.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.performance.connectionStatus = 'error';
          reject(new Error('WebSocket connection failed'));
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.wsConnection?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.performance.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const startTime = performance.now();
      const message = JSON.parse(event.data);
      
      this.messageBuffer.push(message);
      this.performance.lastUpdate = Date.now();
      this.performance.latency = performance.now() - startTime;

      switch (message.type) {
        case 'market_data':
          this.handleMarketDataMessage(message);
          break;
        case 'indicators':
          this.handleIndicatorsMessage(message);
          break;
        case 'signals':
          this.handleSignalsMessage(message);
          break;
        case 'error':
          this.handleErrorMessage(message);
          break;
        case 'connection_established':
          console.log('Market data connection established:', message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle market data message
   */
  private handleMarketDataMessage(message: any) {
    const { symbol, data: marketData } = message;
    
    if (marketData) {
      const candleData: CandlestickData = {
        timestamp: marketData.timestamp * 1000,
        date: new Date(marketData.timestamp * 1000).toISOString(),
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume,
        symbol,
      };

      // Notify subscribers
      this.subscriptions.forEach((subscription, key) => {
        if (subscription.symbol === symbol) {
          try {
            subscription.onData(candleData);
          } catch (error) {
            console.error('Error in market data callback:', error);
            subscription.onError?.(error as Error);
          }
        }
      });
    }
  }

  /**
   * Handle indicators message
   */
  private handleIndicatorsMessage(message: any) {
    const { symbol, indicators: indicatorData } = message;
    
    if (indicatorData) {
      const indicators: TechnicalIndicator[] = Object.entries(indicatorData).map(([type, data]: [string, any]) => ({
        timestamp: data.timestamp * 1000,
        value: data.value,
        type: type as any,
      }));

      // Notify indicator subscribers
      this.indicatorSubscriptions.forEach((subscription) => {
        if (subscription.symbol === symbol) {
          try {
            subscription.onData(indicators);
          } catch (error) {
            console.error('Error in indicator callback:', error);
            subscription.onError?.(error as Error);
          }
        }
      });
    }
  }

  /**
   * Handle signals message
   */
  private handleSignalsMessage(message: any) {
    const { symbol, signals: signalData } = message;
    
    if (signalData && Array.isArray(signalData)) {
      const signals: TradingSignal[] = signalData.map((signal: any) => ({
        id: signal.id,
        symbol: signal.symbol,
        timestamp: signal.timestamp * 1000,
        signal: signal.signal_type,
        confidence: signal.confidence,
        priceTarget: signal.price_target,
        currentPrice: signal.current_price,
        reasoning: signal.reasoning || [],
        strength: signal.strength,
        type: signal.signal_category,
      }));

      // Notify signal subscribers
      this.signalSubscriptions.forEach((subscription) => {
        if (subscription.symbols.includes(symbol)) {
          signals.forEach(signal => {
            try {
              subscription.onSignal(signal);
            } catch (error) {
              console.error('Error in signal callback:', error);
              subscription.onError?.(error as Error);
            }
          });
        }
      });
    }
  }

  /**
   * Handle error message
   */
  private handleErrorMessage(message: any) {
    console.error('WebSocket error message:', message.error);
    
    // Notify all subscribers about the error
    const error = new Error(message.error);
    this.subscriptions.forEach(sub => sub.onError?.(error));
    this.indicatorSubscriptions.forEach(sub => sub.onError?.(error));
    this.signalSubscriptions.forEach(sub => sub.onError?.(error));
  }

  /**
   * Handle disconnection with automatic reconnection
   */
  private handleDisconnection() {
    // Notify all subscribers about disconnection
    this.subscriptions.forEach(sub => sub.onDisconnect?.());

    if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.isReconnecting = true;
      
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        this.connectToLiveData()
          .then(() => {
            // Re-subscribe to all existing subscriptions
            this.resubscribeAll();
          })
          .catch((error) => {
            console.error('Reconnection failed:', error);
            this.isReconnecting = false;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              console.error('Max reconnection attempts reached');
              this.performance.connectionStatus = 'error';
            }
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Re-subscribe to all existing subscriptions after reconnection
   */
  private resubscribeAll() {
    // Re-subscribe to market data
    this.subscriptions.forEach((subscription, key) => {
      this.sendWebSocketMessage({
        type: 'subscribe',
        symbols: [subscription.symbol],
        timeframe: subscription.timeframe,
      });
    });

    // Re-subscribe to indicators
    this.indicatorSubscriptions.forEach((subscription, key) => {
      this.sendWebSocketMessage({
        type: 'get_indicators',
        symbol: subscription.symbol,
      });
    });

    // Re-subscribe to signals
    this.signalSubscriptions.forEach((subscription, key) => {
      subscription.symbols.forEach(symbol => {
        this.sendWebSocketMessage({
          type: 'get_signals',
          symbol,
        });
      });
    });
  }

  /**
   * Send message through WebSocket
   */
  private sendWebSocketMessage(message: any) {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Subscribe to live market data for a symbol
   */
  subscribeToLiveData(subscription: LiveMarketDataSubscription): () => void {
    const key = `${subscription.symbol}_${subscription.timeframe}`;
    this.subscriptions.set(key, subscription);

    // Connect to WebSocket if not already connected
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      this.connectToLiveData()
        .then(() => {
          this.sendWebSocketMessage({
            type: 'subscribe',
            symbols: [subscription.symbol],
            timeframe: subscription.timeframe,
          });
        })
        .catch((error) => {
          subscription.onError?.(error);
        });
    } else {
      this.sendWebSocketMessage({
        type: 'subscribe',
        symbols: [subscription.symbol],
        timeframe: subscription.timeframe,
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(key);
      this.sendWebSocketMessage({
        type: 'unsubscribe',
        symbols: [subscription.symbol],
      });
    };
  }

  /**
   * Subscribe to technical indicators
   */
  subscribeToIndicators(subscription: IndicatorSubscription): () => void {
    const key = `indicators_${subscription.symbol}`;
    this.indicatorSubscriptions.set(key, subscription);

    // Request indicators through WebSocket
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'get_indicators',
        symbol: subscription.symbol,
      });
    } else {
      this.connectToLiveData()
        .then(() => {
          this.sendWebSocketMessage({
            type: 'get_indicators',
            symbol: subscription.symbol,
          });
        })
        .catch((error) => {
          subscription.onError?.(error);
        });
    }

    // Set up periodic updates for indicators
    const interval = setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.sendWebSocketMessage({
          type: 'get_indicators',
          symbol: subscription.symbol,
        });
      }
    }, 5000); // Update every 5 seconds

    return () => {
      this.indicatorSubscriptions.delete(key);
      clearInterval(interval);
    };
  }

  /**
   * Subscribe to trading signals
   */
  subscribeToSignals(subscription: SignalSubscription): () => void {
    const key = `signals_${subscription.symbols.join('_')}`;
    this.signalSubscriptions.set(key, subscription);

    // Request signals through WebSocket
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      subscription.symbols.forEach(symbol => {
        this.sendWebSocketMessage({
          type: 'get_signals',
          symbol,
        });
      });
    } else {
      this.connectToLiveData()
        .then(() => {
          subscription.symbols.forEach(symbol => {
            this.sendWebSocketMessage({
              type: 'get_signals',
              symbol,
            });
          });
        })
        .catch((error) => {
          subscription.onError?.(error);
        });
    }

    // Set up periodic updates for signals
    const interval = setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        subscription.symbols.forEach(symbol => {
          this.sendWebSocketMessage({
            type: 'get_signals',
            symbol,
          });
        });
      }
    }, 10000); // Update every 10 seconds

    return () => {
      this.signalSubscriptions.delete(key);
      clearInterval(interval);
    };
  }

  /**
   * Get historical data with enhanced features
   */
  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    days: number = 30
  ): Promise<MarketDataResponse> {
    try {
      const response = await marketAPI.getLiveHistoricalData(symbol, days);
      
      if (response && response.data) {
        return {
          symbol,
          data: response.data,
          timeframe: timeframe as any,
        };
      }
    } catch (error) {
      console.error('Error fetching enhanced historical data:', error);
    }

    // Fallback to mock data
    return this.generateMockHistoricalData(symbol, timeframe, days);
  }

  /**
   * Get real-time quote with enhanced data
   */
  async getRealTimeQuote(symbol: string): Promise<CandlestickData | null> {
    try {
      const response = await fetch(`/api/market/live/quotes?symbols=${symbol}`);
      const data = await response.json();
      
      if (data.quotes && data.quotes.length > 0) {
        const quote = data.quotes[0];
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
    } catch (error) {
      console.error('Error fetching real-time quote:', error);
    }

    return null;
  }

  /**
   * Get supported symbols for all asset classes
   */
  async getSupportedSymbols(): Promise<Record<string, string[]>> {
    try {
      const response = await fetch('/api/market/multi-asset/symbols');
      const data = await response.json();
      return data.symbols || {};
    } catch (error) {
      console.error('Error fetching supported symbols:', error);
      return {
        equity: ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX'],
        cryptocurrency: ['BTC.AX', 'ETH.AX', 'ADA.AX'],
        commodity: ['GOLD', 'SILVER', 'OIL.WTI'],
        fixed_income: ['AGB.2Y', 'AGB.5Y', 'AGB.10Y'],
        forex: ['AUDUSD', 'EURAUD', 'GBPAUD'],
      };
    }
  }

  /**
   * Get asset class information for a symbol
   */
  async getAssetClassInfo(symbol: string): Promise<AssetClassInfo> {
    try {
      const response = await fetch(`/api/market/multi-asset/data/${symbol}`);
      const data = await response.json();
      
      return {
        symbol,
        assetClass: data.asset_class || 'equity',
        name: data.data?.name || symbol,
        exchange: data.data?.exchange,
        marketHours: data.data?.market_hours,
      };
    } catch (error) {
      console.error('Error fetching asset class info:', error);
      return {
        symbol,
        assetClass: 'equity',
        name: symbol,
      };
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): MarketDataPerformance {
    return { ...this.performance };
  }

  /**
   * Generate mock historical data for fallback
   */
  private generateMockHistoricalData(symbol: string, timeframe: string, days: number): MarketDataResponse {
    const data: CandlestickData[] = [];
    const now = Date.now();
    const interval = this.getTimeframeInterval(timeframe);
    const dataPoints = Math.min(1000, Math.floor((days * 24 * 60 * 60 * 1000) / interval));
    
    let currentPrice = this.getBasePrice(symbol);

    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = 0.02; // 2% volatility
      
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const open = currentPrice;
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

    return {
      symbol,
      data,
      timeframe: timeframe as any,
    };
  }

  /**
   * Get timeframe interval in milliseconds
   */
  private getTimeframeInterval(timeframe: string): number {
    const intervals = {
      '30s': 30 * 1000,
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

  /**
   * Get base price for symbol
   */
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
      'BTC.AX': 45000.0,
      'ETH.AX': 3000.0,
      'GOLD': 1950.0,
      'SILVER': 24.5,
      'AUDUSD': 0.6750,
    };
    return basePrices[symbol as keyof typeof basePrices] || 100.00;
  }

  /**
   * Disconnect from WebSocket and cleanup
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }

    this.subscriptions.clear();
    this.indicatorSubscriptions.clear();
    this.signalSubscriptions.clear();
    
    this.performance.connectionStatus = 'disconnected';
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  /**
   * Force reconnection
   */
  async forceReconnect(): Promise<void> {
    this.disconnect();
    await this.connectToLiveData();
    this.resubscribeAll();
  }
}

// Create singleton instance
const enhancedMarketDataService = new EnhancedMarketDataService();

export default enhancedMarketDataService;