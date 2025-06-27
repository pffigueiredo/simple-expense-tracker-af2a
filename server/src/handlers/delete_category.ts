
import { db } from '../db';
import { categoriesTable, expensesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<void> => {
  try {
    // Check if category exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (category.length === 0) {
      throw new Error('Category not found');
    }

    // Check if category has associated expenses
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.category_id, id))
      .execute();

    if (expenses.length > 0) {
      throw new Error('Cannot delete category with associated expenses');
    }

    // Delete the category
    await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
