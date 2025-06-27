
import { db } from '../db';
import { expensesTable, categoriesTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    // Verify that the referenced category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        category_id: input.category_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and date back to Date object before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount), // Convert string back to number
      date: new Date(expense.date + 'T00:00:00.000Z') // Convert date string back to Date object
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
};
