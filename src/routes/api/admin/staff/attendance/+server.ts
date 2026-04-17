import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { staffActivity } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST({ request, locals }) {
    const session = await locals.auth.getSession();
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { location, action, notes } = await request.json();
    const userId = session.user.id;
    const now = new Date();

    if (action === 'clock-in') {
        await db.insert(staffActivity).values({
            id: crypto.randomUUID(),
            userId,
            checkIn: now,
            location, // Format: "lat, long"
            shiftType: 'Day', // Logic can be added to determine shift based on time
            notes
        });
        return json({ message: 'Clocked in successfully' });
    }

    if (action === 'clock-out') {
        // Find the active session (where checkOut is null)
        const activeSession = await db.query.staffActivity.findFirst({
            where: and(eq(staffActivity.userId, userId), isNull(staffActivity.checkOut))
        });

        if (!activeSession) return json({ error: 'No active session' }, { status: 400 });

        const hoursWorked = Math.round((now.getTime() - activeSession.checkIn.getTime()) / (1000 * 60 * 60));

        await db.update(staffActivity)
            .set({ checkOut: now, hoursWorked })
            .where(eq(staffActivity.id, activeSession.id));

        return json({ message: 'Clocked out successfully' });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
}