import type { PageServerLoad, Actions } from './$types';
import { db, user, storeSections } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Only owner and super admin can manage store sections
  if (!['owner', 'super_admin'].includes(locals.user.role as string)) {
    throw redirect(303, '/dashboard');
  }
  
  // Get all store keepers and their assigned sections
  const storeKeepers = await db.select()
    .from(user)
    .where(
      and(
        eq(user.role, 'store_keeper')
      )
    );
  
  const sections = await db.select()
    .from(storeSections)
    .orderBy(storeSections.section);
  
  return {
    storeKeepers,
    sections
  };
};

export const actions: Actions = {
  assignSection: async ({ request, locals }) => {
    if (!locals.user || !['owner', 'super_admin'].includes(locals.user.role as string)) {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const section = formData.get('section') as string;
    
    // Check if already assigned
    const existing = await db.select()
      .from(storeSections)
      .where(
        and(
          eq(storeSections.userId, userId),
          eq(storeSections.section, section)
        )
      )
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(storeSections).values({
        userId,
        section,
        assignedBy: locals.user.id,
        isActive: true
      });
    }
    
    return { success: true };
  },
  
  revokeSection: async ({ request, locals }) => {
    if (!locals.user || !['owner', 'super_admin'].includes(locals.user.role as string)) {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const sectionId = parseInt(formData.get('sectionId') as string);
    
    await db.delete(storeSections).where(eq(storeSections.id, sectionId));
    
    return { success: true };
  },
  
  revokeAllSections: async ({ request, locals }) => {
    if (!locals.user || !['owner', 'super_admin'].includes(locals.user.role as string)) {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    // Delete all sections for this user
    await db.delete(storeSections).where(eq(storeSections.userId, userId));
    
    // Update user role back to regular staff
    await db.update(user).set({ role: 'staff' }).where(eq(user.id, userId));
    
    return { success: true };
  }
};