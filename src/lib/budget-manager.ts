// Sistema de gestión de presupuestos
import { supabase } from '@/integrations/supabase/client';
import { analytics } from './analytics';
import { cacheManager } from './cache-manager';

interface Budget {
  id: string;
  user_id: string;
  family_id?: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BudgetAlert {
  id: string;
  budget_id: string;
  type: 'warning' | 'critical';
  threshold: number; // Porcentaje del presupuesto
  message: string;
  is_active: boolean;
}

interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'under' | 'warning' | 'over';
  daysLeft: number;
}

export class BudgetManager {
  private static instance: BudgetManager;

  private constructor() {}

  static getInstance(): BudgetManager {
    if (!BudgetManager.instance) {
      BudgetManager.instance = new BudgetManager();
    }
    return BudgetManager.instance;
  }

  // Crear presupuesto
  async createBudget(budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget | null> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budgetData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      analytics.track('budget_created', { 
        category: budgetData.category, 
        amount: budgetData.amount,
        period: budgetData.period 
      });

      // Limpiar cache
      cacheManager.clearByPattern('budget_');

      return data;
    } catch (error) {
      analytics.trackError(error, 'createBudget');
      return null;
    }
  }

  // Obtener presupuestos del usuario
  async getUserBudgets(userId: string, familyId?: string): Promise<Budget[]> {
    const cacheKey = `budget_user_${userId}_${familyId || 'personal'}`;
    
    return cacheManager.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Obtener progreso de presupuesto
  async getBudgetProgress(budgetId: string, userId: string): Promise<BudgetProgress | null> {
    const cacheKey = `budget_progress_${budgetId}`;
    
    return cacheManager.getOrSet(cacheKey, async () => {
      // Obtener presupuesto
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (budgetError || !budget) throw budgetError || new Error('Budget not found');

      // Calcular período
      const startDate = new Date(budget.start_date);
      const endDate = budget.end_date ? new Date(budget.end_date) : this.calculateEndDate(startDate, budget.period);
      const now = new Date();

      // Obtener gastos en el período
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('category', budget.category)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (transError) throw transError;

      const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Determinar estado
      let status: 'under' | 'warning' | 'over' = 'under';
      if (percentage >= 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      return {
        budget,
        spent,
        remaining,
        percentage,
        status,
        daysLeft
      };
    }, 2 * 60 * 1000); // 2 minutos
  }

  // Actualizar presupuesto
  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget | null> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;

      analytics.track('budget_updated', { budgetId, updates });

      // Limpiar cache
      cacheManager.clearByPattern('budget_');

      return data;
    } catch (error) {
      analytics.trackError(error, 'updateBudget');
      return null;
    }
  }

  // Eliminar presupuesto
  async deleteBudget(budgetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      analytics.track('budget_deleted', { budgetId });

      // Limpiar cache
      cacheManager.clearByPattern('budget_');

      return true;
    } catch (error) {
      analytics.trackError(error, 'deleteBudget');
      return false;
    }
  }

  // Obtener alertas de presupuesto
  async getBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    const budgets = await this.getUserBudgets(userId);
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const progress = await this.getBudgetProgress(budget.id, userId);
      if (!progress) continue;

      // Alerta de advertencia (80%)
      if (progress.percentage >= 80 && progress.percentage < 100) {
        alerts.push({
          id: `warning_${budget.id}`,
          budget_id: budget.id,
          type: 'warning',
          threshold: 80,
          message: `Has gastado el ${Math.round(progress.percentage)}% de tu presupuesto de ${budget.category}`,
          is_active: true
        });
      }

      // Alerta crítica (100% o más)
      if (progress.percentage >= 100) {
        alerts.push({
          id: `critical_${budget.id}`,
          budget_id: budget.id,
          type: 'critical',
          threshold: 100,
          message: `¡Has excedido tu presupuesto de ${budget.category} en ${Math.round(progress.percentage - 100)}%!`,
          is_active: true
        });
      }
    }

    return alerts;
  }

  // Obtener resumen de presupuestos
  async getBudgetSummary(userId: string, familyId?: string): Promise<{
    totalBudgets: number;
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    averageUsage: number;
    categories: Array<{
      category: string;
      budgeted: number;
      spent: number;
      remaining: number;
      percentage: number;
    }>;
  }> {
    const budgets = await this.getUserBudgets(userId, familyId);
    const categories: Record<string, { budgeted: number; spent: number }> = {};

    let totalBudgeted = 0;
    let totalSpent = 0;

    for (const budget of budgets) {
      const progress = await this.getBudgetProgress(budget.id, userId);
      if (!progress) continue;

      if (!categories[budget.category]) {
        categories[budget.category] = { budgeted: 0, spent: 0 };
      }

      categories[budget.category].budgeted += budget.amount;
      categories[budget.category].spent += progress.spent;
      totalBudgeted += budget.amount;
      totalSpent += progress.spent;
    }

    const totalRemaining = totalBudgeted - totalSpent;
    const averageUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    const categorySummary = Object.entries(categories).map(([category, data]) => ({
      category,
      budgeted: data.budgeted,
      spent: data.spent,
      remaining: data.budgeted - data.spent,
      percentage: data.budgeted > 0 ? (data.spent / data.budgeted) * 100 : 0
    }));

    return {
      totalBudgets: budgets.length,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      averageUsage,
      categories: categorySummary
    };
  }

  // Calcular fecha de fin basada en período
  private calculateEndDate(startDate: Date, period: 'monthly' | 'yearly'): Date {
    const endDate = new Date(startDate);
    
    if (period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    return endDate;
  }

  // Verificar si una transacción excede el presupuesto
  async checkBudgetExceeded(
    userId: string, 
    category: string, 
    amount: number
  ): Promise<{ exceeded: boolean; budget?: Budget; currentSpent: number; remaining: number }> {
    const budgets = await this.getUserBudgets(userId);
    const categoryBudget = budgets.find(b => b.category === category);
    
    if (!categoryBudget) {
      return { exceeded: false, currentSpent: 0, remaining: 0 };
    }

    const progress = await this.getBudgetProgress(categoryBudget.id, userId);
    if (!progress) {
      return { exceeded: false, currentSpent: 0, remaining: 0 };
    }

    const newTotal = progress.spent + amount;
    const exceeded = newTotal > categoryBudget.amount;

    return {
      exceeded,
      budget: categoryBudget,
      currentSpent: progress.spent,
      remaining: categoryBudget.amount - progress.spent
    };
  }
}

// Instancia global
export const budgetManager = BudgetManager.getInstance();

// Hooks de conveniencia
export const useBudget = () => {
  return {
    createBudget: (budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => 
      budgetManager.createBudget(budgetData),
    getUserBudgets: (userId: string, familyId?: string) => 
      budgetManager.getUserBudgets(userId, familyId),
    getBudgetProgress: (budgetId: string, userId: string) => 
      budgetManager.getBudgetProgress(budgetId, userId),
    updateBudget: (budgetId: string, updates: Partial<Budget>) => 
      budgetManager.updateBudget(budgetId, updates),
    deleteBudget: (budgetId: string) => budgetManager.deleteBudget(budgetId),
    getBudgetAlerts: (userId: string) => budgetManager.getBudgetAlerts(userId),
    getBudgetSummary: (userId: string, familyId?: string) => 
      budgetManager.getBudgetSummary(userId, familyId),
    checkBudgetExceeded: (userId: string, category: string, amount: number) => 
      budgetManager.checkBudgetExceeded(userId, category, amount),
  };
}; 