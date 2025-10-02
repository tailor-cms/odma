import { INestApplication } from '@nestjs/common';
import { User } from '@/database/entities';
import {
  AuthClient,
  TestUser,
  cleanDatabase,
  closeTestingApp,
  createTestingApp,
  seedTestUsers,
} from '../../helpers/test.helpers';
import { getEntityManager } from '../../helpers/test.helpers';
import request from 'supertest';

describe('Auth logout', () => {
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
    apiClient.resetSession();
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('GET /auth/logout - session termination', () => {
    it('should return 401 if user is not signed in', async () => {
      await apiClient.auth.logout(401);
    });

    it('should logout authenticated user', async () => {
      await apiClient.login(user.email, user.password);
      await fetchAuthenticatedUser(200);
      await apiClient.auth.logout(200);
      await fetchAuthenticatedUser(401);
    });

    // TODO: Decide if we want to support token invalidation on logout
    it.skip('should invaidate access token on logout', async () => {
      const { accessToken } = await apiClient.login(user.email, user.password);
      await fetchAuthenticatedUser(200);
      await apiClient.auth.logout(200);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await request(app.getHttpServer())
        .get('/api/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should handle multiple logout attempts gracefully', async () => {
      await apiClient.login(user.email, user.password);
      await apiClient.auth.logout(200);
      await apiClient.auth.logout(401);
    });

    it('should update lastLoginAt on logout', async () => {
      await apiClient.login(user.email, user.password);
      const em = getEntityManager();
      const userAfterLogin = await em.findOne(User, { email: user.email });
      const loginTimestamp = userAfterLogin?.lastLoginAt;
      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));
      await apiClient.auth.logout(200);
      const userAfterLogout = await em.findOne(User, { email: user.email });
      expect(userAfterLogout?.lastLoginAt).toBeDefined();
      expect(new Date(userAfterLogout!.lastLoginAt!).getTime()).toBeGreaterThan(
        new Date(loginTimestamp!).getTime(),
      );
    });
  });
});
