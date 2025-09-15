'use client';

import { useState, useEffect } from 'react';
import { ExpenseFilter, ExpenseCategory, SortField, SortOrder } from '@/types/expense';
import { storageService } from '@/lib/storage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Filter, X } from 'lucide-react';

interface ExpenseFiltersProps {
  onFilterChange: (filter: ExpenseFilter) => void;
  onSortChange: (field: SortField, order: SortOrder) => void;
  currentSort: { field: SortField; order: SortOrder };
}

export function ExpenseFilters({ onFilterChange, onSortChange, currentSort }: ExpenseFiltersProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilter>({});

  useEffect(() => {
    setCategories(storageService.getCategories());
  }, []);

  const handleFilterChange = (field: keyof ExpenseFilter, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  const toggleSort = (field: SortField) => {
    const newOrder = currentSort.field === field && currentSort.order === 'desc' ? 'asc' : 'desc';
    onSortChange(field, newOrder);
  };

  const getSortIcon = (field: SortField) => {
    if (currentSort.field !== field) return null;
    return currentSort.order === 'desc' ? '↓' : '↑';
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Search and main controls */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search expenses..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Sort buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-600 flex items-center">Sort by:</span>
          {(['date', 'amount', 'title', 'category'] as SortField[]).map(field => (
            <Button
              key={field}
              variant={currentSort.field === field ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort(field)}
              className="flex items-center gap-1"
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {getSortIcon(field)}
            </Button>
          ))}
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.minAmount?.toString() || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                value={filters.maxAmount?.toString() || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}