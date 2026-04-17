export type UserRole = 
  | 'owner'
  | 'super_admin'
  | 'general_manager'
  | 'front_desk_manager'
  | 'store_keeper'
  | 'store_keeper_bar'
  | 'store_keeper_kitchen'
  | 'store_keeper_store'
  | 'cleaner'
  | 'staff';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage' | 'view_own')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    { resource: '*', actions: ['manage'] }
  ],
  super_admin: [
    { resource: '*', actions: ['manage'] }
  ],
  general_manager: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'reports', actions: ['read', 'view_own'] },
    { resource: 'audit', actions: ['read', 'create'] },
    { resource: 'rooms', actions: ['read', 'update'] },
    { resource: 'staff', actions: ['read', 'update'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'power_logs', actions: ['read'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  front_desk_manager: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'rooms', actions: ['read', 'update'] },
    { resource: 'transactions', actions: ['create', 'read', 'update'] },
    { resource: 'checkin_checkout', actions: ['manage'] },
    { resource: 'guests', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['view_own'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  store_keeper: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update'] },
    { resource: 'bar', actions: ['manage'] },
    { resource: 'kitchen', actions: ['manage'] },
    { resource: 'store', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  store_keeper_bar: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'bar', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  store_keeper_kitchen: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'kitchen', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  store_keeper_store: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'store', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] },
    { resource: 'time_tracking', actions: ['create', 'read'] }
  ],
  cleaner: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'time_tracking', actions: ['create', 'read'] },
    { resource: 'rooms', actions: ['read'] },
    { resource: 'my_profile', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  staff: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'time_tracking', actions: ['create', 'read'] },
    { resource: 'my_profile', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['view_own'] }
  ]
};

// Helper functions
export function canManageRoom(role: string): boolean {
  return ['owner', 'super_admin'].includes(role);
}

export function canManageFrontDesk(role: string): boolean {
  return ['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(role);
}

export function canToggleRoomMaintenance(role: string): boolean {
  return ['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(role);
}

export function canDisableRoom(role: string): boolean {
  return ['owner', 'super_admin'].includes(role);
}

export function requiresTimeTracking(role: string): boolean {
  return !['owner', 'super_admin'].includes(role);
}

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  return permissions.some(perm => 
    perm.resource === '*' || 
    (perm.resource === resource && perm.actions.includes(action as any))
  );
}