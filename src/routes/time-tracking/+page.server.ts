import type { PageServerLoad, Actions } from './$types';
import { db, staffActivity, user, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

// Define who requires time tracking
function requiresTimeTracking(role: string): boolean {
  // Everyone except owner and super_admin must do time tracking
  return !['owner', 'super_admin'].includes(role);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const needsTracking = requiresTimeTracking(userRole);
  
  // If user doesn't need time tracking, show message but still allow view
  // (they can see staff time tracking if they have permission)
  const isAdmin = ['owner', 'super_admin', 'general_manager'].includes(userRole);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let todayActivity = null;
  let history: any[] = [];
  let stats = {
    totalHoursThisMonth: 0,
    totalShifts: 0,
    averageHours: 0,
    completedShifts: 0,
    activeShifts: 0
  };
  
  // If user needs tracking, get their personal data
  if (needsTracking) {
    todayActivity = await db.select()
      .from(staffActivity)
      .where(
        and(
          eq(staffActivity.userId, locals.user.id),
          gte(staffActivity.createdAt, today),
          lt(staffActivity.createdAt, tomorrow)
        )
      )
      .limit(1);
    
    todayActivity = todayActivity[0] || null;
    
    history = await db.select()
      .from(staffActivity)
      .where(eq(staffActivity.userId, locals.user.id))
      .orderBy(desc(staffActivity.createdAt))
      .limit(30);
    
    stats = {
      totalHoursThisMonth: history.reduce((sum, activity) => sum + (activity.hoursWorked || 0), 0),
      totalShifts: history.length,
      averageHours: history.length > 0 ? Math.round(history.reduce((sum, a) => sum + (a.hoursWorked || 0), 0) / history.length) : 0,
      completedShifts: history.filter(a => a.checkOut !== null).length,
      activeShifts: history.filter(a => a.checkOut === null).length
    };
  }
  
  // If admin, get all staff time tracking for overview
  let allStaffActivity: any[] = [];
  let staffList: any[] = [];
  
  if (isAdmin) {
    // Get all staff (excluding owner and super_admin)
    staffList = await db.select()
      .from(user)
      .where(and(
        eq(user.isActive, true),
        // Exclude owner and super_admin
        ...(userRole !== 'owner' ? [eq(user.role, 'super_admin')] : [])
      ))
      .orderBy(user.name);
    
    // Get today's activity for all staff
    allStaffActivity = await db.select({
      id: staffActivity.id,
      userId: staffActivity.userId,
      checkIn: staffActivity.checkIn,
      checkOut: staffActivity.checkOut,
      hoursWorked: staffActivity.hoursWorked,
      location: staffActivity.location,
      userName: user.name,
      userRole: user.role,
      userStaffId: user.staffId
    })
    .from(staffActivity)
    .leftJoin(user, eq(staffActivity.userId, user.id))
    .where(
      and(
        gte(staffActivity.createdAt, today),
        lt(staffActivity.createdAt, tomorrow)
      )
    )
    .orderBy(desc(staffActivity.checkIn));
  }
  
  return {
    todayActivity,
    history,
    stats,
    user: locals.user,
    needsTracking,
    isAdmin,
    allStaffActivity,
    staffList
  };
};

export const actions: Actions = {
  clockIn: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const userRole = locals.user.role as string;
    const needsTracking = requiresTimeTracking(userRole);
    
    if (!needsTracking) {
      throw error(403, 'Time tracking not required for owners and super admins');
    }
    
    const formData = await request.formData();
    const location = formData.get('location') as string || 'Main Building';
    const notes = formData.get('notes') as string || '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingActivity = await db.select()
      .from(staffActivity)
      .where(
        and(
          eq(staffActivity.userId, locals.user.id),
          gte(staffActivity.createdAt, today),
          lt(staffActivity.createdAt, tomorrow)
        )
      )
      .limit(1);
    
    if (existingActivity.length > 0 && !existingActivity[0].checkOut) {
      throw error(400, 'Already clocked in today');
    }
    
    await db.insert(staffActivity).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      checkIn: new Date(),
      shiftType: 'regular',
      location: location,
      notes: notes,
      createdAt: new Date()
    });
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CLOCK_IN',
      entityType: 'time_tracking',
      newValues: { location },
      createdAt: new Date()
    });
    
    return { success: true, message: 'Clocked in successfully' };
  },
  
  clockOut: async ({ locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const userRole = locals.user.role as string;
    const needsTracking = requiresTimeTracking(userRole);
    
    if (!needsTracking) {
      throw error(403, 'Time tracking not required for owners and super admins');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const activeShift = await db.select()
      .from(staffActivity)
      .where(
        and(
          eq(staffActivity.userId, locals.user.id),
          gte(staffActivity.createdAt, today),
          lt(staffActivity.createdAt, tomorrow),
          eq(staffActivity.checkOut, null)
        )
      )
      .limit(1);
    
    if (activeShift.length === 0) {
      throw error(400, 'No active shift found');
    }
    
    const checkOut = new Date();
    const checkIn = new Date(activeShift[0].checkIn!);
    const hoursWorked = parseFloat(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
    
    await db.update(staffActivity)
      .set({ checkOut, hoursWorked })
      .where(eq(staffActivity.id, activeShift[0].id));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CLOCK_OUT',
      entityType: 'time_tracking',
      newValues: { hoursWorked },
      createdAt: new Date()
    });
    
    return { success: true, message: 'Clocked out successfully', hoursWorked };
  },
  
  updateNotes: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const activityId = formData.get('activityId') as string;
    const notes = formData.get('notes') as string;
    
    await db.update(staffActivity)
      .set({ notes })
      .where(eq(staffActivity.id, activityId));
    
    return { success: true };
  },
  
  // Admin action to view staff time tracking
  getStaffActivity: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const userRole = locals.user.role as string;
    const isAdmin = ['owner', 'super_admin', 'general_manager'].includes(userRole);
    
    if (!isAdmin) {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const staffId = formData.get('staffId') as string;
    const date = formData.get('date') ? new Date(formData.get('date') as string) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const activity = await db.select()
      .from(staffActivity)
      .where(
        and(
          eq(staffActivity.userId, staffId),
          gte(staffActivity.createdAt, date),
          lt(staffActivity.createdAt, nextDay)
        )
      )
      .limit(1);
    
    return { success: true, activity: activity[0] || null };
  }
};