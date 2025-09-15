'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseFilter, SortField, SortOrder } from '@/types/expense';
import { storageService } from '@/lib/storage';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const loadedExpenses = storageService.getExpenses();
    setExpenses(loadedExpenses);
    setLoading(false);
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expenseData,
      id: storageService.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    storageService.addExpense(newExpense);
    setExpenses(prev => [...prev, newExpense]);
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const updatedExpense = expenses.find(e => e.id === id);
    if (!updatedExpense) return;

    const newExpense = {
      ...updatedExpense,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    storageService.updateExpense(newExpense);
    setExpenses(prev => prev.map(e => e.id === id ? newExpense : e));
  }, [expenses]);

  const deleteExpense = useCallback((id: string) => {
    storageService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const filterAndSortExpenses = useCallback((
    filter: ExpenseFilter = {},
    sortField: SortField = 'date',
    sortOrder: SortOrder = 'desc'
  ) => {
    let filtered = [...expenses];

    // Apply filters
    if (filter.category) {
      filtered = filtered.filter(e => e.category.id === filter.category);
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(e => e.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(e => e.date <= filter.dateTo!);
    }

    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(e => e.amount >= filter.minAmount!);
    }

    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(e => e.amount <= filter.maxAmount!);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchTerm) ||
        e.description?.toLowerCase().includes(searchTerm) ||
        e.category.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.name.toLowerCase();
          bValue = b.category.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [expenses]);

  const getExpenseSummary = useCallback(() => {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    const categoryBreakdown: { [categoryId: string]: number } = {};
    const monthlyTotals: { [month: string]: number } = {};

    expenses.forEach(expense => {
      // Category breakdown
      if (!categoryBreakdown[expense.category.id]) {
        categoryBreakdown[expense.category.id] = 0;
      }
      categoryBreakdown[expense.category.id] += expense.amount;

      // Monthly totals
      const month = expense.date.substring(0, 7); // YYYY-MM format
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += expense.amount;
    });

    return {
      totalExpenses,
      totalAmount,
      averageAmount,
      categoryBreakdown,
      monthlyTotals,
    };
  }, [expenses]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    filterAndSortExpenses,
    getExpenseSummary,
  };
}