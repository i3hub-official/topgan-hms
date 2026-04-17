import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, staffActivity, auditTrail } from '$lib/server/db';
import { eq, and, gte, lt, isNull } from 'drizzle-orm';

// Define who requires time tracking
function requiresTimeTracking(role: string): boolean {
  return !['owner', 'super_admin'].includes(role);
}

export const POST: RequestHandler = async ({ locals }) => {
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

    // Find any active shift (not just today's)
    // This handles cases where someone clocked in yesterday and forgot to clock out
    const activeShift = await db.select()
      .from(staffActivity)
      .where(
        and(
          eq(staffActivity.userId, locals.user.id),
          isNull(staffActivity.checkOut)
        )
      )
      .orderBy(staffActivity.createdAt)
      .limit(1);

    if (activeShift.length === 0) {
      return json({ 
        error: 'No active shift found. You need to clock in first before clocking out.',
        tip: 'Go to Time Tracking page and click "Clock In" first'
      }, { status: 400 });
    }

    // Calculate hours worked
    const checkOut = new Date();
    const checkIn = new Date(activeShift[0].checkIn!);
    const hoursWorked = parseFloat(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));

    // Update the shift with clock out time
    await db.update(staffActivity)
      .set({ 
        checkOut: checkOut, 
        hoursWorked: hoursWorked 
      })
      .where(eq(staffActivity.id, activeShift[0].id));

    // Log audit trail
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CLOCK_OUT',
      entityType: 'time_tracking',
      entityId: activeShift[0].id,
      newValues: { checkOut: checkOut.toISOString(), hoursWorked },
      createdAt: new Date()
    });

    return json({ 
      success: true, 
      message: 'Clocked out successfully',
      data: {
        id: activeShift[0].id,
        checkIn: activeShift[0].checkIn,
        checkOut: checkOut,
        hoursWorked: hoursWorked
      }
    });

  } catch (error) {
    console.error('Clock out error:', error);
    return json({ error: 'Failed to clock out: ' + String(error) }, { status: 500 });
  }
};