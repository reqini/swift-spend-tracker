import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "@/components/ui/category-selector";
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

interface ExpenseDetectionModalProps {
  isOpen: boolean;
  onConfirm: (amount: number, description: string, category?: string) => void;
  onCancel: () => void;
  detectedText: string;
}

const ExpenseDetectionModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  detectedText 
}: ExpenseDetectionModalProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (numAmount && numAmount > 0) {
      onConfirm(numAmount, description, category);
      setAmount("");
      setDescription("");
      setCategory("");
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>💳 Posible Gasto Detectado</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Se detectó el siguiente texto que podría ser un gasto:</p>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              {detectedText}
            </div>
            <p>¿Deseas registrar este movimiento como gasto?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del gasto *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descripción del gasto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Categoría</Label>
            <CategorySelector
              value={category}
              onValueChange={setCategory}
              type="expense"
              placeholder="Seleccionar categoría"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!isValidAmount}
            className="bg-destructive hover:bg-destructive/90"
          >
            Registrar Gasto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExpenseDetectionModal;