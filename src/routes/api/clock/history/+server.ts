import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, staffActivity } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '30');
    const userId = url.searchParams.get('userId') || locals.user.id;

    // Check if admin is requesting another user's history
    const isAdmin = ['owner', 'super_admin', 'general_manager'].includes(locals.user.role as string);
    const targetUserId = (isAdmin && userId !== locals.user.id) ? userId : locals.user.id;

    const history = await db.select()
      .from(staffActivity)
      .where(eq(staffActivity.userId, targetUserId))
      .orderBy(desc(staffActivity.createdAt))
      .limit(limit);

    // Calculate statistics
    const stats = {
      totalShifts: history.length,
      totalHours: history.reduce((sum, shift) => sum + (shift.hoursWorked || 0), 0),
      averageHours: history.length > 0 
        ? Math.round(history.reduce((sum, s) => sum + (s.hoursWorked || 0), 0) / history.length) 
        : 0,
      completedShifts: history.filter(s => s.checkOut !== null).length,
      activeShifts: history.filter(s => s.checkOut === null).length
    };

    return json({
      success: true,
      data: {
        history,
        stats,
        userId: targetUserId
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return json({ error: 'Failed to get history' }, { status: 500 });
  }
};