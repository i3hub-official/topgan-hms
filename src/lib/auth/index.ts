import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/db';
import * as schema from './schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false, // Set to true for production
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 1 day
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  advanced: {
    cookiePrefix: 'topgan',
    generateId: () => crypto.randomUUID(),
  },
  // Custom hooks for hotel management
  hooks: {
    after: {
      signIn: async (context) => {
        const { user, request } = context;
        // Log login activity
        await db.insert(schema.loginHistory).values({
          userId: user.id,
          ipAddress: request?.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request?.headers.get('user-agent') || 'unknown',
          success: true,
        });
        
        // Update last login
        await db.update(schema.user)
          .set({ lastLogin: new Date() })
          .where(eq(schema.user.id, user.id));
      },
      signOut: async (context) => {
        // Log logout activity
        await db.insert(schema.auditTrail).values({
          userId: context.user.id,
          action: 'LOGOUT',
          ipAddress: context.request?.headers.get('x-forwarded-for'),
          userAgent: context.request?.headers.get('user-agent'),
        });
      },
    },
  },
});

// Permission helper functions
export const permissions = {
  // Role levels
  roles: {
    admin: 10,
    manager: 7,
    auditor: 5,
    frontdesk: 3,
    housekeeper: 2,
    staff: 1,
  },
  
  // Check if user has permission
  hasPermission: (userRole: string, requiredLevel: number): boolean => {
    const roleLevel = permissions.roles[userRole as keyof typeof permissions.roles] || 0;
    return roleLevel >= requiredLevel;
  },
  
  // Specific permission checks
  canRunAudit: (userRole: string) => {
    return permissions.hasPermission(userRole, 5); // Auditor and above
  },
  
  canManageRooms: (userRole: string) => {
    return permissions.hasPermission(userRole, 3); // Frontdesk and above
  },
  
  canManageInventory: (userRole: string) => {
    return permissions.hasPermission(userRole, 5); // Auditor and above
  },
  
  canManageUsers: (userRole: string) => {
    return permissions.hasPermission(userRole, 10); // Admin only
  },
  
  canViewReports: (userRole: string) => {
    return permissions.hasPermission(userRole, 3); // Frontdesk and above
  },
};

// Seed default roles and admin user
export async function seedDatabase() {
  // Check if roles exist
  const existingRoles = await db.select().from(schema.staffRoles);
  
  if (existingRoles.length === 0) {
    // Insert default roles
    await db.insert(schema.staffRoles).values([
      { id: crypto.randomUUID(), roleName: 'admin', permissions: ['*'], level: 10 },
      { id: crypto.randomUUID(), roleName: 'manager', permissions: ['audit', 'rooms', 'inventory', 'reports'], level: 7 },
      { id: crypto.randomUUID(), roleName: 'auditor', permissions: ['audit', 'inventory', 'reports'], level: 5 },
      { id: crypto.randomUUID(), roleName: 'frontdesk', permissions: ['rooms', 'transactions'], level: 3 },
      { id: crypto.randomUUID(), roleName: 'housekeeper', permissions: ['rooms.update_status'], level: 2 },
      { id: crypto.randomUUID(), roleName: 'staff', permissions: ['view'], level: 1 },
    ]);
  }
  
  // Check if admin user exists
  const existingAdmin = await db.select().from(schema.user).where(eq(schema.user.email, 'admin@topgan.com'));
  
  if (existingAdmin.length === 0) {
    // Create admin user (you'll need to set password via better-auth signup)
    await db.insert(schema.user).values({
      id: crypto.randomUUID(),
      name: 'System Administrator',
      email: 'admin@topgan.com',
      emailVerified: true,
      role: 'admin',
      staffId: 'ADMIN001',
      department: 'management',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}