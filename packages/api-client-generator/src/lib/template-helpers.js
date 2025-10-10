import { stripIndent } from 'common-tags';

// Template helpers for code generation
export function generateResponseHelpers() {
  return stripIndent`
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
          finalPath = finalPath.replace(\`{\${key}}\`, encodeURIComponent(value));
        }
        config.url = finalPath;
      }
      return config;
    }
  `;
}

/**
 * Generate a single axios method for an operation
 */
export function generateAxiosMethod(operation) {
  const cleanPath = operation.path.startsWith('/api')
    ? operation.path.substring('/api'.length)
    : operation.path;
  return stripIndent`
    // ${operation.summary || 'No description'}
    index.${operation.namespace}.${operation.method} = async (request = {}) => {
      const axiosConfig =
        buildAxiosConfig(request, '${cleanPath}', '${operation.httpMethod}');
      const response = await axiosClient.request(axiosConfig);
      return {
        statusCode: response.status,
        headers: response.headers,
        body: response.data,
        data: extractData(response)
      };
    };
    // Add raw method that returns full axios response
    index.${operation.namespace}.${operation.method}.raw =
      async (request = {}) => {
        const axiosConfig = buildAxiosConfig(
          request,
          '${cleanPath}',
          '${operation.httpMethod}');
        return await axiosClient.request(axiosConfig);
    };
  `;
}

/**
 * Generate the main client header comment
 */
export function generateClientHeader() {
  return stripIndent`
    /**
     * Auto-generated axios-based API client
     * Generated from: ${new Date().toISOString()}
     * Usage:
     *   import { createApiClient } from 'app-api-client'
     *   const api = await createApiClient({ axiosClient })
     *   const userData = await api.auth.login({ body: { email, password } })
     */`;
}

/**
 * Generate namespace initializers
 */
export function generateNamespaceInitializers(namespaces) {
  if (namespaces.length === 0) return '';
  return namespaces.map((ns) => `    ${ns}: {}`).join(',\n');
}

/**
 * Generate TypeScript definitions header
 */
export function generateTypeDefinitionsHeader() {
  return stripIndent`
    /**
     * TypeScript definitions for axios-based API client
     */
    import type { AxiosInstance, AxiosResponse } from 'axios';`;
}

/**
 * Generate base TypeScript interfaces
 */
export function generateBaseInterfaces() {
  return stripIndent`
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
    }`;
}

/**
 * Generate success message
 */
export function printSuccessMessage(operations, namespaces, clientDir, config) {
  console.log(`\n${config.Messages.Success}`);
  console.log('\n📁 Generated files:');
  console.log(` • ${clientDir}/${config.ClientJsFile} (axios-based client)`);
  console.log(` • ${clientDir}/${config.ClientTypesFile} (TS definitions)`);
  console.log('\n🏷️  Namespaces created:');
  namespaces.forEach((ns) => {
    const count = operations.filter((op) => op.namespace === ns).length;
    console.log(` • ${ns} (${count} methods)`);
  });
  console.log('\n📚 Usage example:');
  console.log(`import { createApiClient } from 'app-api-client';`);
  console.log(`import axiosClient from './request';`);
  console.log('const api = await createApiClient({ axiosClient });');
  console.log('await api.auth.login({ body: { email, password } });');
}

export default {
  generateResponseHelpers,
  generateAxiosMethod,
  generateClientHeader,
  generateNamespaceInitializers,
  generateTypeDefinitionsHeader,
  generateBaseInterfaces,
  printSuccessMessage,
};
