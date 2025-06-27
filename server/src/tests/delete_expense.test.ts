
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, expensesTable } from '../db/schema';
import { deleteExpense } from '../handlers/delete_expense';
import { eq } from 'drizzle-orm';

describe('deleteExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing expense', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();

    // Create test expense
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '25.50',
        description: 'Test expense',
        date: '2024-01-15',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const expenseId = expenseResult[0].id;

    // Delete the expense
    await deleteExpense(expenseId);

    // Verify expense is deleted
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expenseId))
      .execute();

    expect(expenses).toHaveLength(0);
  });

  it('should throw error when expense does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteExpense(nonExistentId))
      .rejects.toThrow(/Expense with id 999 not found/i);
  });

  it('should not affect other expenses when deleting one', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();

    // Create multiple test expenses
    const expense1Result = await db.insert(expensesTable)
      .values({
        amount: '10.00',
        description: 'First expense',
        date: '2024-01-15',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const expense2Result = await db.insert(expensesTable)
      .values({
        amount: '20.00',
        description: 'Second expense',
        date: '2024-01-16',
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Delete only the first expense
    await deleteExpense(expense1Result[0].id);

    // Verify first expense is deleted
    const deletedExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expense1Result[0].id))
      .execute();

    expect(deletedExpense).toHaveLength(0);

    // Verify second expense still exists
    const remainingExpense = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expense2Result[0].id))
      .execute();

    expect(remainingExpense).toHaveLength(1);
    expect(remainingExpense[0].description).toEqual('Second expense');
  });
});
