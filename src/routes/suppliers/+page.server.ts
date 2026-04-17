import type { PageServerLoad, Actions } from './$types';
import { db, suppliers, auditTrail, categories } from '$lib/server/db';
import { eq, asc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const allowedRoles = ['owner', 'super_admin', 'general_manager', 'store_keeper', 'store_keeper_bar', 'store_keeper_kitchen', 'store_keeper_store'];
  
  if (!allowedRoles.includes(userRole)) {
    throw redirect(303, '/dashboard');
  }
  
  // Check if user can edit suppliers (owner, super_admin, general_manager only)
  const canEdit = ['owner', 'super_admin', 'general_manager'].includes(userRole);
  
  // Get all suppliers
  const allSuppliers = await db.select().from(suppliers).orderBy(suppliers.name);
  
  // Get categories from database
  const supplierCategories = await db.select()
    .from(categories)
    .where(eq(categories.type, 'supplier'))
    .orderBy(asc(categories.sortOrder));
  
  return {
    suppliers: allSuppliers,
    categories: supplierCategories,
    canEdit,
    user: locals.user
  };
};

export const actions: Actions = {
  createSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const userRole = locals.user.role as string;
    const canEdit = ['owner', 'super_admin', 'general_manager'].includes(userRole);
    
    if (!canEdit) {
      throw error(403, 'Only owners, super admins, and general managers can create suppliers');
    }
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const categoryId = formData.get('categoryId') as string;
    const address = formData.get('address') as string;
    
    // Get category name from ID
    const category = await db.select().from(categories).where(eq(categories.id, parseInt(categoryId))).limit(1);
    const categoryName = category[0]?.name || '';
    
    const newSupplier = await db.insert(suppliers).values({
      name,
      contactPerson,
      phone,
      email,
      category: categoryName,
      address,
      isActive: true,
      createdAt: new Date()
    }).returning();
    
    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CREATE_SUPPLIER',
      entityType: 'supplier',
      entityId: newSupplier[0]?.id.toString(),
      newValues: { name, category: categoryName, phone },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  updateSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const userRole = locals.user.role as string;
    const canEdit = ['owner', 'super_admin', 'general_manager'].includes(userRole);
    
    if (!canEdit) {
      throw error(403, 'Only owners, super admins, and general managers can edit suppliers');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const categoryId = formData.get('categoryId') as string;
    const address = formData.get('address') as string;
    const isActive = formData.get('isActive') === 'true';
    
    // Get category name from ID
    const category = await db.select().from(categories).where(eq(categories.id, parseInt(categoryId))).limit(1);
    const categoryName = category[0]?.name || '';
    
    // Get old values for audit trail
    const oldSupplier = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    
    await db.update(suppliers)
      .set({
        name,
        contactPerson,
        phone,
        email,
        category: categoryName,
        address,
        isActive
      })
      .where(eq(suppliers.id, id));
    
    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'UPDATE_SUPPLIER',
      entityType: 'supplier',
      entityId: id.toString(),
      oldValues: oldSupplier[0],
      newValues: { name, category: categoryName, phone, isActive },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  toggleSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const userRole = locals.user.role as string;
    const canEdit = ['owner', 'super_admin', 'general_manager'].includes(userRole);
    
    if (!canEdit) {
      throw error(403, 'Only owners, super admins, and general managers can modify supplier status');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    const currentStatus = formData.get('currentStatus') === 'true';
    const newStatus = !currentStatus;
    
    await db.update(suppliers)
      .set({ isActive: newStatus })
      .where(eq(suppliers.id, id));
    
    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: newStatus ? 'ACTIVATE_SUPPLIER' : 'DEACTIVATE_SUPPLIER',
      entityType: 'supplier',
      entityId: id.toString(),
      newValues: { isActive: newStatus },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  deleteSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const userRole = locals.user.role as string;
    // Only owner and super_admin can delete suppliers
    const canDelete = ['owner', 'super_admin'].includes(userRole);
    
    if (!canDelete) {
      throw error(403, 'Only owners and super admins can delete suppliers');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    
    // Get supplier details for audit trail
    const supplierToDelete = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    
    if (supplierToDelete.length === 0) {
      throw error(404, 'Supplier not found');
    }
    
    await db.delete(suppliers).where(eq(suppliers.id, id));
    
    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'DELETE_SUPPLIER',
      entityType: 'supplier',
      entityId: id.toString(),
      oldValues: supplierToDelete[0],
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  addCategory: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const userRole = locals.user.role as string;
    // Only owner and super_admin can add categories
    const canAddCategory = ['owner', 'super_admin'].includes(userRole);
    
    if (!canAddCategory) {
      throw error(403, 'Only owners and super admins can add categories');
    }
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string || '📦';
    const type = formData.get('type') as string; // 'supplier' or 'inventory'
    
    // Get max sort order
    const existing = await db.select().from(categories).where(eq(categories.type, type));
    const maxSortOrder = existing.length;
    
    await db.insert(categories).values({
      type,
      name,
      icon,
      sortOrder: maxSortOrder + 1,
      isActive: true,
      createdAt: new Date()
    });
    
    return { success: true };
  }
};