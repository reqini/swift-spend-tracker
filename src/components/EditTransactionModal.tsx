import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "@/components/ui/category-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Transaction } from "@/types/finance";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transaction: Transaction | null;
}

const EditTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transaction 
}: EditTransactionModalProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setCategory(transaction.category || '');
      setDate(transaction.date.split('T')[0]); // Solo la fecha, sin la hora
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      amount: Number(amount),
      description: description.trim() || undefined,
      category: category || undefined,
      date: new Date(date).toISOString(),
    };

    onSave(updatedTransaction);
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setCategory(transaction.category || '');
      setDate(transaction.date.split('T')[0]);
    }
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Movimiento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
              required
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descripción del movimiento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div>
            <Label>Categoría</Label>
            <CategorySelector
              value={category}
              onValueChange={setCategory}
              type={transaction.type}
              placeholder="Seleccionar categoría"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0}
          >
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal; 