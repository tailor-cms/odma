import { createApiClient, type ApiClient } from 'app-api-client';
import axiosClient from './request';

export { default as client } from './request';

// Pass the axios client to the API client factory
export const apiClient: ApiClient = await createApiClient({
  url: '',
  axiosClient,
});
