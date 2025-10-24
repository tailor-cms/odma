import axios, { Axios } from 'axios';
import buildFullPath from 'axios/unsafe/core/buildFullPath';

// Helper to get error information
export function getErrorInfo(error: any) {
  const data = error?.response?.data;
  if (data.error) {
    return {
      code: data.error.code,
      type: data.error.type,
      message: data.error.message,
      details: data.error.details,
      statusCode: data.meta?.statusCode || error.response.status,
    };
  }
  // Fallback for network errors
  return {
    code: 'NETWORK_ERROR',
    type: 'NetworkError',
    message: error.message || 'Network error occurred',
    statusCode: error.response?.status || 0,
  };
}

Axios.prototype.submitForm = function (url, fields, options) {
  const action = buildFullPath(this.defaults.baseURL, url);
  return Promise.resolve(submitForm(action, fields, options));
};

const config = {
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
};

// Instance of axios to be used for all API requests.
const client = axios.create(config);

// Attach additional instance without interceptors
Object.defineProperty(client, 'base', {
  get() {
    if (!this.base_) this.base_ = axios.create(config);
    return this.base_;
  },
});

const isAuthError = (err: any) => {
  const status = err.response?.status;
  return [401, 403].includes(status);
};

const isRateLimitError = (err: any) => {
  const status = err.response?.status;
  return status === 429;
};

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (isAuthError(err)) {
      const isAuthenticated = useCookie('is-authenticated');
      isAuthenticated.value = false;
      // Remove trailing slash for consistency
      const pathname = window.location.pathname.replace(/\/$/, '');
      const authRoute = '/auth';
      if (
        pathname === authRoute ||
        err?.meta?.path === '/api/auth/change-password'
      )
        throw err;
      if (import.meta.server) navigateTo(authRoute);
      window.location.replace(authRoute);
      throw err;
    }
    const errInfo = getErrorInfo(err);
    // Handle rate limiting errors
    if (isRateLimitError(err)) {
      console.warn('Rate limit exceeded:', errInfo);
    }
    // Enhance error object with semantic information
    err.errorCode = errInfo.code;
    err.errorType = errInfo.type;
    err.semanticMessage = errInfo.message;
    err.errorDetails = errInfo.details;
    throw err;
  },
);

export default client;

function submitForm(action, fields = {}, options) {
  const form = document.createElement('form');
  Object.assign(form, { method: 'POST', target: 'blank', action }, options);
  Object.entries(fields).forEach(([name, attrs]) => {
    const input = document.createElement('input');
    Object.assign(input, { name }, attrs);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
