// Sistema de generación de reportes automáticos
import { supabase } from '@/integrations/supabase/client';
import { analytics } from './analytics';
import { cacheManager } from './cache-manager';
import { budgetManager } from './budget-manager';

interface ReportData {
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  userId: string;
  familyId?: string;
}

interface FinancialReport {
  period: ReportData['period'];
  startDate: string;
  endDate: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
    averageTransaction: number;
  };
  categories: Array<{
    category: string;
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
  }>;
  trends: {
    dailySpending: Array<{ date: string; amount: number }>;
    categoryBreakdown: Array<{ category: string; percentage: number }>;
  };
  budgets: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under' | 'warning' | 'over';
  }>;
  insights: Array<{
    type: 'spending_increase' | 'budget_exceeded' | 'savings_goal' | 'category_insight';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    data?: unknown;
  }>;
}

export class ReportGenerator {
  private static instance: ReportGenerator;

  private constructor() {}

  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  // Generar reporte financiero
  async generateFinancialReport(reportData: ReportData): Promise<FinancialReport> {
    const cacheKey = `report_${reportData.userId}_${reportData.period}_${reportData.startDate}`;
    
    return cacheManager.getOrSet(cacheKey, async () => {
      const transactions = await this.getTransactionsInPeriod(reportData);
      const budgets = await this.getBudgetData(reportData);
      const insights = await this.generateInsights(reportData, transactions, budgets);

      const summary = this.calculateSummary(transactions);
      const categories = this.calculateCategoryBreakdown(transactions);
      const trends = await this.calculateTrends(reportData, transactions);

      const report: FinancialReport = {
        period: reportData.period,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        summary,
        categories,
        trends,
        budgets,
        insights
      };

      analytics.track('report_generated', { 
        period: reportData.period, 
        transactionCount: summary.transactionCount,
        insightsCount: insights.length 
      });

      return report;
    }, 30 * 60 * 1000); // 30 minutos
  }

  // Obtener transacciones en período
  private async getTransactionsInPeriod(reportData: ReportData) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', reportData.userId)
      .gte('date', reportData.startDate)
      .lte('date', reportData.endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener datos de presupuestos
  private async getBudgetData(reportData: ReportData) {
    const budgets = await budgetManager.getUserBudgets(reportData.userId, reportData.familyId);
    const budgetData = [];

    for (const budget of budgets) {
      const progress = await budgetManager.getBudgetProgress(budget.id, reportData.userId);
      if (progress) {
        budgetData.push({
          category: budget.category,
          budgeted: budget.amount,
          spent: progress.spent,
          remaining: progress.remaining,
          percentage: progress.percentage,
          status: progress.status
        });
      }
    }

    return budgetData;
  }

  // Calcular resumen
  private calculateSummary(transactions: any[]) {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netSavings = income - expenses;
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 
      ? (income + expenses) / transactionCount 
      : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings,
      transactionCount,
      averageTransaction
    };
  }

  // Calcular desglose por categorías
  private calculateCategoryBreakdown(transactions: any[]) {
    const categoryMap = new Map<string, { income: number; expenses: number; count: number }>();

    transactions.forEach(transaction => {
      const category = transaction.category || 'Sin categoría';
      const amount = Number(transaction.amount);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { income: 0, expenses: 0, count: 0 });
      }

      const current = categoryMap.get(category)!;
      if (transaction.type === 'income') {
        current.income += amount;
      } else {
        current.expenses += amount;
      }
      current.count++;
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
      transactionCount: data.count
    }));
  }

  // Calcular tendencias
  private async calculateTrends(reportData: ReportData, transactions: any[]) {
    // Agrupar por día
    const dailySpending = new Map<string, number>();
    const categoryBreakdown = new Map<string, number>();

    let totalExpenses = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const date = transaction.date.split('T')[0];
        const amount = Number(transaction.amount);
        const category = transaction.category || 'Sin categoría';

        dailySpending.set(date, (dailySpending.get(date) || 0) + amount);
        categoryBreakdown.set(category, (categoryBreakdown.get(category) || 0) + amount);
        totalExpenses += amount;
      }
    });

    // Convertir a arrays ordenados
    const dailySpendingArray = Array.from(dailySpending.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const categoryBreakdownArray = Array.from(categoryBreakdown.entries())
      .map(([category, amount]) => ({ 
        category, 
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      dailySpending: dailySpendingArray,
      categoryBreakdown: categoryBreakdownArray
    };
  }

  // Generar insights
  private async generateInsights(
    reportData: ReportData, 
    transactions: any[], 
    budgets: any[]
  ) {
    const insights = [];
    const summary = this.calculateSummary(transactions);

    // Insight: Aumento de gastos
    const previousPeriod = await this.getPreviousPeriodData(reportData);
    if (previousPeriod && summary.totalExpenses > previousPeriod.totalExpenses * 1.2) {
      const increase = ((summary.totalExpenses - previousPeriod.totalExpenses) / previousPeriod.totalExpenses) * 100;
      insights.push({
        type: 'spending_increase',
        message: `Tus gastos aumentaron un ${Math.round(increase)}% comparado con el período anterior`,
        severity: 'warning',
        data: { increase, previous: previousPeriod.totalExpenses, current: summary.totalExpenses }
      });
    }

    // Insight: Presupuestos excedidos
    const exceededBudgets = budgets.filter(b => b.status === 'over');
    if (exceededBudgets.length > 0) {
      insights.push({
        type: 'budget_exceeded',
        message: `Has excedido ${exceededBudgets.length} presupuesto(s): ${exceededBudgets.map(b => b.category).join(', ')}`,
        severity: 'critical',
        data: { exceededBudgets }
      });
    }

    // Insight: Objetivo de ahorro
    if (summary.netSavings > 0) {
      insights.push({
        type: 'savings_goal',
        message: `¡Excelente! Has ahorrado $${summary.netSavings.toFixed(2)} este período`,
        severity: 'info',
        data: { savings: summary.netSavings }
      });
    }

    // Insight: Categoría con mayor gasto
    const categories = this.calculateCategoryBreakdown(transactions);
    const topExpenseCategory = categories
      .filter(c => c.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses)[0];

    if (topExpenseCategory) {
      insights.push({
        type: 'category_insight',
        message: `${topExpenseCategory.category} es tu categoría de mayor gasto con $${topExpenseCategory.expenses.toFixed(2)}`,
        severity: 'info',
        data: { category: topExpenseCategory }
      });
    }

    return insights;
  }

  // Obtener datos del período anterior
  private async getPreviousPeriodData(reportData: ReportData) {
    const startDate = new Date(reportData.startDate);
    const endDate = new Date(reportData.endDate);
    const periodLength = endDate.getTime() - startDate.getTime();

    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodLength);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', reportData.userId)
        .gte('date', previousStartDate.toISOString())
        .lte('date', previousEndDate.toISOString());

      if (error) return null;

      const transactions = data || [];
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { totalExpenses: expenses };
    } catch {
      return null;
    }
  }

  // Generar reporte semanal automático
  async generateWeeklyReport(userId: string, familyId?: string): Promise<FinancialReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.generateFinancialReport({
      period: 'weekly',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
      familyId
    });
  }

  // Generar reporte mensual automático
  async generateMonthlyReport(userId: string, familyId?: string): Promise<FinancialReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    return this.generateFinancialReport({
      period: 'monthly',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
      familyId
    });
  }

  // Generar reporte anual automático
  async generateYearlyReport(userId: string, familyId?: string): Promise<FinancialReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), 0, 1);

    return this.generateFinancialReport({
      period: 'yearly',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
      familyId
    });
  }

  // Exportar reporte a CSV
  async exportReportToCSV(report: FinancialReport): Promise<string> {
    const csvRows = [];

    // Header
    csvRows.push(['Reporte Financiero', `${report.period}`, `${report.startDate} - ${report.endDate}`]);
    csvRows.push([]);

    // Resumen
    csvRows.push(['RESUMEN']);
    csvRows.push(['Ingresos Totales', report.summary.totalIncome]);
    csvRows.push(['Gastos Totales', report.summary.totalExpenses]);
    csvRows.push(['Ahorro Neto', report.summary.netSavings]);
    csvRows.push(['Cantidad de Transacciones', report.summary.transactionCount]);
    csvRows.push(['Promedio por Transacción', report.summary.averageTransaction]);
    csvRows.push([]);

    // Categorías
    csvRows.push(['CATEGORÍAS', 'Ingresos', 'Gastos', 'Neto', 'Cantidad Transacciones']);
    report.categories.forEach(cat => {
      csvRows.push([cat.category, cat.income, cat.expenses, cat.net, cat.transactionCount]);
    });
    csvRows.push([]);

    // Presupuestos
    csvRows.push(['PRESUPUESTOS', 'Presupuestado', 'Gastado', 'Restante', 'Porcentaje', 'Estado']);
    report.budgets.forEach(budget => {
      csvRows.push([budget.category, budget.budgeted, budget.spent, budget.remaining, budget.percentage, budget.status]);
    });

    return csvRows.map(row => row.join(',')).join('\n');
  }

  // Programar reportes automáticos
  scheduleAutomaticReports(userId: string, familyId?: string) {
    // Reporte semanal (cada domingo)
    const scheduleWeekly = () => {
      const now = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7;
      const nextSunday = new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
      nextSunday.setHours(9, 0, 0, 0); // 9 AM

      const timeUntilNext = nextSunday.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.generateWeeklyReport(userId, familyId);
        scheduleWeekly(); // Programar el siguiente
      }, timeUntilNext);
    };

    // Reporte mensual (primer día del mes)
    const scheduleMonthly = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
      
      const timeUntilNext = nextMonth.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.generateMonthlyReport(userId, familyId);
        scheduleMonthly(); // Programar el siguiente
      }, timeUntilNext);
    };

    scheduleWeekly();
    scheduleMonthly();
  }
}

// Instancia global
export const reportGenerator = ReportGenerator.getInstance();

// Hooks de conveniencia
export const useReports = () => {
  return {
    generateFinancialReport: (reportData: ReportData) => 
      reportGenerator.generateFinancialReport(reportData),
    generateWeeklyReport: (userId: string, familyId?: string) => 
      reportGenerator.generateWeeklyReport(userId, familyId),
    generateMonthlyReport: (userId: string, familyId?: string) => 
      reportGenerator.generateMonthlyReport(userId, familyId),
    generateYearlyReport: (userId: string, familyId?: string) => 
      reportGenerator.generateYearlyReport(userId, familyId),
    exportReportToCSV: (report: FinancialReport) => 
      reportGenerator.exportReportToCSV(report),
    scheduleAutomaticReports: (userId: string, familyId?: string) => 
      reportGenerator.scheduleAutomaticReports(userId, familyId),
  };
}; 