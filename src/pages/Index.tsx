import { useState, useEffect } from "react";
import { useFinanceStorage } from "@/hooks/useFinanceStorage";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import FinanceCard from "@/components/FinanceCard";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionForm from "@/components/AddTransactionForm";
import ExpenseDetectionModal from "@/components/ExpenseDetectionModal";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, TrendingUp, Wallet } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const { addTransaction, deleteTransaction, getCurrentMonthBalance } = useFinanceStorage();
  const { requestPermission, registerServiceWorker, showNotification, isSupported, permission } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const monthBalance = getCurrentMonthBalance();

  // Simulate expense detection (in real app this would be clipboard monitoring)
  const simulateExpenseDetection = () => {
    const mockDetections = [
      "CBU: 1234567890123456789012",
      "Alias: mi.cuenta.bancaria",
      "Tarjeta: **** **** **** 1234",
      "Transferencia a: juan.perez.alias"
    ];
    
    const randomDetection = mockDetections[Math.floor(Math.random() * mockDetections.length)];
    setDetectedText(randomDetection);
    setShowExpenseModal(true);
  };

  const handleExpenseConfirm = (amount: number, description: string) => {
    addTransaction({
      amount,
      type: 'expense',
      date: new Date().toISOString(),
      description: description || 'Gasto detectado automáticamente',
    });
    
    toast({
      title: "Gasto registrado",
      description: `Se agregó un gasto de $${amount.toLocaleString('es-AR')}`,
    });
    
    setShowExpenseModal(false);
  };

  const handleAddTransaction = (transaction: any) => {
    addTransaction(transaction);
    toast({
      title: `${transaction.type === 'income' ? 'Ingreso' : 'Gasto'} registrado`,
      description: `Se agregó correctamente por $${transaction.amount.toLocaleString('es-AR')}`,
    });
    setActiveTab('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast({
      title: "Movimiento eliminado",
      description: "El movimiento fue eliminado correctamente",
    });
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      showNotification('¡Notificaciones activadas!', {
        body: 'Ya puedes recibir alertas de gastos detectados'
      });
    }
  };

  const formatMonthYear = () => {
    const now = new Date();
    return now.toLocaleDateString('es-AR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          💰 Mis Finanzas Rápidas
        </h1>
        <p className="text-muted-foreground capitalize text-lg font-medium">
          {formatMonthYear()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FinanceCard
          title="Ingresos del mes"
          amount={monthBalance.totalIncome}
          type="income"
        />
        <FinanceCard
          title="Gastos del mes"
          amount={monthBalance.totalExpenses}
          type="expense"
        />
        <FinanceCard
          title="Balance final"
          amount={monthBalance.balance}
          type="balance"
        />
      </div>

      {isSupported && permission !== 'granted' && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-foreground mb-2">🔔 Activar Notificaciones</h3>
          <p className="text-muted-foreground text-sm mb-3">
            Recibe alertas automáticas cuando detectemos posibles gastos
          </p>
          <Button onClick={handleRequestNotifications} className="w-full">
            Activar Notificaciones Push
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          onClick={simulateExpenseDetection}
          variant="outline"
          className="flex-1 h-12 font-semibold border-2"
        >
          <Bell className="h-5 w-5 mr-2" />
          Simular Detección
        </Button>
        <Button 
          onClick={() => setActiveTab('add')}
          className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90"
        >
          <TrendingUp className="h-5 w-5 mr-2" />
          Agregar Movimiento
        </Button>
      </div>

      {monthBalance.transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Últimos movimientos
          </h3>
          <div className="space-y-2">
            {monthBalance.transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Todos los Movimientos</h2>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {monthBalance.transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay movimientos registrados</p>
              <p className="text-sm">Agrega tu primer ingreso o gasto</p>
            </div>
          ) : (
            monthBalance.transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                />
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderAddTransaction = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Agregar Movimiento</h2>
      <AddTransactionForm 
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'transactions':
        return renderTransactions();
      case 'add':
        return renderAddTransaction();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <div className="p-4 pb-20">
          {renderContent()}
        </div>
        
        <BottomNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <ExpenseDetectionModal
          isOpen={showExpenseModal}
          onConfirm={handleExpenseConfirm}
          onCancel={() => setShowExpenseModal(false)}
          detectedText={detectedText}
        />
      </div>
    </div>
  );
};

export default Index;
