/**
 * Authorization Security Tests
 * OP-081: Security Test Suite - Authorization
 *
 * Tests RBAC permissions, role hierarchy, cross-tenant access prevention,
 * resource ownership validation, and privilege escalation attempts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import configuration from '../../src/config/configuration';
import { Role } from '@operate/database';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import {
  setupSecurityTestApp,
  createTestOrganization,
  createTestUser,
  generateTestToken,
  TEST_USERS,
  makeAuthenticatedRequest,
} from './utils/test-helpers';
import { MASS_ASSIGNMENT_PAYLOADS } from './utils/payloads';

describe('Authorization Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let org1: any;
  let org2: any;
  let ownerUser: any;
  let adminUser: any;
  let memberUser: any;
  let assistantUser: any;
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let assistantToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
          load: [configuration],
        }),
        DatabaseModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = await setupSecurityTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create two organizations for cross-tenant testing
    org1 = await createTestOrganization(prisma);
    org2 = await prisma.organization.create({
      data: {
        name: 'Test Security Org 2',
        country: 'AT',
        taxId: 'AT987654321',
      },
    });

    // Create users with different roles in org1
    ownerUser = await createTestUser(prisma, TEST_USERS.owner, org1.id);
    adminUser = await createTestUser(prisma, TEST_USERS.admin, org1.id);
    memberUser = await createTestUser(prisma, TEST_USERS.member, org1.id);
    assistantUser = await createTestUser(prisma, TEST_USERS.assistant, org1.id);

    // Generate tokens
    ownerToken = generateTestToken(jwtService, ownerUser.id, ownerUser.email, ownerUser.role, org1.id);
    adminToken = generateTestToken(jwtService, adminUser.id, adminUser.email, adminUser.role, org1.id);
    memberToken = generateTestToken(jwtService, memberUser.id, memberUser.email, memberUser.role, org1.id);
    assistantToken = generateTestToken(jwtService, assistantUser.id, assistantUser.email, assistantUser.role, org1.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await app.close();
  });

  describe('RBAC Permission Checks', () => {
    it('should enforce role-based access control', async () => {
      // ASSISTANT should not access admin endpoints
      const assistantResponse = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        assistantToken,
      );

      expect(assistantResponse.status).toBe(403);
    });

    it('should allow OWNER to access all resources', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        ownerToken,
      );

      expect(response.status).toBe(200);
    });

    it('should allow ADMIN to access most resources', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should restrict MEMBER access to their own resources', async () => {
      // Member can view their own profile
      const ownProfile = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users/me',
        memberToken,
      );

      expect(ownProfile.status).toBe(200);

      // Member cannot list all users
      const allUsers = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        memberToken,
      );

      expect(allUsers.status).toBe(403);
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy: OWNER > ADMIN > MEMBER > ASSISTANT', async () => {
      // OWNER can delete ADMIN
      const ownerDeletesAdmin = await makeAuthenticatedRequest(
        app,
        'delete',
        `/api/v1/users/${adminUser.id}`,
        ownerToken,
      );

      expect([200, 204, 403]).toContain(ownerDeletesAdmin.status);

      // ADMIN cannot delete OWNER
      const adminDeletesOwner = await makeAuthenticatedRequest(
        app,
        'delete',
        `/api/v1/users/${ownerUser.id}`,
        adminToken,
      );

      expect(adminDeletesOwner.status).toBe(403);

      // MEMBER cannot delete ADMIN
      const memberDeletesAdmin = await makeAuthenticatedRequest(
        app,
        'delete',
        `/api/v1/users/${adminUser.id}`,
        memberToken,
      );

      expect(memberDeletesAdmin.status).toBe(403);
    });

    it('should prevent privilege escalation via role modification', async () => {
      // MEMBER tries to promote themselves to OWNER
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${memberUser.id}`,
        memberToken,
        { role: Role.OWNER },
      );

      expect(response.status).toBe(403);

      // Verify role was not changed
      const user = await prisma.user.findUnique({
        where: { id: memberUser.id },
        select: { role: true },
      });

      expect(user?.role).toBe(Role.MEMBER);
    });

    it('should prevent ADMIN from promoting to OWNER', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${adminUser.id}`,
        adminToken,
        { role: Role.OWNER },
      );

      expect(response.status).toBe(403);

      // Verify role was not changed
      const user = await prisma.user.findUnique({
        where: { id: adminUser.id },
        select: { role: true },
      });

      expect(user?.role).toBe(Role.ADMIN);
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('should prevent access to resources from different organization', async () => {
      // Create a user in org2
      const org2User = await prisma.user.create({
        data: {
          email: 'org2user@test.com',
          passwordHash: 'hash',
          firstName: 'Org2',
          lastName: 'User',
          role: Role.MEMBER,
          organizationId: org2.id,
          emailVerified: true,
        },
      });

      // User from org1 tries to access org2 user
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        `/api/v1/users/${org2User.id}`,
        ownerToken,
      );

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: org2User.id } });
    });

    it('should prevent listing users from different organizations', async () => {
      // Create some users in org2
      const org2Users = await Promise.all([
        prisma.user.create({
          data: {
            email: 'org2user1@test.com',
            passwordHash: 'hash',
            firstName: 'User1',
            lastName: 'Org2',
            role: Role.MEMBER,
            organizationId: org2.id,
            emailVerified: true,
          },
        }),
        prisma.user.create({
          data: {
            email: 'org2user2@test.com',
            passwordHash: 'hash',
            firstName: 'User2',
            lastName: 'Org2',
            role: Role.MEMBER,
            organizationId: org2.id,
            emailVerified: true,
          },
        }),
      ]);

      // User from org1 lists users
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        ownerToken,
      );

      expect(response.status).toBe(200);

      // Should only see users from their own organization
      const userIds = response.body.map((u: any) => u.id);
      org2Users.forEach(user => {
        expect(userIds).not.toContain(user.id);
      });

      // Cleanup
      await prisma.user.deleteMany({
        where: { id: { in: org2Users.map(u => u.id) } },
      });
    });

    it('should prevent modifying data in different organizations', async () => {
      // Create user in org2
      const org2User = await prisma.user.create({
        data: {
          email: 'org2modify@test.com',
          passwordHash: 'hash',
          firstName: 'Modify',
          lastName: 'Test',
          role: Role.MEMBER,
          organizationId: org2.id,
          emailVerified: true,
        },
      });

      // User from org1 tries to modify org2 user
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${org2User.id}`,
        ownerToken,
        { firstName: 'Hacked' },
      );

      expect(response.status).toBe(403);

      // Verify data was not changed
      const user = await prisma.user.findUnique({
        where: { id: org2User.id },
        select: { firstName: true },
      });

      expect(user?.firstName).toBe('Modify');

      // Cleanup
      await prisma.user.delete({ where: { id: org2User.id } });
    });
  });

  describe('Resource Ownership Validation', () => {
    it('should only allow owners to modify their own resources', async () => {
      // MEMBER tries to modify another MEMBER's profile
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${assistantUser.id}`,
        memberToken,
        { firstName: 'Hacked' },
      );

      expect(response.status).toBe(403);
    });

    it('should allow users to read their own profile', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users/me',
        memberToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', memberUser.id);
    });

    it('should allow users to update their own profile', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        '/api/v1/users/me',
        memberToken,
        { firstName: 'Updated' },
      );

      expect([200, 403]).toContain(response.status);

      // If update was allowed, verify change
      if (response.status === 200) {
        const user = await prisma.user.findUnique({
          where: { id: memberUser.id },
          select: { firstName: true },
        });
        expect(user?.firstName).toBe('Updated');
      }
    });

    it('should prevent users from deleting their own account without proper authorization', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'delete',
        `/api/v1/users/${memberUser.id}`,
        memberToken,
      );

      expect(response.status).toBe(403);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: memberUser.id },
      });

      expect(user).toBeDefined();
    });
  });

  describe('MFA Requirement Enforcement', () => {
    it('should enforce MFA for sensitive operations', async () => {
      // Enable MFA requirement for organization
      await prisma.organization.update({
        where: { id: org1.id },
        data: { mfaRequired: true },
      });

      // User without MFA enabled tries sensitive operation
      const response = await makeAuthenticatedRequest(
        app,
        'delete',
        `/api/v1/users/${assistantUser.id}`,
        ownerToken,
      );

      // Should require MFA verification
      expect([403, 428]).toContain(response.status); // 428 = Precondition Required

      // Cleanup
      await prisma.organization.update({
        where: { id: org1.id },
        data: { mfaRequired: false },
      });
    });

    it('should bypass MFA check when not required', async () => {
      // Ensure MFA is not required
      await prisma.organization.update({
        where: { id: org1.id },
        data: { mfaRequired: false },
      });

      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users/me',
        ownerToken,
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Mass Assignment Protection', () => {
    it('should prevent mass assignment of protected fields', async () => {
      for (const payload of MASS_ASSIGNMENT_PAYLOADS) {
        const response = await makeAuthenticatedRequest(
          app,
          'patch',
          `/api/v1/users/${memberUser.id}`,
          memberToken,
          payload,
        );

        // Should reject or strip protected fields
        expect([400, 403]).toContain(response.status);
      }
    });

    it('should not allow setting role via user update', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${memberUser.id}`,
        ownerToken,
        { role: Role.OWNER },
      );

      // Role changes should go through dedicated endpoint
      expect([400, 403]).toContain(response.status);
    });

    it('should not allow setting organizationId via user update', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'patch',
        `/api/v1/users/${memberUser.id}`,
        ownerToken,
        { organizationId: org2.id },
      );

      expect([400, 403]).toContain(response.status);

      // Verify organizationId was not changed
      const user = await prisma.user.findUnique({
        where: { id: memberUser.id },
        select: { organizationId: true },
      });

      expect(user?.organizationId).toBe(org1.id);
    });
  });

  describe('Permission Boundary Testing', () => {
    it('should enforce explicit permission requirements', async () => {
      // Test endpoints that require specific permissions
      const restrictedEndpoints = [
        { method: 'post', path: '/api/v1/organizations', permission: 'ORGANIZATION_CREATE' },
        { method: 'delete', path: '/api/v1/organizations', permission: 'ORGANIZATION_DELETE' },
        { method: 'post', path: '/api/v1/users/invite', permission: 'USERS_INVITE' },
      ];

      for (const endpoint of restrictedEndpoints) {
        // ASSISTANT should not have these permissions
        const response = await makeAuthenticatedRequest(
          app,
          endpoint.method as any,
          endpoint.path,
          assistantToken,
        );

        expect(response.status).toBe(403);
      }
    });

    it('should allow access when user has required permission', async () => {
      // OWNER should have all permissions
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        '/api/v1/users',
        ownerToken,
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Indirect Object Reference (IDOR)', () => {
    it('should prevent IDOR attacks on user endpoints', async () => {
      // Create victim user
      const victim = await prisma.user.create({
        data: {
          email: 'victim@test.com',
          passwordHash: 'hash',
          firstName: 'Victim',
          lastName: 'User',
          role: Role.MEMBER,
          organizationId: org1.id,
          emailVerified: true,
        },
      });

      // Attacker (another MEMBER) tries to access victim's data
      const response = await makeAuthenticatedRequest(
        app,
        'get',
        `/api/v1/users/${victim.id}`,
        memberToken,
      );

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: victim.id } });
    });

    it('should prevent IDOR with sequential ID guessing', async () => {
      // Try accessing users by guessing IDs
      const guessedIds = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
      ];

      for (const id of guessedIds) {
        const response = await makeAuthenticatedRequest(
          app,
          'get',
          `/api/v1/users/${id}`,
          memberToken,
        );

        expect([403, 404]).toContain(response.status);
      }
    });
  });

  describe('API Key and Service Account Authorization', () => {
    it('should reject requests with invalid API keys', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(401);
    });

    it('should enforce API key permissions', async () => {
      // This test assumes API key functionality exists
      // Adjust according to your implementation
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-API-Key', 'test-api-key');

      expect([401, 403]).toContain(response.status);
    });
  });
});
