
import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long')
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long')
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  amount: z.number(),
  description: z.string(),
  date: z.coerce.date(),
  category_id: z.number(),
  created_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

// Input schema for creating expenses
export const createExpenseInputSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  date: z.coerce.date(),
  category_id: z.number().positive('Category is required')
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Input schema for updating expenses
export const updateExpenseInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  date: z.coerce.date().optional(),
  category_id: z.number().positive('Category is required').optional()
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseInputSchema>;

// Filter schema for expenses
export const expenseFilterSchema = z.object({
  category_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type ExpenseFilter = z.infer<typeof expenseFilterSchema>;

// Expense with category details
export const expenseWithCategorySchema = z.object({
  id: z.number(),
  amount: z.number(),
  description: z.string(),
  date: z.coerce.date(),
  category_id: z.number(),
  created_at: z.coerce.date(),
  category: categorySchema
});

export type ExpenseWithCategory = z.infer<typeof expenseWithCategorySchema>;
