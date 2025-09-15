'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseFilter, SortField, SortOrder } from '@/types/expense';
import { storageService } from '@/lib/storage';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseFilters } from '@/components/ExpenseFilters';
import { ExpenseDashboard } from '@/components/ExpenseDashboard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, BarChart3, List } from 'lucide-react';

export default function Home() {
  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    filterAndSortExpenses,
    getExpenseSummary,
  } = useExpenses();

  const [categories, setCategories] = useState(storageService.getCategories());
  const [activeView, setActiveView] = useState<'list' | 'dashboard'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<ExpenseFilter>({});
  const [sort, setSort] = useState<{ field: SortField; order: SortOrder }>({
    field: 'date',
    order: 'desc',
  });

  // Load categories on mount
  useEffect(() => {
    setCategories(storageService.getCategories());
  }, []);

  const filteredExpenses = filterAndSortExpenses(filter, sort.field, sort.order);
  const summary = getExpenseSummary();

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    addExpense(expenseData);
    setShowForm(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleUpdateExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
      setEditingExpense(null);
      setShowForm(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Tracker</h1>
          <p className="text-gray-600">Track and manage your expenses efficiently</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <Button
              variant={activeView === 'list' ? 'default' : 'ghost'}
              onClick={() => setActiveView('list')}
              className="rounded-none flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Expenses
            </Button>
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveView('dashboard')}
              className="rounded-none flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Button>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6">
            <ExpenseForm
              expense={editingExpense || undefined}
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* Content */}
        {activeView === 'dashboard' ? (
          <ExpenseDashboard summary={summary} categories={categories} />
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <ExpenseFilters
              onFilterChange={setFilter}
              onSortChange={(field, order) => setSort({ field, order })}
              currentSort={sort}
            />

            {/* Results Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>
                    Showing {filteredExpenses.length} of {expenses.length} expenses
                  </span>
                  {filteredExpenses.length > 0 && (
                    <span>
                      Total: {storageService.formatCurrency(
                        filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense List */}
            <ExpenseList
              expenses={filteredExpenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          </div>
        )}
      </div>
    </div>
  );
}