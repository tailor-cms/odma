import {
  AuthClient,
  TestUser,
  cleanDatabase,
  closeTestingApp,
  createTestUser,
  createTestingApp,
  seedTestUsers, getEntityManager,
} from '../../helpers/test.helpers';
import { INestApplication } from '@nestjs/common';
import { User } from '@/database/entities';
import { expectUser } from '../../helpers/assertions';
import { userFactory } from '../../helpers/factories';
import request from 'supertest';

describe('Auth login', () => {
  let app: INestApplication;
  let apiClient: AuthClient;
  let user: TestUser;

  const fetchAuthenticatedUser = (expectedStatus = 200) =>
    apiClient.get('/api/me', { expectedStatus });

  beforeAll(async () => {
    app = await createTestingApp();
    apiClient = new AuthClient(app);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    user = users.user;
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('POST /auth/login - Valid credentials', () => {
    it('should login with valid credentials', async () => {
      const response = await apiClient.login(user.email, user.password, 200);
      apiClient.validateLoginResponse(response);
      expectUser(response.user, { email: user.email, role: user.role });
      await fetchAuthenticatedUser(200);
    });

    it('should login with case-insensitive email', async () => {
      const { email, password } = user;
      const res = await apiClient.login(email.toUpperCase(), password, 200);
      expect(res.user.email).toBe(user.email);
    });

    it('should return valid access token', async () => {
      const response = await apiClient.login(user.email, user.password);
      const { accessToken, expiresIn } = response;
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(expiresIn).toBeGreaterThan(0);
      apiClient.resetSession();
      const meResponse = await request(app.getHttpServer())
        .get('/api/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(meResponse.body.user.email).toBe(user.email);
    });

    it('should update lastLoginAt timestamp', async () => {
      // Make sure user has a past lastLoginAt
      await apiClient.login(user.email, user.password);
      await apiClient.resetSession();
      const em = getEntityManager();
      const userBefore = (await em.findOne(User, user.id)) as User;
      expect(userBefore.lastLoginAt).toBeDefined();
      const originalLoginAt = userBefore.lastLoginAt as Date;
      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));
      await apiClient.login(user.email, user.password);
      const userAfter = (await em.findOne(User, { email: user.email })) as User;
      expect(new Date(userAfter.lastLoginAt!).getTime()).toBeGreaterThan(
        new Date(originalLoginAt).getTime(),
      );
    });

    it('should set secure cookies', async () => {
      const response = await apiClient.login(user.email, user.password);
      expect(response.cookie).toBeDefined();
      expect(response?.cookieAttributes?.httpOnly).toBe(true);
      expect(response?.cookieAttributes?.maxAge).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/login - Invalid credentials', () => {
    it('should fail with incorrect password', async () => {
      const response = await apiClient.login(user.email, 'WrongPw123!', 401);
      expect(response.body.message).toContain('Invalid credentials');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should fail with non-existent email', async () => {
      const response = await apiClient.login('test@test.co', 'AnyPw123!', 401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not reveal whether email exists', async () => {
      const nonExist = await apiClient.login('nonexist@te.co', 'Pwaa123!', 401);
      const wrongPw = await apiClient.login(user.email, 'WrogPwd123!', 401);
      expect(nonExist.body.message).toBe(wrongPw.body.message);
    });
  });

  describe('POST /auth/login - Validation', () => {
    it('should validate email format', async () => {
      for (const email of userFactory.invalidEmails) {
        const response = await apiClient.login(email, 'ValidPassword123!', 400);
        expect(response.body.message).toBeDefined();
        expect(
          response.body.message.some((m: string) =>
            m.toLowerCase().includes('email'),
          ),
        ).toBe(true);
      }
    });

    it('should validate password presence', async () => {
      const { body } = await apiClient.login(user.email, '', 400);
      expect(body.message).toBeDefined();
      expect(
        body.message.some((m: string) => m.toLowerCase().includes('password')),
      ).toBe(true);
    });
  });

  describe('POST /auth/login - Deleted users', () => {
    it('should not allow deleted users to login', async () => {
      const email = 'deleted@test.com';
      const password = 'Password123!';
      await createTestUser({ email, password, deletedAt: new Date() });
      const response = await apiClient.login(email, password, 401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /auth/login - Security', () => {
    it('should prevent SQL injection attempts', async () => {
      for (const payload of userFactory.sqlInjectionPayloads) {
        await apiClient.login(payload, 'Password123!', 400);
      }
    });

    it('should handle XSS attempts safely', async () => {
      for (const payload of userFactory.xssPayloads.slice(0, 3)) {
        const response = await apiClient.login(
          `${payload}@test.com`,
          'Password123!',
          400,
        );
        expect(JSON.stringify(response.body)).not.toContain('<script>');
      }
    });

    it('should handle multiple failed login attempts', async () => {
      const attempts = Array(5)
        .fill(null)
        .map(() => apiClient.login(user.email, 'WrongPassword!', 401));
      const results = await Promise.all(attempts);
      results.forEach((result) => expect(result.status).toBe(401));
    });
  });
});
