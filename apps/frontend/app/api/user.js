import request from './request';
import {
  extractData,
  extractFullResponse,
  extractPaginationMeta,
} from './helpers';

function fetch(params) {
  return request.get('/users', { params }).then((res) => {
    const fullResponse = extractFullResponse(res);
    const data = extractData(res);
    const pagination = extractPaginationMeta(res);
    return {
      data,
      total: pagination?.total || data?.length || 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
      hasNext: pagination?.has_next || false,
      // Include full response for components that need meta data
      _meta: fullResponse.meta,
    };
  });
}

function create(data) {
  return request.post('/users', data).then(extractFullResponse);
}

function update(data) {
  return request.patch(`/users/${data.id}`, data).then(extractFullResponse);
}

function remove({ id }) {
  return request.delete(`/users/${id}`);
}

function reinvite({ id }) {
  return request.post(`/users/${id}/reinvite`);
}

function restore({ id }) {
  return request.post(`/users/${id}/restore`);
}

export default {
  fetch,
  create,
  update,
  remove,
  reinvite,
  restore,
};
