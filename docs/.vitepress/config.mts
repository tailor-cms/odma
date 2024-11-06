import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'App',
  base: '/',
  description: 'App docs',
  // In order to avoid errors for localhost:8080
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'logo.png',
    search: { provider: 'local' },
    nav: [{ text: 'Home', link: '/' }],
    sidebar: [
      {
        text: 'Development',
        items: [
          {
            text: 'Installation Guide',
            link: '/dev/general/setup',
          },
          {
            text: 'Testing',
            link: '/dev/general/testing',
          },
          {
            text: 'Deploy with Pulumi',
            link: '/dev/general/deployment',
          },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/underscope' }],
  },
});
