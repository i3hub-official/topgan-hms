import type { PageServerLoad, Actions } from './$types';
import { db, inventory, inventoryMovements, auditTrail, inventoryCategories, inventoryUnits, suppliers, purchaseOrders, purchaseOrderItems } from '$lib/server/db';
import { eq, desc, sql } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const canManage = ['owner', 'super_admin', 'general_manager', 'store_keeper', 'store_keeper_bar', 'store_keeper_kitchen', 'store_keeper_store'].includes(userRole);
  
  if (!canManage) {
    throw redirect(303, '/dashboard');
  }
  
  // Pagination
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  
  // Build where clause
  let whereClause = sql`1=1`;
  
  if (search) {
    whereClause = sql`${inventory.itemName} LIKE ${`%${search}%`}`;
  }
  
  if (category) {
    whereClause = sql`${whereClause} AND ${inventory.category} = ${category}`;
  }
  
  // Get inventory items with supplier info
  const inventoryItems = await db.select({
    id: inventory.id,
    itemName: inventory.itemName,
    category: inventory.category,
    unit: inventory.unit,
    supplierId: inventory.supplierId,
    supplierName: suppliers.name,
    costPrice: inventory.costPrice,
    sellingPrice: inventory.sellingPrice,
    openingStock: inventory.openingStock,
    additions: inventory.additions,
    sales: inventory.sales,
    closingStock: inventory.closingStock,
    physicalCount: inventory.physicalCount,
    variance: inventory.variance,
    reorderLevel: inventory.reorderLevel,
    reorderQuantity: inventory.reorderQuantity,
    location: inventory.location,
    lastOrderDate: inventory.lastOrderDate,
    createdAt: inventory.createdAt
  })
  .from(inventory)
  .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
  .where(whereClause)
  .orderBy(desc(inventory.createdAt))
  .limit(limit)
  .offset(offset);
  
  // Get total count
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(inventory)
    .where(whereClause);
  
  const totalCount = Number(totalResult[0]?.count || 0);
  
  // Get low stock items (based on reorder level)
  const lowStockItems = inventoryItems.filter(item => item.closingStock <= (item.reorderLevel || 10));
  
  // Get all suppliers for dropdown
  const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  
  // Get recent purchase orders
  const recentOrders = await db.select({
    id: purchaseOrders.id,
    orderNumber: purchaseOrders.orderNumber,
    supplierName: suppliers.name,
    orderDate: purchaseOrders.orderDate,
    expectedDelivery: purchaseOrders.expectedDelivery,
    status: purchaseOrders.status,
    totalAmount: purchaseOrders.totalAmount
  })
  .from(purchaseOrders)
  .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
  .orderBy(desc(purchaseOrders.createdAt))
  .limit(5);
  
  // Calculate stock value
  const totalStockValue = inventoryItems.reduce((sum, item) => sum + (item.closingStock * (item.costPrice || 0)), 0);
  const totalPotentialRevenue = inventoryItems.reduce((sum, item) => sum + (item.closingStock * (item.sellingPrice || 0)), 0);
  
  const stats = {
    totalItems: totalCount,
    lowStock: lowStockItems.length,
    totalStockValue,
    totalPotentialRevenue,
    profitMargin: totalStockValue > 0 ? ((totalPotentialRevenue - totalStockValue) / totalStockValue * 100).toFixed(1) : 0
  };
  
  return {
    inventory: inventoryItems,
    categories: inventoryCategories,
    units: inventoryUnits,
    suppliers: allSuppliers,
    stats,
    lowStockItems,
    recentOrders,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    search,
    category,
    canManage,
    user: locals.user
  };
};

export const actions: Actions = {
  addInventory: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemName = formData.get('itemName') as string;
    const category = formData.get('category') as string;
    const unit = formData.get('unit') as string;
    const supplierId = formData.get('supplierId') ? parseInt(formData.get('supplierId') as string) : null;
    const costPrice = parseFloat(formData.get('costPrice') as string) || 0;
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string) || 0;
    const openingStock = parseFloat(formData.get('openingStock') as string) || 0;
    const reorderLevel = parseFloat(formData.get('reorderLevel') as string) || 10;
    const reorderQuantity = parseFloat(formData.get('reorderQuantity') as string) || 50;
    const location = formData.get('location') as string;
    
    const newItem = await db.insert(inventory).values({
      itemName,
      category,
      unit,
      supplierId,
      costPrice,
      sellingPrice,
      openingStock,
      closingStock: openingStock,
      reorderLevel,
      reorderQuantity,
      location,
      date: new Date(),
      createdAt: new Date()
    }).returning();
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'ADD_INVENTORY',
      entityType: 'inventory',
      entityId: newItem[0]?.id.toString(),
      newValues: { itemName, category, unit, supplierId, costPrice, sellingPrice, openingStock },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
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
        sales: type === 'remove' ? (item[0].sales || 0) + quantity : item[0].sales,
        variance: item[0].physicalCount ? item[0].physicalCount - newClosingStock : null
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
      action: type === 'add' ? 'STOCK_ADD' : 'STOCK_REMOVE',
      entityType: 'inventory',
      entityId: itemId.toString(),
      newValues: { quantity, reason, newStock: newClosingStock },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  updatePrices: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);
    const costPrice = parseFloat(formData.get('costPrice') as string);
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    
    await db.update(inventory)
      .set({ costPrice, sellingPrice })
      .where(eq(inventory.id, itemId));
    
    return { success: true };
  },
  
  updateSupplier: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);
    const supplierId = formData.get('supplierId') ? parseInt(formData.get('supplierId') as string) : null;
    
    await db.update(inventory)
      .set({ supplierId })
      .where(eq(inventory.id, itemId));
    
    return { success: true };
  },
  
  updateReorderSettings: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);
    const reorderLevel = parseFloat(formData.get('reorderLevel') as string);
    const reorderQuantity = parseFloat(formData.get('reorderQuantity') as string);
    const location = formData.get('location') as string;
    
    await db.update(inventory)
      .set({ reorderLevel, reorderQuantity, location })
      .where(eq(inventory.id, itemId));
    
    return { success: true };
  },
  
  createPurchaseOrder: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const supplierId = parseInt(formData.get('supplierId') as string);
    const items = JSON.parse(formData.get('items') as string);
    
    const orderNumber = `PO-${Date.now()}`;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    
    const newOrder = await db.insert(purchaseOrders).values({
      orderNumber,
      supplierId,
      orderDate: new Date(),
      expectedDelivery: formData.get('expectedDelivery') ? new Date(formData.get('expectedDelivery') as string) : null,
      status: 'pending',
      totalAmount,
      notes: formData.get('notes') as string,
      createdBy: locals.user.id,
      createdAt: new Date()
    }).returning();
    
    for (const item of items) {
      await db.insert(purchaseOrderItems).values({
        orderId: newOrder[0].id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        receivedQuantity: 0
      });
    }
    
    return { success: true, orderNumber };
  },
  
  receivePurchaseOrder: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const orderId = parseInt(formData.get('orderId') as string);
    
    const order = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId)).limit(1);
    if (order.length === 0) throw error(404, 'Order not found');
    
    const orderItems = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, orderId));
    
    // Update inventory stock
    for (const item of orderItems) {
      const inventoryItem = await db.select().from(inventory).where(eq(inventory.id, item.itemId)).limit(1);
      if (inventoryItem.length > 0) {
        await db.update(inventory)
          .set({
            closingStock: inventoryItem[0].closingStock + item.quantity,
            lastOrderDate: new Date()
          })
          .where(eq(inventory.id, item.itemId));
        
        await db.insert(inventoryMovements).values({
          itemId: item.itemId,
          type: 'add',
          quantity: item.quantity,
          reason: `Purchase Order ${order[0].orderNumber}`,
          createdAt: new Date()
        });
      }
    }
    
    await db.update(purchaseOrders)
      .set({
        status: 'delivered',
        actualDelivery: new Date()
      })
      .where(eq(purchaseOrders.id, orderId));
    
    return { success: true };
  },
  
  deleteInventory: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const itemId = parseInt(formData.get('itemId') as string);
    
    const item = await db.select().from(inventory).where(eq(inventory.id, itemId)).limit(1);
    
    await db.delete(inventory).where(eq(inventory.id, itemId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'DELETE_INVENTORY',
      entityType: 'inventory',
      entityId: itemId.toString(),
      oldValues: item[0],
      createdAt: new Date()
    });
    
    return { success: true };
  }
};