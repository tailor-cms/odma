import type { User } from '@app/interfaces/user';

import { auth as api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const strategy = ref<string | null>(null);

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isDefaultUser = computed(() => user.value?.role === 'USER');

  const isOidcActive = computed(() => strategy.value === 'oidc');

  function $reset(
    userData: User | null = null,
    authStrategy: string | null = null,
  ) {
    user.value = userData;
    strategy.value = authStrategy;
  }

  function login(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    return api.login(credentials).then(({ user, authData }) => {
      $reset(user, authData?.strategy || 'local');
    });
  }

  function logout() {
    return api.logout().then(() => $reset());
  }

  function forgotPassword({ email }: { email: string }) {
    return api.forgotPassword(email);
  }

  function resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    return api.resetPassword(token, password);
  }

  function changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    return api.changePassword(currentPassword, newPassword);
  }

  function fetchUserInfo() {
    return api
      .getUserInfo()
      .then(({ user, authData }) => $reset(user, authData?.strategy || 'local'))
      .catch(() => $reset());
  }

  function updateInfo(payload: any) {
    return api
      .updateUserInfo(payload)
      .then(({ data }) => (user.value = data.user));
  }

  return {
    user,
    isAdmin,
    isDefaultUser,
    isOidcActive,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    fetchUserInfo,
    updateInfo,
    $reset,
  };
});
