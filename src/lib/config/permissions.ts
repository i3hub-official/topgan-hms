// Available permissions for the system
export const availablePermissions = [
  { id: 'dashboard', label: 'Dashboard Access', category: 'Core' },
  { id: 'rooms', label: 'View Rooms', category: 'Rooms' },
  { id: 'rooms_create', label: 'Create Rooms', category: 'Rooms' },
  { id: 'rooms_update', label: 'Update Rooms', category: 'Rooms' },
  { id: 'rooms_delete', label: 'Delete Rooms', category: 'Rooms' },
  { id: 'inventory', label: 'View Inventory', category: 'Inventory' },
  { id: 'inventory_create', label: 'Create Inventory', category: 'Inventory' },
  { id: 'inventory_update', label: 'Update Inventory', category: 'Inventory' },
  { id: 'inventory_delete', label: 'Delete Inventory', category: 'Inventory' },
  { id: 'suppliers', label: 'View Suppliers', category: 'Suppliers' },
  { id: 'suppliers_create', label: 'Create Suppliers', category: 'Suppliers' },
  { id: 'suppliers_update', label: 'Update Suppliers', category: 'Suppliers' },
  { id: 'suppliers_delete', label: 'Delete Suppliers', category: 'Suppliers' },
  { id: 'staff', label: 'View Staff', category: 'Staff' },
  { id: 'staff_create', label: 'Create Staff', category: 'Staff' },
  { id: 'staff_update', label: 'Update Staff', category: 'Staff' },
  { id: 'staff_delete', label: 'Delete Staff', category: 'Staff' },
  { id: 'transactions', label: 'View Transactions', category: 'Finance' },
  { id: 'transactions_create', label: 'Create Transactions', category: 'Finance' },
  { id: 'reports', label: 'View Reports', category: 'Reports' },
  { id: 'audit', label: 'Run Night Audit', category: 'Audit' },
  { id: 'power_logs', label: 'View Power Logs', category: 'Utilities' },
  { id: 'time_tracking', label: 'Time Tracking', category: 'Staff' },
  { id: 'bar_tender', label: 'Bar Management', category: 'Store' },
  { id: 'kitchen', label: 'Kitchen Management', category: 'Store' },
  { id: 'my_profile', label: 'View Own Profile', category: 'Profile' }
];

// Group permissions by category
export function getPermissionsByCategory() {
  return availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);
}