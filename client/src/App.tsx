
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, Filter, DollarSign, Calendar, Tag } from 'lucide-react';
import type { 
  ExpenseWithCategory, 
  Category, 
  CreateExpenseInput, 
  CreateCategoryInput,
  ExpenseFilter,
  UpdateCategoryInput 
} from '../../server/src/schema';

function App() {
  // State management
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>({});

  // Form states
  const [expenseForm, setExpenseForm] = useState<CreateExpenseInput>({
    amount: 0,
    description: '',
    date: new Date(),
    category_id: 0
  });

  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: ''
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  // Load data functions
  const loadExpenses = useCallback(async () => {
    try {
      const result = await trpc.getExpenses.query(Object.keys(filter).length > 0 ? filter : undefined);
      setExpenses(result);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }, [filter]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Effects
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Expense handlers
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.category_id === 0) {
      alert('Please select a category');
      return;
    }
    
    setIsLoading(true);
    try {
      await trpc.createExpense.mutate(expenseForm);
      // Since the API returns Expense but we need ExpenseWithCategory for display,
      // we'll reload expenses to get the complete data
      await loadExpenses();
      
      // Reset form
      setExpenseForm({
        amount: 0,
        description: '',
        date: new Date(),
        category_id: 0
      });
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await trpc.deleteExpense.mutate(id);
      setExpenses((prev: ExpenseWithCategory[]) => 
        prev.filter((expense: ExpenseWithCategory) => expense.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCategory = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCategoryForm({ name: '' });
      setShowCategoryDialog(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateCategoryInput = {
        id: editingCategory.id,
        name: categoryForm.name
      };
      await trpc.updateCategory.mutate(updateData);
      await loadCategories();
      setEditingCategory(null);
      setShowCategoryDialog(false);
      setCategoryForm({ name: '' });
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await trpc.deleteCategory.mutate(id);
      setCategories((prev: Category[]) => 
        prev.filter((category: Category) => category.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof ExpenseFilter, value: string | number | Date | undefined) => {
    setFilter((prev: ExpenseFilter) => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  // Calculate total
  const totalExpenses = expenses.reduce((sum: number, expense: ExpenseWithCategory) => 
    sum + expense.amount, 0
  );

  // Format currency
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            💰 Expense Tracker
          </h1>
          <p className="text-gray-600">Track your expenses and manage your budget efficiently</p>
          
          {/* Note about stub implementation */}
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
            <strong>Note:</strong> This application uses stub backend implementations. 
            Data won't persist and some features may not work as expected until the backend handlers are fully implemented.
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Transactions</p>
                  <p className="text-2xl font-bold">{expenses.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Tag className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">📊 Expenses</TabsTrigger>
            <TabsTrigger value="categories">🏷️ Categories</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Add Expense Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseForm.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0
                        }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={expenseForm.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          description: e.target.value
                        }))
                      }
                      placeholder="Coffee, groceries, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={expenseForm.date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          date: new Date(e.target.value)
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={expenseForm.category_id.toString()}
                      onValueChange={(value: string) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({
                          ...prev,
                          category_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-4">
                    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                      {isLoading ? 'Adding...' : 'Add Expense'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={filter.category_id?.toString() || 'all'}
                      onValueChange={(value: string) =>
                        handleFilterChange('category_id', value === 'all' ? undefined : parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filter.start_date?.toISOString().split('T')[0] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('start_date', e.target.value ? new Date(e.target.value) : undefined)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filter.end_date?.toISOString().split('T')[0] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('end_date', e.target.value ? new Date(e.target.value) : undefined)
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No expenses recorded yet. Add your first expense above! 🚀</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {expenses.map((expense: ExpenseWithCategory) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{expense.description}</h3>
                            <Badge variant="secondary">{expense.category.name}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="mr-4">📅 {expense.date.toLocaleDateString()}</span>
                            <span>💰 {formatCurrency(expense.amount)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Manage Categories
                  </CardTitle>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '' });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoryName">Category Name</Label>
                          <Input
                            id="categoryName"
                            value={categoryForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCategoryForm((prev: CreateCategoryInput) => ({
                                ...prev,
                                name: e.target.value
                              }))
                            }
                            placeholder="e.g., Food, Transportation, Entertainment"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCategoryDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No categories yet. Create your first category! 🏷️</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category: Category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                      >
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-gray-500">
                            Created: {category.created_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryForm({ name: category.name });
                              setShowCategoryDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{category.name}"? This may affect existing expenses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
