/**
 * WebSocket Service for Real-time Updates
 * Handles training progress, market data, and system notifications
 */

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  private getWebSocketUrl(endpoint: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/ws/${endpoint}`;
  }

  /**
   * Connect to a WebSocket endpoint
   */
  connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrl(endpoint);
        
        // Check if WebSocket is supported and not blocked by CSP
        if (typeof WebSocket === 'undefined') {
          console.warn('WebSocket not supported, falling back to polling');
          reject(new Error('WebSocket not supported'));
          return;
        }

        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log(`WebSocket connected: ${endpoint}`);
          this.connections.set(endpoint, ws);
          this.reconnectAttempts.set(endpoint, 0);
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(endpoint, message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log(`WebSocket closed: ${endpoint}`, event.code, event.reason);
          this.connections.delete(endpoint);
          
          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect(endpoint);
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error: ${endpoint}`, error);
          // Check for CSP or security policy violations
          if (error instanceof Event && error.type === 'error') {
            console.warn('WebSocket connection blocked (possibly by CSP), falling back to polling');
          }
          reject(error);
        };

      } catch (error) {
        console.error('WebSocket creation failed:', error);
        if (error instanceof DOMException && error.name === 'SecurityError') {
          console.warn('WebSocket blocked by security policy, falling back to polling');
        }
        reject(error);
      }
    });
  }

  /**
   * Disconnect from a WebSocket endpoint
   */
  disconnect(endpoint: string): void {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close(1000, 'Manual disconnect');
      this.connections.delete(endpoint);
      this.handlers.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  /**
   * Subscribe to messages from an endpoint
   */
  subscribe(endpoint: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(endpoint)) {
      this.handlers.set(endpoint, new Set());
    }
    
    this.handlers.get(endpoint)!.add(handler);

    // Auto-connect if not already connected
    if (!this.connections.has(endpoint)) {
      this.connect(endpoint).catch(console.error);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(endpoint);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.disconnect(endpoint);
        }
      }
    };
  }

  /**
   * Send message to WebSocket endpoint
   */
  send(endpoint: string, message: any): void {
    const ws = this.connections.get(endpoint);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(endpoint: string, message: WebSocketMessage): void {
    const handlers = this.handlers.get(endpoint);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private attemptReconnect(endpoint: string): void {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(endpoint, attempts + 1);
      
      console.log(`Attempting to reconnect to ${endpoint} (${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(endpoint).catch(() => {
          // Reconnection failed, will try again if there are handlers
          if (this.handlers.has(endpoint) && this.handlers.get(endpoint)!.size > 0) {
            this.attemptReconnect(endpoint);
          }
        });
      }, this.reconnectDelay * Math.pow(2, attempts)); // Exponential backoff
    } else {
      console.error(`Max reconnection attempts reached for ${endpoint}`);
    }
  }

  /**
   * Get connection status
   */
  isConnected(endpoint: string): boolean {
    const ws = this.connections.get(endpoint);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Disconnect all WebSockets
   */
  disconnectAll(): void {
    this.connections.forEach((ws, endpoint) => {
      this.disconnect(endpoint);
    });
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Convenience methods for specific endpoints
export const trainingWebSocket = {
  subscribe: (handler: MessageHandler) => websocketService.subscribe('training', handler),
  send: (message: any) => websocketService.send('training', message),
  isConnected: () => websocketService.isConnected('training')
};

export const marketWebSocket = {
  subscribe: (handler: MessageHandler) => websocketService.subscribe('market', handler),
  send: (message: any) => websocketService.send('market', message),
  isConnected: () => websocketService.isConnected('market')
};

export const systemWebSocket = {
  subscribe: (handler: MessageHandler) => websocketService.subscribe('system', handler),
  send: (message: any) => websocketService.send('system', message),
  isConnected: () => websocketService.isConnected('system')
};

export default websocketService;