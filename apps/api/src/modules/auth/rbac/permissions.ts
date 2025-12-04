/**
 * Permission Definitions
 * Granular permissions for RBAC system
 * Each permission represents a specific action on a resource
 */
export enum Permission {
  // ============================
  // Organisation Permissions
  // ============================
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  ORG_SETTINGS = 'org:settings',

  // ============================
  // User Management Permissions
  // ============================
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_INVITE = 'users:invite',

  // ============================
  // Member Management Permissions
  // ============================
  MEMBERS_READ = 'members:read',
  MEMBERS_CREATE = 'members:create',
  MEMBERS_UPDATE = 'members:update',
  MEMBERS_DELETE = 'members:delete',
  MEMBERS_ROLES = 'members:roles',

  // ============================
  // Finance Permissions
  // ============================
  INVOICES_READ = 'invoices:read',
  INVOICES_CREATE = 'invoices:create',
  INVOICES_UPDATE = 'invoices:update',
  INVOICES_DELETE = 'invoices:delete',
  INVOICES_APPROVE = 'invoices:approve',

  EXPENSES_READ = 'expenses:read',
  EXPENSES_CREATE = 'expenses:create',
  EXPENSES_UPDATE = 'expenses:update',
  EXPENSES_DELETE = 'expenses:delete',
  EXPENSES_APPROVE = 'expenses:approve',

  PAYMENTS_READ = 'payments:read',
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_UPDATE = 'payments:update',
  PAYMENTS_DELETE = 'payments:delete',

  BANKING_READ = 'banking:read',
  BANKING_CREATE = 'banking:create',
  BANKING_UPDATE = 'banking:update',
  BANKING_DELETE = 'banking:delete',

  // ============================
  // Cost Tracking Permissions
  // ============================
  COSTS_READ = 'costs:read',
  COSTS_CREATE = 'costs:create',

  // ============================
  // HR Permissions
  // ============================
  EMPLOYEES_READ = 'employees:read',
  EMPLOYEES_CREATE = 'employees:create',
  EMPLOYEES_UPDATE = 'employees:update',
  EMPLOYEES_DELETE = 'employees:delete',

  PAYROLL_READ = 'payroll:read',
  PAYROLL_CREATE = 'payroll:create',
  PAYROLL_UPDATE = 'payroll:update',
  PAYROLL_DELETE = 'payroll:delete',
  PAYROLL_APPROVE = 'payroll:approve',

  LEAVE_READ = 'leave:read',
  LEAVE_CREATE = 'leave:create',
  LEAVE_UPDATE = 'leave:update',
  LEAVE_DELETE = 'leave:delete',
  LEAVE_APPROVE = 'leave:approve',

  // ============================
  // Document Management Permissions
  // ============================
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_CREATE = 'documents:create',
  DOCUMENTS_UPDATE = 'documents:update',
  DOCUMENTS_DELETE = 'documents:delete',

  // ============================
  // Tax Permissions
  // ============================
  TAX_READ = 'tax:read',
  TAX_CREATE = 'tax:create',
  TAX_UPDATE = 'tax:update',
  TAX_DELETE = 'tax:delete',
  TAX_SUBMIT = 'tax:submit',
  TAX_REPORTS = 'tax:reports',

  // ============================
  // Reports & Analytics Permissions
  // ============================
  REPORTS_READ = 'reports:read',
  REPORTS_CREATE = 'reports:create',
  REPORTS_EXPORT = 'reports:export',
  ANALYTICS_VIEW = 'analytics:view',

  // ============================
  // Audit & Compliance Permissions
  // ============================
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_MANAGE = 'compliance:manage',

  // ============================
  // Settings Permissions
  // ============================
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // ============================
  // Admin Permissions
  // ============================
  ADMIN_FULL = 'admin:full', // Wildcard - grants all permissions
}

/**
 * Permission metadata
 * Provides human-readable descriptions for each permission
 */
export const PermissionMetadata: Record<
  Permission,
  {
    name: string;
    description: string;
    category: string;
  }
> = {
  // Organisation
  [Permission.ORG_READ]: {
    name: 'Read Organisation',
    description: 'View organisation details',
    category: 'Organisation',
  },
  [Permission.ORG_UPDATE]: {
    name: 'Update Organisation',
    description: 'Edit organisation details',
    category: 'Organisation',
  },
  [Permission.ORG_DELETE]: {
    name: 'Delete Organisation',
    description: 'Delete organisation (permanent)',
    category: 'Organisation',
  },
  [Permission.ORG_SETTINGS]: {
    name: 'Manage Organisation Settings',
    description: 'Configure organisation settings',
    category: 'Organisation',
  },

  // Users
  [Permission.USERS_READ]: {
    name: 'Read Users',
    description: 'View user list and details',
    category: 'Users',
  },
  [Permission.USERS_CREATE]: {
    name: 'Create Users',
    description: 'Create new users',
    category: 'Users',
  },
  [Permission.USERS_UPDATE]: {
    name: 'Update Users',
    description: 'Edit user details',
    category: 'Users',
  },
  [Permission.USERS_DELETE]: {
    name: 'Delete Users',
    description: 'Delete users',
    category: 'Users',
  },
  [Permission.USERS_INVITE]: {
    name: 'Invite Users',
    description: 'Send user invitations',
    category: 'Users',
  },

  // Members
  [Permission.MEMBERS_READ]: {
    name: 'Read Members',
    description: 'View organisation members',
    category: 'Members',
  },
  [Permission.MEMBERS_CREATE]: {
    name: 'Create Members',
    description: 'Add new members to organisation',
    category: 'Members',
  },
  [Permission.MEMBERS_UPDATE]: {
    name: 'Update Members',
    description: 'Edit member details',
    category: 'Members',
  },
  [Permission.MEMBERS_DELETE]: {
    name: 'Delete Members',
    description: 'Remove members from organisation',
    category: 'Members',
  },
  [Permission.MEMBERS_ROLES]: {
    name: 'Manage Member Roles',
    description: 'Assign and change member roles',
    category: 'Members',
  },

  // Invoices
  [Permission.INVOICES_READ]: {
    name: 'Read Invoices',
    description: 'View invoices',
    category: 'Finance',
  },
  [Permission.INVOICES_CREATE]: {
    name: 'Create Invoices',
    description: 'Create new invoices',
    category: 'Finance',
  },
  [Permission.INVOICES_UPDATE]: {
    name: 'Update Invoices',
    description: 'Edit invoices',
    category: 'Finance',
  },
  [Permission.INVOICES_DELETE]: {
    name: 'Delete Invoices',
    description: 'Delete invoices',
    category: 'Finance',
  },
  [Permission.INVOICES_APPROVE]: {
    name: 'Approve Invoices',
    description: 'Approve invoices for payment',
    category: 'Finance',
  },

  // Expenses
  [Permission.EXPENSES_READ]: {
    name: 'Read Expenses',
    description: 'View expenses',
    category: 'Finance',
  },
  [Permission.EXPENSES_CREATE]: {
    name: 'Create Expenses',
    description: 'Create expense reports',
    category: 'Finance',
  },
  [Permission.EXPENSES_UPDATE]: {
    name: 'Update Expenses',
    description: 'Edit expenses',
    category: 'Finance',
  },
  [Permission.EXPENSES_DELETE]: {
    name: 'Delete Expenses',
    description: 'Delete expenses',
    category: 'Finance',
  },
  [Permission.EXPENSES_APPROVE]: {
    name: 'Approve Expenses',
    description: 'Approve expense reimbursements',
    category: 'Finance',
  },

  // Payments
  [Permission.PAYMENTS_READ]: {
    name: 'Read Payments',
    description: 'View payments',
    category: 'Finance',
  },
  [Permission.PAYMENTS_CREATE]: {
    name: 'Create Payments',
    description: 'Process payments',
    category: 'Finance',
  },
  [Permission.PAYMENTS_UPDATE]: {
    name: 'Update Payments',
    description: 'Edit payment records',
    category: 'Finance',
  },
  [Permission.PAYMENTS_DELETE]: {
    name: 'Delete Payments',
    description: 'Delete payment records',
    category: 'Finance',
  },

  // Banking
  [Permission.BANKING_READ]: {
    name: 'Read Banking',
    description: 'View bank accounts and transactions',
    category: 'Finance',
  },
  [Permission.BANKING_CREATE]: {
    name: 'Create Banking',
    description: 'Add bank accounts',
    category: 'Finance',
  },
  [Permission.BANKING_UPDATE]: {
    name: 'Update Banking',
    description: 'Edit bank accounts and transactions',
    category: 'Finance',
  },
  [Permission.BANKING_DELETE]: {
    name: 'Delete Banking',
    description: 'Delete bank accounts',
    category: 'Finance',
  },

  // Costs
  [Permission.COSTS_READ]: {
    name: 'Read Costs',
    description: 'View cost tracking data and reports',
    category: 'Finance',
  },
  [Permission.COSTS_CREATE]: {
    name: 'Create Costs',
    description: 'Record cost entries',
    category: 'Finance',
  },

  // Employees
  [Permission.EMPLOYEES_READ]: {
    name: 'Read Employees',
    description: 'View employee records',
    category: 'HR',
  },
  [Permission.EMPLOYEES_CREATE]: {
    name: 'Create Employees',
    description: 'Add new employees',
    category: 'HR',
  },
  [Permission.EMPLOYEES_UPDATE]: {
    name: 'Update Employees',
    description: 'Edit employee records',
    category: 'HR',
  },
  [Permission.EMPLOYEES_DELETE]: {
    name: 'Delete Employees',
    description: 'Remove employee records',
    category: 'HR',
  },

  // Payroll
  [Permission.PAYROLL_READ]: {
    name: 'Read Payroll',
    description: 'View payroll data',
    category: 'HR',
  },
  [Permission.PAYROLL_CREATE]: {
    name: 'Create Payroll',
    description: 'Generate payroll',
    category: 'HR',
  },
  [Permission.PAYROLL_UPDATE]: {
    name: 'Update Payroll',
    description: 'Edit payroll records',
    category: 'HR',
  },
  [Permission.PAYROLL_DELETE]: {
    name: 'Delete Payroll',
    description: 'Delete payroll records',
    category: 'HR',
  },
  [Permission.PAYROLL_APPROVE]: {
    name: 'Approve Payroll',
    description: 'Approve payroll for processing',
    category: 'HR',
  },

  // Leave
  [Permission.LEAVE_READ]: {
    name: 'Read Leave',
    description: 'View leave requests',
    category: 'HR',
  },
  [Permission.LEAVE_CREATE]: {
    name: 'Create Leave',
    description: 'Submit leave requests',
    category: 'HR',
  },
  [Permission.LEAVE_UPDATE]: {
    name: 'Update Leave',
    description: 'Edit leave requests',
    category: 'HR',
  },
  [Permission.LEAVE_DELETE]: {
    name: 'Delete Leave',
    description: 'Delete leave requests',
    category: 'HR',
  },
  [Permission.LEAVE_APPROVE]: {
    name: 'Approve Leave',
    description: 'Approve/reject leave requests',
    category: 'HR',
  },

  // Documents
  [Permission.DOCUMENTS_READ]: {
    name: 'Read Documents',
    description: 'View documents and folders',
    category: 'Documents',
  },
  [Permission.DOCUMENTS_CREATE]: {
    name: 'Create Documents',
    description: 'Upload new documents',
    category: 'Documents',
  },
  [Permission.DOCUMENTS_UPDATE]: {
    name: 'Update Documents',
    description: 'Edit document metadata',
    category: 'Documents',
  },
  [Permission.DOCUMENTS_DELETE]: {
    name: 'Delete Documents',
    description: 'Delete documents and folders',
    category: 'Documents',
  },

  // Tax
  [Permission.TAX_READ]: {
    name: 'Read Tax',
    description: 'View tax records',
    category: 'Tax',
  },
  [Permission.TAX_CREATE]: {
    name: 'Create Tax',
    description: 'Create tax records',
    category: 'Tax',
  },
  [Permission.TAX_UPDATE]: {
    name: 'Update Tax',
    description: 'Edit tax records',
    category: 'Tax',
  },
  [Permission.TAX_DELETE]: {
    name: 'Delete Tax',
    description: 'Delete tax records',
    category: 'Tax',
  },
  [Permission.TAX_SUBMIT]: {
    name: 'Submit Tax',
    description: 'Submit tax filings to authorities',
    category: 'Tax',
  },
  [Permission.TAX_REPORTS]: {
    name: 'Tax Reports',
    description: 'Generate tax reports',
    category: 'Tax',
  },

  // Reports
  [Permission.REPORTS_READ]: {
    name: 'Read Reports',
    description: 'View reports',
    category: 'Reports',
  },
  [Permission.REPORTS_CREATE]: {
    name: 'Create Reports',
    description: 'Generate custom reports',
    category: 'Reports',
  },
  [Permission.REPORTS_EXPORT]: {
    name: 'Export Reports',
    description: 'Export reports to various formats',
    category: 'Reports',
  },
  [Permission.ANALYTICS_VIEW]: {
    name: 'View Analytics',
    description: 'Access analytics dashboards',
    category: 'Reports',
  },

  // Audit
  [Permission.AUDIT_READ]: {
    name: 'Read Audit Logs',
    description: 'View audit trail',
    category: 'Audit',
  },
  [Permission.AUDIT_EXPORT]: {
    name: 'Export Audit Logs',
    description: 'Export audit logs',
    category: 'Audit',
  },
  [Permission.COMPLIANCE_VIEW]: {
    name: 'View Compliance',
    description: 'View compliance status',
    category: 'Audit',
  },
  [Permission.COMPLIANCE_MANAGE]: {
    name: 'Manage Compliance',
    description: 'Manage compliance settings',
    category: 'Audit',
  },

  // Settings
  [Permission.SETTINGS_READ]: {
    name: 'Read Settings',
    description: 'View system settings',
    category: 'Settings',
  },
  [Permission.SETTINGS_UPDATE]: {
    name: 'Update Settings',
    description: 'Modify system settings',
    category: 'Settings',
  },

  // Admin
  [Permission.ADMIN_FULL]: {
    name: 'Full Admin Access',
    description: 'Complete administrative access',
    category: 'Admin',
  },
};

/**
 * Helper function to get all permissions in a category
 */
export function getPermissionsByCategory(category: string): Permission[] {
  return Object.entries(PermissionMetadata)
    .filter(([_, meta]) => meta.category === category)
    .map(([permission, _]) => permission as Permission);
}

/**
 * Helper function to check if a permission belongs to a category
 */
export function isPermissionInCategory(
  permission: Permission,
  category: string,
): boolean {
  return PermissionMetadata[permission].category === category;
}
