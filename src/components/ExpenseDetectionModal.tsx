import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ExpenseDetectionModalProps {
  isOpen: boolean;
  onConfirm: (amount: number, description: string) => void;
  onCancel: () => void;
  detectedText: string;
}

const ExpenseDetectionModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  detectedText 
}: ExpenseDetectionModalProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      onConfirm(Number(amount), description);
      setAmount('');
      setDescription('');
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Registrar este movimiento como gasto?</AlertDialogTitle>
          <AlertDialogDescription>
            Se detectó una posible transacción: <br />
            <code className="bg-muted p-1 rounded text-sm">{detectedText}</code>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 my-4">
          <div>
            <Label htmlFor="detected-amount">Monto del gasto</Label>
            <Input
              id="detected-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ingrese el monto"
              required
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <Label htmlFor="detected-description">Descripción (opcional)</Label>
            <Input
              id="detected-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Transferencia, Pago con tarjeta"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            No, cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0}
            className="bg-expense hover:bg-expense/90"
          >
            Sí, es un gasto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExpenseDetectionModal;