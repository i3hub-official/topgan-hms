import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, staffActivity } from '$lib/server/db';
import { eq, and, gte, lt } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's activity
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

    const isClockedIn = todayActivity.length > 0 && !todayActivity[0].checkOut;
    const currentShift = todayActivity[0] || null;

    // Get today's stats
    const allStaffToday = await db.select()
      .from(staffActivity)
      .where(
        and(
          gte(staffActivity.createdAt, today),
          lt(staffActivity.createdAt, tomorrow)
        )
      );

    const stats = {
      totalClockedIn: allStaffToday.filter(a => !a.checkOut).length,
      totalCompleted: allStaffToday.filter(a => a.checkOut).length,
      totalShifts: allStaffToday.length
    };

    return json({
      success: true,
      data: {
        isClockedIn,
        currentShift,
        stats
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return json({ error: 'Failed to get status' }, { status: 500 });
  }
};