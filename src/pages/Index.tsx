import { useState, useEffect } from "react";
import { useSupabaseFinance } from "@/hooks/useSupabaseFinance";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import FinanceCard from "@/components/FinanceCard";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionForm from "@/components/AddTransactionForm";
import ExpenseDetectionModal from "@/components/ExpenseDetectionModal";
import BottomNavigation from "@/components/BottomNavigation";
import FamilyManagement from "@/components/FamilyManagement";
import AuthForm from "@/components/AuthForm";
import CategoryStats from "@/components/CategoryStats";
import CategoryChart from "@/components/CategoryChart";
import TransactionFilters from "@/components/TransactionFilters";
import EditTransactionModal from "@/components/EditTransactionModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, TrendingUp, Wallet, RefreshCw, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/finance";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { 
    user, 
    loading, 
    familyId,
    family,
    familyMembers,
    familyInvitations,
    familyNotifications,
    addTransaction, 
    deleteTransaction, 
    updateTransaction,
    getCurrentMonthBalance,
    createFamily,
    joinFamily,
    getFamilyInviteCode,
    sendFamilyInvitation,
    acceptFamilyInvitation,
    removeFamilyMember,
    changeMemberRole,
    markNotificationAsRead,
    deleteNotification,
    migrateFromLocalStorage,
    refreshData,
    clearAllData
  } = useSupabaseFinance();
  const { 
    requestPermission, 
    registerServiceWorker, 
    showNotification, 
    isSupported, 
    permission,
    isMonitoring,
    startClipboardMonitoring,
    simulateExpenseDetection
  } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    registerServiceWorker();
    
    // Handle URL parameters for transaction addition from notifications
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add-expense') {
      setShowExpenseModal(true);
      setDetectedText('Gasto detectado desde notificación');
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('action') === 'add-transaction') {
      const amount = urlParams.get('amount');
      const type = urlParams.get('type');
      const description = urlParams.get('description');
      
      if (amount && type) {
        setShowExpenseModal(true);
        setDetectedText(`${description || 'Transacción detectada'} - $${amount}`);
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Auto-migrate localStorage data when user logs in
    if (user) {
      migrateFromLocalStorage();
    }
  }, [user]);

  const monthBalance = getCurrentMonthBalance();
  
  // Inicializar transacciones filtradas cuando cambian las transacciones
  useEffect(() => {
    setFilteredTransactions(monthBalance.transactions);
  }, [monthBalance.transactions]);



  const handleExpenseConfirm = (amount: number, description: string, category?: string) => {
    addTransaction({
      amount,
      type: 'expense',
      date: new Date().toISOString(),
      description: description || 'Gasto detectado automáticamente',
      category,
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

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleSaveTransaction = async (updatedTransaction: Transaction) => {
    const result = await updateTransaction(updatedTransaction);
    if (result) {
      toast({
        title: "Movimiento actualizado",
        description: "El movimiento fue actualizado correctamente",
      });
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      showNotification('¡Notificaciones activadas!', {
        body: 'Ya puedes recibir alertas de transacciones detectadas'
      });
      
      // Iniciar monitoreo del portapapeles
      startClipboardMonitoring();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  const handleRefresh = async () => {
    if (user) {
      await refreshData();
      toast({
        title: "Datos actualizados",
        description: "Se han sincronizado los datos más recientes",
      });
    }
  };

  const handleClearData = () => {
    clearAllData();
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
            Recibe alertas automáticas cuando detectemos transferencias y pagos
          </p>
          <Button onClick={handleRequestNotifications} className="w-full">
            Activar Notificaciones Push
          </Button>
        </div>
      )}

      {isSupported && permission === 'granted' && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-foreground mb-2">✅ Notificaciones Activas</h3>
          <p className="text-muted-foreground text-sm mb-3">
            {isMonitoring ? 'Monitoreando portapapeles para detectar transacciones' : 'Notificaciones configuradas'}
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={simulateExpenseDetection}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Simular Detección
            </Button>
            <Button 
              onClick={startClipboardMonitoring}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isMonitoring ? 'Detener Monitoreo' : 'Iniciar Monitoreo'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="h-12 font-semibold border-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
        <Button 
          onClick={handleClearData}
          variant="outline"
          className="h-12 font-semibold border-2"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        <FamilyManagement
          familyId={familyId}
          familyName={family?.name}
          familyMembers={familyMembers}
          familyInvitations={familyInvitations}
          familyNotifications={familyNotifications}
          currentUserId={user?.id || ''}
          isAdmin={familyMembers.find(m => m.user_id === user?.id)?.role === 'admin'}
          onCreateFamily={createFamily}
          onJoinFamily={joinFamily}
          onGetInviteCode={getFamilyInviteCode}
          onSendInvitation={sendFamilyInvitation}
          onRemoveMember={removeFamilyMember}
          onChangeRole={changeMemberRole}
          onNotificationRead={markNotificationAsRead}
          onNotificationDelete={deleteNotification}
        />
      </div>

      <div className="flex gap-3">
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
            {            monthBalance.transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
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
      
      <TransactionFilters
        transactions={monthBalance.transactions}
        onFilterChange={setFilteredTransactions}
      />
      
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {monthBalance.transactions.length === 0 
                  ? "No hay movimientos registrados" 
                  : "No se encontraron movimientos con los filtros aplicados"
                }
              </p>
              <p className="text-sm">
                {monthBalance.transactions.length === 0 
                  ? "Agrega tu primer ingreso o gasto" 
                  : "Intenta cambiar los filtros de búsqueda"
                }
              </p>
            </div>
          ) : (
            filteredTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
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

  const renderStats = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Estadísticas del Mes</h2>
      <div className="space-y-6">
        <CategoryChart
          transactions={monthBalance.transactions}
          type="expense"
          title="Gastos por Categoría"
        />
        <CategoryChart
          transactions={monthBalance.transactions}
          type="income"
          title="Ingresos por Categoría"
        />
        <div className="grid grid-cols-1 gap-4">
          <CategoryStats
            transactions={monthBalance.transactions}
            type="expense"
            title="Detalle de Gastos"
          />
          <CategoryStats
            transactions={monthBalance.transactions}
            type="income"
            title="Detalle de Ingresos"
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'transactions':
        return renderTransactions();
      case 'stats':
        return renderStats();
      case 'add':
        return renderAddTransaction();
      default:
        return renderDashboard();
    }
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth form if user is not logged in
  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <div className="p-4 pb-20">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
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
        
        <EditTransactionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveTransaction}
          transaction={editingTransaction}
        />
        
        <PWAInstallPrompt />
      </div>
    </div>
  );
};

export default Index;
