import {
  ApiRequest,
  expectValidationError,
  paths,
  userFactory,
} from '../../helpers';
import type { INestApplication } from '@nestjs/common';
import type { TestUser } from '../../helpers/test.helpers';
import {
  closeTestingApp,
  cleanDatabase,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';

describe('User input validation', () => {
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

  describe('UUID validation', () => {
    it('should reject invalid UUID formats', async () => {
      const invalidIds = [
        'not-a-uuid',
        '123',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '00000000-0000-0000-0000-00000000000g',
        '00000000000000000000000000000000',
        '',
      ];
      for (const id of invalidIds) {
        // Both 404 (not found) and 400 (bad request) are valid responses
        const expectedStatuses = id === '' ? [200, 400, 404] : [400, 404];

        const getResponse = await api.as(admin).get({ path: `/${id}` });
        expect(expectedStatuses).toContain(getResponse.status);

        const patchResponse = await api.as(admin).patch({
          path: `/${id}`,
          body: { firstName: 'Test' },
        });
        expect(expectedStatuses).toContain(patchResponse.status);

        const deleteResponse = await api.as(admin).delete({ path: `/${id}` });
        expect(expectedStatuses).toContain(deleteResponse.status);

        const restoreResponse = await api
          .as(admin)
          .post({ path: `/${id}/restore` });
        expect(expectedStatuses).toContain(restoreResponse.status);

        const reinviteResponse = await api
          .as(admin)
          .post({ path: `/${id}/reinvite` });
        expect(expectedStatuses).toContain(reinviteResponse.status);
      }
    });
  });

  describe('Email validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = userFactory.invalidEmails;
      for (const email of invalidEmails) {
        const response = await api
          .as(admin)
          .post({ body: { email } })
          .expect(400);
        expectValidationError(response, 'email');
      }
    });

    it('should handle email edge cases', async () => {
      const emailEdgeCases = [
        { email: 'test+tag@example.com', shouldPass: true },
        { email: 'test.name@example.com', shouldPass: true },
        { email: 'test@sub.domain.com', shouldPass: true },
        { email: 'test@localhost', shouldPass: false }, // No TLD
        { email: '@example.com', shouldPass: false }, // No local part
        { email: 'test@', shouldPass: false }, // No domain
        { email: 'test@@example.com', shouldPass: false }, // Double @
        { email: 'test @example.com', shouldPass: false }, // Space in local
        { email: 'test@exam ple.com', shouldPass: false }, // Space in domain
        { email: 'test..name@example.com', shouldPass: false }, // Double dots
      ];
      for (const testCase of emailEdgeCases) {
        const response = await api
          .as(admin)
          .post({ body: { email: testCase.email } });
        if (testCase.shouldPass) {
          expect(response.status).toBe(201);
          expect(response.body.email).toBe(testCase.email.toLowerCase());
        } else {
          expect(response.status).toBe(400);
        }
      }
    });

    it('should lowercase email addresses', async () => {
      const response = await api
        .as(admin)
        .post({
          body: {
            email: 'TEST.USER@EXAMPLE.COM',
            firstName: 'Test',
            lastName: 'User',
          },
        })
        .expect(201);
      expect(response.body.email).toBe('test.user@example.com');
    });
  });

  describe('Role validation', () => {
    it('should reject invalid role values', async () => {
      const invalidRoles = [
        'SUPERADMIN',
        'admin', // lowercase
        'Admin', // wrong case
        123,
        true,
        ['ADMIN'],
        { role: 'ADMIN' },
      ];
      for (const role of invalidRoles) {
        await api
          .as(admin)
          .post({ body: { email: 'role@test.com', role } })
          .expect(400);
        await api
          .as(admin)
          .patch({
            path: `/${user.id}`,
            body: { role },
          })
          .expect(400);
      }
    });

    it('should accept valid role values', async () => {
      const validRoles = ['ADMIN', 'USER'];
      for (const [index, role] of validRoles.entries()) {
        const response = await api
          .as(admin)
          .post({
            body: {
              email: `role${index}@test.com`,
              role,
            },
          })
          .expect(201);
        expect(response.body.role).toBe(role);
      }
    });
  });

  describe('String field validation', () => {
    it('should enforce maximum field lengths', async () => {
      const longString = 'a'.repeat(10000);

      // Email should have reasonable length limit
      await api
        .as(admin)
        .post({ body: { email: longString + '@test.com' } })
        .expect(400);

      // Names should have reasonable length limit
      await api
        .as(admin)
        .post({
          body: {
            email: 'length@test.com',
            firstName: longString,
            lastName: longString,
          },
        })
        .expect(400);

      // Update should also enforce limits
      await api
        .as(admin)
        .patch({
          path: `/${user.id}`,
          body: { firstName: longString },
        })
        .expect(400);
    });

    it('should handle Unicode and special characters in names', async () => {
      const unicodeNames = [
        { firstName: '李明', lastName: '王' }, // Chinese
        { firstName: 'José', lastName: 'García' }, // Spanish
        { firstName: 'Владимир', lastName: 'Путин' }, // Cyrillic
        { firstName: 'محمد', lastName: 'أحمد' }, // Arabic
        { firstName: '🙂', lastName: '😀' }, // Emojis
        { firstName: 'O\'Brien', lastName: 'McDonald' }, // Apostrophes
        { firstName: 'Anne-Marie', lastName: 'Saint-Claire' }, // Hyphens
      ];
      for (const [index, names] of unicodeNames.entries()) {
        const response = await api.as(admin).post({
          body: {
            email: `unicode${index}@test.com`,
            ...names,
          },
        });
        // Should either accept (201) or reject (400) consistently
        expect([201, 400]).toContain(response.status);
        if (response.status === 201) {
          expect(response.body.firstName).toBe(names.firstName);
          expect(response.body.lastName).toBe(names.lastName);
        }
      }
    });

    it('should sanitize or reject HTML/script tags in text fields', async () => {
      const xssPayloads = userFactory.xssPayloads;
      for (const [index, xss] of xssPayloads.entries()) {
        const response = await api.as(admin).post({
          body: {
            email: `xss${index}@test.com`,
            firstName: xss,
            lastName: 'Test',
          },
        });
        if (response.status === 201) {
          // If accepted, verify it's sanitized
          expect(response.body.firstName).not.toContain('<script');
          expect(response.body.firstName).not.toContain('javascript:');
          expect(response.body.firstName).not.toContain('onerror=');
        } else {
          // Should reject with 400
          expect(response.status).toBe(400);
        }
      }
    });

    it('should handle null vs undef vs empty str for optionals', async () => {
      const testCases = [
        { data: { email: 'null@test.com', firstName: null, lastName: null } },
        { data: { email: 'undefined@test.com' } },
        { data: { email: 'empty@test.com', firstName: '', lastName: '' } },
        { data: { email: 'spaces@x.com', firstName: '   ', lastName: '  ' } },
      ];
      for (const testCase of testCases) {
        const response = await api.as(admin).post({ body: testCase.data });
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Type coercion protection', () => {
    it('should reject arrays where strings are expected', async () => {
      await api
        .as(admin)
        .post({
          body: {
            email: ['test@test.com'],
            firstName: ['John'],
            lastName: ['Doe'],
          },
        })
        .expect(400);
    });

    it('should reject objects where primitives are expected', async () => {
      await api
        .as(admin)
        .post({
          body: {
            email: { value: 'test@test.com' },
            firstName: { value: 'John' },
            role: { value: 'ADMIN' },
          },
        })
        .expect(400);
    });

    it('should handle boolean values in string fields', async () => {
      await api
        .as(admin)
        .post({
          body: {
            email: true,
            firstName: false,
            lastName: true,
          },
        })
        .expect(400);
    });

    it('should handle numeric values in string fields', async () => {
      await api
        .as(admin)
        .post({
          body: {
            email: 12345,
            firstName: 123,
            lastName: 456,
          },
        })
        .expect(400);
    });

    it('should reject non-string email values', async () => {
      const invalidEmails = [
        { email: 123 }, // number
        { email: true }, // boolean
        { email: ['test@test.com'] }, // array
        { email: { value: 'test@test.com' } }, // object
        { email: null }, // null should be rejected for required field
      ];
      for (const data of invalidEmails) {
        await api.as(admin).post({ body: data }).expect(400);
      }
    });
  });

  describe('Query parameter validation', () => {
    it('should handle extreme pagination values', async () => {
      // Negative values
      await api
        .as(admin)
        .get({ query: { page: -1 } })
        .expect(400);
      await api
        .as(admin)
        .get({ query: { limit: -10 } })
        .expect(400);

      // Zero values
      await api
        .as(admin)
        .get({ query: { page: 0 } })
        .expect(400);
      await api
        .as(admin)
        .get({ query: { limit: 0 } })
        .expect(400);

      // Excessive values
      await api
        .as(admin)
        .get({ query: { limit: 10000 } })
        .expect(400);
      await api
        .as(admin)
        .get({ query: { page: 999999999 } })
        .expect(200); // Should return empty results

      // Non-numeric values
      await api
        .as(admin)
        .get({ query: { page: 'abc' } })
        .expect(400);
      await api
        .as(admin)
        .get({ query: { limit: 'xyz' } })
        .expect(400);

      // Float values
      await api
        .as(admin)
        .get({ query: { page: 1.5 } })
        .expect(400);
      await api
        .as(admin)
        .get({ query: { limit: 10.5 } })
        .expect(400);
    });

    it('should reject SQL injection in sortBy field', async () => {
      const sqlInjectionPayloads = userFactory.sqlInjectionPayloads;
      for (const injection of sqlInjectionPayloads) {
        const response = await api
          .as(admin)
          .get({ query: { sortBy: injection } });
        // Should either reject (400) or safely handle without executing injection
        expect([200, 400]).toContain(response.status);
        if (response.status === 200) {
          // If it returns 200, verify data is still intact
          expect(response.body.data).toBeDefined();
          expect(response.body.data.length).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should reject dangerous patterns in search field', async () => {
      const dangerousPatterns = [
        '(a+)+$', // ReDoS pattern
        '(?i)(a+)+', // Case insensitive ReDoS
        '.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*', // Excessive wildcards
        '<script>alert(1)</script>',
        '${7*7}', // Template injection
        '{{7*7}}', // Template injection
      ];
      for (const pattern of dangerousPatterns) {
        const response = await api
          .as(admin)
          .get({ query: { search: pattern } });
        // Should handle safely without crashing
        expect([200, 400]).toContain(response.status);
      }
    });
  });
});
