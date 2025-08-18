import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/finance';

export const useSupabaseFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserFamily(session.user.id);
          loadTransactions(session.user.id);
        } else {
          setTransactions([]);
          setFamilyId(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserFamily(session.user.id);
        loadTransactions(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFamily = async (userId: string) => {
    const { data } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setFamilyId(data.family_id);
    }
  };

  const loadTransactions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedTransactions = data?.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
        date: t.date,
        description: t.description || undefined,
        category: t.category || undefined
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          family_id: familyId,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          description: transaction.description,
          category: transaction.category
        })
        .select()
        .single();

      if (error) throw error;

      const newTransaction = {
        id: data.id,
        amount: Number(data.amount),
        type: data.type as 'income' | 'expense',
        date: data.date,
        description: data.description || undefined,
        category: data.category || undefined
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createFamily = async (name: string) => {
    if (!user) return null;

    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          created_by: user.id
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      setFamilyId(family.id);
      
      // Update existing transactions to belong to the family
      await supabase
        .from('transactions')
        .update({ family_id: family.id })
        .eq('user_id', user.id);

      loadTransactions(user.id);

      return family;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const joinFamily = async (inviteCode: string) => {
    if (!user) return null;

    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (familyError) throw familyError;

      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      setFamilyId(family.id);
      
      // Update existing transactions to belong to the family
      await supabase
        .from('transactions')
        .update({ family_id: family.id })
        .eq('user_id', user.id);

      loadTransactions(user.id);

      return family;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const getFamilyInviteCode = async () => {
    if (!familyId) return null;

    try {
      const { data, error } = await supabase
        .from('families')
        .select('invite_code')
        .eq('id', familyId)
        .single();

      if (error) throw error;
      return data.invite_code;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!user) return;

    const stored = localStorage.getItem('mis-finanzas-transactions');
    if (!stored) return;

    try {
      const localTransactions = JSON.parse(stored);
      if (!Array.isArray(localTransactions) || localTransactions.length === 0) return;

      for (const transaction of localTransactions) {
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            family_id: familyId,
            amount: transaction.amount,
            type: transaction.type,
            date: transaction.date,
            description: transaction.description,
            category: transaction.category
          });
      }

      localStorage.removeItem('mis-finanzas-transactions');
      loadTransactions(user.id);

      toast({
        title: "Migración exitosa",
        description: `Se migraron ${localTransactions.length} transacciones`,
      });
    } catch (error: any) {
      toast({
        title: "Error en migración",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    if (user) {
      await loadTransactions(user.id);
    }
  };

  const clearAllData = () => {
    setTransactions([]);
    localStorage.removeItem('mis-finanzas-transactions');
    toast({
      title: "Datos limpiados",
      description: "Se han eliminado todas las transacciones locales",
    });
  };

  const getMonthlyTransactions = (year: number, month: number) => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const getCurrentMonthBalance = () => {
    const now = new Date();
    const currentMonth = getMonthlyTransactions(now.getFullYear(), now.getMonth());
    
    const totalIncome = currentMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = currentMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactions: currentMonth
    };
  };

  return {
    transactions,
    loading,
    user,
    familyId,
    addTransaction,
    deleteTransaction,
    getMonthlyTransactions,
    getCurrentMonthBalance,
    createFamily,
    joinFamily,
    getFamilyInviteCode,
    migrateFromLocalStorage,
    refreshData,
    clearAllData
  };
};