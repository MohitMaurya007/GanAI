import { Expense, ExpenseCategory } from '@/types/expense';

const EXPENSES_KEY = 'expense-tracker-expenses';
const CATEGORIES_KEY = 'expense-tracker-categories';

// Default categories
export const defaultCategories: ExpenseCategory[] = [
  { id: '1', name: 'Food & Dining', color: '#ef4444', icon: '🍽️' },
  { id: '2', name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { id: '3', name: 'Shopping', color: '#f59e0b', icon: '🛍️' },
  { id: '4', name: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
  { id: '5', name: 'Bills & Utilities', color: '#10b981', icon: '⚡' },
  { id: '6', name: 'Healthcare', color: '#ec4899', icon: '🏥' },
  { id: '7', name: 'Education', color: '#6366f1', icon: '📚' },
  { id: '8', name: 'Travel', color: '#06b6d4', icon: '✈️' },
  { id: '9', name: 'Other', color: '#64748b', icon: '📝' },
];

export const storageService = {
  // Expenses
  getExpenses(): Expense[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(EXPENSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: Expense[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  },

  addExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.push(expense);
    this.saveExpenses(expenses);
  },

  updateExpense(updatedExpense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
      expenses[index] = updatedExpense;
      this.saveExpenses(expenses);
    }
  },

  deleteExpense(id: string): void {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    this.saveExpenses(filtered);
  },

  // Categories
  getCategories(): ExpenseCategory[] {
    if (typeof window === 'undefined') return defaultCategories;
    try {
      const data = localStorage.getItem(CATEGORIES_KEY);
      if (!data) {
        // Initialize with default categories
        this.saveCategories(defaultCategories);
        return defaultCategories;
      }
      return JSON.parse(data);
    } catch {
      return defaultCategories;
    }
  },

  saveCategories(categories: ExpenseCategory[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  },

  // Utility methods
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },
};