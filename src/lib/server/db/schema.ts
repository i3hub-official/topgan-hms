import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Auth tables for better-auth
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').default('auditor'), // admin, auditor, owner
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date())
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

// Core business tables
export const rooms = sqliteTable('rooms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomNumber: text('room_number').notNull().unique(),
  status: text('status').notNull().default('vacant'), // vacant, occupied, dirty, maintenance
  rate: real('rate').notNull(),
  lastCleaned: integer('last_cleaned', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomId: integer('room_id').references(() => rooms.id),
  guestName: text('guest_name').notNull(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // cash, pos, transfer
  checkIn: integer('check_in', { mode: 'timestamp' }).notNull(),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'), // active, checked_out, cancelled
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  auditDate: integer('audit_date', { mode: 'timestamp' }).notNull(),
  physicalOccupancy: integer('physical_occupancy').notNull(),
  systemBookings: integer('system_bookings').notNull(),
  discrepancy: integer('discrepancy').notNull(),
  flags: text('flags'), // JSON array of flags
  totalCash: real('total_cash'),
  totalPos: real('total_pos'),
  totalTransfer: real('total_transfer'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(), // bar, store, kitchen
  unit: text('unit').notNull(), // bottle, kg, piece
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
  type: text('type').notNull(), // addition, sale, adjustment
  quantity: real('quantity').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const powerLogs = sqliteTable('power_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  generatorStart: integer('generator_start', { mode: 'timestamp' }).notNull(),
  generatorStop: integer('generator_stop', { mode: 'timestamp' }).notNull(),
  fuelLevelStart: real('fuel_level_start').notNull(), // in liters or cm
  fuelLevelEnd: real('fuel_level_end').notNull(),
  fuelConsumed: real('fuel_consumed').notNull(),
  hoursRun: real('hours_run').notNull(),
  efficiency: real('efficiency'), // liters per hour
  flagged: integer('flagged').default(0), // 1 if efficiency abnormal
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  room: one(rooms, {
    fields: [transactions.roomId],
    references: [rooms.id]
  })
}));

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  providerId: text('provider_id').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});