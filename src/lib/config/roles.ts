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
    { resource: '*', actions: ['manage'] } // Full access
  ],
  super_admin: [
    { resource: '*', actions: ['manage'] } // Full access except owner-only
  ],
  general_manager: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'reports', actions: ['read', 'view_own'] },
    { resource: 'audit', actions: ['read', 'create'] },
    { resource: 'rooms', actions: ['read'] }, // View only
    { resource: 'staff', actions: ['read', 'update'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'power_logs', actions: ['read'] }
  ],
  front_desk_manager: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'rooms', actions: ['read'] }, // View only
    { resource: 'transactions', actions: ['create', 'read', 'update'] },
    { resource: 'checkin_checkout', actions: ['manage'] },
    { resource: 'guests', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  store_keeper: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update'] },
    { resource: 'bar', actions: ['manage'] },
    { resource: 'kitchen', actions: ['manage'] },
    { resource: 'store', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  store_keeper_bar: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'bar', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  store_keeper_kitchen: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'kitchen', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  store_keeper_store: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'inventory', actions: ['read', 'update'] },
    { resource: 'store', actions: ['manage'] },
    { resource: 'reports', actions: ['view_own'] }
  ],
  cleaner: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'time_tracking', actions: ['create', 'read'] },
    { resource: 'rooms', actions: ['read'] }, // View only for cleaning schedule
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

export function canManageRoom(userRole: UserRole): boolean {
  return ['owner', 'super_admin'].includes(userRole);
}

export function canViewRoom(userRole: UserRole): boolean {
  return true; // All authenticated users can view rooms
}

export function getStoreSections(userRole: UserRole): string[] {
  switch(userRole) {
    case 'store_keeper':
      return ['bar', 'kitchen', 'store'];
    case 'store_keeper_bar':
      return ['bar'];
    case 'store_keeper_kitchen':
      return ['kitchen'];
    case 'store_keeper_store':
      return ['store'];
    default:
      return [];
  }
}