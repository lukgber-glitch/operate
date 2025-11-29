import { Permission } from './permissions';

/**
 * Role Enum
 * Matches Prisma schema Role enum
 */
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * Role Hierarchy
 * Higher index = more powerful role
 * Used for role comparison operations
 */
export const ROLE_HIERARCHY: Role[] = [
  Role.VIEWER,
  Role.MEMBER,
  Role.MANAGER,
  Role.ADMIN,
  Role.OWNER,
];

/**
 * Role Permissions Mapping
 * Defines which permissions each role has
 *
 * Permission Inheritance:
 * - OWNER: Full access including org deletion
 * - ADMIN: Full access except org deletion
 * - MANAGER: Team management, approvals, and finance operations
 * - MEMBER: Standard CRUD operations, own resources
 * - VIEWER: Read-only access
 */
export const RolePermissions: Record<Role, Permission[]> = {
  /**
   * OWNER Role
   * - Full administrative access
   * - Can delete organisation
   * - Typically the organisation creator/founder
   */
  [Role.OWNER]: [Permission.ADMIN_FULL],

  /**
   * ADMIN Role
   * - Full access to all features
   * - Cannot delete organisation
   * - Can manage all resources and users
   */
  [Role.ADMIN]: [
    // Organisation
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_SETTINGS,

    // Users & Members
    Permission.USERS_READ,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.USERS_INVITE,
    Permission.MEMBERS_READ,
    Permission.MEMBERS_CREATE,
    Permission.MEMBERS_UPDATE,
    Permission.MEMBERS_DELETE,
    Permission.MEMBERS_ROLES,

    // Finance - Full Access
    Permission.INVOICES_READ,
    Permission.INVOICES_CREATE,
    Permission.INVOICES_UPDATE,
    Permission.INVOICES_DELETE,
    Permission.INVOICES_APPROVE,
    Permission.EXPENSES_READ,
    Permission.EXPENSES_CREATE,
    Permission.EXPENSES_UPDATE,
    Permission.EXPENSES_DELETE,
    Permission.EXPENSES_APPROVE,
    Permission.PAYMENTS_READ,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_UPDATE,
    Permission.PAYMENTS_DELETE,

    // HR - Full Access
    Permission.EMPLOYEES_READ,
    Permission.EMPLOYEES_CREATE,
    Permission.EMPLOYEES_UPDATE,
    Permission.EMPLOYEES_DELETE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_CREATE,
    Permission.PAYROLL_UPDATE,
    Permission.PAYROLL_DELETE,
    Permission.PAYROLL_APPROVE,
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_UPDATE,
    Permission.LEAVE_DELETE,
    Permission.LEAVE_APPROVE,

    // Tax - Full Access
    Permission.TAX_READ,
    Permission.TAX_CREATE,
    Permission.TAX_UPDATE,
    Permission.TAX_DELETE,
    Permission.TAX_SUBMIT,
    Permission.TAX_REPORTS,

    // Reports & Analytics
    Permission.REPORTS_READ,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,
    Permission.ANALYTICS_VIEW,

    // Audit & Compliance
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_MANAGE,

    // Settings
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
  ],

  /**
   * MANAGER Role
   * - Team management capabilities
   * - Approve requests (expenses, leave, invoices)
   * - Finance and HR operations
   * - Cannot modify organisation settings or delete users
   */
  [Role.MANAGER]: [
    // Organisation - Read only
    Permission.ORG_READ,

    // Users & Members - Read and basic management
    Permission.USERS_READ,
    Permission.USERS_INVITE,
    Permission.MEMBERS_READ,
    Permission.MEMBERS_CREATE,
    Permission.MEMBERS_UPDATE,

    // Finance - CRUD and Approvals
    Permission.INVOICES_READ,
    Permission.INVOICES_CREATE,
    Permission.INVOICES_UPDATE,
    Permission.INVOICES_DELETE,
    Permission.INVOICES_APPROVE,
    Permission.EXPENSES_READ,
    Permission.EXPENSES_CREATE,
    Permission.EXPENSES_UPDATE,
    Permission.EXPENSES_DELETE,
    Permission.EXPENSES_APPROVE,
    Permission.PAYMENTS_READ,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_UPDATE,

    // HR - Full CRUD and Approvals
    Permission.EMPLOYEES_READ,
    Permission.EMPLOYEES_CREATE,
    Permission.EMPLOYEES_UPDATE,
    Permission.EMPLOYEES_DELETE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_CREATE,
    Permission.PAYROLL_UPDATE,
    Permission.PAYROLL_APPROVE,
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_UPDATE,
    Permission.LEAVE_DELETE,
    Permission.LEAVE_APPROVE,

    // Tax - Read and Update
    Permission.TAX_READ,
    Permission.TAX_CREATE,
    Permission.TAX_UPDATE,
    Permission.TAX_REPORTS,

    // Reports & Analytics
    Permission.REPORTS_READ,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,
    Permission.ANALYTICS_VIEW,

    // Audit - Read only
    Permission.AUDIT_READ,
    Permission.COMPLIANCE_VIEW,

    // Settings - Read only
    Permission.SETTINGS_READ,
  ],

  /**
   * MEMBER Role
   * - Standard user with CRUD access
   * - Can create and manage own resources
   * - Cannot approve requests or manage users
   * - Cannot access sensitive data (payroll, tax submissions)
   */
  [Role.MEMBER]: [
    // Organisation - Read only
    Permission.ORG_READ,

    // Users & Members - Read only
    Permission.USERS_READ,
    Permission.MEMBERS_READ,

    // Finance - Basic CRUD (no approvals)
    Permission.INVOICES_READ,
    Permission.INVOICES_CREATE,
    Permission.INVOICES_UPDATE,
    Permission.EXPENSES_READ,
    Permission.EXPENSES_CREATE,
    Permission.EXPENSES_UPDATE,
    Permission.PAYMENTS_READ,

    // HR - Limited access
    Permission.EMPLOYEES_READ,
    Permission.LEAVE_READ,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_UPDATE,

    // Tax - Read only
    Permission.TAX_READ,

    // Reports - Read and create
    Permission.REPORTS_READ,
    Permission.REPORTS_CREATE,
    Permission.ANALYTICS_VIEW,

    // Settings - Read only
    Permission.SETTINGS_READ,
  ],

  /**
   * VIEWER Role
   * - Read-only access to most resources
   * - Cannot create, update, or delete anything
   * - Useful for auditors, accountants, stakeholders
   */
  [Role.VIEWER]: [
    // Organisation - Read only
    Permission.ORG_READ,

    // Users & Members - Read only
    Permission.USERS_READ,
    Permission.MEMBERS_READ,

    // Finance - Read only
    Permission.INVOICES_READ,
    Permission.EXPENSES_READ,
    Permission.PAYMENTS_READ,

    // HR - Limited read access (no payroll)
    Permission.EMPLOYEES_READ,
    Permission.LEAVE_READ,

    // Tax - Read only
    Permission.TAX_READ,

    // Reports - Read only
    Permission.REPORTS_READ,
    Permission.ANALYTICS_VIEW,

    // Audit - Read only
    Permission.AUDIT_READ,
    Permission.COMPLIANCE_VIEW,

    // Settings - Read only
    Permission.SETTINGS_READ,
  ],
};

/**
 * Helper function to get all permissions for a role
 * Handles the ADMIN_FULL wildcard permission
 */
export function getPermissionsForRole(role: Role): Permission[] {
  const permissions = RolePermissions[role];

  // If role has ADMIN_FULL, return all permissions
  if (permissions.includes(Permission.ADMIN_FULL)) {
    return Object.values(Permission);
  }

  return permissions;
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Check if a role is higher or equal to another role in hierarchy
 */
export function isRoleHigherOrEqual(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  return userIndex >= requiredIndex;
}

/**
 * Get the hierarchical level of a role (0 = lowest, 4 = highest)
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Role metadata for display purposes
 */
export const RoleMetadata: Record<
  Role,
  {
    name: string;
    description: string;
    level: number;
  }
> = {
  [Role.OWNER]: {
    name: 'Owner',
    description: 'Full access including organisation deletion',
    level: 4,
  },
  [Role.ADMIN]: {
    name: 'Administrator',
    description: 'Full access except organisation deletion',
    level: 3,
  },
  [Role.MANAGER]: {
    name: 'Manager',
    description: 'Team management and approvals',
    level: 2,
  },
  [Role.MEMBER]: {
    name: 'Member',
    description: 'Standard user access',
    level: 1,
  },
  [Role.VIEWER]: {
    name: 'Viewer',
    description: 'Read-only access',
    level: 0,
  },
};
