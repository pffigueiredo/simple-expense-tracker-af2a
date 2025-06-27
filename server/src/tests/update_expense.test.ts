
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateExpenseInput, type UpdateExpenseInput } from '../schema';
import { updateExpense } from '../handlers/update_expense';
import { eq } from 'drizzle-orm';

describe('updateExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an expense with all fields', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test expense
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '100.50',
        description: 'Original description',
        date: '2024-01-01',
        category_id: categoryId
      })
      .returning()
      .execute();
    const expenseId = expenseResult[0].id;

    // Update expense
    const updateInput: UpdateExpenseInput = {
      id: expenseId,
      amount: 150.75,
      description: 'Updated description',
      date: new Date('2024-01-15'),
      category_id: categoryId
    };

    const result = await updateExpense(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(expenseId);
    expect(result.amount).toEqual(150.75);
    expect(result.description).toEqual('Updated description');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.category_id).toEqual(categoryId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update an expense with partial fields', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test expense
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '100.50',
        description: 'Original description',
        date: '2024-01-01',
        category_id: categoryId
      })
      .returning()
      .execute();
    const expenseId = expenseResult[0].id;

    // Update only amount and description
    const updateInput: UpdateExpenseInput = {
      id: expenseId,
      amount: 200.25,
      description: 'Partially updated description'
    };

    const result = await updateExpense(updateInput);

    // Verify updated fields
    expect(result.amount).toEqual(200.25);
    expect(result.description).toEqual('Partially updated description');
    // Verify unchanged fields
    expect(result.date).toEqual(new Date('2024-01-01'));
    expect(result.category_id).toEqual(categoryId);
  });

  it('should save updated expense to database', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test expense
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '100.50',
        description: 'Original description',
        date: '2024-01-01',
        category_id: categoryId
      })
      .returning()
      .execute();
    const expenseId = expenseResult[0].id;

    // Update expense
    const updateInput: UpdateExpenseInput = {
      id: expenseId,
      amount: 300.99,
      description: 'Database test description'
    };

    await updateExpense(updateInput);

    // Query database to verify changes
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, expenseId))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(parseFloat(expenses[0].amount)).toEqual(300.99);
    expect(expenses[0].description).toEqual('Database test description');
    expect(expenses[0].date).toEqual('2024-01-01');
    expect(expenses[0].category_id).toEqual(categoryId);
  });

  it('should update expense with different category', async () => {
    // Create test categories
    const category1Result = await db.insert(categoriesTable)
      .values({ name: 'Category 1' })
      .returning()
      .execute();
    const category1Id = category1Result[0].id;

    const category2Result = await db.insert(categoriesTable)
      .values({ name: 'Category 2' })
      .returning()
      .execute();
    const category2Id = category2Result[0].id;

    // Create test expense with category 1
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '50.00',
        description: 'Test expense',
        date: '2024-01-01',
        category_id: category1Id
      })
      .returning()
      .execute();
    const expenseId = expenseResult[0].id;

    // Update to category 2
    const updateInput: UpdateExpenseInput = {
      id: expenseId,
      category_id: category2Id
    };

    const result = await updateExpense(updateInput);

    expect(result.category_id).toEqual(category2Id);
  });

  it('should throw error when expense not found', async () => {
    const updateInput: UpdateExpenseInput = {
      id: 99999,
      amount: 100.00
    };

    await expect(updateExpense(updateInput)).rejects.toThrow(/expense not found/i);
  });

  it('should throw error when category not found', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test expense
    const expenseResult = await db.insert(expensesTable)
      .values({
        amount: '100.50',
        description: 'Test expense',
        date: '2024-01-01',
        category_id: categoryId
      })
      .returning()
      .execute();
    const expenseId = expenseResult[0].id;

    // Try to update with non-existent category
    const updateInput: UpdateExpenseInput = {
      id: expenseId,
      category_id: 99999
    };

    await expect(updateExpense(updateInput)).rejects.toThrow(/category not found/i);
  });
});
