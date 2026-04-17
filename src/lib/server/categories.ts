import { db, categories } from '$lib/server/db';
import { eq, asc } from 'drizzle-orm';

// Default categories to seed
export const defaultSupplierCategories = [
  { type: 'supplier', name: 'Diesel / Fuel', icon: '⛽', sortOrder: 1 },
  { type: 'supplier', name: 'Beverages (Soft Drinks)', icon: '🥤', sortOrder: 2 },
  { type: 'supplier', name: 'Drinks (Alcoholic)', icon: '🍺', sortOrder: 3 },
  { type: 'supplier', name: 'Food Supplies', icon: '🍽️', sortOrder: 4 },
  { type: 'supplier', name: 'Linens & Bedding', icon: '🛏️', sortOrder: 5 },
  { type: 'supplier', name: 'Cleaning Supplies', icon: '🧹', sortOrder: 6 },
  { type: 'supplier', name: 'Maintenance & Repair', icon: '🔧', sortOrder: 7 },
  { type: 'supplier', name: 'Electronics & Appliances', icon: '📺', sortOrder: 8 },
  { type: 'supplier', name: 'Furniture', icon: '🪑', sortOrder: 9 },
  { type: 'supplier', name: 'Kitchen Equipment', icon: '🍳', sortOrder: 10 },
  { type: 'supplier', name: 'Bar Supplies', icon: '🍸', sortOrder: 11 },
  { type: 'supplier', name: 'Office Supplies', icon: '📎', sortOrder: 12 }
];

export const defaultInventoryCategories = [
  { type: 'inventory', name: 'Linens', icon: '🔹', sortOrder: 1 },
  { type: 'inventory', name: 'Amenities', icon: '🧴', sortOrder: 2 },
  { type: 'inventory', name: 'Beverages', icon: '🥤', sortOrder: 3 },
  { type: 'inventory', name: 'Drinks (Alcoholic)', icon: '🍺', sortOrder: 4 },
  { type: 'inventory', name: 'Food Supplies', icon: '🍽️', sortOrder: 5 },
  { type: 'inventory', name: 'Cleaning Supplies', icon: '🧹', sortOrder: 6 },
  { type: 'inventory', name: 'Maintenance', icon: '🔧', sortOrder: 7 },
  { type: 'inventory', name: 'Electronics', icon: '📺', sortOrder: 8 },
  { type: 'inventory', name: 'Furniture', icon: '🪑', sortOrder: 9 },
  { type: 'inventory', name: 'Kitchen Equipment', icon: '🍳', sortOrder: 10 },
  { type: 'inventory', name: 'Bar Supplies', icon: '🍸', sortOrder: 11 },
  { type: 'inventory', name: 'Office Supplies', icon: '📎', sortOrder: 12 }
];

export async function getCategories(type: 'supplier' | 'inventory') {
  return await db.select()
    .from(categories)
    .where(eq(categories.type, type))
    .orderBy(asc(categories.sortOrder));
}

export async function seedCategories() {
  // Check if categories exist
  const existingSupplier = await db.select().from(categories).where(eq(categories.type, 'supplier')).limit(1);
  const existingInventory = await db.select().from(categories).where(eq(categories.type, 'inventory')).limit(1);
  
  if (existingSupplier.length === 0) {
    for (const cat of defaultSupplierCategories) {
      await db.insert(categories).values(cat);
    }
    console.log('✅ Seeded supplier categories');
  }
  
  if (existingInventory.length === 0) {
    for (const cat of defaultInventoryCategories) {
      await db.insert(categories).values(cat);
    }
    console.log('✅ Seeded inventory categories');
  }
}