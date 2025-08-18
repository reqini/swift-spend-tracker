export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  category?: string;
}

export interface MonthlyBalance {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface DetectedTransaction {
  id: string;
  amount: number;
  detectedText: string;
  timestamp: string;
}