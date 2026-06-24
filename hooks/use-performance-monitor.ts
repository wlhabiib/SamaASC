'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface PerformanceMonitorOptions {
  threshold?: number; // Alert if duration exceeds threshold (ms)
  logToConsole?: boolean;
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const { threshold = 300, logToConsole = true } = options;
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const startTimeRef = useRef<number>(0);
  const currentMetricRef = useRef<string>('');

  const startMeasure = (name: string) => {
    startTimeRef.current = performance.now();
    currentMetricRef.current = name;
  };

  const endMeasure = (name: string) => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
    };

    setMetrics(prev => [...prev, metric]);

    if (logToConsole) {
      const isSlow = duration > threshold;
      console.log(
        `[Performance] ${name}: ${duration.toFixed(2)}ms${isSlow ? ' ⚠️ SLOW' : ''}`
      );
    }

    return duration;
  };

  const measureAsync = async <T,>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    startMeasure(name);
    try {
      const result = await fn();
      endMeasure(name);
      return result;
    } catch (error) {
      endMeasure(name);
      throw error;
    }
  };

  const clearMetrics = () => {
    setMetrics([]);
  };

  const getSlowMetrics = () => {
    return metrics.filter(m => m.duration > threshold);
  };

  const getAverageDuration = (name?: string) => {
    const filtered = name 
      ? metrics.filter(m => m.name === name)
      : metrics;
    
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  };

  return {
    startMeasure,
    endMeasure,
    measureAsync,
    metrics,
    clearMetrics,
    getSlowMetrics,
    getAverageDuration,
  };
}

// Hook pour mesurer le temps de rendu d'un composant
export function useRenderMonitor(componentName: string, threshold = 300) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now();
    renderTimes.current.push(renderTime);

    if (renderTimes.current.length > 1) {
      const lastRenderTime = renderTimes.current[renderTimes.current.length - 2];
      const duration = renderTime - lastRenderTime;
      
      if (duration > threshold) {
        console.warn(
          `[Slow Render] ${componentName} rendered in ${duration.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    }
  });

  return { renderCount: renderCount.current };
}
