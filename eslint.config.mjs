// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/quotes': ['warn', 'single', { 'avoidEscape': true }],
      '@stylistic/no-multiple-empty-lines': ['warn', { 'max': 1 }],
      '@stylistic/comma-dangle': ['warn', 'only-multiline'],
      '@stylistic/curly-newline': ['warn', 'always'],
      'curly': ['warn', 'all'],
      'sort-imports': ['warn', {
        'ignoreCase': false,
        'ignoreDeclarationSort': false,
        'ignoreMemberSort': false,
        'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
        'allowSeparatedGroups': false
      }],
      '@typescript-eslint/no-unused-vars': ['error', { 'ignoreRestSiblings': true }],
    }
  }
);
