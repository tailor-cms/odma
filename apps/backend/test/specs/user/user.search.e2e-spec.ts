import { ApiRequest, paths } from '../../helpers';
import type { INestApplication } from '@nestjs/common';
import type { TestUser } from '../../helpers/test.helpers';
import { QueryOrder } from '@mikro-orm/core';
import {
  closeTestingApp,
  cleanDatabase,
  createTestingApp,
  createTestUser,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('User search and filtering', () => {
  let app: INestApplication;
  let api: ApiRequest;
  let admin: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    api = new ApiRequest(app, paths.users.base);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    admin = users.admin;
  });

  afterAll(async () => await closeTestingApp());

  describe('Search functionality', () => {
    beforeEach(async () => {
      // Create test users with specific names for searching
      await createTestUser({
        email: 'alice.johnson@test.com',
        firstName: 'Alice',
        lastName: 'Johnson',
      });
      await createTestUser({
        email: 'bob.smith@test.com',
        firstName: 'Bob',
        lastName: 'Smith',
      });
      await createTestUser({
        email: 'charlie.alice@test.com',
        firstName: 'Charlie',
        lastName: 'Alice',
      });
    });

    it('should search users by firstName', async () => {
      const response = await api
        .as(admin)
        .get({ query: { search: 'Alice' } })
        .expect(200);
      const { data } = response.body;
      expect(data).toHaveLength(2);
      expect(data.some((u: any) => u.firstName === 'Alice')).toBe(true);
      expect(data.some((u: any) => u.lastName === 'Alice')).toBe(true);
    });

    it('should search users by lastName', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { search: 'Smith' } })
        .expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].lastName).toBe('Smith');
    });

    it('should search users by email', async () => {
      const response = await api
        .as(admin)
        .get({ query: { search: 'alice' } })
        .expect(200);
      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data.every(
          (u: any) =>
            u.email.includes('alice') ||
            u.firstName.toLowerCase() === 'alice' ||
            u.lastName.toLowerCase() === 'alice',
        ),
      ).toBe(true);
    });

    // NOTE: This passes because email is stored in lowercase and this is
    // transformed to lowercase before search. There is an issue with
    // libSQL not supporting ILIKE for case-insensitive search (testing env)
    it('should search case-insensitively', async () => {
      const responses = await Promise.all([
        api.as(admin).get({ query: { search: 'ALICE' } }),
        api.as(admin).get({ query: { search: 'alice' } }),
        api.as(admin).get({ query: { search: 'AliCe' } }),
      ]);
      const dataCounts = responses.map((r) => r.body.data.length);
      // All should return same count
      expect(new Set(dataCounts).size).toBe(1);
    });

    it('should handle partial matches', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { search: 'ohn' } })
        .expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].lastName).toBe('Johnson');
    });

    it('should handle special characters in search', async () => {
      await createTestUser({
        email: 'special@test.com',
        firstName: 'O\'Brien',
        lastName: 'Smith-Jones',
      });
      const response = await api
        .as(admin)
        .get({ query: { search: 'O\'Brien' } })
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('O\'Brien');
    });

    it('should escape special regex characters', async () => {
      // Chars that have special meaning in regex should be escaped
      const specialChars = ['%', '_'];
      for (const char of specialChars) {
        const response = await api
          .as(admin)
          .get({ query: { search: char } })
          .expect(200);
        // Should not throw err and return valid results
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return empty results for non-matching search', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { search: 'NonExistentUser' } })
        .expect(200);
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });
  });

  describe('Email filtering', () => {
    it('should filter by exact email match', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { email: admin.email } })
        .expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].email).toBe(admin.email);
    });

    it('should be case-insensitive for email filter', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { email: admin.email.toUpperCase() } })
        .expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].email).toBe(admin.email);
    });

    it('should not return partial matches for email filter', async () => {
      await api
        .as(admin)
        .get({ query: { email: 'admin' } })
        .expect(400);
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      // Create users with specific attrs for sorting
      await createTestUser({
        email: 'zack@test.com',
        firstName: 'Zack',
        lastName: 'Anderson',
      });
      await createTestUser({
        email: 'anna@test.com',
        firstName: 'Anna',
        lastName: 'Zimmerman',
      });
    });

    it('should sort by email ascending', async () => {
      const response = await api
        .as(admin)
        .get({ query: { sortBy: 'email', sortOrder: QueryOrder.ASC } })
        .expect(200);
      const emails = response.body.data.map((u: any) => u.email);
      expect(emails).toEqual([...emails].sort());
    });

    it('should sort by email descending', async () => {
      const response = await api
        .as(admin)
        .get({ query: { sortBy: 'email', sortOrder: QueryOrder.DESC } })
        .expect(200);
      const emails = response.body.data.map((u: any) => u.email);
      expect(emails).toEqual([...emails].sort().reverse());
    });

    it('should sort by firstName', async () => {
      const response = await api
        .as(admin)
        .get({ query: { sortBy: 'firstName', sortOrder: QueryOrder.ASC } })
        .expect(200);
      const names = response.body.data.map((u: any) => u.firstName);
      expect(names).toEqual([...names].sort());
    });

    it('should sort by lastName', async () => {
      const response = await api
        .as(admin)
        .get({ query: { sortBy: 'lastName', sortOrder: QueryOrder.DESC } })
        .expect(200);
      const names = response.body.data.map((u: any) => u.lastName);
      expect(names).toEqual([...names].sort().reverse());
    });

    it('should sort by createdAt by default', async () => {
      const response = await api.as(admin).get().expect(200);
      const dates = response.body.data.map((u: any) =>
        new Date(u.createdAt).getTime(),
      );
      // Default is DESC; newer dates should come first
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should maintain sorting with pagination', async () => {
      // Create more users for pagination
      for (let i = 0; i < 10; i++) {
        await createTestUser({ email: `user${i}@test.com` });
      }
      const page1 = await api
        .as(admin)
        .get({
          query: {
            page: 1,
            limit: 5,
            sortBy: 'email',
            sortOrder: QueryOrder.ASC,
          },
        })
        .expect(200);
      const page2 = await api
        .as(admin)
        .get({
          query: {
            page: 2,
            limit: 5,
            sortBy: 'email',
            sortOrder: QueryOrder.ASC,
          },
        })
        .expect(200);
      // Last email of page 1 should be alphabetically before
      // first email of page 2
      const lastPage1 = page1.body.data[page1.body.data.length - 1].email;
      const firstPage2 = page2.body.data[0].email;
      expect(lastPage1 < firstPage2).toBe(true);
    });
  });

  describe('Archived users filtering', () => {
    let deletedUser: TestUser;

    beforeEach(async () => {
      deletedUser = await createTestUser({
        email: 'deleted@test.com',
        firstName: 'Deleted',
        lastName: 'User',
      });
      await api
        .as(admin)
        .delete({ path: `/${deletedUser.id}` })
        .expect(204);
    });

    it('should exclude archived users by default', async () => {
      const { body } = await api.as(admin).get().expect(200);
      const { data } = body;
      expect(data.every((u: any) => u.email !== 'deleted@test.com')).toBe(true);
      expect(body.total).toBe(2); // admin and user only
    });

    it('should include archived users when requested', async () => {
      const { body } = await api
        .as(admin)
        .get({ query: { includeArchived: true } })
        .expect(200);
      const { data } = body;
      expect(data.some((u: any) => u.email === 'deleted@test.com')).toBe(true);
      expect(body.total).toBe(3); // admin, user, and deleted user
    });

    it('should search archived users when includeArchived is true', async () => {
      const response = await api
        .as(admin)
        .get({ query: { search: 'Deleted', includeArchived: true } })
        .expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('deleted@test.com');
      expect(response.body.data[0].deletedAt).toBeDefined();
    });

    it('should not search archived users by default', async () => {
      const response = await api
        .as(admin)
        .get({ query: { search: 'Deleted' } })
        .expect(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Combined filters', () => {
    it('should combine search with pagination', async () => {
      // Create users with 'test' in their names
      for (let i = 0; i < 10; i++) {
        await createTestUser({
          email: `test${i}@example.com`,
          firstName: `Test${i}`,
          lastName: 'User',
        });
      }
      const { body } = await api
        .as(admin)
        .get({ query: { search: 'Test', page: 1, limit: 5 } })
        .expect(200);

      expect(body.data).toHaveLength(5);
      expect(body.hasNext).toBe(true);
      const cond = (it: any) =>
        it.firstName.includes('Test') || it.email.includes('test');
      expect(body.data.every(cond)).toBe(true);
    });

    it('should combine all filters together', async () => {
      await createTestUser({
        email: 'archived.test@example.com',
        firstName: 'Archived',
        lastName: 'Test',
      });
      const archivedUser = await createTestUser({
        email: 'deleted.test@example.com',
        firstName: 'Deleted',
        lastName: 'Test',
      });
      await api
        .as(admin)
        .delete({ path: `/${archivedUser.id}` })
        .expect(204);
      const {
        body: { data },
      } = await api
        .as(admin)
        .get({
          query: {
            search: 'test',
            includeArchived: true,
            sortBy: 'email',
            sortOrder: QueryOrder.ASC,
            page: 1,
            limit: 10,
          },
        })
        .expect(200);
      // Should find users with 'test' in their data
      expect(data.length).toBeGreaterThan(0);
      // Should be sorted by email ascending
      const emails = data.map((u: any) => u.email);
      expect(emails).toEqual([...emails].sort());
      // Should include archived user
      expect(data.some((u: any) => u.deletedAt !== null)).toBe(true);
    });
  });
});
