
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, expensesTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Delete the category
    await deleteCategory(categoryId);

    // Verify category was deleted
    const remainingCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(remainingCategories).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteCategory(nonExistentId))
      .rejects.toThrow(/category not found/i);
  });

  it('should throw error when category has associated expenses', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create an expense associated with the category
    await db.insert(expensesTable)
      .values({
        amount: '50.00',
        description: 'Test expense',
        date: new Date().toISOString().split('T')[0],
        category_id: categoryId
      })
      .execute();

    // Attempt to delete the category should fail
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/cannot delete category with associated expenses/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should not affect other categories when deleting one', async () => {
    // Create two test categories
    const category1Result = await db.insert(categoriesTable)
      .values({ name: 'Category 1' })
      .returning()
      .execute();
    
    const category2Result = await db.insert(categoriesTable)
      .values({ name: 'Category 2' })
      .returning()
      .execute();
    
    const category1Id = category1Result[0].id;
    const category2Id = category2Result[0].id;

    // Delete the first category
    await deleteCategory(category1Id);

    // Verify first category is deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category1Id))
      .execute();

    expect(deletedCategory).toHaveLength(0);

    // Verify second category still exists
    const remainingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category2Id))
      .execute();

    expect(remainingCategory).toHaveLength(1);
    expect(remainingCategory[0].name).toEqual('Category 2');
  });
});
