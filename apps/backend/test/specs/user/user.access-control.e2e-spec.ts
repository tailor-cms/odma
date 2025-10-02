import {
  ApiRequest,
  expectForbidden,
  expectBadRequest,
  paths,
} from '../../helpers';
import type { INestApplication } from '@nestjs/common';
import { UserRole } from '@/database/entities';
import type { TestUser } from '../../helpers/test.helpers';
import {
  cleanDatabase,
  createTestUser,
  closeTestingApp,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('User API: access control', () => {
  let app: INestApplication;
  let api: ApiRequest;
  let admin: TestUser;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    api = new ApiRequest(app, paths.users.base);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
    user = users.user;
  });

  afterAll(async () => await closeTestingApp());

  describe('Role-based access control', () => {
    describe('Admin-only endpoints', () => {
      it('should deny GET /users for regular users', async () => {
        const response = await api.as(user).get().expect(403);
        expectForbidden(response);
      });

      it('should deny POST /users for regular users', async () => {
        const response = await api
          .as(user)
          .post({ body: { email: 'newuser@test.com' } })
          .expect(403);
        expectForbidden(response);
      });

      it('should deny GET /users/:id for regular users', async () => {
        const response = await api
          .as(user)
          .get({ path: `/${admin.id}` })
          .expect(403);
        expectForbidden(response);
      });

      it('should deny PATCH /users/:id for regular users', async () => {
        const response = await api
          .as(user)
          .patch({ path: `/${admin.id}`, body: { firstName: 'Hacker' } })
          .expect(403);
        expectForbidden(response);
      });

      it('should deny DELETE /users/:id for regular users', async () => {
        const response = await api
          .as(user)
          .delete({ path: `/${admin.id}` })
          .expect(403);
        expectForbidden(response);
      });

      it('should deny POST /users/:id/restore for regular users', async () => {
        const response = await api
          .as(user)
          .post({ path: `/${admin.id}/restore` })
          .expect(403);
        expectForbidden(response);
      });

      it('should deny POST /users/:id/reinvite for regular users', async () => {
        const response = await api
          .as(user)
          .post({ path: `/${admin.id}/reinvite` })
          .expect(403);
        expectForbidden(response);
      });
    });

    describe('Unauthenticated access', () => {
      it('should deny all user endpoints for unauthenticated users', async () => {
        await api.as(null).get().expect(401);
        await api
          .as(null)
          .post({ body: { email: 'test@test.com' } })
          .expect(401);
        await api
          .as(null)
          .get({ path: `/${user.id}` })
          .expect(401);
        await api
          .as(null)
          .patch({ path: `/${user.id}`, body: { firstName: 'Test' } })
          .expect(401);
        await api
          .as(null)
          .delete({ path: `/${user.id}` })
          .expect(401);
        await api
          .as(null)
          .post({ path: `/${user.id}/restore` })
          .expect(401);
        await api
          .as(null)
          .post({ path: `/${user.id}/reinvite` })
          .expect(401);
      });
    });

    describe('Invalid token access', () => {
      it('should deny access with invalid JWT token', async () => {
        const invalidUser = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'invalid@test.com',
          password: 'blalba',
          role: UserRole.USER,
          token: 'invalid.jwt.token',
        };
        await api.as(invalidUser).get().expect(401);
      });
    });
  });

  describe('Self-modification protection', () => {
    it('should prevent admin from deleting themselves', async () => {
      // Create a second admin to ensure we are not the last admin
      // If we are the last admin, the test will fail due to last-admin
      // delete protection
      await createTestUser({ email: 'admin2@test.com', role: UserRole.ADMIN });
      const response = await api
        .as(admin)
        .delete({ path: `/${admin.id}` })
        .expect(400);
      expectBadRequest(response, 'Cannot delete your own admin account');
    });

    it('should prevent admin from demoting themselves', async () => {
      // Create a second admin to ensure we are not the last admin
      // If we are the last admin, the test will fail due to last-admin
      // demote protection
      await createTestUser({ email: 'admin2@test.com', role: UserRole.ADMIN });
      const response = await api
        .as(admin)
        .patch({ path: `/${admin.id}`, body: { role: UserRole.USER } })
        .expect(400);
      expectBadRequest(response, 'Cannot demote your own admin account');
    });

    it('should allow admin to update their own non-role fields', async () => {
      const response = await api
        .as(admin)
        .patch({
          path: `/${admin.id}`,
          body: { firstName: 'UpdatedAdmin', lastName: 'Name' },
        })
        .expect(200);
      expect(response.body.firstName).toBe('UpdatedAdmin');
      expect(response.body.lastName).toBe('Name');
      expect(response.body.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Last admin protection', () => {
    it('should prevent deletion of the last admin', async () => {
      const allUsers = await api.as(admin).get().expect(200);
      const adminCount = allUsers.body.data.filter(
        (u: any) => u.role === UserRole.ADMIN,
      ).length;
      // Ensure there is only one seeded admin
      await expect(adminCount).toBe(1);
      const response = await api
        .as(admin)
        .delete({ path: `/${admin.id}` })
        .expect(400);
      expectBadRequest(response, 'Cannot delete the last admin');
    });

    it('should prevent demotion of the last admin', async () => {
      const allUsers = await api.as(admin).get().expect(200);
      const adminCount = allUsers.body.data.filter(
        (u: any) => u.role === UserRole.ADMIN,
      ).length;
      // Ensure there is only one seeded admin
      await expect(adminCount).toBe(1);
      const response = await api
        .as(admin)
        .patch({ path: `/${admin.id}`, body: { role: UserRole.USER } })
        .expect(400);
      expectBadRequest(response, 'Cannot demote the last admin');
    });

    it('should allow deletion when multiple admins exist', async () => {
      const secondAdmin = await api
        .as(admin)
        .post({
          body: {
            email: 'admin2@test.com',
            firstName: 'Second',
            lastName: 'Admin',
            role: UserRole.ADMIN,
          },
        })
        .expect(201);

      await api
        .as(admin)
        .delete({ path: `/${secondAdmin.body.id}` })
        .expect(204);
    });

    it('should allow demotion when multiple admins exist', async () => {
      const secondAdmin = await api
        .as(admin)
        .post({
          body: {
            email: 'admin2@test.com',
            firstName: 'Second',
            lastName: 'Admin',
            role: UserRole.ADMIN,
          },
        })
        .expect(201);

      const response = await api
        .as(admin)
        .patch({
          path: `/${secondAdmin.body.id}`,
          body: { role: UserRole.USER },
        })
        .expect(200);

      expect(response.body.role).toBe(UserRole.USER);
    });
  });

  describe('Cross-User access prevention', () => {
    it('should prevent regular users from accessing other users data', async () => {
      const response = await api
        .as(user)
        .get({ path: `/${admin.id}` })
        .expect(403);
      expectForbidden(response);
    });

    it('should prevent regular users from modifying other users', async () => {
      const response = await api
        .as(user)
        .patch({ path: `/${admin.id}`, body: { firstName: 'Hacked' } })
        .expect(403);
      expectForbidden(response);
    });

    it('should prevent regular users from deleting other users', async () => {
      const response = await api
        .as(user)
        .delete({ path: `/${admin.id}` })
        .expect(403);
      expectForbidden(response);
    });
  });
});
