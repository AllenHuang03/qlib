/**
 * Real-time WebSocket Data Manager
 * AGENT 5: REAL-TIME DATA INTEGRATION SPECIALIST
 */

import { CandlestickData } from '../types/market';

export interface LiveDataSubscription {
  id: string;
  symbol: string;
  callback: (data: CandlestickData) => void;
}

export interface LivePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export class LiveDataManager {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, LiveDataSubscription> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor(private wsUrl?: string) {
    this.wsUrl = wsUrl || this.getWebSocketUrl();
  }

  private getWebSocketUrl(): string {
    // Determine WebSocket URL from environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || 'localhost:8080';
    return `${protocol}//${host.replace('http://', '').replace('https://', '')}/ws/live-market`;
  }

  /**
   * Connect to live data WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to live data: ${this.wsUrl}`);
        this.ws = new WebSocket(this.wsUrl!);

        this.ws.onopen = () => {
          console.log('Connected to live market data WebSocket');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.isConnecting = false;
          this.handleDisconnection();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to live data for a specific symbol
   */
  subscribe(symbol: string, callback: (data: CandlestickData) => void): string {
    const subscriptionId = `${symbol}_${Date.now()}_${Math.random()}`;
    
    const subscription: LiveDataSubscription = {
      id: subscriptionId,
      symbol: symbol.toUpperCase(),
      callback,
    };

    this.subscribers.set(subscriptionId, subscription);

    // Send subscription request if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscriptionRequest(symbol);
    } else {
      // Connect and then subscribe
      this.connect().then(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendSubscriptionRequest(symbol);
        }
      }).catch(error => {
        console.error('Failed to connect for subscription:', error);
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from live data
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscribers.get(subscriptionId);
    if (subscription) {
      this.subscribers.delete(subscriptionId);

      // Send unsubscription request if connected
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendUnsubscriptionRequest(subscription.symbol);
      }
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscribers.clear();
    this.isConnecting = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private sendSubscriptionRequest(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const request = {
        type: 'subscribe',
        symbol: symbol.toUpperCase(),
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(request));
      console.log(`Subscribed to live data for ${symbol}`);
    }
  }

  private sendUnsubscriptionRequest(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const request = {
        type: 'unsubscribe',
        symbol: symbol.toUpperCase(),
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(request));
      console.log(`Unsubscribed from live data for ${symbol}`);
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      switch (data.type) {
        case 'price_update':
          this.handlePriceUpdate(data);
          break;
        case 'candle_update':
          this.handleCandleUpdate(data);
          break;
        case 'heartbeat':
          // Heartbeat to keep connection alive
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handlePriceUpdate(data: LivePriceData): void {
    // Convert price update to candlestick format
    const candlestick: CandlestickData = {
      time: data.timestamp,
      date: new Date(data.timestamp).toISOString(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.price,
      volume: data.volume,
    };

    this.notifySubscribers(data.symbol, candlestick);
  }

  private handleCandleUpdate(data: any): void {
    const candlestick: CandlestickData = {
      time: data.timestamp,
      date: new Date(data.timestamp).toISOString(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    };

    this.notifySubscribers(data.symbol, candlestick);
  }

  private notifySubscribers(symbol: string, data: CandlestickData): void {
    this.subscribers.forEach(subscription => {
      if (subscription.symbol === symbol.toUpperCase()) {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.reconnectInterval = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.log('Max reconnection attempts reached. Please check your connection.');
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Generate mock live data for testing
   */
  generateMockData(symbol: string): void {
    if (!this.isConnected()) {
      // Simulate mock WebSocket data
      const interval = setInterval(() => {
        const mockData: LivePriceData = {
          symbol: symbol.toUpperCase(),
          price: 100 + Math.random() * 20,
          change: (Math.random() - 0.5) * 5,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000) + 100000,
          high: 100 + Math.random() * 25,
          low: 100 - Math.random() * 5,
          open: 100 + (Math.random() - 0.5) * 10,
          timestamp: Date.now(),
        };

        this.handlePriceUpdate(mockData);
      }, 1000); // Update every second

      // Store interval for cleanup
      setTimeout(() => clearInterval(interval), 300000); // Stop after 5 minutes
    }
  }
}

// Singleton instance
export const liveDataManager = new LiveDataManager();