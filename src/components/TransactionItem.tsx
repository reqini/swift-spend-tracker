import { Transaction } from "@/types/finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

const TransactionItem = ({ transaction, onDelete }: TransactionItemProps) => {
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const isIncome = transaction.type === 'income';

  return (
    <Card className="mb-3 border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-full",
              isIncome ? "bg-income/20 border border-income/30" : "bg-expense/20 border border-expense/30"
            )}>
              {isIncome ? (
                <ArrowUpCircle className="h-5 w-5 text-income" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-expense" />
              )}
            </div>
            <div className="flex-1">
              <div className={cn(
                "text-lg font-bold",
                isIncome ? "text-income" : "text-expense"
              )}>
                {formatAmount(transaction.amount)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {formatDate(transaction.date)}
              </div>
              {transaction.description && (
                <div className="text-sm text-foreground/80 mt-1">
                  {transaction.description}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transaction.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionItem;