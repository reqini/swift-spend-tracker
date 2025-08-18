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
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isIncome ? "bg-income/10" : "bg-expense/10"
            )}>
              {isIncome ? (
                <ArrowUpCircle className="h-4 w-4 text-income" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-expense" />
              )}
            </div>
            <div>
              <div className={cn(
                "font-semibold",
                isIncome ? "text-income" : "text-expense"
              )}>
                {formatAmount(transaction.amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </div>
              {transaction.description && (
                <div className="text-sm text-muted-foreground">
                  {transaction.description}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transaction.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionItem;