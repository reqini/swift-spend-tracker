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
    if (type === 'income') return 'bg-gradient-to-br from-income/20 to-income/10 border-income/30 shadow-sm';
    if (type === 'expense') return 'bg-gradient-to-br from-expense/20 to-expense/10 border-expense/30 shadow-sm';
    return 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-sm';
  };

  return (
    <Card className={cn(getCardVariant(), className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn("text-3xl font-bold", getAmountColor())}>
          {formatAmount(amount)}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceCard;