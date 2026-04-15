import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// --- BETTER AUTH CORE TABLES ---
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  role: text('role').default('staff'),
  staffId: text('staff_id').unique(),
  phone: text('phone'),
  department: text('department'),
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

// --- HOTEL BUSINESS TABLES ---
export const rooms = sqliteTable('rooms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomNumber: text('room_number').notNull().unique(),
  status: text('status').notNull().default('vacant'),
  rate: real('rate').notNull(),
  lastCleaned: integer('last_cleaned', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomId: integer('room_id').references(() => rooms.id),
  guestName: text('guest_name').notNull(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  checkIn: integer('check_in', { mode: 'timestamp' }).notNull(),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  auditDate: integer('audit_date', { mode: 'timestamp' }).notNull(),
  physicalOccupancy: integer('physical_occupancy').notNull(),
  systemBookings: integer('system_bookings').notNull(),
  discrepancy: integer('discrepancy').notNull(),
  flags: text('flags'),
  totalCash: real('total_cash'),
  totalPos: real('total_pos'),
  totalTransfer: real('total_transfer'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  openingStock: real('opening_stock').default(0),
  additions: real('additions').default(0),
  sales: real('sales').default(0),
  closingStock: real('closing_stock').default(0),
  physicalCount: real('physical_count'),
  variance: real('variance'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: integer('item_id').references(() => inventory.id),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const powerLogs = sqliteTable('power_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  generatorStart: integer('generator_start', { mode: 'timestamp' }).notNull(),
  generatorStop: integer('generator_stop', { mode: 'timestamp' }).notNull(),
  fuelLevelStart: real('fuel_level_start').notNull(),
  fuelLevelEnd: real('fuel_level_end').notNull(),
  fuelConsumed: real('fuel_consumed').notNull(),
  hoursRun: real('hours_run').notNull(),
  efficiency: real('efficiency'),
  flagged: integer('flagged').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const staffRoles = sqliteTable('staff_roles', {
  id: text('id').primaryKey(),
  roleName: text('role_name').notNull().unique(),
  permissions: text('permissions', { mode: 'json' }).$type<string[]>(),
  level: integer('level').default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});

export const auditTrail = sqliteTable('audit_trail', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  oldValues: text('old_values', { mode: 'json' }),
  newValues: text('new_values', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});

export const staffActivity = sqliteTable('staff_activity', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  checkIn: integer('check_in', { mode: 'timestamp' }),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  shiftType: text('shift_type'),
  hoursWorked: integer('hours_worked'),
  location: text('location'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});

export const loginHistory = sqliteTable('login_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  loginTime: integer('login_time', { mode: 'timestamp' }).$default(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).default(true),
  failureReason: text('failure_reason'),
});

// --- RELATIONS ---
export const roomsRelations = relations(rooms, ({ many }) => ({
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  room: one(rooms, {
    fields: [transactions.roomId],
    references: [rooms.id]
  })
}));

// --- CONSOLIDATED EXPORT ---
// This object is what Better Auth and Drizzle use to map the models
export const schema = {
  user,
  session,
  account,
  verification,
  rooms,
  transactions,
  auditLogs,
  inventory,
  inventoryMovements,
  powerLogs,
  staffRoles,
  auditTrail,
  staffActivity,
  loginHistory,
  roomsRelations,
  transactionsRelations
};