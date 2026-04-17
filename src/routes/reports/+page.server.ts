import type { PageServerLoad } from './$types';
import { db, transactions, staffActivity, user, rooms } from '$lib/server/db';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const isManager = ['owner', 'super_admin', 'general_manager'].includes(userRole);
  
  // Get date range for reports (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Personal shift reports - FIXED: Removed invalid where clause
  const personalShifts = await db.select()
    .from(staffActivity)
    .where(eq(staffActivity.userId, locals.user.id))
    .orderBy(desc(staffActivity.createdAt))
    .limit(50);
  
  // Personal transaction reports (if front desk or above)
  let personalTransactions: any[] = [];
  if (['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(userRole)) {
    personalTransactions = await db.select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(50);
  }
  
  // For managers - get aggregated reports (without individual details)
  let aggregatedData = null;
  let roomStats = null;
  let staffStats = null;
  
  if (isManager) {
    // Get all shifts in last 30 days
    const allShifts = await db.select()
      .from(staffActivity)
      .where(gte(staffActivity.createdAt, thirtyDaysAgo))
      .orderBy(desc(staffActivity.createdAt));
    
    // Get all transactions in last 30 days
    const allTransactions = await db.select()
      .from(transactions)
      .where(gte(transactions.createdAt, thirtyDaysAgo))
      .orderBy(desc(transactions.createdAt));
    
    // Get room statistics
    const allRooms = await db.select().from(rooms);
    const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
    const availableRooms = allRooms.filter(r => r.status === 'vacant').length;
    const maintenanceRooms = allRooms.filter(r => r.status === 'maintenance').length;
    
    roomStats = {
      total: allRooms.length,
      occupied: occupiedRooms,
      available: availableRooms,
      maintenance: maintenanceRooms,
      occupancyRate: allRooms.length > 0 ? Math.round((occupiedRooms / allRooms.length) * 100) : 0
    };
    
    // Get staff statistics
    const allStaff = await db.select().from(user);
    const activeStaff = allStaff.filter(s => s.isActive === true).length;
    const staffByRole = allStaff.reduce((acc, s) => {
      const role = s.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    staffStats = {
      total: allStaff.length,
      active: activeStaff,
      inactive: allStaff.length - activeStaff,
      byRole: staffByRole
    };
    
    // Calculate financial summary
    const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const cashRevenue = allTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0);
    const posRevenue = allTransactions.filter(t => t.paymentMethod === 'pos').reduce((sum, t) => sum + t.amount, 0);
    const transferRevenue = allTransactions.filter(t => t.paymentMethod === 'transfer').reduce((sum, t) => sum + t.amount, 0);
    
    aggregatedData = {
      totalShifts: allShifts.length,
      totalHours: allShifts.reduce((sum, s) => sum + (s.hoursWorked || 0), 0),
      totalRevenue: totalRevenue,
      cashRevenue: cashRevenue,
      posRevenue: posRevenue,
      transferRevenue: transferRevenue,
      totalTransactions: allTransactions.length,
      averageTransactionValue: allTransactions.length > 0 ? totalRevenue / allTransactions.length : 0
    };
  }
  
  // Calculate personal stats
  const personalStats = {
    totalShifts: personalShifts.length,
    totalHours: personalShifts.reduce((sum, s) => sum + (s.hoursWorked || 0), 0),
    totalTransactions: personalTransactions.length,
    totalRevenue: personalTransactions.reduce((sum, t) => sum + t.amount, 0),
    averageHoursPerShift: personalShifts.length > 0 
      ? Math.round(personalShifts.reduce((sum, s) => sum + (s.hoursWorked || 0), 0) / personalShifts.length)
      : 0,
    completedShifts: personalShifts.filter(s => s.checkOut !== null).length,
    activeShifts: personalShifts.filter(s => s.checkOut === null).length
  };
  
  // Get recent activity for timeline
  const recentActivity = await db.select()
    .from(staffActivity)
    .where(eq(staffActivity.userId, locals.user.id))
    .orderBy(desc(staffActivity.createdAt))
    .limit(10);
  
  return {
    personalShifts,
    personalTransactions,
    personalStats,
    aggregatedData,
    roomStats,
    staffStats,
    recentActivity,
    user: locals.user,
    isManager
  };
};