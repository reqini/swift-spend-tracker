// Optimizador de queries para Supabase
import { supabase } from '@/integrations/supabase/client';

export class SupabaseOptimizer {
  private static instance: SupabaseOptimizer;
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  
  private constructor() {}
  
  static getInstance(): SupabaseOptimizer {
    if (!SupabaseOptimizer.instance) {
      SupabaseOptimizer.instance = new SupabaseOptimizer();
    }
    return SupabaseOptimizer.instance;
  }

  // Cache con TTL (Time To Live)
  private getCachedData(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: unknown, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Query optimizada para transacciones con paginación
  async getTransactionsOptimized(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    useCache: boolean = true
  ) {
    const cacheKey = `transactions_${userId}_${page}_${limit}`;
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = {
      data: data || [],
      count: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    };

    if (useCache) {
      this.setCachedData(cacheKey, result, 2 * 60 * 1000); // 2 minutos
    }

    return result;
  }

  // Query optimizada para estadísticas con agregación
  async getStatsOptimized(userId: string, month: string, year: string) {
    const cacheKey = `stats_${userId}_${month}_${year}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        type,
        amount,
        category
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      categoryStats: {} as Record<string, { income: number; expenses: number }>,
      transactionCount: data?.length || 0
    };

    data?.forEach(transaction => {
      const amount = Number(transaction.amount);
      const category = transaction.category || 'Sin categoría';
      
      if (!stats.categoryStats[category]) {
        stats.categoryStats[category] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        stats.totalIncome += amount;
        stats.categoryStats[category].income += amount;
      } else {
        stats.totalExpenses += amount;
        stats.categoryStats[category].expenses += amount;
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;

    this.setCachedData(cacheKey, stats, 5 * 60 * 1000); // 5 minutos
    return stats;
  }

  // Query optimizada para familias con joins
  async getFamilyDataOptimized(familyId: string) {
    const cacheKey = `family_${familyId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('families')
      .select(`
        *,
        family_members (
          user_id,
          role,
          joined_at,
          users (email)
        ),
        family_invitations (
          id,
          invited_email,
          status,
          created_at
        )
      `)
      .eq('id', familyId)
      .single();

    if (error) throw error;

    this.setCachedData(cacheKey, data, 10 * 60 * 1000); // 10 minutos
    return data;
  }

  // Batch insert para múltiples transacciones
  async batchInsertTransactions(transactions: unknown[]) {
    if (transactions.length === 0) return [];

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();

    if (error) throw error;

    // Limpiar cache relacionado
    this.clearCacheByPattern('transactions_');
    this.clearCacheByPattern('stats_');

    return data || [];
  }

  // Batch update para múltiples transacciones
  async batchUpdateTransactions(updates: Array<{ id: string; [key: string]: unknown }>) {
    if (updates.length === 0) return [];

    const results = [];
    
    for (const update of updates) {
      const { id, ...updateData } = update;
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    // Limpiar cache relacionado
    this.clearCacheByPattern('transactions_');
    this.clearCacheByPattern('stats_');

    return results;
  }

  // Limpiar cache por patrón
  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia global
export const supabaseOptimizer = SupabaseOptimizer.getInstance(); 