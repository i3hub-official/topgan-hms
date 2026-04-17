import type { PageServerLoad, Actions } from './$types';
import { db, staffActivity, user } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get today's activity for the user
  const todayActivity = await db.select()
    .from(staffActivity)
    .where(
      and(
        eq(staffActivity.userId, locals.user.id),
        gte(staffActivity.createdAt, today),
        lt(staffActivity.createdAt, tomorrow)
      )
    )
    .limit(1);
  
  // Get user's activity history (last 30 days)
  const history = await db.select()
    .from(staffActivity)
    .where(eq(staffActivity.userId, locals.user.id))
    .orderBy(desc(staffActivity.createdAt))
    .limit(30);
  
  // Get user's staff details
  const staffDetails = await db.query.user.findFirst({
    where: eq(user.id, locals.user.id),
    with: {
      staffDetails: true
    }
  });
  
  // Calculate statistics
  const stats = {
    totalHoursThisMonth: history.reduce((sum, activity) => sum + (activity.hoursWorked || 0), 0),
    totalShifts: history.length,
    averageHours: history.length > 0 ? Math.round(history.reduce((sum, a) => sum + (a.hoursWorked || 0), 0) / history.length) : 0,
    completedShifts: history.filter(a => a.checkOut !== null).length,
    activeShifts: history.filter(a => a.checkOut === null).length
  };
  
  return {
    todayActivity: todayActivity[0] || null,
    history,
    stats,
    user: locals.user
  };
};

export const actions: Actions = {
  clockIn: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const location = formData.get('location') as string || 'Main Building';
    const notes = formData.get('notes') as string || '';
    
    // Check if already clocked in today
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
    
    // Create new activity
    await db.insert(staffActivity).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      checkIn: new Date(),
      shiftType: 'regular',
      location: location,
      notes: notes,
      createdAt: new Date()
    });
    
    return { success: true, message: 'Clocked in successfully' };
  },
  
  clockOut: async ({ locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    // Get today's active shift
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
    
    // Update the activity
    await db.update(staffActivity)
      .set({
        checkOut: checkOut,
        hoursWorked: hoursWorked
      })
      .where(eq(staffActivity.id, activeShift[0].id));
    
    return { success: true, message: 'Clocked out successfully', hoursWorked };
  },
  
  updateNotes: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const activityId = formData.get('activityId') as string;
    const notes = formData.get('notes') as string;
    
    await db.update(staffActivity)
      .set({ notes })
      .where(eq(staffActivity.id, activityId));
    
    return { success: true };
  }
};