// If you see this file, you have not run the auth:schema script yet, but you should!
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Better-Auth core tables
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  role: text('role').default('staff'), // admin, manager, staff, auditor
  staffId: text('staff_id').unique(),
  phone: text('phone'),
  department: text('department'), // frontdesk, housekeeping, maintenance, management
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastLogin: integer('last_login', { mode: 'timestamp' }),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Extended tables for hotel management
export const staffRoles = sqliteTable('staff_roles', {
  id: text('id').primaryKey(),
  roleName: text('role_name').notNull().unique(), // admin, manager, frontdesk, housekeeper, auditor
  permissions: text('permissions', { mode: 'json' }).$type<string[]>(), // Array of permissions
  level: integer('level').default(1), // 1-10, higher = more access
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditTrail = sqliteTable('audit_trail', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, AUDIT_RUN
  entityType: text('entity_type'), // room, transaction, inventory, user, audit
  entityId: text('entity_id'),
  oldValues: text('old_values', { mode: 'json' }),
  newValues: text('new_values', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const staffActivity = sqliteTable('staff_activity', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  checkIn: integer('check_in', { mode: 'timestamp' }),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  shiftType: text('shift_type'), // morning, afternoon, night
  hoursWorked: integer('hours_worked'),
  location: text('location'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const loginHistory = sqliteTable('login_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  loginTime: integer('login_time', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).default(true),
  failureReason: text('failure_reason'),
});
