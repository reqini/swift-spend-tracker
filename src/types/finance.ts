export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
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

export interface CategoryStats {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_email?: string;
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  invited_email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  family_name?: string;
  invited_by_email?: string;
}

export interface FamilyNotification {
  id: string;
  family_id: string;
  user_id: string;
  type: 'invitation_sent' | 'invitation_accepted' | 'member_joined' | 'transaction_added';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
}