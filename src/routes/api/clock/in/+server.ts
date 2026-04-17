import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, staffActivity, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt } from 'drizzle-orm';

// Define who requires time tracking
function requiresTimeTracking(role: string): boolean {
  return !['owner', 'super_admin'].includes(role);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = locals.user.role as string;
    const needsTracking = requiresTimeTracking(userRole);

    if (!needsTracking) {
      return json({ error: 'Time tracking not required for owners and super admins' }, { status: 403 });
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
      return json({ error: 'Already clocked in today' }, { status: 400 });
    }

    // Create clock in record
    const newActivity = await db.insert(staffActivity).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      checkIn: new Date(),
      shiftType: 'regular',
      location: location,
      notes: notes,
      createdAt: new Date()
    }).returning();

    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CLOCK_IN',
      entityType: 'time_tracking',
      entityId: newActivity[0]?.id,
      newValues: { location, checkIn: new Date().toISOString() },
      createdAt: new Date()
    });

    return json({ 
      success: true, 
      message: 'Clocked in successfully',
      data: {
        id: newActivity[0]?.id,
        checkIn: newActivity[0]?.checkIn,
        location: location
      }
    });

  } catch (error) {
    console.error('Clock in error:', error);
    return json({ error: 'Failed to clock in' }, { status: 500 });
  }
};