// Tests unitarios para useSupabaseFinance
import { renderHook, act } from '@testing-library/react';
import { useSupabaseFinance } from '../hooks/useSupabaseFinance';
import { supabase } from '../integrations/supabase/client';

// Mock de Supabase
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock del hook de toast
jest.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock del error handler
jest.mock('../lib/error-handler', () => ({
  errorHandler: {
    handleError: jest.fn(),
  },
}));

describe('useSupabaseFinance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSupabaseFinance());

    expect(result.current.transactions).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.familyId).toBeNull();
  });

  it('should load transactions successfully', async () => {
    const mockTransactions = [
      {
        id: '1',
        amount: 100,
        type: 'income',
        date: '2024-01-01',
        description: 'Test income',
        category: 'salary',
      },
    ];

    const mockSupabaseResponse = {
      data: mockTransactions,
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue(mockSupabaseResponse),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    await act(async () => {
      await result.current.loadTransactions('user123');
    });

    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it('should handle transaction loading error', async () => {
    const mockError = new Error('Database error');
    const mockSupabaseResponse = {
      data: null,
      error: mockError,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue(mockSupabaseResponse),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    await act(async () => {
      await result.current.loadTransactions('user123');
    });

    expect(result.current.transactions).toEqual([]);
  });

  it('should add transaction successfully', async () => {
    const newTransaction = {
      amount: 50,
      type: 'expense' as const,
      date: '2024-01-01',
      description: 'Test expense',
      category: 'food',
    };

    const mockSupabaseResponse = {
      data: { id: '1', ...newTransaction },
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockSupabaseResponse),
        }),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    await act(async () => {
      const addedTransaction = await result.current.addTransaction(newTransaction);
      expect(addedTransaction).toEqual({ id: '1', ...newTransaction });
    });
  });

  it('should create family successfully', async () => {
    const familyName = 'Test Family';
    const mockFamily = {
      id: 'family123',
      name: familyName,
      created_by: 'user123',
    };

    const mockSupabaseResponse = {
      data: mockFamily,
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockSupabaseResponse),
        }),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    // Mock user
    result.current.user = { id: 'user123' };

    await act(async () => {
      const createdFamily = await result.current.createFamily(familyName);
      expect(createdFamily).toEqual(mockFamily);
    });
  });

  it('should handle family creation error', async () => {
    const familyName = 'Test Family';
    const mockError = new Error('Family creation failed');

    const mockSupabaseResponse = {
      data: null,
      error: mockError,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockSupabaseResponse),
        }),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    // Mock user
    result.current.user = { id: 'user123' };

    await act(async () => {
      const createdFamily = await result.current.createFamily(familyName);
      expect(createdFamily).toBeNull();
    });
  });

  it('should delete transaction successfully', async () => {
    const transactionId = '1';
    const mockSupabaseResponse = {
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue(mockSupabaseResponse),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    // Mock transactions
    result.current.transactions = [
      { id: '1', amount: 100, type: 'income', date: '2024-01-01' },
      { id: '2', amount: 50, type: 'expense', date: '2024-01-01' },
    ];

    await act(async () => {
      await result.current.deleteTransaction(transactionId);
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].id).toBe('2');
  });

  it('should update transaction successfully', async () => {
    const updatedTransaction = {
      id: '1',
      amount: 150,
      type: 'expense' as const,
      date: '2024-01-01',
      description: 'Updated expense',
      category: 'food',
    };

    const mockSupabaseResponse = {
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue(mockSupabaseResponse),
      }),
    });

    const { result } = renderHook(() => useSupabaseFinance());

    // Mock transactions
    result.current.transactions = [
      { id: '1', amount: 100, type: 'income', date: '2024-01-01' },
    ];

    await act(async () => {
      const resultTransaction = await result.current.updateTransaction(updatedTransaction);
      expect(resultTransaction).toEqual(updatedTransaction);
    });

    expect(result.current.transactions[0]).toEqual(updatedTransaction);
  });
}); 