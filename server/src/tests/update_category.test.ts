
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing category', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Test input
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category'
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Updated Category');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated category to database', async () => {
    // Create a category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category'
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Update the category
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category Name'
    };

    await updateCategory(updateInput);

    // Query the database to verify the update
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category Name');
    expect(categories[0].id).toEqual(categoryId);
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput))
      .rejects.toThrow(/Category with id 999 not found/i);
  });

  it('should handle duplicate name constraint', async () => {
    // Create two categories
    const category1 = await db.insert(categoriesTable)
      .values({
        name: 'Category One'
      })
      .returning()
      .execute();

    const category2 = await db.insert(categoriesTable)
      .values({
        name: 'Category Two'
      })
      .returning()
      .execute();

    // Try to update category2 to have the same name as category1
    const updateInput: UpdateCategoryInput = {
      id: category2[0].id,
      name: 'Category One'
    };

    // This should work since there's no unique constraint on name in the schema
    // But let's test it anyway to ensure the handler doesn't break
    const result = await updateCategory(updateInput);
    expect(result.name).toEqual('Category One');
  });
});
