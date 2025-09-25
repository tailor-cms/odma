// See https://eslint.nuxt.com/packages/config
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

/** @type {import('eslint').Linter.Config[]} */
export default createConfigForNuxt({
  features: {
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
      braceStyle: '1tbs',
      arrowParens: 'always',
    },
  },
}).append({
  rules: {
    'max-len': ['error', { code: 90, comments: 100, ignoreUrls: true }],
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: {
          max: 4,
        },
        multiline: {
          max: 1,
        },
      },
    ],
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/indent-binary-ops': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}).append({
  files: ['apps/backend/**/*.ts'],
  rules: {
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
  },
});
