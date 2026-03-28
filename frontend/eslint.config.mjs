import eslint from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

export default [
  eslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    ignores: ['.nuxt/', '.output/', 'dist/', 'node_modules/', 'cypress/'],
  }
];
