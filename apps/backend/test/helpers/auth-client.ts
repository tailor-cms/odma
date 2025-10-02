import { INestApplication } from '@nestjs/common';
import { extractCookie, getCookieWithAttributes } from './cookie';
import * as setCookieParser from 'set-cookie-parser';
import request from 'supertest';

const AuthApiRoot = '/api/auth';
const AuthRoutes = {
  Login: `${AuthApiRoot}/login`,
  Logout: `${AuthApiRoot}/logout`,
  ChangePassword: `${AuthApiRoot}/change-password`,
  ForgotPassword: `${AuthApiRoot}/forgot-password`,
  ResetPassword: `${AuthApiRoot}/reset-password`,
  ResetTokenStatus: `${AuthApiRoot}/reset-password/token-status`,
} as const;

export interface AuthResponse {
  status: number;
  headers: any;
  body: any;
}

export interface LoginResponse {
  user: any;
  accessToken: string;
  expiresIn: number;
  cookie?: string;
  cookieAttributes?: setCookieParser.Cookie;
}

export interface AuthRequestOptions {
  path?: string;
  body?: any;
  expectedStatus?: number | number[];
}

/**
 * Auth client helper for standardized authentication operations in tests
 * Uses agent-based approach for automatic cookie management like a real browser
 */
export class AuthClient {
  private agent?: any;

  constructor(private readonly app: INestApplication) {}

  /**
   * Fluent API for making requests to any endpoint (cookies automatically
   * handled)
   */
  get(path: string, options?: Omit<AuthRequestOptions, 'path'>) {
    return this.makeRequest('get', path, options);
  }

  post(path: string, options?: Omit<AuthRequestOptions, 'path'>) {
    return this.makeRequest('post', path, options);
  }

  patch(path: string, options?: Omit<AuthRequestOptions, 'path'>) {
    return this.makeRequest('patch', path, options);
  }

  delete(path: string, options?: Omit<AuthRequestOptions, 'path'>) {
    return this.makeRequest('delete', path, options);
  }

  /**
   * Login and create a session (cookies automatically stored)
   */
  async login(
    email: string,
    pw: string,
    status: number = 200,
  ): Promise<LoginResponse | AuthResponse> {
    return this.authLogin(email, pw, status);
  }

  /**
   * Direct access to auth routes with fluent API
   * Note: login is kept at top-level for TypeScript overload support and
   * frequent usage
   */
  auth = {
    logout: (expectedStatus?: number | number[]) =>
      this.makeRequest('get', AuthRoutes.Logout, { expectedStatus }),

    changePassword: (
      currentPassword: string,
      newPassword: string,
      expectedStatus?: number | number[],
    ) =>
      this.makeRequest('post', AuthRoutes.ChangePassword, {
        body: { currentPassword, newPassword },
        expectedStatus,
      }),

    forgotPassword: (email: string, expectedStatus?: number | number[]) =>
      this.makeRequest('post', AuthRoutes.ForgotPassword, {
        body: { email },
        expectedStatus,
      }),

    resetPassword: (
      token: string,
      newPassword: string,
      expectedStatus?: number | number[],
    ) =>
      this.makeRequest('post', AuthRoutes.ResetPassword, {
        body: { token, newPassword },
        expectedStatus: expectedStatus || 204,
      }),

    validateResetToken: (token: string, expectedStatus?: number | number[]) =>
      this.makeRequest('post', AuthRoutes.ResetTokenStatus, {
        body: { token },
        expectedStatus: expectedStatus || 202,
      }),
  };

  private async authLogin(
    email: string,
    pw: string,
    status: number = 200,
  ): Promise<LoginResponse | AuthResponse> {
    const response = await this.makeRequest('post', AuthRoutes.Login, {
      body: { email, password: pw },
      expectedStatus: status,
    });
    if (status === 200) {
      const cookie = this.formatCookieResponse(response.headers);
      const cookieAttributes = getCookieWithAttributes(
        response.headers,
        'access_token',
      );
      return {
        user: response.body.user,
        accessToken: response.body.accessToken,
        expiresIn: response.body.expiresIn,
        cookie,
        cookieAttributes,
      } as LoginResponse;
    }
    return response;
  }

  /**
   * Reset the session (clears cookies)
   */
  resetSession(): void {
    this.agent = undefined;
  }

  /**
   * Validate auth-related response has expected shape
   */
  validateLoginResponse(response: LoginResponse): void {
    expect(response.user).toBeDefined();
    expect(response.accessToken).toBeDefined();
    expect(response.expiresIn).toBeDefined();
    expect(typeof response.accessToken).toBe('string');
    expect(typeof response.expiresIn).toBe('number');
  }

  private getAgent() {
    if (!this.agent) {
      this.agent = request.agent(this.app.getHttpServer());
    }
    return this.agent;
  }

  private async makeRequest(
    method: 'get' | 'post' | 'patch' | 'delete',
    pathOrBaseRoute: string,
    options: AuthRequestOptions = {},
  ): Promise<AuthResponse> {
    const { path = '', body, expectedStatus = 200 } = options;
    // If path is provided, treat pathOrBaseRoute as base and append path
    // If no path provided, treat pathOrBaseRoute as the full path
    const fullPath = path ? `${pathOrBaseRoute}${path}` : pathOrBaseRoute;
    const agent = this.getAgent();
    let req = agent[method](fullPath);
    if (body) req = req.send(body);
    const expectedStatuses = Array.isArray(expectedStatus)
      ? expectedStatus
      : [expectedStatus];
    const response = await req.expect((res) => {
      if (!expectedStatuses.includes(res.status)) {
        const statusStr = expectedStatuses.join(' or ');
        throw new Error(`Expected status ${statusStr}, got ${res.status}`);
      }
    });

    return {
      status: response.status,
      body: response.body,
      headers: response.headers,
    };
  }

  /**
   * Check if cookies are enabled (some test environments may not use them)
   */
  hasCookies(response: LoginResponse | AuthResponse): boolean {
    if ('cookie' in response) return !!response.cookie;
    if ('headers' in response) return !!response.headers?.['set-cookie'];
    return false;
  }

  private formatCookieResponse(headers: any): string | undefined {
    const cookieValue = extractCookie(headers);
    return cookieValue ? `access_token=${cookieValue}` : undefined;
  }
}
