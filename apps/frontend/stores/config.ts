import camelCase from 'lodash/camelCase';
import { computed } from 'vue';

interface ConfigCookie {
  oidcEnabled?: boolean;
  oidcLoginText?: string;
  oidcLogoutEnabled?: boolean;
  [key: string]: any;
}

export const useConfigStore = defineStore('config', () => {
  const rawConfig = ref({});
  const config = reactive<ConfigCookie>({});

  const oidcLoginText = computed(
    () => config.oidcLoginText ?? 'Sign in with SSO',
  );

  function getConfig() {
    const cookie = useCookie<ConfigCookie | undefined>('config');
    rawConfig.value = cookie.value ?? {};
    if (!cookie.value) return;
    Object.entries(cookie.value).forEach(([key, value]) => {
      const parsedKey = camelCase(key.replace('NUXT_PUBLIC_', ''));
      config[parsedKey] = value;
    });
    cookie.value = undefined;
  }

  return {
    getConfig,
    props: readonly(config),
    rawProps: readonly(rawConfig),
    oidcLoginText,
  };
});
