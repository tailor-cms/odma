import { createApiClient, type ApiClient } from 'app-api-client';
import axiosClient from './request';

export { default as auth } from './auth';
export { default as user } from './user';
export { default as client } from './request';
export { extractData } from './helpers';

// Pass the axios client to the API client factory
export const apiClient: ApiClient = await createApiClient({
  url: '',
  axiosClient,
});
