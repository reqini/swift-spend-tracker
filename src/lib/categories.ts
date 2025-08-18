import { Category } from '@/types/finance';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentación', icon: '🍽️', color: 'text-orange-500', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: 'text-blue-500', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: 'text-purple-500', type: 'expense' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', color: 'text-pink-500', type: 'expense' },
  { id: 'health', name: 'Salud', icon: '🏥', color: 'text-red-500', type: 'expense' },
  { id: 'education', name: 'Educación', icon: '📚', color: 'text-indigo-500', type: 'expense' },
  { id: 'bills', name: 'Servicios', icon: '💡', color: 'text-yellow-500', type: 'expense' },
  { id: 'housing', name: 'Vivienda', icon: '🏠', color: 'text-green-500', type: 'expense' },
  { id: 'personal', name: 'Personal', icon: '👤', color: 'text-gray-500', type: 'expense' },
  { id: 'other', name: 'Otros', icon: '📦', color: 'text-gray-400', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salario', icon: '💰', color: 'text-green-600', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💼', color: 'text-blue-600', type: 'income' },
  { id: 'investment', name: 'Inversiones', icon: '📈', color: 'text-emerald-600', type: 'income' },
  { id: 'gift', name: 'Regalo', icon: '🎁', color: 'text-pink-600', type: 'income' },
  { id: 'refund', name: 'Reembolso', icon: '↩️', color: 'text-orange-600', type: 'income' },
  { id: 'other', name: 'Otros', icon: '📦', color: 'text-gray-500', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoriesByType = (type: 'income' | 'expense'): Category[] => {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};

export const getCategoryById = (id: string): Category | undefined => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryByName = (name: string): Category | undefined => {
  return ALL_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
}; 