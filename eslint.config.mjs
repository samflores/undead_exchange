// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
      '@stylistic/no-multiple-empty-lines': ['warn', { 'max': 1 }],
      '@stylistic/comma-dangle': ['warn', 'only-multiline'],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    }
  }
);
