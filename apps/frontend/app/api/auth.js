import request from './request';
import { extractData } from './helpers';

const urls = {
  root: '/auth',
  login: () => `${urls.authRoot}/login`,
  logout: () => `${urls.authRoot}/logout`,
  forgotPassword: () => `${urls.authRoot}/forgot-password`,
  resetPassword: () => `${urls.authRoot}/reset-password`,
  resetTokenStatus: () => `${urls.resetPassword()}/token-status`,
  changePassword: () => `${urls.authRoot}/change-password`,
  profile: () => 'me',
};

function login(credentials) {
  return request.post(urls.login(), credentials).then(extractData);
}

function logout() {
  return request.get(urls.logout()).then(extractData);
}

function forgotPassword(email) {
  return request.post(urls.forgotPassword(), { email }).then(extractData);
}

function resetPassword(token, password) {
  return request
    .post(urls.resetPassword(), { token, newPassword: password })
    .then(extractData);
}

function validateResetToken(token) {
  return request.base
    .post(urls.resetTokenStatus(), { token })
    .then(extractData);
}

function changePassword(currentPassword, newPassword) {
  return request
    .post(urls.changePassword(), { currentPassword, newPassword })
    .then(extractData);
}

function getUserInfo() {
  return request.get(urls.profile()).then(extractData);
}

function updateUserInfo(userData) {
  return request.patch(urls.profile(), userData).then((res) => res.data);
}

export default {
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUserInfo,
  updateUserInfo,
  changePassword,
  validateResetToken,
};
