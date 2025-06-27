
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteExpense = async (id: number): Promise<void> => {
  try {
    // First check if expense exists
    const existingExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, id))
      .execute();

    if (existingExpense.length === 0) {
      throw new Error(`Expense with id ${id} not found`);
    }

    // Delete the expense
    await db.delete(expensesTable)
      .where(eq(expensesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Expense deletion failed:', error);
    throw error;
  }
};
