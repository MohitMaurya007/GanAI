'use client';

import { Expense } from '@/types/expense';
import { storageService } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const formattedDate = format(new Date(expense.date), 'MMM dd, yyyy');
  const formattedAmount = storageService.formatCurrency(expense.amount);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: expense.category.color }}
              />
              <h3 className="font-semibold text-lg truncate">{expense.title}</h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <span className="text-base">{expense.category.icon}</span>
                <span>{expense.category.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {expense.description && (
              <p className="text-sm text-gray-600 mb-3">{expense.description}</p>
            )}

            <div className="flex items-center gap-1 text-lg font-bold text-green-600">
              <DollarSign className="w-5 h-5" />
              <span>{formattedAmount}</span>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onEdit(expense)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => onDelete(expense.id)}
              className="h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}