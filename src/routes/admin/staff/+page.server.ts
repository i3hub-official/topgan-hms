import type { PageServerLoad, Actions } from './$types';
import { db, user, staffDetails, auditTrail, loginHistory } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import { requirePermission, logAuditTrail } from '$lib/server/auth-utils';
import { error, fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = await locals.auth();
  if (!session?.user) throw redirect(302, '/login');
  
  const hasPermission = await requirePermission(session.user.id, 'staff', 'manage');
  if (!hasPermission) throw error(403, 'Access denied');
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  // Get all staff with their details
  const staffList = await db.query.user.findMany({
    where: eq(user.role, 'staff'),
    limit,
    offset,
    with: {
      staffDetails: true
    }
  });
  
  const total = await db.select({ count: user.id }).from(user).where(eq(user.role, 'staff'));
  
  // Get staff activity stats
  const activeStaff = await db.select({ count: user.id }).from(user).where(eq(user.isActive, true));
  
  return {
    staff: staffList,
    pagination: {
      page,
      limit,
      total: total.length
    },
    stats: {
      total: total.length,
      active: activeStaff[0]?.count || 0,
      inactive: total.length - (activeStaff[0]?.count || 0)
    }
  };
};

export const actions: Actions = {
  createStaff: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user) throw error(401, 'Unauthorized');
    
    const hasPermission = await requirePermission(session.user.id, 'staff', 'create');
    if (!hasPermission) throw error(403, 'Access denied');
    
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const staffId = formData.get('staffId') as string;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const password = formData.get('password') as string;
    
    // Check if user exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUser.length > 0) {
      return fail(400, { error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await db.insert(user).values({
      id: crypto.randomUUID(),
      email,
      name,
      role,
      staffId,
      phone,
      department,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }).returning();
    
    // Create account for better-auth
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: email,
      providerId: 'credentials',
      userId: newUser[0].id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await logAuditTrail(
      session.user.id,
      'CREATE_STAFF',
      'user',
      newUser[0].id,
      null,
      { email, name, role, staffId },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return { success: true };
  },
  
  updateStaff: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user) throw error(401, 'Unauthorized');
    
    const hasPermission = await requirePermission(session.user.id, 'staff', 'update');
    if (!hasPermission) throw error(403, 'Access denied');
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const isActive = formData.get('isActive') === 'true';
    
    const oldUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    await db.update(user).set({
      name,
      role,
      phone,
      department,
      isActive,
      updatedAt: new Date()
    }).where(eq(user.id, userId));
    
    await logAuditTrail(
      session.user.id,
      'UPDATE_STAFF',
      'user',
      userId,
      oldUser[0],
      { name, role, phone, department, isActive },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return { success: true };
  },
  
  deactivateStaff: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user) throw error(401, 'Unauthorized');
    
    const hasPermission = await requirePermission(session.user.id, 'staff', 'update');
    if (!hasPermission) throw error(403, 'Access denied');
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    await db.update(user).set({
      isActive: false,
      updatedAt: new Date()
    }).where(eq(user.id, userId));
    
    await logAuditTrail(
      session.user.id,
      'DEACTIVATE_STAFF',
      'user',
      userId,
      null,
      { deactivated: true },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return { success: true };
  },
  
  activateStaff: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user) throw error(401, 'Unauthorized');
    
    const hasPermission = await requirePermission(session.user.id, 'staff', 'update');
    if (!hasPermission) throw error(403, 'Access denied');
    
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    await db.update(user).set({
      isActive: true,
      updatedAt: new Date()
    }).where(eq(user.id, userId));
    
    await logAuditTrail(
      session.user.id,
      'ACTIVATE_STAFF',
      'user',
      userId,
      null,
      { activated: true },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return { success: true };
  }
};