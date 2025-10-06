import axios, { Axios } from 'axios';
import buildFullPath from 'axios/unsafe/core/buildFullPath';
import { getErrorInfo } from './helpers';

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
      const authRoute = '/auth';
      if (window.location.pathname === authRoute) return;
      if (import.meta.server) return navigateTo(authRoute);
      return window.location.replace(authRoute);
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
