import type { PageServerLoad, Actions } from './$types';
import { db, rooms, transactions, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

// Define permission functions locally to avoid import issues
function canManageRoom(role: string): boolean {
  return ['owner', 'super_admin'].includes(role);
}

function canViewRoom(role: string): boolean {
  return true; // All authenticated users can view rooms
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Get all rooms - everyone can view
  const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
  
  // Get active transactions (checked-in guests) for each room
  const activeTransactions = await db.select()
    .from(transactions)
    .where(eq(transactions.status, 'active'))
    .orderBy(desc(transactions.checkIn));
  
  // Create a map of roomId to active transaction
  const activeTransactionMap = new Map();
  activeTransactions.forEach(transaction => {
    if (transaction.roomId) {
      activeTransactionMap.set(transaction.roomId, transaction);
    }
  });
  
  // Get recent check-outs for history
  const recentCheckouts = await db.select()
    .from(transactions)
    .where(eq(transactions.status, 'completed'))
    .orderBy(desc(transactions.checkOut))
    .limit(10);
  
  // Check if user can manage rooms (for UI buttons)
  const canManage = canManageRoom(locals.user.role as string);
  
  const stats = {
    total: allRooms.length,
    available: allRooms.filter(r => r.status === 'vacant' && r.isActive === true).length,
    occupied: allRooms.filter(r => r.status === 'occupied').length,
    maintenance: allRooms.filter(r => r.status === 'maintenance').length,
    inactive: allRooms.filter(r => r.isActive === false).length
  };
  
  return {
    rooms: allRooms,
    activeTransactions: activeTransactionMap,
    recentCheckouts,
    stats,
    canManage,
    user: locals.user
  };
};

export const actions: Actions = {
  checkOut: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    const transactionId = parseInt(formData.get('transactionId') as string);
    
    // Get the transaction details before updating
    const transaction = await db.select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);
    
    if (transaction.length === 0) {
      throw error(404, 'Transaction not found');
    }
    
    const checkOutTime = new Date();
    const checkInTime = new Date(transaction[0].checkIn);
    const hoursStayed = Math.ceil((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
    
    // Update transaction with check-out time
    await db.update(transactions)
      .set({
        checkOut: checkOutTime,
        status: 'completed'
      })
      .where(eq(transactions.id, transactionId));
    
    // Update room status back to vacant
    await db.update(rooms)
      .set({ status: 'vacant' })
      .where(eq(rooms.id, roomId));
    
    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CHECK_OUT',
      entityType: 'room',
      entityId: roomId.toString(),
      oldValues: { status: 'occupied' },
      newValues: { status: 'vacant', guestName: transaction[0].guestName, hoursStayed },
      createdAt: new Date()
    });
    
    return { success: true, message: 'Guest checked out successfully', hoursStayed };
  },
  
  updateRoomStatus: async ({ request, locals }) => {
    if (!locals.user || !canManageRoom(locals.user.role as string)) {
      throw error(403, 'Only owners and admins can modify room status');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    const status = formData.get('status') as string;
    
    const oldRoom = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    await db.update(rooms)
      .set({ status })
      .where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'UPDATE_ROOM_STATUS',
      entityType: 'room',
      entityId: roomId.toString(),
      oldValues: { status: oldRoom[0]?.status },
      newValues: { status },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  createRoom: async ({ request, locals }) => {
    if (!locals.user || !canManageRoom(locals.user.role as string)) {
      throw error(403, 'Only owners and admins can create rooms');
    }
    
    const formData = await request.formData();
    const roomNumber = formData.get('roomNumber') as string;
    const rate = parseFloat(formData.get('rate') as string);
    
    const newRoom = await db.insert(rooms).values({
      roomNumber,
      rate,
      status: 'vacant',
      isActive: true,
      createdAt: new Date()
    }).returning();
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CREATE_ROOM',
      entityType: 'room',
      entityId: newRoom[0]?.id.toString(),
      newValues: { roomNumber, rate },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  deleteRoom: async ({ request, locals }) => {
    if (!locals.user || !canManageRoom(locals.user.role as string)) {
      throw error(403, 'Only owners and admins can delete rooms');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    
    const oldRoom = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    // Soft delete - mark as inactive
    await db.update(rooms)
      .set({
        isActive: false,
        deletedAt: new Date()
      })
      .where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'DELETE_ROOM',
      entityType: 'room',
      entityId: roomId.toString(),
      oldValues: oldRoom[0],
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  toggleRoomActive: async ({ request, locals }) => {
    if (!locals.user || !canManageRoom(locals.user.role as string)) {
      throw error(403, 'Only owners and admins can toggle room active status');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    
    const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room.length === 0) throw error(404, 'Room not found');
    
    const newActiveState = !room[0].isActive;
    
    await db.update(rooms)
      .set({ 
        isActive: newActiveState,
        status: newActiveState ? 'vacant' : room[0].status
      })
      .where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: newActiveState ? 'ROOM_ACTIVATED' : 'ROOM_DEACTIVATED',
      entityType: 'room',
      entityId: roomId.toString(),
      oldValues: { isActive: room[0].isActive },
      newValues: { isActive: newActiveState },
      createdAt: new Date()
    });
    
    return { success: true };
  }
};