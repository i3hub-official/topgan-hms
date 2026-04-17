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
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
  supplierId: integer('supplier_id').references(() => suppliers.id),
  costPrice: real('cost_price').default(0),
  sellingPrice: real('selling_price').default(0),
  openingStock: real('opening_stock').default(0),
  additions: real('additions').default(0),
  sales: real('sales').default(0),
  closingStock: real('closing_stock').default(0),
  physicalCount: real('physical_count'),
  variance: real('variance'),
  reorderLevel: real('reorder_level').default(10),
  reorderQuantity: real('reorder_quantity').default(50),
  location: text('location'),
  lastOrderDate: integer('last_order_date', { mode: 'timestamp' }),
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

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'supplier' or 'inventory'
  name: text('name').notNull(),
  icon: text('icon').default('📦'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
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

export const staffDetails = sqliteTable('staff_details', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  address: text('address'),
  nextOfKinName: text('next_of_kin_name'),
  nextOfKinPhone: text('next_of_kin_phone'),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  salary: real('salary'),
  dateJoined: integer('date_joined', { mode: 'timestamp' }),
});

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone').notNull(),
  email: text('email'),
  category: text('category'),
  address: text('address'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  orderDate: integer('order_date', { mode: 'timestamp' }).notNull(),
  expectedDelivery: integer('expected_delivery', { mode: 'timestamp' }),
  actualDelivery: integer('actual_delivery', { mode: 'timestamp' }),
  status: text('status').default('pending'),
  totalAmount: real('total_amount').default(0),
  notes: text('notes'),
  createdBy: text('created_by').references(() => user.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
});

export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => purchaseOrders.id),
  itemId: integer('item_id').notNull().references(() => inventory.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  receivedQuantity: real('received_quantity').default(0)
});

export const inventoryUnits = sqliteTable('inventory_units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),           // e.g. "Carton"
  abbreviation: text('abbreviation').notNull(), // e.g. "ctn"
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date())
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

export const userRelations = relations(user, ({ many, one }) => ({
  staffDetails: one(staffDetails, {
    fields: [user.id],
    references: [staffDetails.userId]
  }),
  staffActivity: many(staffActivity),
  auditTrails: many(auditTrail),
  createdPurchaseOrders: many(purchaseOrders, {
    relationName: 'createdBy'
  })
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [inventory.supplierId],
    references: [suppliers.id]
  })
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  inventory: many(inventory),
  purchaseOrders: many(purchaseOrders)
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id]
  }),
  createdByUser: one(user, {
    fields: [purchaseOrders.createdBy],
    references: [user.id],
    relationName: 'createdBy'
  }),
  items: many(purchaseOrderItems)
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  order: one(purchaseOrders, {
    fields: [purchaseOrderItems.orderId],
    references: [purchaseOrders.id]
  }),
  item: one(inventory, {
    fields: [purchaseOrderItems.itemId],
    references: [inventory.id]
  })
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  // Categories can have many inventory items
  // If you want to link categories to inventory items by category name
  // This is a conceptual relation - actual linking would require categoryId in inventory table
  inventoryItems: many(inventory),
  suppliers: many(suppliers)
}));

// Optional: Add categoryId to inventory for proper relation
// export const inventoryWithCategory = sqliteTable('inventory', {
//   ...inventory,
//   categoryId: integer('category_id').references(() => categories.id),
// });

// --- CONSOLIDATED SCHEMA EXPORT ---
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
  staffDetails,
  suppliers,
  categories,
  purchaseOrders,
  purchaseOrderItems,
  inventoryUnits
};