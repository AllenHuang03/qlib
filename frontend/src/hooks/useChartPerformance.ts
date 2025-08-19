/**
 * Chart Performance Optimization Hook
 * Memory management and smooth animations for large datasets
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CandlestickData, TechnicalIndicator } from '../types/market';

interface ChartPerformanceConfig {
  maxDataPoints: number;
  viewportBuffer: number;
  animationDuration: number;
  enableVirtualization: boolean;
  enableDataCompression: boolean;
  compressionThreshold: number;
  memoryLimit: number; // MB
}

interface VirtualizedData {
  visible: CandlestickData[];
  total: number;
  startIndex: number;
  endIndex: number;
  compressed: boolean;
}

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  dataPoints: number;
  compressionRatio: number;
  fps: number;
}

export const useChartPerformance = (
  rawData: CandlestickData[],
  config: Partial<ChartPerformanceConfig> = {}
) => {
  const defaultConfig: ChartPerformanceConfig = {
    maxDataPoints: 1000,
    viewportBuffer: 50,
    animationDuration: 300,
    enableVirtualization: true,
    enableDataCompression: false,
    compressionThreshold: 5000,
    memoryLimit: 50, // 50MB
    ...config,
  };

  // State for virtualized data
  const [virtualizedData, setVirtualizedData] = useState<VirtualizedData>({
    visible: [],
    total: 0,
    startIndex: 0,
    endIndex: 0,
    compressed: false,
  });

  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    dataPoints: 0,
    compressionRatio: 1,
    fps: 60,
  });

  // Refs for performance tracking
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const memoryObserver = useRef<PerformanceObserver | null>(null);

  // Data compression algorithms
  const compressData = useCallback((data: CandlestickData[], compressionFactor: number): CandlestickData[] => {
    if (compressionFactor <= 1 || data.length === 0) return data;

    const compressed: CandlestickData[] = [];
    const chunkSize = Math.ceil(compressionFactor);

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;

      // Combine multiple candles into one
      const combinedCandle: CandlestickData = {
        timestamp: chunk[chunk.length - 1].timestamp, // Use last timestamp
        date: chunk[chunk.length - 1].date,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, c) => sum + c.volume, 0),
        symbol: chunk[0].symbol,
      };

      compressed.push(combinedCandle);
    }

    return compressed;
  }, []);

  // Smart data sampling for large datasets
  const sampleData = useCallback((data: CandlestickData[], maxPoints: number): CandlestickData[] => {
    if (data.length <= maxPoints) return data;

    const samplingRatio = data.length / maxPoints;
    const sampled: CandlestickData[] = [];

    // Use adaptive sampling - keep more recent data at higher resolution
    const recentCount = Math.floor(maxPoints * 0.7); // 70% for recent data
    const historicalCount = maxPoints - recentCount;

    // Recent data (higher resolution)
    const recentData = data.slice(-recentCount);
    sampled.push(...recentData);

    // Historical data (lower resolution)
    if (historicalCount > 0) {
      const historicalData = data.slice(0, data.length - recentCount);
      const historicalSamplingRatio = historicalData.length / historicalCount;

      for (let i = 0; i < historicalCount; i++) {
        const index = Math.floor(i * historicalSamplingRatio);
        if (index < historicalData.length) {
          sampled.unshift(historicalData[index]);
        }
      }
    }

    return sampled;
  }, []);

  // Viewport-based virtualization
  const getVisibleData = useCallback((
    data: CandlestickData[],
    viewStart: number,
    viewEnd: number,
    buffer: number
  ): VirtualizedData => {
    const dataLength = data.length;
    if (dataLength === 0) {
      return {
        visible: [],
        total: 0,
        startIndex: 0,
        endIndex: 0,
        compressed: false,
      };
    }

    // Calculate indices based on viewport
    const startIndex = Math.max(0, Math.floor(viewStart * dataLength) - buffer);
    const endIndex = Math.min(dataLength - 1, Math.ceil(viewEnd * dataLength) + buffer);
    
    const visible = data.slice(startIndex, endIndex + 1);

    return {
      visible,
      total: dataLength,
      startIndex,
      endIndex,
      compressed: false,
    };
  }, []);

  // Memory usage estimation
  const estimateMemoryUsage = useCallback((data: CandlestickData[]): number => {
    // Rough estimation: each candle ~200 bytes
    const candleSize = 200; // bytes
    const totalSize = data.length * candleSize;
    return totalSize / (1024 * 1024); // Convert to MB
  }, []);

  // Smooth animations using requestAnimationFrame
  const animateDataTransition = useCallback((
    fromData: CandlestickData[],
    toData: CandlestickData[],
    duration: number,
    onUpdate: (data: CandlestickData[]) => void,
    onComplete?: () => void
  ) => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate between datasets
      const interpolatedData = toData.map((toCandle, index) => {
        const fromCandle = fromData[index];
        if (!fromCandle) return toCandle;

        return {
          ...toCandle,
          open: fromCandle.open + (toCandle.open - fromCandle.open) * easeOut,
          high: fromCandle.high + (toCandle.high - fromCandle.high) * easeOut,
          low: fromCandle.low + (toCandle.low - fromCandle.low) * easeOut,
          close: fromCandle.close + (toCandle.close - fromCandle.close) * easeOut,
          volume: fromCandle.volume + (toCandle.volume - fromCandle.volume) * easeOut,
        };
      });

      onUpdate(interpolatedData);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, []);

  // FPS monitoring
  useEffect(() => {
    const trackFPS = () => {
      const now = performance.now();
      frameCount.current++;

      if (lastFrameTime.current !== 0) {
        const delta = now - lastFrameTime.current;
        const fps = 1000 / delta;
        
        // Update FPS every 30 frames
        if (frameCount.current % 30 === 0) {
          setMetrics(prev => ({ ...prev, fps: Math.round(fps) }));
        }
      }

      lastFrameTime.current = now;
      requestAnimationFrame(trackFPS);
    };

    requestAnimationFrame(trackFPS);
  }, []);

  // Memory monitoring
  useEffect(() => {
    if ('memory' in performance && (performance as any).memory) {
      const updateMemoryMetrics = () => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        setMetrics(prev => ({ ...prev, memoryUsage: Math.round(usedMB) }));
      };

      const interval = setInterval(updateMemoryMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // Process and optimize data
  const processedData = useMemo(() => {
    renderStartTime.current = performance.now();
    
    let data = rawData;
    let compressed = false;
    let compressionRatio = 1;

    // Apply compression if needed
    if (defaultConfig.enableDataCompression && data.length > defaultConfig.compressionThreshold) {
      const targetSize = defaultConfig.maxDataPoints;
      const currentCompressionFactor = Math.ceil(data.length / targetSize);
      
      if (currentCompressionFactor > 1) {
        data = compressData(data, currentCompressionFactor);
        compressed = true;
        compressionRatio = rawData.length / data.length;
      }
    }

    // Apply sampling if still too large
    if (data.length > defaultConfig.maxDataPoints) {
      data = sampleData(data, defaultConfig.maxDataPoints);
    }

    // Update metrics
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(renderTime),
      dataPoints: data.length,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
    }));

    return data;
  }, [rawData, defaultConfig, compressData, sampleData]);

  // Virtualization based on viewport
  const getVirtualizedData = useCallback((viewStart = 0, viewEnd = 1) => {
    if (!defaultConfig.enableVirtualization) {
      return {
        visible: processedData,
        total: processedData.length,
        startIndex: 0,
        endIndex: processedData.length - 1,
        compressed: false,
      };
    }

    return getVisibleData(processedData, viewStart, viewEnd, defaultConfig.viewportBuffer);
  }, [processedData, defaultConfig, getVisibleData]);

  // Data chunking for progressive loading
  const getDataChunks = useCallback((chunkSize = 100) => {
    const chunks: CandlestickData[][] = [];
    for (let i = 0; i < processedData.length; i += chunkSize) {
      chunks.push(processedData.slice(i, i + chunkSize));
    }
    return chunks;
  }, [processedData]);

  // Smooth data updates
  const updateDataWithAnimation = useCallback((
    newData: CandlestickData[],
    onUpdate: (data: CandlestickData[]) => void,
    onComplete?: () => void
  ) => {
    if (defaultConfig.animationDuration <= 0) {
      onUpdate(newData);
      onComplete?.();
      return;
    }

    animateDataTransition(
      processedData,
      newData,
      defaultConfig.animationDuration,
      onUpdate,
      onComplete
    );
  }, [processedData, defaultConfig.animationDuration, animateDataTransition]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (memoryObserver.current) {
      memoryObserver.current.disconnect();
    }
  }, []);

  // Performance warnings
  const warnings = useMemo(() => {
    const warnings: string[] = [];
    
    if (metrics.memoryUsage > defaultConfig.memoryLimit) {
      warnings.push(`High memory usage: ${metrics.memoryUsage}MB`);
    }
    
    if (metrics.fps < 30) {
      warnings.push(`Low FPS: ${metrics.fps}`);
    }
    
    if (metrics.renderTime > 50) {
      warnings.push(`Slow render: ${metrics.renderTime}ms`);
    }
    
    return warnings;
  }, [metrics, defaultConfig.memoryLimit]);

  // Optimization suggestions
  const optimizationSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    
    if (rawData.length > 5000 && !defaultConfig.enableDataCompression) {
      suggestions.push('Enable data compression for large datasets');
    }
    
    if (metrics.memoryUsage > 30 && !defaultConfig.enableVirtualization) {
      suggestions.push('Enable virtualization to reduce memory usage');
    }
    
    if (metrics.fps < 45) {
      suggestions.push('Consider reducing animation duration or data points');
    }
    
    return suggestions;
  }, [rawData.length, defaultConfig, metrics]);

  return {
    // Processed data
    data: processedData,
    originalDataLength: rawData.length,
    
    // Virtualization
    getVirtualizedData,
    getDataChunks,
    
    // Animation utilities
    updateDataWithAnimation,
    animateDataTransition,
    
    // Performance metrics
    metrics,
    warnings,
    optimizationSuggestions,
    
    // Utility functions
    estimateMemoryUsage,
    cleanup,
    
    // Configuration
    config: defaultConfig,
  };
};