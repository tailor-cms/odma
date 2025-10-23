import {
  ApiRequest,
  paths,
  expectBadRequest,
  expectConflict,
  expectForbidden,
  expectNotFound,
  expectPaginatedResponse,
  expectUser,
  userFactory,
} from '../../helpers';
import type { INestApplication } from '@nestjs/common';
import type { TestUser } from '../../helpers/test.helpers';
import { UserRole } from '@/database/entities';
import { QueryOrder } from '@mikro-orm/core';
import {
  cleanDatabase,
  closeTestingApp,
  createTestUser,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('User API: CRUD operations', () => {
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

  describe('GET /users', () => {
    it('should return paginated users for admin', async () => {
      const response = await api.as(admin).get().expect(200);
      expectPaginatedResponse(response.body, {
        page: 1,
        total: 2,
        hasPrevious: false,
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should allow access for non-admin users', async () => {
      const response = await api.as(user).get().expect(200);
      expectPaginatedResponse(response.body, {
        page: 1,
        total: 2,
      });
    });

    it('should filter users by email (exact match)', async () => {
      const response = await api
        .as(admin)
        .get({ query: { email: admin.email } })
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe(admin.email);
    });

    it('should paginate results', async () => {
      await createTestUser({ email: 'user2@test.com' });
      await createTestUser({ email: 'user3@test.com' });
      const response = await api
        .as(admin)
        .get({ query: { page: 1, limit: 2 } })
        .expect(200);
      expectPaginatedResponse(response.body, {
        page: 1,
        limit: 2,
        hasNext: true,
        hasPrevious: false,
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should sort users', async () => {
      const sortAscReq = await api
        .as(admin)
        .get({ query: { sortBy: 'email', sortOrder: QueryOrder.ASC } })
        .expect(200);
      expect(sortAscReq.body.data[0].email).toBe('admin@example.com');
      expect(sortAscReq.body.data[1].email).toBe('user@test.com');

      const sortDescReq = await api
        .as(admin)
        .get({ query: { sortBy: 'email', sortOrder: QueryOrder.DESC } })
        .expect(200);
      expect(sortDescReq.body.data[1].email).toBe('admin@example.com');
      expect(sortDescReq.body.data[0].email).toBe('user@test.com');
    });

    it('should include archived users when requested', async () => {
      const userToDelete = await createTestUser({ email: 'deleted@test.com' });
      await api
        .as(admin)
        .delete({ path: `/${userToDelete.id}` })
        .expect(204);

      const responseWithoutArchived = await api.as(admin).get().expect(200);
      const responseWithArchived = await api
        .as(admin)
        .get({ query: { includeArchived: true } })
        .expect(200);
      expect(responseWithoutArchived.body.total).toBe(2);
      expect(responseWithArchived.body.total).toBe(3);
    });
  });

  describe('POST /users', () => {
    it('should create a new user as admin', async () => {
      const newUser = userFactory.createData({
        email: 'newuser@test.com',
        firstName: 'Newko',
        lastName: 'Userkrich',
        role: UserRole.USER,
      });
      const response = await api.as(admin).post({ body: newUser }).expect(201);
      expectUser(response.body, {
        email: newUser.email?.toLowerCase(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      });
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .post({ body: userFactory.createData() })
        .expect(403);
      expectForbidden(response);
    });

    it('should reject duplicate email', async () => {
      const response = await api
        .as(admin)
        .post({ body: { email: admin.email } })
        .expect(409);
      expectConflict(response, 'already exists');
    });

    it('should handle previously deleted user email', async () => {
      const deletedUser = await createTestUser({ email: 'deleted@test.com' });
      await api
        .as(admin)
        .delete({ path: `/${deletedUser.id}` })
        .expect(204);
      const response = await api
        .as(admin)
        .post({ body: { email: 'deleted@test.com' } })
        .expect(409);
      expect(response.body.message).toContain('restore the user instead');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id for admin', async () => {
      const response = await api
        .as(admin)
        .get({ path: `/${user.id}` })
        .expect(200);
      expectUser(response.body, {
        id: user.id,
        email: user.email,
      });
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .get({ path: `/${admin.id}` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await api
        .as(admin)
        .get({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user as admin', async () => {
      const updateData = userFactory.updateData({
        firstName: 'Updated',
        lastName: 'Name',
      });
      const response = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: updateData })
        .expect(200);
      expectUser(response.body, {
        id: user.id,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
      });
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .patch({ path: `/${admin.id}`, body: { firstName: 'Hacker' } })
        .expect(403);
      expectForbidden(response);
    });

    it('should reject duplicate email on update', async () => {
      const response = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: { email: admin.email } })
        .expect(409);
      expectConflict(response, 'already in use');
    });

    it('should allow promoting user to admin', async () => {
      const response = await api
        .as(admin)
        .patch({ path: `/${user.id}`, body: { role: UserRole.ADMIN } })
        .expect(200);
      expect(response.body.role).toBe(UserRole.ADMIN);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await api
        .as(admin)
        .patch({
          path: '/00000000-0000-0000-0000-000000000000',
          body: { firstName: 'Test' },
        })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should soft delete user as admin', async () => {
      const userToDelete = await createTestUser({ email: 'delete@test.com' });
      await api
        .as(admin)
        .delete({ path: `/${userToDelete.id}` })
        .expect(204);
      const response = await api
        .as(admin)
        .get({ path: `/${userToDelete.id}` })
        .expect(200);
      expect(response.body.deletedAt).toBeDefined();
    });

    it('should deny access for non-admin users', async () => {
      const userToDelete = await createTestUser({ email: 'delete@test.com' });
      const response = await api
        .as(user)
        .delete({ path: `/${userToDelete.id}` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await api
        .as(admin)
        .delete({ path: '/00000000-0000-0000-0000-000000000000' })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('POST /users/:id/restore', () => {
    let deletedUser: TestUser;

    beforeEach(async () => {
      deletedUser = await createTestUser({ email: 'deleted@test.com' });
      await api
        .as(admin)
        .delete({ path: `/${deletedUser.id}` })
        .expect(204);
    });

    it('should restore soft-deleted user', async () => {
      const response = await api
        .as(admin)
        .post({ path: `/${deletedUser.id}/restore` })
        .expect(200);
      expect(response.body.deletedAt).toBeUndefined();
      expectUser(response.body, {
        id: deletedUser.id,
        email: deletedUser.email,
      });
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .post({ path: `/${deletedUser.id}/restore` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 400 for non-deleted user', async () => {
      const response = await api
        .as(admin)
        .post({ path: `/${user.id}/restore` })
        .expect(400);
      expectBadRequest(response, 'not archived');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await api
        .as(admin)
        .post({ path: '/00000000-0000-0000-0000-000000000000/restore' })
        .expect(404);
      expectNotFound(response);
    });
  });

  describe('POST /users/:id/reinvite', () => {
    it('should reinvite user as admin', async () => {
      await api
        .as(admin)
        .post({ path: `/${user.id}/reinvite` })
        .expect(202);
    });

    it('should deny access for non-admin users', async () => {
      const response = await api
        .as(user)
        .post({ path: `/${admin.id}/reinvite` })
        .expect(403);
      expectForbidden(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await api
        .as(admin)
        .post({ path: '/00000000-0000-0000-0000-000000000000/reinvite' })
        .expect(404);
      expectNotFound(response);
    });
  });
});
