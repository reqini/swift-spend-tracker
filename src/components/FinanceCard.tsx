import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinanceCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  className?: string;
}

const FinanceCard = ({ title, amount, type, className }: FinanceCardProps) => {
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getAmountColor = () => {
    if (type === 'income') return 'text-income';
    if (type === 'expense') return 'text-expense';
    if (amount > 0) return 'text-balance-positive';
    if (amount < 0) return 'text-balance-negative';
    return 'text-balance-neutral';
  };

  const getCardVariant = () => {
    if (type === 'income') return 'bg-gradient-to-br from-income/10 to-income/5 border-income/20';
    if (type === 'expense') return 'bg-gradient-to-br from-expense/10 to-expense/5 border-expense/20';
    return 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20';
  };

  return (
    <Card className={cn(getCardVariant(), "shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", getAmountColor())}>
          {formatAmount(amount)}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceCard;