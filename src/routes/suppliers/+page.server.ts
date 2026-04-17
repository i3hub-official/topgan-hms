import type { PageServerLoad, Actions } from './$types';
import { db, suppliers } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const allowedRoles = ['owner', 'super_admin', 'general_manager', 'store_keeper'];
  if (!allowedRoles.includes(locals.user.role as string)) {
    throw redirect(303, '/dashboard');
  }
  
  // Get all suppliers
  const allSuppliers = await db.select().from(suppliers).orderBy(suppliers.name);
  
  // Get unique categories
  const categories = [...new Set(allSuppliers.map(s => s.category).filter(Boolean))];
  
  return {
    suppliers: allSuppliers,
    categories: categories
  };
};

export const actions: Actions = {
  createSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    
    await db.insert(suppliers).values({
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      category: formData.get('category') as string,
      address: formData.get('address') as string,
      isActive: true,
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  toggleSupplier: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    const currentStatus = formData.get('currentStatus') === 'true';
    
    await db.update(suppliers).set({
      isActive: !currentStatus
    }).where(eq(suppliers.id, id));
    
    return { success: true };
  }
};