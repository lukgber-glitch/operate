import { Test, TestingModule } from '@nestjs/testing';
import { RbacService, RbacUser } from './rbac.service';
import { Permission } from './permissions';
import { Role } from './roles';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbacService],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Role Hierarchy', () => {
    const ownerUser: RbacUser = {
      userId: '1',
      email: 'owner@test.com',
      orgId: 'org1',
      role: Role.OWNER,
    };

    const adminUser: RbacUser = {
      userId: '2',
      email: 'admin@test.com',
      orgId: 'org1',
      role: Role.ADMIN,
    };

    const managerUser: RbacUser = {
      userId: '3',
      email: 'manager@test.com',
      orgId: 'org1',
      role: Role.MANAGER,
    };

    const memberUser: RbacUser = {
      userId: '4',
      email: 'member@test.com',
      orgId: 'org1',
      role: Role.MEMBER,
    };

    const viewerUser: RbacUser = {
      userId: '5',
      email: 'viewer@test.com',
      orgId: 'org1',
      role: Role.VIEWER,
    };

    describe('OWNER permissions', () => {
      it('should have all permissions including org deletion', () => {
        expect(service.hasPermission(ownerUser, Permission.ORG_DELETE)).toBe(true);
        expect(service.hasPermission(ownerUser, Permission.ORG_UPDATE)).toBe(true);
        expect(service.hasPermission(ownerUser, Permission.INVOICES_CREATE)).toBe(true);
        expect(service.hasPermission(ownerUser, Permission.TAX_SUBMIT)).toBe(true);
      });

      it('should have ADMIN_FULL wildcard permission', () => {
        expect(service.hasPermission(ownerUser, Permission.ADMIN_FULL)).toBe(true);
      });
    });

    describe('ADMIN permissions', () => {
      it('should have full access except org deletion', () => {
        expect(service.hasPermission(adminUser, Permission.ORG_DELETE)).toBe(false);
        expect(service.hasPermission(adminUser, Permission.ORG_UPDATE)).toBe(true);
        expect(service.hasPermission(adminUser, Permission.USERS_DELETE)).toBe(true);
        expect(service.hasPermission(adminUser, Permission.TAX_SUBMIT)).toBe(true);
      });
    });

    describe('MANAGER permissions', () => {
      it('should have approval permissions', () => {
        expect(service.hasPermission(managerUser, Permission.INVOICES_APPROVE)).toBe(true);
        expect(service.hasPermission(managerUser, Permission.EXPENSES_APPROVE)).toBe(true);
        expect(service.hasPermission(managerUser, Permission.LEAVE_APPROVE)).toBe(true);
      });

      it('should not have user deletion permissions', () => {
        expect(service.hasPermission(managerUser, Permission.USERS_DELETE)).toBe(false);
        expect(service.hasPermission(managerUser, Permission.TAX_SUBMIT)).toBe(false);
      });
    });

    describe('MEMBER permissions', () => {
      it('should have basic CRUD permissions', () => {
        expect(service.hasPermission(memberUser, Permission.INVOICES_CREATE)).toBe(true);
        expect(service.hasPermission(memberUser, Permission.EXPENSES_CREATE)).toBe(true);
        expect(service.hasPermission(memberUser, Permission.LEAVE_CREATE)).toBe(true);
      });

      it('should not have approval permissions', () => {
        expect(service.hasPermission(memberUser, Permission.INVOICES_APPROVE)).toBe(false);
        expect(service.hasPermission(memberUser, Permission.EXPENSES_APPROVE)).toBe(false);
      });

      it('should not have delete permissions', () => {
        expect(service.hasPermission(memberUser, Permission.INVOICES_DELETE)).toBe(false);
      });
    });

    describe('VIEWER permissions', () => {
      it('should have only read permissions', () => {
        expect(service.hasPermission(viewerUser, Permission.INVOICES_READ)).toBe(true);
        expect(service.hasPermission(viewerUser, Permission.EXPENSES_READ)).toBe(true);
        expect(service.hasPermission(viewerUser, Permission.EMPLOYEES_READ)).toBe(true);
      });

      it('should not have create permissions', () => {
        expect(service.hasPermission(viewerUser, Permission.INVOICES_CREATE)).toBe(false);
        expect(service.hasPermission(viewerUser, Permission.EXPENSES_CREATE)).toBe(false);
      });

      it('should not have payroll access', () => {
        expect(service.hasPermission(viewerUser, Permission.PAYROLL_READ)).toBe(false);
      });
    });
  });

  describe('hasAnyPermission', () => {
    const memberUser: RbacUser = {
      userId: '1',
      email: 'member@test.com',
      orgId: 'org1',
      role: Role.MEMBER,
    };

    it('should return true if user has at least one permission', () => {
      const result = service.hasAnyPermission(memberUser, [
        Permission.INVOICES_CREATE,
        Permission.INVOICES_APPROVE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      const result = service.hasAnyPermission(memberUser, [
        Permission.INVOICES_APPROVE,
        Permission.TAX_SUBMIT,
      ]);
      expect(result).toBe(false);
    });

    it('should return true if permissions array is empty', () => {
      const result = service.hasAnyPermission(memberUser, []);
      expect(result).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    const adminUser: RbacUser = {
      userId: '1',
      email: 'admin@test.com',
      orgId: 'org1',
      role: Role.ADMIN,
    };

    it('should return true if user has all permissions', () => {
      const result = service.hasAllPermissions(adminUser, [
        Permission.INVOICES_CREATE,
        Permission.INVOICES_UPDATE,
        Permission.INVOICES_DELETE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const result = service.hasAllPermissions(adminUser, [
        Permission.INVOICES_CREATE,
        Permission.ORG_DELETE, // Admin doesn't have this
      ]);
      expect(result).toBe(false);
    });

    it('should return true if permissions array is empty', () => {
      const result = service.hasAllPermissions(adminUser, []);
      expect(result).toBe(true);
    });
  });

  describe('hasRole', () => {
    const adminUser: RbacUser = {
      userId: '1',
      email: 'admin@test.com',
      orgId: 'org1',
      role: Role.ADMIN,
    };

    it('should return true for exact role match', () => {
      expect(service.hasRole(adminUser, Role.ADMIN)).toBe(true);
    });

    it('should return false for different role', () => {
      expect(service.hasRole(adminUser, Role.OWNER)).toBe(false);
    });
  });

  describe('hasMinimumRole', () => {
    const managerUser: RbacUser = {
      userId: '1',
      email: 'manager@test.com',
      orgId: 'org1',
      role: Role.MANAGER,
    };

    it('should return true for equal role', () => {
      expect(service.hasMinimumRole(managerUser, Role.MANAGER)).toBe(true);
    });

    it('should return true for lower role', () => {
      expect(service.hasMinimumRole(managerUser, Role.MEMBER)).toBe(true);
      expect(service.hasMinimumRole(managerUser, Role.VIEWER)).toBe(true);
    });

    it('should return false for higher role', () => {
      expect(service.hasMinimumRole(managerUser, Role.ADMIN)).toBe(false);
      expect(service.hasMinimumRole(managerUser, Role.OWNER)).toBe(false);
    });
  });

  describe('belongsToOrganisation', () => {
    const user: RbacUser = {
      userId: '1',
      email: 'user@test.com',
      orgId: 'org1',
      role: Role.MEMBER,
    };

    it('should return true for same organisation', () => {
      expect(service.belongsToOrganisation(user, 'org1')).toBe(true);
    });

    it('should return false for different organisation', () => {
      expect(service.belongsToOrganisation(user, 'org2')).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    const adminUser: RbacUser = {
      userId: '1',
      email: 'admin@test.com',
      orgId: 'org1',
      role: Role.ADMIN,
    };

    it('should allow access with permission and same org', () => {
      const result = service.canAccessResource(
        adminUser,
        Permission.INVOICES_UPDATE,
        'org1',
      );
      expect(result).toBe(true);
    });

    it('should deny access from different org', () => {
      const result = service.canAccessResource(
        adminUser,
        Permission.INVOICES_UPDATE,
        'org2',
      );
      expect(result).toBe(false);
    });

    it('should deny access without permission', () => {
      const memberUser: RbacUser = {
        userId: '2',
        email: 'member@test.com',
        orgId: 'org1',
        role: Role.MEMBER,
      };

      const result = service.canAccessResource(
        memberUser,
        Permission.INVOICES_APPROVE,
        'org1',
      );
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for OWNER', () => {
      const ownerUser: RbacUser = {
        userId: '1',
        email: 'owner@test.com',
        orgId: 'org1',
        role: Role.OWNER,
      };

      const permissions = service.getUserPermissions(ownerUser);
      expect(permissions).toContain(Permission.ADMIN_FULL);
      expect(permissions.length).toBeGreaterThan(1);
    });

    it('should return specific permissions for ADMIN', () => {
      const adminUser: RbacUser = {
        userId: '1',
        email: 'admin@test.com',
        orgId: 'org1',
        role: Role.ADMIN,
      };

      const permissions = service.getUserPermissions(adminUser);
      expect(permissions).toContain(Permission.INVOICES_CREATE);
      expect(permissions).toContain(Permission.TAX_SUBMIT);
      expect(permissions).not.toContain(Permission.ORG_DELETE);
    });

    it('should return limited permissions for VIEWER', () => {
      const viewerUser: RbacUser = {
        userId: '1',
        email: 'viewer@test.com',
        orgId: 'org1',
        role: Role.VIEWER,
      };

      const permissions = service.getUserPermissions(viewerUser);
      expect(permissions).toContain(Permission.INVOICES_READ);
      expect(permissions).not.toContain(Permission.INVOICES_CREATE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid user context gracefully', () => {
      const invalidUser = {
        userId: '1',
        email: 'test@test.com',
        orgId: 'org1',
        role: '', // Invalid role
      } as RbacUser;

      expect(service.hasPermission(invalidUser, Permission.INVOICES_READ)).toBe(false);
    });

    it('should handle null/undefined user', () => {
      expect(service.hasPermission(null as any, Permission.INVOICES_READ)).toBe(false);
      expect(service.hasPermission(undefined as any, Permission.INVOICES_READ)).toBe(false);
    });
  });
});
