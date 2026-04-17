import type { PageServerLoad, Actions } from './$types';
import { db, inventory, inventoryMovements, suppliers, auditTrail, user, storeSections } from '$lib/server/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const allowedRoles = ['owner', 'super_admin', 'general_manager', 'store_keeper', 'store_keeper_bar', 'store_keeper_kitchen', 'store_keeper_store'];
  
  if (!allowedRoles.includes(userRole)) {
    throw redirect(303, '/dashboard');
  }
  
  // Determine which sections this user can access
  let allowedSections: string[] = [];
  
  if (userRole === 'owner' || userRole === 'super_admin' || userRole === 'general_manager' || userRole === 'store_keeper') {
    allowedSections = ['bar', 'kitchen', 'store'];
  } else if (userRole === 'store_keeper_bar') {
    allowedSections = ['bar'];
  } else if (userRole === 'store_keeper_kitchen') {
    allowedSections = ['kitchen'];
  } else if (userRole === 'store_keeper_store') {
    allowedSections = ['store'];
  }
  
  // Get inventory items based on sections
  let inventoryItems: any[] = [];
  
  if (allowedSections.includes('bar')) {
    const barItems = await db.select({
      id: inventory.id,
      itemName: inventory.itemName,
      category: inventory.category,
      unit: inventory.unit,
      supplierId: inventory.supplierId,
      supplierName: suppliers.name,
      costPrice: inventory.costPrice,
      sellingPrice: inventory.sellingPrice,
      closingStock: inventory.closingStock,
      reorderLevel: inventory.reorderLevel,
      location: inventory.location
    })
    .from(inventory)
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(sql`${inventory.category} IN ('drinks', 'beverages', 'bar')`)
    .orderBy(desc(inventory.closingStock));
    
    inventoryItems.push(...barItems.map(item => ({ ...item, section: 'bar' })));
  }
  
  if (allowedSections.includes('kitchen')) {
    const kitchenItems = await db.select({
      id: inventory.id,
      itemName: inventory.itemName,
      category: inventory.category,
      unit: inventory.unit,
      supplierId: inventory.supplierId,
      supplierName: suppliers.name,
      costPrice: inventory.costPrice,
      sellingPrice: inventory.sellingPrice,
      closingStock: inventory.closingStock,
      reorderLevel: inventory.reorderLevel,
      location: inventory.location
    })
    .from(inventory)
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(sql`${inventory.category} IN ('food_supplies', 'kitchen')`)
    .orderBy(desc(inventory.closingStock));
    
    inventoryItems.push(...kitchenItems.map(item => ({ ...item, section: 'kitchen' })));
  }
  
  if (allowedSections.includes('store')) {
    const storeItems = await db.select({
      id: inventory.id,
      itemName: inventory.itemName,
      category: inventory.category,
      unit: inventory.unit,
      supplierId: inventory.supplierId,
      supplierName: suppliers.name,
      costPrice: inventory.costPrice,
      sellingPrice: inventory.sellingPrice,
      closingStock: inventory.closingStock,
      reorderLevel: inventory.reorderLevel,
      location: inventory.location
    })
    .from(inventory)
    .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
    .where(sql`${inventory.category} NOT IN ('drinks', 'beverages', 'bar', 'food_supplies', 'kitchen')`)
    .orderBy(desc(inventory.closingStock));
    
    inventoryItems.push(...storeItems.map(item => ({ ...item, section: 'store' })));
  }
  
  // Get low stock items
  const lowStockItems = inventoryItems.filter(item => item.closingStock <= (item.reorderLevel || 10));
  
  // Get recent movements for this section
  const recentMovements = await db.select({
    id: inventoryMovements.id,
    itemId: inventoryMovements.itemId,
    type: inventoryMovements.type,
    quantity: inventoryMovements.quantity,
    reason: inventoryMovements.reason,
    createdAt: inventoryMovements.createdAt,
    itemName: inventory.itemName
  })
  .from(inventoryMovements)
  .leftJoin(inventory, eq(inventoryMovements.itemId, inventory.id))
  .orderBy(desc(inventoryMovements.createdAt))
  .limit(20);
  
  // Calculate statistics
  const stats = {
    bar: {
      totalItems: inventoryItems.filter(i => i.section === 'bar').length,
      lowStock: inventoryItems.filter(i => i.section === 'bar' && i.closingStock <= (i.reorderLevel || 10)).length,
      totalValue: inventoryItems.filter(i => i.section === 'bar').reduce((sum, i) => sum + (i.closingStock * (i.costPrice || 0)), 0)
    },
    kitchen: {
      totalItems: inventoryItems.filter(i => i.section === 'kitchen').length,
      lowStock: inventoryItems.filter(i => i.section === 'kitchen' && i.closingStock <= (i.reorderLevel || 10)).length,
      totalValue: inventoryItems.filter(i => i.section === 'kitchen').reduce((sum, i) => sum + (i.closingStock * (i.costPrice || 0)), 0)
    },
    store: {
      totalItems: inventoryItems.filter(i => i.section === 'store').length,
      lowStock: inventoryItems.filter(i => i.section === 'store' && i.closingStock <= (i.reorderLevel || 10)).length,
      totalValue: inventoryItems.filter(i => i.section === 'store').reduce((sum, i) => sum + (i.closingStock * (i.costPrice || 0)), 0)
    }
  };
  
  return {
    inventory: inventoryItems,
    lowStockItems,
    recentMovements,
    stats,
    allowedSections,
    user: locals.user
  };
};

export const actions: Actions = {
  updateStock: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);
    const type = formData.get('type') as string;
    const quantity = parseFloat(formData.get('quantity') as string);
    const reason = formData.get('reason') as string;
    
    const item = await db.select().from(inventory).where(eq(inventory.id, itemId)).limit(1);
    if (item.length === 0) throw error(404, 'Item not found');
    
    let newClosingStock = item[0].closingStock;
    if (type === 'add') {
      newClosingStock += quantity;
    } else {
      newClosingStock -= quantity;
      if (newClosingStock < 0) throw error(400, 'Insufficient stock');
    }
    
    await db.update(inventory)
      .set({
        closingStock: newClosingStock,
        additions: type === 'add' ? (item[0].additions || 0) + quantity : item[0].additions,
        sales: type === 'remove' ? (item[0].sales || 0) + quantity : item[0].sales
      })
      .where(eq(inventory.id, itemId));
    
    await db.insert(inventoryMovements).values({
      itemId,
      type,
      quantity,
      reason,
      createdAt: new Date()
    });
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: type === 'add' ? 'BAR_STOCK_ADD' : 'BAR_STOCK_REMOVE',
      entityType: 'inventory',
      entityId: itemId.toString(),
      newValues: { quantity, reason, newStock: newClosingStock },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  createOrder: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const items = JSON.parse(formData.get('items') as string);
    
    // Create a simple order record (you can expand this)
    for (const item of items) {
      await db.insert(inventoryMovements).values({
        itemId: item.id,
        type: 'add',
        quantity: item.quantity,
        reason: `Order from ${item.supplierName || 'supplier'}`,
        createdAt: new Date()
      });
      
      await db.update(inventory)
        .set({
          closingStock: item.closingStock + item.quantity,
          lastOrderDate: new Date()
        })
        .where(eq(inventory.id, item.id));
    }
    
    return { success: true };
  }
};