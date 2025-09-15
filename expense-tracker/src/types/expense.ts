export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ExpenseFilter {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: { [categoryId: string]: number };
  monthlyTotals: { [month: string]: number };
}

export type SortField = 'date' | 'amount' | 'title' | 'category';
export type SortOrder = 'asc' | 'desc';