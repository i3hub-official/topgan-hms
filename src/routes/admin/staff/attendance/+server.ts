import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, staffActivity, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { action, location } = await request.json();
  const userId = locals.user.id;
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Validate location
  if (!location || location.trim() === '') {
    return json({ error: 'Location is required' }, { status: 400 });
  }
  
  try {
    if (action === 'clock-in') {
      // Check if already clocked in today
      const existing = await db.select()
        .from(staffActivity)
        .where(
          and(
            eq(staffActivity.userId, userId),
            gte(staffActivity.createdAt, today),
            lt(staffActivity.createdAt, tomorrow)
          )
        )
        .limit(1);
      
      if (existing.length > 0 && !existing[0].checkOut) {
        return json({ error: 'Already clocked in today' }, { status: 400 });
      }
      
      // Create new attendance record
      const newActivity = await db.insert(staffActivity).values({
        id: crypto.randomUUID(),
        userId,
        checkIn: now,
        location: location,
        shiftType: 'regular',
        createdAt: now
      }).returning();
      
      await db.insert(auditTrail).values({
        id: crypto.randomUUID(),
        userId,
        action: 'CLOCK_IN',
        entityType: 'attendance',
        entityId: newActivity[0]?.id,
        newValues: { location },
        createdAt: now
      });
      
      return json({ success: true, action: 'clock-in' });
      
    } else if (action === 'clock-out') {
      // Find today's active shift
      const activeShift = await db.select()
        .from(staffActivity)
        .where(
          and(
            eq(staffActivity.userId, userId),
            gte(staffActivity.createdAt, today),
            lt(staffActivity.createdAt, tomorrow),
            eq(staffActivity.checkOut, null)
          )
        )
        .limit(1);
      
      if (activeShift.length === 0) {
        return json({ error: 'No active shift found' }, { status: 400 });
      }
      
      const checkInTime = new Date(activeShift[0].checkIn!);
      const hoursWorked = parseFloat(((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
      
      await db.update(staffActivity)
        .set({
          checkOut: now,
          hoursWorked,
          location: `${activeShift[0].location} → ${location}`
        })
        .where(eq(staffActivity.id, activeShift[0].id));
      
      await db.insert(auditTrail).values({
        id: crypto.randomUUID(),
        userId,
        action: 'CLOCK_OUT',
        entityType: 'attendance',
        entityId: activeShift[0].id,
        newValues: { hoursWorked, location },
        createdAt: now
      });
      
      return json({ success: true, action: 'clock-out', hoursWorked });
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Attendance error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const activity = await db.select()
    .from(staffActivity)
    .where(
      and(
        eq(staffActivity.userId, locals.user.id),
        gte(staffActivity.createdAt, today),
        lt(staffActivity.createdAt, tomorrow)
      )
    )
    .limit(1);
  
  return json({ activity: activity[0] || null });
};