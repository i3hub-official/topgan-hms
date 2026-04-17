import type { PageServerLoad, Actions } from './$types';
import { db, user, auditTrail, staffRoles, rooms, suppliers, inventory } from '$lib/server/db';
import { eq, desc, sql } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Only owner can access this page
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  if (locals.user.role !== 'owner') {
    throw redirect(303, '/dashboard');
  }
  
  // Get system statistics
  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(user);
  const activeUsersResult = await db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.isActive, true));
  const totalRoomsResult = await db.select({ count: sql<number>`count(*)` }).from(rooms);
  const totalSuppliersResult = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
  const totalInventoryResult = await db.select({ count: sql<number>`count(*)` }).from(inventory);
  
  // Get recent audit logs with user names - Human readable format
  const recentAuditsRaw = await db.select({
    id: auditTrail.id,
    userId: auditTrail.userId,
    action: auditTrail.action,
    entityType: auditTrail.entityType,
    entityId: auditTrail.entityId,
    oldValues: auditTrail.oldValues,
    newValues: auditTrail.newValues,
    createdAt: auditTrail.createdAt,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role
  })
  .from(auditTrail)
  .leftJoin(user, eq(auditTrail.userId, user.id))
  .orderBy(desc(auditTrail.createdAt))
  .limit(100);
  
  // Format audit logs for human readability
  const recentAudits = recentAuditsRaw.map(audit => {
    let description = '';
    let changes = '';
    
    switch(audit.action) {
      case 'CREATE_STAFF': {
        const newStaff = audit.newValues as any;
        description = `Created new staff member: ${newStaff?.name || 'Unknown'}`;
        changes = `Email: ${newStaff?.email}, Role: ${newStaff?.role}`;
        break;
      }
      case 'UPDATE_STAFF': {
        const updates = audit.newValues as any;
        description = `Updated staff information`;
        changes = `Name: ${updates?.name}, Role: ${updates?.role}, Phone: ${updates?.phone}`;
        break;
      }
      case 'DELETE_STAFF': {
        const deleted = audit.oldValues as any;
        description = `Deactivated staff member: ${deleted?.name || 'Unknown'}`;
        changes = `Staff ID: ${deleted?.staffId}, Email: ${deleted?.email}`;
        break;
      }
      case 'CREATE_ROOM': {
        const newRoom = audit.newValues as any;
        description = `Added new room: ${newRoom?.roomNumber}`;
        changes = `Rate: ₦${newRoom?.rate?.toLocaleString()}`;
        break;
      }
      case 'UPDATE_ROOM': {
        const roomUpdates = audit.newValues as any;
        description = `Updated room: ${roomUpdates?.roomNumber}`;
        changes = `Status: ${roomUpdates?.status}, Rate: ₦${roomUpdates?.rate?.toLocaleString()}`;
        break;
      }
      case 'DELETE_ROOM': {
        const deletedRoom = audit.oldValues as any;
        description = `Deactivated room: ${deletedRoom?.roomNumber}`;
        changes = `Previous status: ${deletedRoom?.status}`;
        break;
      }
      case 'CREATE_ROLE': {
        const newRole = audit.newValues as any;
        description = `Created new role: ${newRole?.roleName}`;
        changes = `Level: ${newRole?.level}, Permissions: ${newRole?.permissions?.join(', ')}`;
        break;
      }
      case 'UPDATE_ROLE': {
        const roleUpdates = audit.newValues as any;
        description = `Updated role permissions`;
        changes = `Level: ${roleUpdates?.level}, Permissions: ${roleUpdates?.permissions?.join(', ')}`;
        break;
      }
      case 'DATABASE_BACKUP':
        description = `Performed database backup`;
        changes = `System maintenance`;
        break;
      case 'CLEAR_AUDIT_LOGS':
        description = `Cleared old audit logs`;
        changes = `Kept last 30 days of logs`;
        break;
      default:
        description = `${audit.action.replace(/_/g, ' ')}`;
        changes = audit.entityType ? `Entity: ${audit.entityType}` : '';
    }
    
    return {
      ...audit,
      description,
      changes,
      timestamp: audit.createdAt ? new Date(audit.createdAt).toLocaleString() : 'N/A',
      date: audit.createdAt ? new Date(audit.createdAt).toLocaleDateString() : 'N/A',
      time: audit.createdAt ? new Date(audit.createdAt).toLocaleTimeString() : 'N/A'
    };
  });
  
  // Get all staff roles with formatted permissions
  const rolesRaw = await db.select().from(staffRoles).orderBy(staffRoles.level);
  const roles = rolesRaw.map(role => ({
    ...role,
    permissionsArray: role.permissions || []
  }));
  
  // Get user distribution by role
  const userStats = await db.select({
    role: user.role,
    count: sql<number>`count(*)`
  })
  .from(user)
  .groupBy(user.role);
  
  const stats = {
    totalUsers: Number(totalUsersResult[0]?.count || 0),
    activeUsers: Number(activeUsersResult[0]?.count || 0),
    totalRooms: Number(totalRoomsResult[0]?.count || 0),
    totalSuppliers: Number(totalSuppliersResult[0]?.count || 0),
    totalInventory: Number(totalInventoryResult[0]?.count || 0),
    userDistribution: userStats
  };
  
  return {
    stats,
    recentAudits,
    roles,
    user: locals.user
  };
};

export const actions: Actions = {
  updateRolePermissions: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'owner') {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const roleId = formData.get('roleId') as string;
    const permissions = formData.getAll('permissions') as string[];
    const level = parseInt(formData.get('level') as string);
    
    const oldRole = await db.select().from(staffRoles).where(eq(staffRoles.id, roleId)).limit(1);
    
    await db.update(staffRoles)
      .set({ permissions, level })
      .where(eq(staffRoles.id, roleId));
    
    // Log the action
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'UPDATE_ROLE',
      entityType: 'role',
      entityId: roleId,
      oldValues: oldRole[0],
      newValues: { permissions, level },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  createRole: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'owner') {
      throw error(403, 'Unauthorized');
    }
    
    const formData = await request.formData();
    const roleName = formData.get('roleName') as string;
    const permissions = formData.getAll('permissions') as string[];
    const level = parseInt(formData.get('level') as string);
    
    await db.insert(staffRoles).values({
      id: roleName.toLowerCase().replace(/\s/g, '_'),
      roleName,
      permissions,
      level,
      createdAt: new Date()
    });
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CREATE_ROLE',
      entityType: 'role',
      entityId: roleName.toLowerCase().replace(/\s/g, '_'),
      newValues: { roleName, permissions, level },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  clearAuditLogs: async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'owner') {
      throw error(403, 'Unauthorized');
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await db.delete(auditTrail).where(eq(auditTrail.createdAt, thirtyDaysAgo));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'CLEAR_AUDIT_LOGS',
      entityType: 'system',
      newValues: { keptLastDays: 30 },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  backupDatabase: async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'owner') {
      throw error(403, 'Unauthorized');
    }
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'DATABASE_BACKUP',
      entityType: 'system',
      createdAt: new Date()
    });
    
    return { success: true };
  }
};