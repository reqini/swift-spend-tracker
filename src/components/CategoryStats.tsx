import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, CategoryStats } from "@/types/finance";
import { getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface CategoryStatsProps {
  transactions: Transaction[];
  type: 'income' | 'expense';
  title: string;
}

const CategoryStats = ({ transactions, type, title }: CategoryStatsProps) => {
  // Filtrar transacciones por tipo y que tengan categoría
  const filteredTransactions = transactions.filter(t => 
    t.type === type && t.category
  );

  if (filteredTransactions.length === 0) {
    return null;
  }

  // Calcular estadísticas por categoría
  const categoryStats: { [key: string]: CategoryStats } = {};
  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  filteredTransactions.forEach(transaction => {
    if (transaction.category) {
      if (!categoryStats[transaction.category]) {
        categoryStats[transaction.category] = {
          category: transaction.category,
          total: 0,
          count: 0,
          percentage: 0
        };
      }
      categoryStats[transaction.category].total += transaction.amount;
      categoryStats[transaction.category].count += 1;
    }
  });

  // Calcular porcentajes
  Object.values(categoryStats).forEach(stat => {
    stat.percentage = (stat.total / total) * 100;
  });

  // Ordenar por total descendente
  const sortedStats = Object.values(categoryStats).sort((a, b) => b.total - a.total);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedStats.slice(0, 5).map((stat) => {
            const category = getCategoryById(stat.category);
            if (!category) return null;

            return (
              <div key={stat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                    type === 'expense' ? 'bg-expense/20' : 'bg-income/20'
                  )}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.count} {stat.count === 1 ? 'movimiento' : 'movimientos'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatAmount(stat.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryStats; 