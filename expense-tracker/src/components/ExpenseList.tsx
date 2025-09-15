'use client';

import { Expense } from '@/types/expense';
import { ExpenseCard } from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">💸</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
        <p className="text-gray-600">Start by adding your first expense above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}