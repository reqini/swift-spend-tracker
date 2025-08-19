// Sistema de analytics para monitoreo de la aplicación
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface ErrorLog {
  error: string;
  stack?: string;
  context: string;
  timestamp: number;
  userId?: string;
}

export class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errorLogs: ErrorLog[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;
  private maxEvents = 1000;
  private maxMetrics = 500;
  private maxErrors = 100;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startPeriodicFlush();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Configurar usuario
  setUser(userId: string): void {
    this.userId = userId;
  }

  // Habilitar/deshabilitar analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Registrar evento
  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);

    // Limitar número de eventos
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', analyticsEvent);
    }
  }

  // Registrar métrica de rendimiento
  trackPerformance(name: string, value: number, unit: string = 'ms'): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    this.performanceMetrics.push(metric);

    // Limitar número de métricas
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics);
    }
  }

  // Registrar error
  trackError(error: Error | string, context: string): void {
    if (!this.isEnabled) return;

    const errorLog: ErrorLog = {
      error: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now(),
      userId: this.userId
    };

    this.errorLogs.push(errorLog);

    // Limitar número de errores
    if (this.errorLogs.length > this.maxErrors) {
      this.errorLogs = this.errorLogs.slice(-this.maxErrors);
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Analytics Error:', errorLog);
    }
  }

  // Eventos específicos de la aplicación
  trackPageView(page: string): void {
    this.track('page_view', { page });
  }

  trackTransaction(type: 'income' | 'expense', amount: number, category?: string): void {
    this.track('transaction_added', { type, amount, category });
  }

  trackFamilyAction(action: 'created' | 'joined' | 'invited', familyId?: string): void {
    this.track('family_action', { action, familyId });
  }

  trackAuthAction(action: 'login' | 'signup' | 'logout'): void {
    this.track('auth_action', { action });
  }

  trackFeatureUsage(feature: string): void {
    this.track('feature_used', { feature });
  }

  trackErrorBoundary(error: Error, componentStack: string): void {
    this.trackError(error, `ErrorBoundary: ${componentStack}`);
  }

  // Métricas de rendimiento específicas
  trackLoadTime(page: string, loadTime: number): void {
    this.trackPerformance(`${page}_load_time`, loadTime);
  }

  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.trackPerformance(`api_${endpoint}`, duration);
    this.track('api_call', { endpoint, duration, success });
  }

  trackBundleSize(size: number): void {
    this.trackPerformance('bundle_size', size, 'bytes');
  }

  trackMemoryUsage(usage: number): void {
    this.trackPerformance('memory_usage', usage, 'bytes');
  }

  // Obtener estadísticas
  getStats(): {
    events: number;
    metrics: number;
    errors: number;
    sessionDuration: number;
  } {
    const now = Date.now();
    const sessionStart = this.events[0]?.timestamp || now;
    
    return {
      events: this.events.length,
      metrics: this.performanceMetrics.length,
      errors: this.errorLogs.length,
      sessionDuration: now - sessionStart
    };
  }

  // Obtener eventos por tipo
  getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter(event => event.event === eventType);
  }

  // Obtener métricas por nombre
  getMetricsByName(metricName: string): PerformanceMetric[] {
    return this.performanceMetrics.filter(metric => metric.name === metricName);
  }

  // Obtener errores por contexto
  getErrorsByContext(context: string): ErrorLog[] {
    return this.errorLogs.filter(error => error.context === context);
  }

  // Generar reporte
  generateReport(): {
    summary: {
      totalEvents: number;
      totalMetrics: number;
      totalErrors: number;
      sessionDuration: number;
      userId?: string;
    };
    topEvents: Array<{ event: string; count: number }>;
    topErrors: Array<{ error: string; count: number }>;
    performanceSummary: {
      avgLoadTime: number;
      avgApiCallTime: number;
      totalApiCalls: number;
    };
  } {
    const stats = this.getStats();
    
    // Eventos más frecuentes
    const eventCounts = new Map<string, number>();
    this.events.forEach(event => {
      eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1);
    });
    
    const topEvents = Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Errores más frecuentes
    const errorCounts = new Map<string, number>();
    this.errorLogs.forEach(error => {
      errorCounts.set(error.error, (errorCounts.get(error.error) || 0) + 1);
    });
    
    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Resumen de rendimiento
    const loadTimes = this.getMetricsByName('page_load_time');
    const apiCalls = this.getMetricsByName('api_call');
    
    const avgLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, metric) => sum + metric.value, 0) / loadTimes.length 
      : 0;
    
    const avgApiCallTime = apiCalls.length > 0 
      ? apiCalls.reduce((sum, metric) => sum + metric.value, 0) / apiCalls.length 
      : 0;

    return {
      summary: {
        totalEvents: stats.events,
        totalMetrics: stats.metrics,
        totalErrors: stats.errors,
        sessionDuration: stats.sessionDuration,
        userId: this.userId
      },
      topEvents,
      topErrors,
      performanceSummary: {
        avgLoadTime,
        avgApiCallTime,
        totalApiCalls: apiCalls.length
      }
    };
  }

  // Enviar datos al servidor (placeholder)
  async flush(): Promise<void> {
    if (!this.isEnabled || this.events.length === 0) return;

    try {
      const report = this.generateReport();
      
      // Aquí se enviaría al servidor de analytics
      // Por ahora solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Report:', report);
      }

      // Limpiar datos después del envío
      this.events = [];
      this.performanceMetrics = [];
      this.errorLogs = [];
      
    } catch (error) {
      console.error('Error flushing analytics:', error);
    }
  }

  // Generar ID de sesión
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Envío periódico
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }
}

// Instancia global
export const analytics = Analytics.getInstance();

// Hooks de conveniencia
export const useAnalytics = () => {
  return {
    track: (event: string, properties?: Record<string, unknown>) => analytics.track(event, properties),
    trackPageView: (page: string) => analytics.trackPageView(page),
    trackTransaction: (type: 'income' | 'expense', amount: number, category?: string) => 
      analytics.trackTransaction(type, amount, category),
    trackFamilyAction: (action: 'created' | 'joined' | 'invited', familyId?: string) => 
      analytics.trackFamilyAction(action, familyId),
    trackAuthAction: (action: 'login' | 'signup' | 'logout') => analytics.trackAuthAction(action),
    trackFeatureUsage: (feature: string) => analytics.trackFeatureUsage(feature),
    trackError: (error: Error | string, context: string) => analytics.trackError(error, context),
    trackPerformance: (name: string, value: number, unit?: string) => 
      analytics.trackPerformance(name, value, unit),
    getStats: () => analytics.getStats(),
    generateReport: () => analytics.generateReport(),
  };
}; 