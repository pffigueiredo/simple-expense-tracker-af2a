
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, expensesTable } from '../db/schema';
import { type ExpenseFilter } from '../schema';
import { getExpenses } from '../handlers/get_expenses';

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();
    expect(result).toEqual([]);
  });

  it('should return all expenses with category information', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test expenses
    await db.insert(expensesTable)
      .values([
        {
          amount: '25.50',
          description: 'Lunch',
          date: '2024-01-15',
          category_id: categoryId
        },
        {
          amount: '15.75',
          description: 'Coffee',
          date: '2024-01-16',
          category_id: categoryId
        }
      ])
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(2);
    
    // Check first expense (should be ordered by date descending)
    expect(result[0].description).toEqual('Coffee');
    expect(result[0].amount).toEqual(15.75);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].category.name).toEqual('Food');
    expect(result[0].category_id).toEqual(categoryId);

    // Check second expense
    expect(result[1].description).toEqual('Lunch');
    expect(result[1].amount).toEqual(25.50);
    expect(result[1].category.name).toEqual('Food');
  });

  it('should filter expenses by category_id', async () => {
    // Create two categories
    const foodCategory = await db.insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const transportCategory = await db.insert(categoriesTable)
      .values({ name: 'Transport' })
      .returning()
      .execute();

    // Create expenses in different categories
    await db.insert(expensesTable)
      .values([
        {
          amount: '25.50',
          description: 'Lunch',
          date: '2024-01-15',
          category_id: foodCategory[0].id
        },
        {
          amount: '10.00',
          description: 'Bus fare',
          date: '2024-01-15',
          category_id: transportCategory[0].id
        }
      ])
      .execute();

    const filter: ExpenseFilter = { category_id: foodCategory[0].id };
    const result = await getExpenses(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Lunch');
    expect(result[0].category.name).toEqual('Food');
  });

  it('should filter expenses by date range', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create expenses across different dates
    await db.insert(expensesTable)
      .values([
        {
          amount: '25.50',
          description: 'Old expense',
          date: '2024-01-10',
          category_id: categoryId
        },
        {
          amount: '15.75',
          description: 'In range expense',
          date: '2024-01-15',
          category_id: categoryId
        },
        {
          amount: '30.00',
          description: 'Future expense',
          date: '2024-01-20',
          category_id: categoryId
        }
      ])
      .execute();

    const filter: ExpenseFilter = {
      start_date: new Date('2024-01-14'),
      end_date: new Date('2024-01-16')
    };
    const result = await getExpenses(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('In range expense');
    expect(result[0].date.toISOString().split('T')[0]).toEqual('2024-01-15');
  });

  it('should combine multiple filters', async () => {
    // Create two categories
    const foodCategory = await db.insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const transportCategory = await db.insert(categoriesTable)
      .values({ name: 'Transport' })
      .returning()
      .execute();

    // Create expenses
    await db.insert(expensesTable)
      .values([
        {
          amount: '25.50',
          description: 'Food in range',
          date: '2024-01-15',
          category_id: foodCategory[0].id
        },
        {
          amount: '10.00',
          description: 'Transport in range',
          date: '2024-01-15',
          category_id: transportCategory[0].id
        },
        {
          amount: '20.00',
          description: 'Food out of range',
          date: '2024-01-10',
          category_id: foodCategory[0].id
        }
      ])
      .execute();

    const filter: ExpenseFilter = {
      category_id: foodCategory[0].id,
      start_date: new Date('2024-01-14'),
      end_date: new Date('2024-01-16')
    };
    const result = await getExpenses(filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Food in range');
    expect(result[0].category.name).toEqual('Food');
  });

  it('should order expenses by date descending', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create expenses with different dates
    await db.insert(expensesTable)
      .values([
        {
          amount: '25.50',
          description: 'First expense',
          date: '2024-01-10',
          category_id: categoryId
        },
        {
          amount: '15.75',
          description: 'Latest expense',
          date: '2024-01-20',
          category_id: categoryId
        },
        {
          amount: '30.00',
          description: 'Middle expense',
          date: '2024-01-15',
          category_id: categoryId
        }
      ])
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(3);
    expect(result[0].description).toEqual('Latest expense'); // Most recent first
    expect(result[1].description).toEqual('Middle expense');
    expect(result[2].description).toEqual('First expense'); // Oldest last
  });
});
