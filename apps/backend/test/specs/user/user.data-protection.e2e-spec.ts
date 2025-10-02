import { ApiRequest, expectConflict, paths, userFactory } from '../../helpers';
import type { INestApplication } from '@nestjs/common';
import type { TestUser } from '../../helpers/test.helpers';
import {
  cleanDatabase,
  closeTestingApp,
  createTestUser,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('User Data Protection (e2e)', () => {
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

  describe('Sensitive field filtering', () => {
    it('should never return password field in any user endpoint', async () => {
      // Check GET list
      const listResponse = await api.as(admin).get().expect(200);
      listResponse.body.data.forEach((u: any) => {
        expect(u).not.toHaveProperty('password');
        expect(u).not.toHaveProperty('token');
        expect(u).not.toHaveProperty('accessToken');
      });
      // Check GET single
      const getResponse = await api
        .as(admin)
        .get({ path: `/${user.id}` })
        .expect(200);
      expect(getResponse.body).not.toHaveProperty('password');
      expect(getResponse.body).not.toHaveProperty('token');
      expect(getResponse.body).not.toHaveProperty('accessToken');
      // Check POST create
      const createResponse = await api
        .as(admin)
        .post({ body: { email: 'newuser@test.com' } })
        .expect(201);
      expect(createResponse.body).not.toHaveProperty('password');
      expect(createResponse.body).not.toHaveProperty('token');
      expect(createResponse.body).not.toHaveProperty('accessToken');
      // Check PATCH update
      const updateResponse = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: { firstName: 'Updated' } })
        .expect(200);
      expect(updateResponse.body).not.toHaveProperty('password');
      expect(updateResponse.body).not.toHaveProperty('token');
      expect(updateResponse.body).not.toHaveProperty('accessToken');
    });
  });

  describe('Protected field assignment', () => {
    it('should not allow setting id during user creation', async () => {
      const customId = '12345678-1234-1234-1234-123456789abc';
      await api
        .as(admin)
        .post({
          body: {
            id: customId,
            email: 'customid@test.com',
          },
        })
        .expect(400);
    });

    it('should not allow updating id field', async () => {
      const newId = '87654321-4321-4321-4321-cba987654321';
      await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: { id: newId } })
        .expect(400);
    });

    it('should not allow setting timestamps during creation', async () => {
      const customDate = new Date('2020-01-01').toISOString();
      await api
        .as(admin)
        .post({
          body: {
            email: 'timestamp@test.com',
            createdAt: customDate,
            updatedAt: customDate,
          },
        })
        .expect(400);
    });

    it('should not allow updating protected timestamps', async () => {
      const customDate = new Date('2020-01-01').toISOString();
      await api
        .as(admin)
        .patch({
          path: `/${user.id}`,
          body: {
            createdAt: customDate,
            updatedAt: customDate,
          },
        })
        .expect(400);
    });

    it('should not allow setting password directly', async () => {
      await api
        .as(admin)
        .post({
          body: {
            email: 'directpass@test.com',
            password: 'DirectPassword123!',
          },
        })
        .expect(400);
    });

    it('should not allow updating protected fields', async () => {
      await api
        .as(admin)
        .patch({
          path: `/${user.id}`,
          body: {
            password: 'NewPassword123!',
          },
        })
        .expect(400);
    });
  });

  describe('Data integrity', () => {
    it('should properly handle deletedAt field', async () => {
      const userToDelete = await createTestUser({ email: 'soft@test.com' });
      const beforeDelete = await api
        .as(admin)
        .get({ path: `/${userToDelete.id}` })
        .expect(200);
      expect(beforeDelete.body.deletedAt).toBeNull();
      await api
        .as(admin)
        .delete({ path: `/${userToDelete.id}` })
        .expect(204);
      const afterDelete = await api
        .as(admin)
        .get({ path: `/${userToDelete.id}` })
        .expect(200);
      expect(afterDelete.body.deletedAt).toBeDefined();
      expect(afterDelete.body.deletedAt).not.toBeUndefined();
      const restored = await api
        .as(admin)
        .post({ path: `/${userToDelete.id}/restore` })
        .expect(200);
      expect(restored.body.deletedAt).toBeUndefined();
    });

    it('should maintain data consistency during updates', async () => {
      const originalUser = await api
        .as(admin)
        .get({ path: `/${user.id}` })
        .expect(200);
      const updateData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      };
      const updatedUser = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: updateData })
        .expect(200);
      // Updated fields should change
      expect(updatedUser.body.firstName).toBe(updateData.firstName);
      expect(updatedUser.body.lastName).toBe(updateData.lastName);
      // Other fields should remain unchanged
      expect(updatedUser.body.id).toBe(originalUser.body.id);
      expect(updatedUser.body.email).toBe(originalUser.body.email);
      expect(updatedUser.body.role).toBe(originalUser.body.role);
      expect(updatedUser.body.createdAt).toBe(originalUser.body.createdAt);
    });

    it('should handle email uniqueness case-insensitively', async () => {
      await createTestUser({ email: 'unique@test.com' });
      // Try to create with same email in different case
      const response = await api
        .as(admin)
        .post({ body: { email: 'UNIQUE@TEST.COM' } })
        .expect(409);
      expectConflict(response, 'already exists');
    });

    it('should prevent email collision during update', async () => {
      await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const response = await api
        .as(admin)
        .patch({
          path: `/${user2.id}`,
          body: { email: 'user1@test.com' },
        })
        .expect(409);
      expectConflict(response, 'already in use');
    });
  });

  describe('Response field consistency', () => {
    it('should return consistent fields across all endpoints', async () => {
      const expectedFields = [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'isDeleted',
      ];
      // Check list endpoint
      const listResponse = await api.as(admin).get().expect(200);
      listResponse.body.data.forEach((u: any) => {
        expectedFields.forEach((field) => {
          expect(u).toHaveProperty(field);
        });
      });
      // Check single endpoint
      const singleResponse = await api
        .as(admin)
        .get({ path: `/${user.id}` })
        .expect(200);
      expectedFields.forEach((field) => {
        expect(singleResponse.body).toHaveProperty(field);
      });
      // Check create endpoint
      const createResponse = await api
        .as(admin)
        .post({ body: userFactory.createData() })
        .expect(201);
      expectedFields.forEach((field) => {
        expect(createResponse.body).toHaveProperty(field);
      });
      // Check update endpoint
      const updateResponse = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: { firstName: 'Test' } })
        .expect(200);
      expectedFields.forEach((field) => {
        expect(updateResponse.body).toHaveProperty(field);
      });
    });

    it('should format dates consistently as ISO strings', async () => {
      const response = await api
        .as(admin)
        .get({ path: `/${user.id}` })
        .expect(200);
      // Check that date fields are valid ISO strings
      expect(() => new Date(response.body.createdAt)).not.toThrow();
      expect(() => new Date(response.body.updatedAt)).not.toThrow();
      // Should be in ISO format
      const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(response.body.createdAt).toMatch(ISO_FORMAT);
      expect(response.body.updatedAt).toMatch(ISO_FORMAT);
    });
  });
});
