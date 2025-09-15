'use client';

import { ExpenseSummary, ExpenseCategory } from '@/types/expense';
import { storageService } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';

interface ExpenseDashboardProps {
  summary: ExpenseSummary;
  categories: ExpenseCategory[];
}

export function ExpenseDashboard({ summary, categories }: ExpenseDashboardProps) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#64748b';
  };

  const topCategories = Object.entries(summary.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentMonths = Object.entries(summary.monthlyTotals)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{summary.totalExpenses}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {storageService.formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {storageService.formatCurrency(summary.averageAmount)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map(([categoryId, amount]) => {
                  const percentage = (amount / summary.totalAmount) * 100;
                  return (
                    <div key={categoryId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {getCategoryName(categoryId)}
                        </span>
                        <span className="text-gray-600">
                          {storageService.formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(categoryId),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expenses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMonths.length > 0 ? (
              <div className="space-y-4">
                {recentMonths.map(([month, amount]) => {
                  const maxAmount = Math.max(...recentMonths.map(([, amt]) => amt));
                  const percentage = (amount / maxAmount) * 100;
                  const monthName = new Date(month + '-01').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  });

                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{monthName}</span>
                        <span className="text-gray-600">
                          {storageService.formatCurrency(amount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No monthly data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}