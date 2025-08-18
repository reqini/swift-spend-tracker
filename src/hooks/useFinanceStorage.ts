import { useState, useEffect } from 'react';
import { Transaction } from '@/types/finance';

const STORAGE_KEY = 'mis-finanzas-transactions';

export const useFinanceStorage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    }
  }, []);

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    const updated = [...transactions, newTransaction];
    saveTransactions(updated);
    return newTransaction;
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    saveTransactions(updated);
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
    addTransaction,
    deleteTransaction,
    getMonthlyTransactions,
    getCurrentMonthBalance
  };
};