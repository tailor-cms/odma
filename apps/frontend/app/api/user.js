import request from './request';

function fetch(params) {
  return request.get('/users', { params }).then((res) => res.data);
}

function create(data) {
  return request.post('/users', data).then((res) => res.data);
}

function update(data) {
  return request.patch(`/users/${data.id}`, data).then((res) => res.data);
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
