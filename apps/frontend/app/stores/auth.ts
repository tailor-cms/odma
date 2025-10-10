import type { LoginDto, UserDto } from 'app-api-client';

import { apiClient as api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null);
  const strategy = ref<string | null>(null);

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isDefaultUser = computed(() => user.value?.role === 'USER');
  const isOidcActive = computed(() => strategy.value === 'oidc');

  function $reset(
    userData: UserDto | null = null,
    authStrategy: string | null = null,
  ) {
    user.value = userData;
    strategy.value = authStrategy;
  }

  function login(credentials: LoginDto): Promise<void> {
    return api.auth.login({ body: credentials }).then(({ data }) => {
      const userData = data.user;
      const authStrategy = 'local';
      $reset(userData, authStrategy);
    });
  }

  function logout() {
    return api.auth.logout().then(() => $reset());
  }

  function forgotPassword({ email }: { email: string }) {
    return api.auth.forgotPassword({ body: { email } });
  }

  function resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    return api.auth.resetPassword({ body: { token, newPassword: password } });
  }

  function changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    return api.auth.changePassword({ body: { currentPassword, newPassword } });
  }

  function me() {
    return api.currentUser
      .get()
      .then((res) => {
        const authStrategy = 'local';
        $reset(res.data, authStrategy);
      })
      .catch(() => $reset());
  }

  function updateCurrentUser(payload: any) {
    return api.currentUser.update({ body: payload }).then((res) => {
      user.value = res.data;
      return res;
    });
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
    me,
    updateCurrentUser,
    $reset,
  };
});
