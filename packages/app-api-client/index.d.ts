/**
 * TypeScript definitions for axios-based API client
 */
import type { AxiosInstance, AxiosResponse } from 'axios';

// Auto-generated schema types from OpenAPI spec
export interface LoginDto {
  /** User email address */
  email: string;

  /** User password */
  password: string;
}

export interface UserDto {
  id: number;

  email: string;

  role: 'ADMIN' | 'USER';

  firstName: string;

  lastName: string;

  fullName: string;

  label: string;

  imgUrl: string;

  createdAt: string;

  updatedAt: string;

  deletedAt: string;
}

export interface LoginResponseDto {
  user: UserDto;

  /** JWT access token */
  accessToken: string;

  /** Token expiration time in milliseconds */
  expiresInMs: number;
}

export interface ChangePasswordDto {
  /** Current password */
  currentPassword: string;

  /** New password */
  newPassword: string;
}

export interface ChangePasswordResponseDto {
  /** Success message */
  message: string;
}

export interface ForgotPasswordDto {
  /** Email address to send reset link to */
  email: string;
}

export interface ResetPasswordDto {
  /** Password reset token */
  token: string;

  /** New password */
  newPassword: string;
}

export interface UpdateProfileDto {
  /** User email address */
  email?: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User avatar base64 image URL */
  imgUrl?: string;
}

export interface PaginatedUsersDto {
  data: Array<UserDto>;

  /** Total number of items */
  total: number;

  /** Number of items per page */
  limit: number;

  /** Current page number */
  page: number;

  /** Total number of pages */
  totalPages: number;

  /** Has previous page */
  hasPrevious: boolean;

  /** Has next page */
  hasNext: boolean;
}

export interface CreateUserDto {
  /** User email address */
  email: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User role */
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserDto {
  /** User email address */
  email?: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User avatar base64 image URL */
  imgUrl?: string;

  /** User role (admin only) */
  role?: 'ADMIN' | 'USER';
}
// Response wrapper interface
export interface ApiResponse<T = any> {
  statusCode: number;
  headers: any;
  body: {
    success: boolean;
    data: T;
    meta?: {
      pagination?: {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasPrevious: boolean;
        hasNext: boolean;
      };
    };
    error?: any;
  };
  data: T;
}

// Raw method interface
export interface RawMethod<TRequest, TResponse> {
  (request?: TRequest): Promise<AxiosResponse<TResponse>>;
}

// API method interface
export interface ApiMethod<TRequest, TResponse> {
  (request?: TRequest): Promise<ApiResponse<TResponse>>;
  raw: RawMethod<TRequest, TResponse>;
}

// Helper function interfaces
export interface ResponseHelpers {
  extractData(res: AxiosResponse): any;
  extractFullResponse(res: AxiosResponse): any;
  extractPaginationMeta(res: AxiosResponse): any;
}

// Namespace interfaces
export interface AuthNamespace {
  /**
   * User login
   */
  login: ApiMethod<{ body: LoginDto }, LoginResponseDto>;
  /**
   * User logout
   */
  logout: ApiMethod<{}, any>;
  /**
   * Change current password
   */
  changePassword: ApiMethod<
    { body: ChangePasswordDto },
    ChangePasswordResponseDto
  >;
  /**
   * Request password reset
   */
  forgotPassword: ApiMethod<{ body: ForgotPasswordDto }, any>;
  /**
   * Reset password with token
   */
  resetPassword: ApiMethod<{ body: ResetPasswordDto }, any>;
  /**
   * Validate reset token
   */
  validateResetToken: ApiMethod<{}, any>;
}
export interface CurrentUserNamespace {
  /**
   * Get current user profile
   */
  get: ApiMethod<{}, UserDto>;
  /**
   * Update user profile
   */
  update: ApiMethod<{ body: UpdateProfileDto }, UserDto>;
}
export interface HealthNamespace {
  /**
   * Basic health check
   */
  healthCheck: ApiMethod<{}, any>;
  /**
   * Liveness probe
   */
  liveness: ApiMethod<{}, any>;
  /**
   * Readiness probe
   */
  readiness: ApiMethod<{}, any>;
}
export interface UserNamespace {
  /**
   * List users (Admin only)
   */
  fetch: ApiMethod<
    {
      query?: {
        email?: string;
        search?: string;
        includeArchived?: boolean;
        page?: number;
        limit?: number;
        sortBy?:
          | 'id'
          | 'email'
          | 'firstName'
          | 'lastName'
          | 'createdAt'
          | 'updatedAt';
        sortOrder?: 'ASC' | 'DESC';
      };
    },
    Array<UserDto>
  >;
  /**
   * Create or invite user (Admin only)
   */
  create: ApiMethod<{ body: CreateUserDto }, UserDto>;
  /**
   * Get user by ID (Admin only)
   */
  get: ApiMethod<{ path: { id: string } }, UserDto>;
  /**
   * Update user by ID
   */
  update: ApiMethod<{ path: { id: string }; body: UpdateUserDto }, UserDto>;
  /**
   * Delete user (Admin only)
   */
  remove: ApiMethod<{ path: { id: string } }, any>;
  /**
   * Restore soft-deleted user (Admin only)
   */
  restore: ApiMethod<{ path: { id: string } }, UserDto>;
  /**
   * Reinvite user (Admin only)
   */
  reinvite: ApiMethod<{ path: { id: string } }, any>;
}

// Main client interface
export interface ApiClient extends ResponseHelpers {
  auth: AuthNamespace;
  currentUser: CurrentUserNamespace;
  health: HealthNamespace;
  user: UserNamespace;
  _axiosClient: AxiosInstance;
}
// Client creation options
export interface CreateAcOpts {
  axiosClient: AxiosInstance;
  [key: string]: any;
}
export declare function createApiClient(opts: CreateAcOpts): Promise<ApiClient>;
export default createApiClient;
