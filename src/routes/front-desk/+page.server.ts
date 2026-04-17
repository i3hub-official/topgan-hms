import type { PageServerLoad, Actions } from './$types';
import { db, rooms, transactions, user, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

// Define permission functions directly in the file to avoid import issues
function canManageFrontDesk(role: string): boolean {
  return ['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(role);
}

function canToggleRoomMaintenance(role: string): boolean {
  return ['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(role);
}

function canDisableRoom(role: string): boolean {
  return ['owner', 'super_admin'].includes(role);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const canManage = canManageFrontDesk(userRole);
  
  if (!canManage) {
    throw redirect(303, '/dashboard');
  }
  
  // Get all rooms
  const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
  
  // Get today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayTransactions = await db.select()
    .from(transactions)
    .where(
      and(
        gte(transactions.createdAt, today),
        lt(transactions.createdAt, tomorrow)
      )
    )
    .orderBy(desc(transactions.createdAt));
  
  // Get active guests
  const activeGuests = await db.select()
    .from(transactions)
    .where(eq(transactions.status, 'active'))
    .orderBy(desc(transactions.checkIn));
  
  const stats = {
    totalRooms: allRooms.length,
    availableRooms: allRooms.filter(r => r.status === 'vacant' && r.isActive === true).length,
    occupiedRooms: allRooms.filter(r => r.status === 'occupied').length,
    maintenanceRooms: allRooms.filter(r => r.status === 'maintenance').length,
    inactiveRooms: allRooms.filter(r => r.isActive === false).length,
    todayCheckins: todayTransactions.filter(t => t.status === 'active').length,
    todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0)
  };
  
  return {
    rooms: allRooms,
    todayTransactions,
    activeGuests,
    stats,
    user: locals.user,
    permissions: {
      canToggleMaintenance: canToggleRoomMaintenance(userRole),
      canDisableRoom: canDisableRoom(userRole)
    }
  };
};

export const actions: Actions = {
  checkIn: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const canManage = canManageFrontDesk(locals.user.role as string);
    if (!canManage) {
      throw error(403, 'Unauthorized - Only front desk managers and above can check in guests');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    const guestName = formData.get('guestName') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('paymentMethod') as string;
    
    const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room.length === 0 || room[0].status !== 'vacant' || room[0].isActive === false) {
      throw error(400, 'Room is not available');
    }
    
    const newTransaction = await db.insert(transactions).values({
      roomId,
      guestName,
      amount,
      paymentMethod,
      checkIn: new Date(),
      status: 'active',
      createdAt: new Date()
    }).returning();
    
    await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CHECK_IN',
      entityType: 'room',
      entityId: roomId.toString(),
      newValues: { guestName, amount, paymentMethod, roomNumber: room[0].roomNumber },
      createdAt: new Date()
    });
    
    return { success: true, transactionId: newTransaction[0]?.id };
  },
  
  checkOut: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const canManage = canManageFrontDesk(locals.user.role as string);
    if (!canManage) {
      throw error(403, 'Unauthorized - Only front desk managers and above can check out guests');
    }
    
    const formData = await request.formData();
    const transactionId = parseInt(formData.get('transactionId') as string);
    const roomId = parseInt(formData.get('roomId') as string);
    
    const transaction = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (transaction.length === 0) throw error(404, 'Transaction not found');
    
    const checkOutTime = new Date();
    const checkInTime = new Date(transaction[0].checkIn);
    const hoursStayed = Math.ceil((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
    
    await db.update(transactions)
      .set({ checkOut: checkOutTime, status: 'completed' })
      .where(eq(transactions.id, transactionId));
    
    await db.update(rooms).set({ status: 'vacant' }).where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CHECK_OUT',
      entityType: 'room',
      entityId: roomId.toString(),
      newValues: { hoursStayed, guestName: transaction[0].guestName },
      createdAt: new Date()
    });
    
    return { success: true, hoursStayed };
  },
  
  toggleMaintenance: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const canToggle = canToggleRoomMaintenance(locals.user.role as string);
    if (!canToggle) {
      throw error(403, 'Unauthorized - Only front desk managers and above can toggle maintenance');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    
    const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room.length === 0) throw error(404, 'Room not found');
    
    const newStatus = room[0].status === 'maintenance' ? 'vacant' : 'maintenance';
    
    await db.update(rooms).set({ status: newStatus }).where(eq(rooms.id, roomId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: newStatus === 'maintenance' ? 'MAINTENANCE_START' : 'MAINTENANCE_END',
      entityType: 'room',
      entityId: roomId.toString(),
      oldValues: { status: room[0].status },
      newValues: { status: newStatus },
      createdAt: new Date()
    });
    
    return { success: true, newStatus };
  },
  
  toggleRoomActive: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const canDisable = canDisableRoom(locals.user.role as string);
    if (!canDisable) {
      throw error(403, 'Only owners and super admins can disable rooms');
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
    
    return { success: true, isActive: newActiveState };
  }
};