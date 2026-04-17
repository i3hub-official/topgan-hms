import { db, user, staffRoles, auditTrail } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { UserRole } from '$lib/config/roles';
import { hasPermission } from '$lib/config/roles';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const result = await db.select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  
  return result[0]?.role as UserRole || null;
}

export async function requirePermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (!userRole) return false;
  return hasPermission(userRole, resource, action);
}

export async function logAuditTrail(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) {
  await db.insert(auditTrail).values({
    id: crypto.randomUUID(),
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
    createdAt: new Date()
  });
}

export async function getStaffActivity(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const activity = await db.query.staffActivity.findFirst({
    where: and(
      eq(getStaffActivity.userId, userId),
      // Add date range filter
    )
  });

  return activity;
}