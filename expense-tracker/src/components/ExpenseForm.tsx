'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { storageService } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    amount: expense?.amount?.toString() || '',
    categoryId: expense?.category.id || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    description: expense?.description || '',
  });

  useEffect(() => {
    setCategories(storageService.getCategories());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    if (!selectedCategory) return;

    const expenseData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      category: selectedCategory,
      date: formData.date,
      description: formData.description || undefined,
    };

    onSubmit(expenseData);
    
    // Reset form if not editing
    if (!expense) {
      setFormData({
        title: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.title && formData.amount && formData.categoryId && formData.date;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter expense title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Amount *
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category *
            </label>
            <Select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Date *
            </label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Input
              id="description"
              type="text"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!isValid} className="flex-1">
              {expense ? 'Update Expense' : 'Add Expense'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}