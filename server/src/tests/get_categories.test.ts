
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        { name: 'Food' },
        { name: 'Transportation' },
        { name: 'Entertainment' }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by name', async () => {
    // Create categories in non-alphabetical order
    await db.insert(categoriesTable)
      .values([
        { name: 'Zebra' },
        { name: 'Apple' },
        { name: 'Mountain' }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Apple');
    expect(result[1].name).toEqual('Mountain');
    expect(result[2].name).toEqual('Zebra');
  });

  it('should include all required category fields', async () => {
    await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    expect(category.id).toBeDefined();
    expect(typeof category.id).toBe('number');
    expect(category.name).toEqual('Test Category');
    expect(category.created_at).toBeInstanceOf(Date);
  });
});
