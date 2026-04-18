import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// SQLite doesn't have native enums, so we'll use text with checks
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomNumber: text('room_number').notNull().unique(),
  status: text('status', { enum: ['vacant', 'occupied', 'dirty', 'maintenance'] }).notNull().default('vacant'),
  ratePerNight: real('rate_per_night').notNull(),
  lastCleaned: integer('last_cleaned', { mode: 'timestamp' }),
  floor: integer('floor').notNull().default(1),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text('room_id').references(() => rooms.id),
  guestName: text('guest_name').notNull(),
  amountPaid: real('amount_paid').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'pos', 'transfer', 'complimentary'] }).notNull(),
  checkIn: integer('check_in', { mode: 'timestamp' }).notNull(),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  receiptNumber: text('receipt_number').unique(),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  auditDate: integer('audit_date', { mode: 'timestamp' }).notNull(),
  physicalCount: integer('physical_count').notNull(),
  systemCount: integer('system_count').notNull(),
  discrepancy: integer('discrepancy').notNull(),
  flagged: text('flagged', { mode: 'json' }).$type<string[]>(), // Store as JSON array
  auditedBy: text('audited_by').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  openingStock: real('opening_stock').notNull(),
  currentStock: real('current_stock').notNull(),
  reorderLevel: real('reorder_level').default(5),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text('item_id').references(() => inventoryItems.id),
  type: text('type', { enum: ['sale', 'restock', 'variance'] }).notNull(),
  quantity: real('quantity').notNull(),
  physicalCount: real('physical_count'),
  variance: real('variance'),
  recordedBy: text('recorded_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const powerLogs = sqliteTable('power_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  generatorId: text('generator_id').notNull().default('GEN-01'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  stopTime: integer('stop_time', { mode: 'timestamp' }),
  fuelAtStart: real('fuel_at_start'),
  fuelAtStop: real('fuel_at_stop'),
  fuelConsumed: real('fuel_consumed'),
  hoursRun: real('hours_run'),
  litersPerHour: real('liters_per_hour'),
  flagged: text('flagged'),
  recordedBy: text('recorded_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

