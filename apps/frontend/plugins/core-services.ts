import { useAuthStore } from '@/stores/auth';

export default defineNuxtPlugin({
  hooks: {
    'app:created': () => {
      const authStore = useAuthStore();
      const nuxtApp = useNuxtApp();
      nuxtApp.provide('getCurrentUser', () => authStore.user);
    },
  },
});
