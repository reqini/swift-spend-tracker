import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Transaction, 
  Family, 
  FamilyMember, 
  FamilyInvitation, 
  FamilyNotification 
} from '@/types/finance';

export const useSupabaseFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyInvitations, setFamilyInvitations] = useState<FamilyInvitation[]>([]);
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserFamily(session.user.id);
          loadTransactions(session.user.id);
          loadFamilyData(session.user.id);
        } else {
          setTransactions([]);
          setFamilyId(null);
          setFamily(null);
          setFamilyMembers([]);
          setFamilyInvitations([]);
          setFamilyNotifications([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserFamily(session.user.id);
        loadTransactions(session.user.id);
        loadFamilyData(session.user.id);
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

  const loadFamilyData = async (userId: string) => {
    if (!familyId) return;

    // Load family details
    const { data: familyData } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (familyData) {
      setFamily(familyData);
    }

    // Load family members
    const { data: membersData } = await supabase
      .from('family_members')
      .select(`
        *,
        users:user_id(email)
      `)
      .eq('family_id', familyId);

    if (membersData) {
      const membersWithEmails = membersData.map(member => ({
        ...member,
        user_email: member.users?.email
      }));
      setFamilyMembers(membersWithEmails);
    }

    // Load family invitations (only for admins)
    const currentMember = membersData?.find(m => m.user_id === userId);
    if (currentMember?.role === 'admin') {
      const { data: invitationsData } = await supabase
        .from('family_invitations')
        .select(`
          *,
          families:family_id(name)
        `)
        .eq('family_id', familyId);

      if (invitationsData) {
        const invitationsWithNames = invitationsData.map(inv => ({
          ...inv,
          family_name: inv.families?.name
        }));
        setFamilyInvitations(invitationsWithNames);
      }
    }

    // Load family notifications
    const { data: notificationsData } = await supabase
      .from('family_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notificationsData) {
      setFamilyNotifications(notificationsData);
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

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          description: transaction.description,
          category: transaction.category
        })
        .eq('id', transaction.id);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? transaction : t)
      );

      return transaction;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
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

  // Family invitation functions
  const sendFamilyInvitation = async (email: string, message?: string) => {
    if (!user || !familyId) return null;

    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .insert({
          family_id: familyId,
          invited_email: email,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for admin
      await supabase
        .from('family_notifications')
        .insert({
          family_id: familyId,
          user_id: user.id,
          type: 'invitation_sent',
          title: 'Invitación Enviada',
          message: `Se envió una invitación a ${email}`,
          data: { invited_email: email }
        });

      // Reload family data
      if (user) {
        await loadFamilyData(user.id);
      }

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const acceptFamilyInvitation = async (token: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('accept_family_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      if (data.success) {
        // Reload all data
        await loadUserFamily(user.id);
        await loadTransactions(user.id);
        await loadFamilyData(user.id);

        toast({
          title: "¡Bienvenido a la familia!",
          description: data.message,
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Family member management
  const removeFamilyMember = async (memberId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Reload family data
      await loadFamilyData(user.id);

      toast({
        title: "Miembro eliminado",
        description: "El miembro fue eliminado de la familia",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const changeMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      // Reload family data
      await loadFamilyData(user.id);

      toast({
        title: "Rol actualizado",
        description: `El rol fue cambiado a ${newRole === 'admin' ? 'administrador' : 'miembro'}`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Notification functions
  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('family_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setFamilyNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );

      return true;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('family_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setFamilyNotifications(prev => prev.filter(n => n.id !== notificationId));

      return true;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  return {
    transactions,
    loading,
    user,
    familyId,
    family,
    familyMembers,
    familyInvitations,
    familyNotifications,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getMonthlyTransactions,
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
  };
};