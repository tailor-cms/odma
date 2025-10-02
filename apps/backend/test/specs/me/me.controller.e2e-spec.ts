import { INestApplication } from '@nestjs/common';
import {
  TestUser,
  cleanDatabase,
  closeTestingApp,
  createTestUser,
  createTestingApp,
  seedTestUsers,
  getJwtService,
  getConfigService,
  getEntityManager,
} from '../../helpers/test.helpers';
import { ApiRequest } from '../../helpers/api-request';
import { UserRole } from '@/database/entities';
import { createAccessToken } from '../../helpers/auth.spec.helpers';
import { expectUser } from '../../helpers/assertions';

/**
 * Tests for /me endpoints - current user profile management
 * These endpoints are special cases that:
 * 1. Don't require user ID (uses authenticated user)
 * 2. Have restricted field updates (no role/email/id changes)
 * 3. Are available to all authenticated users (not just admins)
 */
describe('/me endpoint', () => {
  let app: INestApplication;
  let apiRequest: ApiRequest;
  let admin: TestUser;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    apiRequest = new ApiRequest(app, '/api/me');
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    user = users.user;
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('GET /me - Current user profile', () => {
    it('should return current user without id route parameter', async () => {
      const response = await apiRequest.as(user).get().expect(200);
      expect(response.body).toHaveProperty('user');
      expectUser(response.body.user, {
        email: user.email,
        role: user.role,
      });
    });

    it('should work for both regular users and admins', async () => {
      // Regular user
      const userResponse = await apiRequest.as(user).get().expect(200);
      expect(userResponse.body.user.role).toBe(UserRole.USER);

      // Admin user
      const adminResponse = await apiRequest.as(admin).get().expect(200);
      expect(adminResponse.body.user.role).toBe(UserRole.ADMIN);
    });

    it('should require authentication', async () => {
      await apiRequest.as(null).get().expect(401);
    });
  });

  describe('PATCH /me - Self update only', () => {
    it('should update own profile without ID parameter', async () => {
      const response = await apiRequest
        .as(user)
        .patch({ body: { firstName: 'SelfUpdated' } })
        .expect(200);
      expectUser(response.body.user, {
        firstName: 'SelfUpdated',
        id: user.id, // Ensures it updated the right user
      });
    });

    it('should prevent role self-promotion', async () => {
      // Regular user cannot make themselves admin
      await apiRequest
        .as(user)
        .patch({
          body: {
            firstName: 'Test',
            role: UserRole.ADMIN,
          },
        })
        .expect(400);
      const { body } = await apiRequest.as(user).get().expect(200);
      expect(body.user.role).toBe(UserRole.USER);
    });

    it('should prevent email changes through profile endpoint', async () => {
      // Email changes require verification process
      await apiRequest
        .as(user)
        .patch({
          body: {
            firstName: 'Test',
            email: 'newemail@test.com',
          },
        })
        .expect(400);
      // Verify email unchanged
      const { body } = await apiRequest.as(user).get().expect(200);
      expect(body.user.email).toBe(user.email);
    });

    it('should prevent id manipulation', async () => {
      await apiRequest
        .as(user)
        .patch({
          body: {
            firstName: 'Test',
            id: admin.id, // Try to change to another user's ID
          },
        })
        .expect(400);
    });

    it('should allow admins to update their own profile only', async () => {
      // Admin can update their own profile
      const { body } = await apiRequest
        .as(admin)
        .patch({ body: { firstName: 'AdminUpdated' } })
        .expect(200);
      expect(body.user.firstName).toBe('AdminUpdated');
      expect(body.user.id).toBe(admin.id);
    });

    it('should handle empty updates gracefully', async () => {
      const response = await apiRequest
        .as(user)
        .patch({ body: {} })
        .expect(200);
      // Should return current data unchanged
      expectUser(response.body.user, {
        email: user.email,
        firstName: 'User',
        lastName: 'Test',
      });
    });
  });

  describe('Field update restrictions', () => {
    it('should only allow safe profile fields', async () => {
      const allowedUpdates = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        imgUrl: 'https://example.com/avatar.jpg',
      };
      const response = await apiRequest
        .as(user)
        .patch({ body: allowedUpdates })
        .expect(200);
      expectUser(response.body.user, allowedUpdates);
    });

    it('should reject system fields', async () => {
      const systemFields = [
        { password: 'NewPassword123!' },
        { createdAt: new Date().toISOString() },
        { updatedAt: new Date().toISOString() },
        { deletedAt: new Date().toISOString() },
        { lastLoginAt: new Date().toISOString() },
      ];
      for (const field of systemFields) {
        await apiRequest.as(user).patch({ body: field }).expect(400);
      }
    });
  });

  describe('Data consistency', () => {
    it('should maintain consistency between update and retrieval', async () => {
      // Update profile
      const updateResponse = await apiRequest
        .as(user)
        .patch({ body: { firstName: 'ConsistentName' } })
        .expect(200);
      // Immediately retrieve
      const { body } = await apiRequest.as(user).get().expect(200);
      // Both should match
      expect(updateResponse.body.user.firstName).toBe('ConsistentName');
      expect(body.user.firstName).toBe('ConsistentName');
      expect(updateResponse.body.user.updatedAt).toBe(body.user.updatedAt);
    });

    it('should handle null values for optional fields', async () => {
      await apiRequest
        .as(user)
        .patch({ body: { imgUrl: 'https://example.com/photo.jpg' } })
        .expect(200);
      const response = await apiRequest
        .as(user)
        .patch({ body: { imgUrl: null } })
        .expect(200);
      expect(response.body.user.imgUrl).toBeNull();
    });
  });

  describe('Deleted user handling', () => {
    it('should not allow deleted users to access profile', async () => {
      // Create and delete a user
      const tempUser = await createTestUser({
        email: 'deleted@test.com',
        firstName: 'Deleted',
        lastName: 'User',
      });
      const jwtService = getJwtService();
      const configService = getConfigService();
      const tempToken = await createAccessToken(
        tempUser,
        jwtService,
        configService,
      );
      // Soft delete the user
      const em = getEntityManager();
      tempUser.deletedAt = new Date();
      await em.persistAndFlush(tempUser);
      // Create a test user object with the token
      const deletedTestUser: TestUser = {
        id: tempUser.id,
        email: tempUser.email,
        password: '',
        role: tempUser.role as UserRole,
        token: tempToken,
      };
      await apiRequest.as(deletedTestUser).get().expect(401);
      await apiRequest
        .as(deletedTestUser)
        .patch({ body: { firstName: 'ShouldFail' } })
        .expect(401);
    });
  });
});
