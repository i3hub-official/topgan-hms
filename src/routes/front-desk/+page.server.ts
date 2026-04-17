import type { PageServerLoad, Actions } from './$types';
import { db, rooms, transactions } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

// Define types for better type safety
interface Room {
  id: number;
  roomNumber: string;
  status: string;
  rate: number;
  isActive: boolean | null;
  deletedAt: Date | null;
  lastCleaned: Date | null;
  createdAt: Date | null;
}

interface Transaction {
  id: number;
  roomId: number | null;
  guestName: string;
  amount: number;
  paymentMethod: string;
  checkIn: Date;
  checkOut: Date | null;
  status: string;
  createdAt: Date | null;
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and has front desk role
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Type assertion for user role
  const userRole = locals.user.role as string;
  const allowedRoles = ['owner', 'super_admin', 'general_manager', 'front_desk_manager'];
  if (!allowedRoles.includes(userRole)) {
    throw redirect(303, '/dashboard');
  }
  
  // Get all rooms
  const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
  
  // Get today's check-ins and check-outs
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
  
  // Get active guests (checked in but not checked out)
  const activeGuests = await db.select()
    .from(transactions)
    .where(eq(transactions.status, 'active'))
    .orderBy(desc(transactions.checkIn));
  
  const stats = {
    totalRooms: allRooms.length,
    availableRooms: allRooms.filter((r: Room) => r.status === 'vacant').length,
    occupiedRooms: allRooms.filter((r: Room) => r.status === 'occupied').length,
    maintenanceRooms: allRooms.filter((r: Room) => r.status === 'maintenance').length,
    todayCheckins: todayTransactions.filter((t: Transaction) => t.status === 'active').length,
    todayRevenue: todayTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
  };
  
  return {
    rooms: allRooms,
    todayTransactions,
    activeGuests,
    stats,
    user: locals.user
  };
};

export const actions: Actions = {
  checkIn: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const roomId = parseInt(formData.get('roomId') as string);
    const guestName = formData.get('guestName') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('paymentMethod') as string;
    
    // Check if room is available
    const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room.length === 0 || room[0].status !== 'vacant') {
      throw error(400, 'Room is not available');
    }
    
    // Create transaction
    await db.insert(transactions).values({
      roomId,
      guestName,
      amount,
      paymentMethod,
      checkIn: new Date(),
      status: 'active',
      createdAt: new Date()
    });
    
    // Update room status
    await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, roomId));
    
    return { success: true, message: 'Guest checked in successfully' };
  },
  
  checkOut: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const transactionId = parseInt(formData.get('transactionId') as string);
    const roomId = parseInt(formData.get('roomId') as string);
    
    // Update transaction
    await db.update(transactions).set({
      checkOut: new Date(),
      status: 'completed'
    }).where(eq(transactions.id, transactionId));
    
    // Update room status
    await db.update(rooms).set({ status: 'vacant' }).where(eq(rooms.id, roomId));
    
    return { success: true, message: 'Guest checked out successfully' };
  },
  
  addRoom: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const roomNumber = formData.get('roomNumber') as string;
    const rate = parseFloat(formData.get('rate') as string);
    
    await db.insert(rooms).values({
      roomNumber,
      rate,
      status: 'vacant',
      isActive: true,
      createdAt: new Date()
    });
    
    return { success: true, message: 'Room added successfully' };
  }
};