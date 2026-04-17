import { db } from '$lib/server/db';
import { staffActivity, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load = async () => {
    const logs = await db
        .select({
            id: staffActivity.id,
            userName: user.name,
            role: user.role,
            checkIn: staffActivity.checkIn,
            checkOut: staffActivity.checkOut,
            location: staffActivity.location,
            hoursWorked: staffActivity.hoursWorked,
        })
        .from(staffActivity)
        .leftJoin(user, eq(staffActivity.userId, user.id))
        .orderBy(desc(staffActivity.checkIn))
        .limit(50);

    return { logs };
};