/**
 * Auto-generated axios-based API client
 * Generated from: 2025-10-10T10:22:59.435Z
 * Usage:
 *   import { createApiClient } from 'app-api-client'
 *   const api = await createApiClient({ axiosClient })
 *   const userData = await api.auth.login({ body: { email, password } })
 */

export async function createApiClient(opts = {}) {
  const { axiosClient, ...otherOpts } = opts;

  if (!axiosClient) {
    throw new Error('axiosClient is required for API client');
  }

  // Helper to extract full response
  function extractFullResponse(res) {
    return res?.data || {};
  }

  // Helper to extract data from API response format
  function extractData(res) {
    const response = extractFullResponse(res);
    if (response.success && response.data !== undefined) return response.data;
    // Handle error responses
    if (!response.success && response.error) {
      const error = new Error(response.error.message || 'API Error');
      error.code = response.error.code;
      error.type = response.error.type;
      error.details = response.error.details;
      error.meta = response.meta;
      throw error;
    }
    // Return response directly if not in standard format
    return response;
  }

  // Helper to extract pagination info
  function extractPaginationMeta(res) {
    const response = extractFullResponse(res);
    return response?.meta?.pagination || null;
  }

  // Build axios request config from API client request
  function buildAxiosConfig(request, path, method) {
    const config = {
      url: path,
      method: method.toLowerCase(),
    };
    if (request?.body) {
      config.data = request.body;
    }
    if (request?.query) {
      config.params = request.query;
    }
    if (request?.path) {
      // Replace path parameters in URL
      let finalPath = path;
      for (const [key, value] of Object.entries(request.path)) {
        finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
      }
      config.url = finalPath;
    }
    return config;
  }

  // Initialize namespace groups
  const index = {
    auth: {},
    currentUser: {},
    health: {},
    user: {},
    _axiosClient: axiosClient,
    extractData,
    extractFullResponse,
    extractPaginationMeta,
  };

  // Generate axios-based methods
  // User login
  index.auth.login = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/auth/login', 'POST');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.login.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/auth/login', 'POST');
    return await axiosClient.request(axiosConfig);
  };
  // User logout
  index.auth.logout = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/auth/logout', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.logout.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/auth/logout', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Change current password
  index.auth.changePassword = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/change-password',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.changePassword.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/change-password',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Request password reset
  index.auth.forgotPassword = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/forgot-password',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.forgotPassword.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/forgot-password',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Reset password with token
  index.auth.resetPassword = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.resetPassword.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Validate reset token
  index.auth.validateResetToken = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password/token-status',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.auth.validateResetToken.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password/token-status',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Get current user profile
  index.currentUser.get = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/me', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.currentUser.get.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/me', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Update user profile
  index.currentUser.update = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/me', 'PATCH');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.currentUser.update.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/me', 'PATCH');
    return await axiosClient.request(axiosConfig);
  };
  // List users (Admin only)
  index.user.fetch = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.fetch.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Create or invite user (Admin only)
  index.user.create = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users', 'POST');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.create.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users', 'POST');
    return await axiosClient.request(axiosConfig);
  };
  // Get user by ID (Admin only)
  index.user.get = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.get.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Update user by ID
  index.user.update = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'PATCH');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.update.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'PATCH');
    return await axiosClient.request(axiosConfig);
  };
  // Delete user (Admin only)
  index.user.remove = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'DELETE');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.remove.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/users/{id}', 'DELETE');
    return await axiosClient.request(axiosConfig);
  };
  // Restore soft-deleted user (Admin only)
  index.user.restore = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/restore',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.restore.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/restore',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Reinvite user (Admin only)
  index.user.reinvite = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/reinvite',
      'POST',
    );
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.user.reinvite.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/reinvite',
      'POST',
    );
    return await axiosClient.request(axiosConfig);
  };
  // Basic health check
  index.health.healthCheck = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/healthcheck', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.health.healthCheck.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/healthcheck', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Liveness probe
  index.health.liveness = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/health/live', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.health.liveness.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/health/live', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  // Readiness probe
  index.health.readiness = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/health/ready', 'GET');
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response),
    };
  };
  // Add raw method that returns full axios response
  index.health.readiness.raw = async (request = {}) => {
    const axiosConfig = buildAxiosConfig(request, '/health/ready', 'GET');
    return await axiosClient.request(axiosConfig);
  };
  return index;
}

export default createApiClient;
