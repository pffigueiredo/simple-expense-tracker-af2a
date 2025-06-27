
import { db } from '../db';
import { expensesTable, categoriesTable } from '../db/schema';
import { type UpdateExpenseInput, type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExpense = async (input: UpdateExpenseInput): Promise<Expense> => {
  try {
    // Check if expense exists
    const existingExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, input.id))
      .execute();

    if (existingExpense.length === 0) {
      throw new Error('Expense not found');
    }

    // If category_id is provided, verify it exists
    if (input.category_id !== undefined) {
      const category = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (category.length === 0) {
        throw new Error('Category not found');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.amount !== undefined) updateData.amount = input.amount.toString();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.date !== undefined) updateData.date = input.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    if (input.category_id !== undefined) updateData.category_id = input.category_id;

    // Update expense record
    const result = await db.update(expensesTable)
      .set(updateData)
      .where(eq(expensesTable.id, input.id))
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount), // Convert string back to number
      date: new Date(expense.date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Expense update failed:', error);
    throw error;
  }
};
