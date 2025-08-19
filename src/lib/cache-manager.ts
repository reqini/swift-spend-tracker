// Sistema de cache avanzado para la aplicación
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    memoryUsage: 0
  };
  private maxSize = 100; // Máximo número de entradas
  private maxMemoryUsage = 50 * 1024 * 1024; // 50MB

  private constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Obtener datos del cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Verificar si expiró
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data;
  }

  // Guardar datos en el cache
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const now = Date.now();
    
    // Verificar si necesitamos limpiar cache
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    this.updateMemoryUsage();
  }

  // Verificar si existe en cache
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }

    return true;
  }

  // Eliminar entrada específica
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
      this.updateMemoryUsage();
    }
    return deleted;
  }

  // Limpiar cache por patrón
  clearByPattern(pattern: string): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    this.stats.size = this.cache.size;
    this.updateMemoryUsage();
    return deletedCount;
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
  }

  // Obtener estadísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Obtener todas las claves
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Cache con función de fallback
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('Error fetching data for cache:', error);
      throw error;
    }
  }

  // Cache para datos que no cambian frecuentemente
  getStatic<T>(key: string, data: T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    this.set(key, data, 24 * 60 * 60 * 1000); // 24 horas
    return data;
  }

  // Cache para datos de sesión
  getSession<T>(key: string, data: T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    this.set(key, data, 30 * 60 * 1000); // 30 minutos
    return data;
  }

  // Cache para datos temporales
  getTemporary<T>(key: string, data: T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    this.set(key, data, 60 * 1000); // 1 minuto
    return data;
  }

  // Evict LRU (Least Recently Used)
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.size--;
    }
  }

  // Actualizar uso de memoria
  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += this.estimateSize(key) + this.estimateSize(entry.data);
    }

    this.stats.memoryUsage = totalSize;

    // Si excede el límite de memoria, evict LRU
    if (totalSize > this.maxMemoryUsage) {
      this.evictLRU();
    }
  }

  // Estimar tamaño de datos
  private estimateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Tamaño por defecto
    }
  }

  // Limpieza periódica
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.stats.size = this.cache.size;
        this.updateMemoryUsage();
        console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
      }
    }, 60 * 1000); // Cada minuto
  }

  // Precalentar cache
  async prewarm(keys: string[], fetchFunction: (key: string) => Promise<unknown>): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const data = await fetchFunction(key);
        this.set(key, data);
      } catch (error) {
        console.error(`Error prewarming cache for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

// Instancia global
export const cacheManager = CacheManager.getInstance();

// Hooks de conveniencia
export const useCache = () => {
  return {
    get: <T>(key: string) => cacheManager.get<T>(key),
    set: <T>(key: string, data: T, ttl?: number) => cacheManager.set(key, data, ttl),
    has: (key: string) => cacheManager.has(key),
    delete: (key: string) => cacheManager.delete(key),
    clear: () => cacheManager.clear(),
    getStats: () => cacheManager.getStats(),
    getOrSet: <T>(key: string, fetchFunction: () => Promise<T>, ttl?: number) => 
      cacheManager.getOrSet(key, fetchFunction, ttl),
  };
}; 