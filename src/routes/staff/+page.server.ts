import type { PageServerLoad, Actions } from './$types';
import { db, user, staffDetails, auditTrail } from '$lib/server/db';
import { eq, desc, sql, like, or, and, notInArray } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { auth } from '$lib/server/auth';

// Role hierarchy for sorting (highest to lowest)
const roleHierarchy: Record<string, number> = {
  'owner': 100,
  'super_admin': 90,
  'general_manager': 80,
  'front_desk_manager': 70,
  'store_keeper': 60,
  'store_keeper_bar': 60,
  'store_keeper_kitchen': 60,
  'store_keeper_store': 60,
  'cleaner': 50,
  'staff': 40
};

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated and authorized
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  const userRole = locals.user.role as string;
  const isOwner = userRole === 'owner';
  const isSuperAdmin = userRole === 'super_admin';
  const isManager = ['owner', 'super_admin', 'general_manager'].includes(userRole);
  
  if (!isManager) {
    throw redirect(303, '/dashboard');
  }
  
  // Pagination
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  
  // Build where clause - hide owner and super_admin from general managers
  let whereClause = sql`1=1`;
  
  if (!isOwner && !isSuperAdmin) {
    // General managers cannot see owner or super_admin
    whereClause = sql`${user.role} NOT IN ('owner', 'super_admin')`;
  }
  
  if (search) {
    whereClause = isOwner || isSuperAdmin 
      ? sql`(${user.name} LIKE ${`%${search}%`} OR ${user.email} LIKE ${`%${search}%`} OR ${user.staffId} LIKE ${`%${search}%`})`
      : sql`(${user.name} LIKE ${`%${search}%`} OR ${user.email} LIKE ${`%${search}%`} OR ${user.staffId} LIKE ${`%${search}%`}) AND ${user.role} NOT IN ('owner', 'super_admin')`;
  }
  
  // Get all staff (without pagination first for sorting by role hierarchy)
  const allStaff = await db.select()
    .from(user)
    .where(whereClause);
  
  // Sort by role hierarchy (highest to lowest)
  const sortedStaff = allStaff.sort((a, b) => {
    const aLevel = roleHierarchy[a.role || 'staff'] || 0;
    const bLevel = roleHierarchy[b.role || 'staff'] || 0;
    return bLevel - aLevel;
  });
  
  // Apply pagination after sorting
  const staffList = sortedStaff.slice(offset, offset + limit);
  const totalCount = sortedStaff.length;
  
  // Get staff details for each user
  const staffWithDetails = await Promise.all(
    staffList.map(async (staffMember) => {
      const details = await db.select()
        .from(staffDetails)
        .where(eq(staffDetails.userId, staffMember.id))
        .limit(1);
      
      const hasBankDetails = details.length > 0;
      
      return {
        ...staffMember,
        details: details[0] || null,
        hasBankDetails,
        roleLevel: roleHierarchy[staffMember.role || 'staff'] || 0
      };
    })
  );
  
  // Get statistics (excluding owner/super_admin for managers)
  let statsWhere = sql`1=1`;
  if (!isOwner && !isSuperAdmin) {
    statsWhere = sql`${user.role} NOT IN ('owner', 'super_admin')`;
  }
  
  const totalStaffCount = await db.select({ count: sql<number>`count(*)` }).from(user).where(statsWhere);
  const activeStaffCount = await db.select({ count: sql<number>`count(*)` }).from(user).where(and(eq(user.isActive, true), statsWhere));
  const managersCount = await db.select({ count: sql<number>`count(*)` }).from(user).where(and(eq(user.role, 'general_manager'), statsWhere));
  
  const stats = {
    total: Number(totalStaffCount[0]?.count || 0),
    active: Number(activeStaffCount[0]?.count || 0),
    inactive: Number(totalStaffCount[0]?.count || 0) - Number(activeStaffCount[0]?.count || 0),
    managers: Number(managersCount[0]?.count || 0)
  };
  
  // Get all available roles for dropdown (excluding owner/super_admin for managers)
  let roles = [];
  if (isOwner || isSuperAdmin) {
    roles = [
      { value: 'owner', label: 'Owner' },
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'general_manager', label: 'General Manager' },
      { value: 'front_desk_manager', label: 'Front Desk Manager' },
      { value: 'store_keeper', label: 'Store Keeper (Full)' },
      { value: 'store_keeper_bar', label: 'Store Keeper (Bar)' },
      { value: 'store_keeper_kitchen', label: 'Store Keeper (Kitchen)' },
      { value: 'store_keeper_store', label: 'Store Keeper (Store)' },
      { value: 'cleaner', label: 'Cleaner' },
      { value: 'staff', label: 'Regular Staff' }
    ];
  } else {
    roles = [
      { value: 'general_manager', label: 'General Manager' },
      { value: 'front_desk_manager', label: 'Front Desk Manager' },
      { value: 'store_keeper', label: 'Store Keeper (Full)' },
      { value: 'store_keeper_bar', label: 'Store Keeper (Bar)' },
      { value: 'store_keeper_kitchen', label: 'Store Keeper (Kitchen)' },
      { value: 'store_keeper_store', label: 'Store Keeper (Store)' },
      { value: 'cleaner', label: 'Cleaner' },
      { value: 'staff', label: 'Regular Staff' }
    ];
  }
  
  return {
    staff: staffWithDetails,
    stats,
    roles,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    search,
    permissions: {
      canResetPassword: isOwner || isSuperAdmin,
      canModifyBankDetails: isOwner || isSuperAdmin,
      canModifyRole: isOwner || isSuperAdmin,
      canModifyDepartment: isOwner || isSuperAdmin,
      canModifySalary: isOwner || isSuperAdmin,
      canDeleteStaff: isOwner,
      canActivateDeactivate: true,
      canAddBankDetails: true
    },
    currentUser: locals.user,
    roleHierarchy
  };
};

// Rest of actions remain the same...
export const actions: Actions = {
  updateStaff: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const userRole = locals.user.role as string;
    const isOwner = userRole === 'owner';
    const isSuperAdmin = userRole === 'super_admin';
    
    if (!isOwner && !isSuperAdmin) {
      throw error(403, 'Only owners and super admins can modify staff details');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const isActive = formData.get('isActive') === 'true';
    
    if (!isOwner && (role === 'owner' || role === 'super_admin')) {
      throw error(403, 'Only owner can assign owner or super admin roles');
    }
    
    const oldData = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    await db.update(user)
      .set({
        name,
        role,
        phone,
        department,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'UPDATE_STAFF',
      entityType: 'user',
      entityId: userId,
      oldValues: oldData[0],
      newValues: { name, role, phone, department, isActive },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  updateBankDetails: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const address = formData.get('address') as string;
    const nextOfKinName = formData.get('nextOfKinName') as string;
    const nextOfKinPhone = formData.get('nextOfKinPhone') as string;
    const bankName = formData.get('bankName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const accountName = formData.get('accountName') as string;
    const salary = parseFloat(formData.get('salary') as string) || 0;
    
    const existing = await db.select()
      .from(staffDetails)
      .where(eq(staffDetails.userId, userId))
      .limit(1);
    
    const userRole = locals.user.role as string;
    const isOwner = userRole === 'owner';
    const isSuperAdmin = userRole === 'super_admin';
    
    const hasExisting = existing.length > 0;
    
    if (hasExisting && !isOwner && !isSuperAdmin) {
      throw error(403, 'Only owners and super admins can modify existing bank details');
    }
    
    if (existing.length > 0) {
      await db.update(staffDetails)
        .set({
          address,
          nextOfKinName,
          nextOfKinPhone,
          bankName,
          accountNumber,
          accountName,
          salary
        })
        .where(eq(staffDetails.userId, userId));
    } else {
      await db.insert(staffDetails).values({
        id: crypto.randomUUID(),
        userId,
        address,
        nextOfKinName,
        nextOfKinPhone,
        bankName,
        accountNumber,
        accountName,
        salary,
        dateJoined: new Date()
      });
    }
    
    return { success: true };
  },
  
  resetPassword: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const userRole = locals.user.role as string;
    const isOwner = userRole === 'owner';
    const isSuperAdmin = userRole === 'super_admin';
    
    if (!isOwner && !isSuperAdmin) {
      throw error(403, 'Only owners and super admins can reset passwords');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const newPassword = formData.get('newPassword') as string;
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'RESET_PASSWORD',
      entityType: 'user',
      entityId: userId,
      newValues: { passwordReset: true },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  toggleStaffStatus: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const currentStatus = formData.get('currentStatus') === 'true';
    
    const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (targetUser.length === 0) {
      throw error(404, 'User not found');
    }
    
    const userRole = locals.user.role as string;
    const targetRole = targetUser[0].role;
    
    if (userRole !== 'owner' && (targetRole === 'owner' || targetRole === 'super_admin')) {
      throw error(403, 'Cannot deactivate owner or super admin accounts');
    }
    
    if (targetRole === 'owner' && userRole !== 'owner') {
      throw error(403, 'Only owner can deactivate owner accounts');
    }
    
    await db.update(user)
      .set({
        isActive: !currentStatus,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: currentStatus ? 'DEACTIVATE_STAFF' : 'ACTIVATE_STAFF',
      entityType: 'user',
      entityId: userId,
      newValues: { isActive: !currentStatus },
      createdAt: new Date()
    });
    
    return { success: true };
  },
  
  deleteStaff: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    if (locals.user.role !== 'owner') {
      throw error(403, 'Only owner can delete staff');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    const staffToDelete = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    await db.update(user)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));
    
    await db.insert(auditTrail).values({
      id: crypto.randomUUID(),
      userId: locals.user.id,
      action: 'DELETE_STAFF',
      entityType: 'user',
      entityId: userId,
      oldValues: staffToDelete[0],
      createdAt: new Date()
    });
    
    return { success: true };
  }
};