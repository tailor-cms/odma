// Helper to extract full response
export function extractFullResponse(res) {
  return res?.data || {};
}

// Helper to extract data from API response format
export function extractData(res) {
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
}

// Helper to extract pagination info
export function extractPaginationMeta(res) {
  const response = extractFullResponse(res);
  return response?.meta?.pagination || null;
}

// Helper to get error information
export function getErrorInfo(error) {
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
