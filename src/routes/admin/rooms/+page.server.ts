import type { PageServerLoad, Actions } from './$types';
import { db, rooms, auditTrail } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { canManageRoom } from '$lib/config/roles';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Get all rooms - everyone can view
  const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
  
  // Check if user can manage rooms (for UI buttons)
  const canManage = canManageRoom(locals.user.role as any);
  
  const stats = {
    total: allRooms.length,
    available: allRooms.filter(r => r.status === 'vacant').length,
    occupied: allRooms.filter(r => r.status === 'occupied').length,
    maintenance: allRooms.filter(r => r.status === 'maintenance').length
  };
  
  return {
    rooms: allRooms,
    stats,
    canManage // Pass this to the frontend to show/hide management buttons
  };
};

export const actions: Actions = {
  createRoom: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    if (!canManageRoom(locals.user.role as any)) {
      throw error(403, 'Only owners and admins can create rooms');
    }
    
    const formData = await request.formData();
    await db.insert(rooms).values({
      roomNumber: formData.get('roomNumber') as string,
      rate: parseFloat(formData.get('rate') as string),
      status: 'vacant',
      isActive: true,
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  updateRoom: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    if (!canManageRoom(locals.user.role as any)) {
      throw error(403, 'Only owners and admins can modify rooms');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    
    await db.update(rooms).set({
      roomNumber: formData.get('roomNumber') as string,
      rate: parseFloat(formData.get('rate') as string),
      status: formData.get('status') as string
    }).where(eq(rooms.id, id));
    
    return { success: true };
  },
  
  deleteRoom: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    if (!canManageRoom(locals.user.role as any)) {
      throw error(403, 'Only owners and admins can delete rooms');
    }
    
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);
    
    // Soft delete
    await db.update(rooms).set({
      isActive: false,
      deletedAt: new Date()
    }).where(eq(rooms.id, id));
    
    return { success: true };
  }
};