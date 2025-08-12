/**
 * Performance Monitor Utility
 * Measures and reports Core Web Vitals and other performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
    
    if (this.isSupported) {
      this.init();
    }
  }

  init() {
    // Initialize performance observers
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Report metrics when page is about to unload
    this.setupReporting();
  }

  // Largest Contentful Paint (LCP)
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.lcp = {
          value: lastEntry.startTime,
          rating: this.getRating(lastEntry.startTime, [2500, 4000]),
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || 'unknown',
          timestamp: Date.now()
        };
        
        this.reportMetric('LCP', this.metrics.lcp);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation failed:', error);
    }
  }

  // First Input Delay (FID)
  observeFID() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = {
            value: entry.processingStart - entry.startTime,
            rating: this.getRating(entry.processingStart - entry.startTime, [100, 300]),
            eventType: entry.name,
            timestamp: Date.now()
          };
          
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation failed:', error);
    }
  }

  // Cumulative Layout Shift (CLS)
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries = [];
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
            
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              
              this.metrics.cls = {
                value: clsValue,
                rating: this.getRating(clsValue, [0.1, 0.25]),
                entries: sessionEntries.length,
                timestamp: Date.now()
              };
              
              this.reportMetric('CLS', this.metrics.cls);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation failed:', error);
    }
  }

  // First Contentful Paint (FCP)
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = {
              value: entry.startTime,
              rating: this.getRating(entry.startTime, [1800, 3000]),
              timestamp: Date.now()
            };
            
            this.reportMetric('FCP', this.metrics.fcp);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observation failed:', error);
    }
  }

  // Time to First Byte (TTFB)
  observeTTFB() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart;
            
            this.metrics.ttfb = {
              value: ttfb,
              rating: this.getRating(ttfb, [800, 1800]),
              timestamp: Date.now()
            };
            
            this.reportMetric('TTFB', this.metrics.ttfb);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TTFB observation failed:', error);
    }
  }

  // Interaction to Next Paint (INP)
  observeINP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let interactions = [];
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.interactionId) {
            interactions.push({
              id: entry.interactionId,
              latency: entry.processingEnd - entry.startTime,
              type: entry.name,
              timestamp: entry.startTime
            });
            
            // Keep only recent interactions (last 50)
            if (interactions.length > 50) {
              interactions = interactions.slice(-50);
            }
            
            // Calculate INP (98th percentile)
            const sortedLatencies = interactions
              .map(i => i.latency)
              .sort((a, b) => a - b);
            
            const inp = sortedLatencies[Math.floor(sortedLatencies.length * 0.98)];
            
            this.metrics.inp = {
              value: inp,
              rating: this.getRating(inp, [200, 500]),
              interactions: interactions.length,
              timestamp: Date.now()
            };
            
            this.reportMetric('INP', this.metrics.inp);
          }
        });
      });
      
      observer.observe({ entryTypes: ['event'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('INP observation failed:', error);
    }
  }

  // Resource Timing
  observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.duration > 100) { // Only report slow resources
            const resourceMetric = {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize || 0,
              type: this.getResourceType(entry.name),
              timestamp: Date.now()
            };
            
            this.reportMetric('RESOURCE', resourceMetric);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observation failed:', error);
    }
  }

  // Navigation Timing
  observeNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return;
    
    try {
      const [navigation] = window.performance.getEntriesByType('navigation');
      
      if (navigation) {
        this.metrics.navigation = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          timestamp: Date.now()
        };
        
        this.reportMetric('NAVIGATION', this.metrics.navigation);
      }
    } catch (error) {
      console.warn('Navigation timing observation failed:', error);
    }
  }

  // Get performance rating (good, needs-improvement, poor)
  getRating(value, thresholds) {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(js)$/)) return 'script';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  // Report metric to console and analytics
  reportMetric(type, metric) {
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${type}:`, metric);
    }
    
    // Send to analytics service (implement as needed)
    this.sendToAnalytics(type, metric);
  }

  // Send metrics to analytics service
  sendToAnalytics(type, metric) {
    // Implement your analytics service here
    // Example: Google Analytics, custom endpoint, etc.
    
    try {
      // Example implementation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: type,
          value: Math.round(metric.value),
          custom_map: {
            metric_rating: metric.rating
          }
        });
      }
    } catch (error) {
      console.warn('Analytics reporting failed:', error);
    }
  }

  // Setup reporting on page unload
  setupReporting() {
    if (typeof window === 'undefined') return;
    
    const reportAllMetrics = () => {
      const summary = this.getMetricsSummary();
      console.log('📈 Performance Summary:', summary);
      
      // Send final report to analytics
      this.sendToAnalytics('SUMMARY', summary);
    };
    
    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportAllMetrics();
      }
    });
    
    // Report on page unload
    window.addEventListener('beforeunload', reportAllMetrics);
  }

  // Get metrics summary
  getMetricsSummary() {
    return {
      lcp: this.metrics.lcp?.value || null,
      fid: this.metrics.fid?.value || null,
      cls: this.metrics.cls?.value || null,
      fcp: this.metrics.fcp?.value || null,
      ttfb: this.metrics.ttfb?.value || null,
      inp: this.metrics.inp?.value || null,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : null
    };
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Observer cleanup failed:', error);
      }
    });
    this.observers = [];
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Also export the class for custom instances
export { PerformanceMonitor };

// Utility function to start monitoring
export const startPerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    console.log('🚀 Performance monitoring started');
    return performanceMonitor;
  }
  return null;
};

// Utility function to get current metrics
export const getCurrentMetrics = () => {
  return performanceMonitor.getMetrics();
};

// Utility function to get metrics summary
export const getMetricsSummary = () => {
  return performanceMonitor.getMetricsSummary();
};