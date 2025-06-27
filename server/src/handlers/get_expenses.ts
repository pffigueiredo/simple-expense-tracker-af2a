
import { db } from '../db';
import { expensesTable, categoriesTable } from '../db/schema';
import { type ExpenseWithCategory, type ExpenseFilter } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getExpenses = async (filter?: ExpenseFilter): Promise<ExpenseWithCategory[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      if (filter.category_id !== undefined) {
        conditions.push(eq(expensesTable.category_id, filter.category_id));
      }

      if (filter.start_date !== undefined) {
        // Convert Date to YYYY-MM-DD string format for date column comparison
        const startDateStr = filter.start_date.toISOString().split('T')[0];
        conditions.push(gte(expensesTable.date, startDateStr));
      }

      if (filter.end_date !== undefined) {
        // Convert Date to YYYY-MM-DD string format for date column comparison
        const endDateStr = filter.end_date.toISOString().split('T')[0];
        conditions.push(lte(expensesTable.date, endDateStr));
      }
    }

    // Build complete query based on whether we have conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(expensesTable)
          .innerJoin(categoriesTable, eq(expensesTable.category_id, categoriesTable.id))
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(expensesTable.date))
          .execute()
      : await db.select()
          .from(expensesTable)
          .innerJoin(categoriesTable, eq(expensesTable.category_id, categoriesTable.id))
          .orderBy(desc(expensesTable.date))
          .execute();

    // Transform joined results to expected format with numeric conversion
    return results.map(result => ({
      id: result.expenses.id,
      amount: parseFloat(result.expenses.amount), // Convert numeric to number
      description: result.expenses.description,
      date: new Date(result.expenses.date), // Convert date string to Date object
      category_id: result.expenses.category_id,
      created_at: result.expenses.created_at,
      category: {
        id: result.categories.id,
        name: result.categories.name,
        created_at: result.categories.created_at
      }
    }));
  } catch (error) {
    console.error('Get expenses failed:', error);
    throw error;
  }
};
