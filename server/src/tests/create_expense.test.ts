
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, categoriesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const category = categoryResult[0];

    const testInput: CreateExpenseInput = {
      amount: 25.99,
      description: 'Test expense',
      date: new Date('2024-01-15'),
      category_id: category.id
    };

    const result = await createExpense(testInput);

    // Basic field validation
    expect(result.amount).toEqual(25.99);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Test expense');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    const category = categoryResult[0];

    const testInput: CreateExpenseInput = {
      amount: 100.50,
      description: 'Database test expense',
      date: new Date('2024-02-20'),
      category_id: category.id
    };

    const result = await createExpense(testInput);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].description).toEqual('Database test expense');
    expect(parseFloat(expenses[0].amount)).toEqual(100.50);
    expect(expenses[0].date).toEqual('2024-02-20');
    expect(expenses[0].category_id).toEqual(category.id);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent category', async () => {
    const testInput: CreateExpenseInput = {
      amount: 50.00,
      description: 'Test expense with invalid category',
      date: new Date('2024-01-15'),
      category_id: 999 // Non-existent category ID
    };

    await expect(createExpense(testInput)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Decimal Test Category' })
      .returning()
      .execute();
    const category = categoryResult[0];

    const testInput: CreateExpenseInput = {
      amount: 123.45,
      description: 'Decimal amount test',
      date: new Date('2024-03-10'),
      category_id: category.id
    };

    const result = await createExpense(testInput);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].amount)).toEqual(123.45);
  });

  it('should handle date conversion correctly', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Date Test Category' })
      .returning()
      .execute();
    const category = categoryResult[0];

    const testDate = new Date('2024-12-25');
    const testInput: CreateExpenseInput = {
      amount: 75.00,
      description: 'Date conversion test',
      date: testDate,
      category_id: category.id
    };

    const result = await createExpense(testInput);

    expect(result.date).toEqual(testDate);
    expect(result.date).toBeInstanceOf(Date);

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses[0].date).toEqual('2024-12-25');
  });
});
