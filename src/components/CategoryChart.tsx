import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from "@/types/finance";
import { getCategoryById } from "@/lib/categories";

interface CategoryChartProps {
  transactions: Transaction[];
  type: 'income' | 'expense';
  title: string;
}

const CategoryChart = ({ transactions, type, title }: CategoryChartProps) => {
  // Filtrar transacciones por tipo y que tengan categoría
  const filteredTransactions = transactions.filter(t => 
    t.type === type && t.category
  );

  if (filteredTransactions.length === 0) {
    return null;
  }

  // Calcular datos para el gráfico
  const categoryData: { [key: string]: number } = {};
  
  filteredTransactions.forEach(transaction => {
    if (transaction.category) {
      categoryData[transaction.category] = (categoryData[transaction.category] || 0) + transaction.amount;
    }
  });

  // Convertir a formato para Recharts
  const chartData = Object.entries(categoryData)
    .map(([categoryId, total]) => {
      const category = getCategoryById(categoryId);
      return {
        name: category?.name || 'Sin categoría',
        total,
        icon: category?.icon || '📦',
        color: category?.color || 'text-gray-500'
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6); // Top 6 categorías

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {formatAmount(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('es-AR', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill={type === 'expense' ? 'hsl(var(--expense))' : 'hsl(var(--income))'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.name}</span>
              <span className="ml-auto font-medium">
                {formatAmount(item.total)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryChart; 