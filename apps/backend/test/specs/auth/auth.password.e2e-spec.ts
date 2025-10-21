import { INestApplication } from '@nestjs/common';
import {
  createTestingApp,
  closeTestingApp,
  cleanDatabase,
  seedTestUsers,
  createTestUser,
  TestUser,
  getJwtService,
  getConfigService,
  AuthClient, getEntityManager,
} from '../../helpers/test.helpers';
import {
  createResetToken,
  createExpiredToken,
  createInvitationToken,
  mockMailService,
  generateValidPassword,
} from '../../helpers/auth.spec.helpers';
import { User } from '@/database/entities';

describe('Auth - Password management', () => {
  let app: INestApplication;
  let authClient: AuthClient;
  let user: TestUser;
  let testUser: User;

  beforeAll(async () => {
    app = await createTestingApp();
    authClient = new AuthClient(app);
  });

  beforeEach(async () => {
    await cleanDatabase();
    const users = await seedTestUsers();
    user = users.user;
    authClient.resetSession(); // Start fresh each test

    // Create a test user for password operations
    testUser = await createTestUser({
      email: 'passwordtest@test.com',
      password: 'OldPassword123!',
      firstName: 'Password',
      lastName: 'Test',
    });

    // Reset mail service mock
    mockMailService.sendPasswordResetEmail.mockClear();
    mockMailService.sendInvitationEmail.mockClear();
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('POST /auth/change-password - Authenticated password change', () => {
    it('should change password with correct current password', async () => {
      const newPassword = generateValidPassword();
      await authClient.login(user.email, user.password);
      const response = await authClient.auth.changePassword(
        user.password,
        newPassword,
      );
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successfully');
      authClient.resetSession();
      await authClient.login(user.email, newPassword);
      authClient.resetSession();
      await authClient.login(user.email, user.password, 401);
    });

    it('should fail with incorrect current password', async () => {
      await authClient.login(user.email, user.password);
      const response = await authClient.auth.changePassword(
        'WrongCurrentPassword123!',
        generateValidPassword(),
        400,
      );
      expect(response.body.message).toContain('incorrect');
    });

    it('should validate new password requirements', async () => {
      const invalidPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChar1',
        '        ',
      ];
      // Login to establish session
      await authClient.login(user.email, user.password);
      for (const invalidPassword of invalidPasswords) {
        await authClient.auth.changePassword(
          user.password,
          invalidPassword,
          400,
        );
      }
    });

    it('should require authentication', async () => {
      authClient.resetSession();
      const response = await authClient.auth.changePassword(
        'OldPassword123!',
        generateValidPassword(),
        401,
      );
      expect(response.status).toBe(401);
    });

    it('should invalidate reset tokens after password change', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.validateResetToken(resetToken);
      await authClient.login(testUser.email, 'OldPassword123!');
      await authClient.auth.changePassword(
        'OldPassword123!',
        generateValidPassword(),
      );
      await authClient.auth.validateResetToken(resetToken, 400);
    });

    // TODO: Decide if we want to enforce this
    it.skip('should not allow changing to the same password', async () => {
      await authClient.login(user.email, user.password);
      await authClient.auth.changePassword(
        user.password,
        'TestPassword123!55',
      );
    });
  });

  describe('POST /auth/forgot-password - Password reset request', () => {
    it('should send reset email for existing user', async () => {
      await authClient.auth.forgotPassword(testUser.email);
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: testUser.email }),
        expect.any(String),
      );
    });

    it('should silently succeed for non-existent user', async () => {
      await authClient.auth.forgotPassword('nonexistent@test.com');
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not send email for deleted user', async () => {
      const deletedUser = await createTestUser({
        email: 'deleted@test.com',
        deletedAt: new Date(),
      });
      await authClient.auth.forgotPassword(deletedUser.email);
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive email', async () => {
      await authClient.auth.forgotPassword(testUser.email.toUpperCase());
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it('should validate email format', async () => {
      const response = await authClient.auth.forgotPassword('not-email', 400);
      expect(response.status).toBe(400);
    });

    it('should handle multiple reset requests', async () => {
      await authClient.auth.forgotPassword(testUser.email);
      await authClient.auth.forgotPassword(testUser.email);
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /auth/reset-password - Password reset with token', () => {
    it('should reset password with valid token', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      const newPassword = generateValidPassword();
      await authClient.auth.resetPassword(resetToken, newPassword);
      await authClient.login(testUser.email, newPassword, 200);
      await authClient.login(testUser.email, 'OldPassword123!', 401);
    });

    it('should fail with invalid token', async () => {
      const response = await authClient.auth.resetPassword(
        'invalid.token.here',
        generateValidPassword(),
        400,
      );
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with expired token', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const expiredToken = await createExpiredToken(
        testUser,
        jwtService,
        configService,
      );
      const response = await authClient.auth.resetPassword(
        expiredToken,
        generateValidPassword(),
        400,
      );
      expect(response.body.message).toContain('expired');
    });

    it('should validate new password requirements', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.resetPassword(resetToken, 'weak', 400);
    });

    it('should invalidate token after use', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.resetPassword(resetToken, generateValidPassword());
      await authClient.auth.resetPassword(
        resetToken,
        generateValidPassword(),
        400,
      );
    });

    it('should not work with wrong audience token', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const wrongToken = await createInvitationToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.resetPassword(
        wrongToken,
        generateValidPassword(),
        400,
      );
    });
  });

  describe('POST /auth/reset-password/token-status - Token validation', () => {
    it('should validate correct token', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.validateResetToken(resetToken, 202);
    });

    it('should reject invalid token', async () => {
      await authClient.auth.validateResetToken('invalid.token.here', 400);
    });

    it('should reject expired token', async () => {
      const configService = getConfigService();
      const jwtService = getJwtService();
      const expiredToken = await createExpiredToken(
        testUser,
        jwtService,
        configService,
      );
      await authClient.auth.validateResetToken(expiredToken, 400);
    });

    it('should reject missing token', async () => {
      const path = '/api/auth/reset-password/token-status';
      const opts = { body: {}, expectedStatus: 400 };
      const response = await authClient.post(path, opts);
      expect(response.status).toBe(400);
    });

    it('should handle token for deleted user', async () => {
      const deletedUser = await createTestUser({
        email: 'willbedeleted@test.com',
        password: 'Password123!',
      });
      const configService = getConfigService();
      const jwtService = getJwtService();
      const resetToken = await createResetToken(
        deletedUser,
        jwtService,
        configService,
      );
      // Delete the user
      const em = getEntityManager();
      deletedUser.deletedAt = new Date();
      await em.persistAndFlush(deletedUser);
      await authClient.auth.validateResetToken(resetToken, 400);
    });
  });
});
