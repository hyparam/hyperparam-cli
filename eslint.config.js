import javascript from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import globals from 'globals'
import typescript from 'typescript-eslint'

export default typescript.config(
  { ignores: ['coverage/', 'dist/', 'lib/'] },
  {
    extends: [javascript.configs.recommended, ...typescript.configs.strictTypeChecked, ...typescript.configs.stylisticTypeChecked],
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      ...javascript.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      // javascript
      'arrow-spacing': 'error',
      camelcase: 'off',
      'comma-spacing': 'error',
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      'eol-last': 'error',
      eqeqeq: 'error',
      'func-style': ['error', 'declaration'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'key-spacing': 'error',
      'no-constant-condition': 'off',
      'no-extra-parens': 'error',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-trailing-spaces': 'error',
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'object-curly-spacing': ['error', 'always'],
      'object-shorthand': 'error',
      'prefer-const': 'warn',
      'prefer-destructuring': ['warn', {
        object: true,
        array: false,
      }],
      'prefer-promise-reject-errors': 'error',
      quotes: ['error', 'single'],
      'require-await': 'warn',
      semi: ['error', 'never'],
      'sort-imports': ['error', {
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      }],
      'space-infix-ops': 'error',
      // typescript
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/require-await': 'warn',
      // react hooks
      'react-hooks/exhaustive-deps': 'error',
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['test/**/*.{ts,tsx}', '*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.js'],
    ...typescript.configs.disableTypeChecked,
  },
  {
    files: ['bin/**/*.js', 'test/bin/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    extends: [
      ...storybook.configs['flat/recommended'],
    ],
    files: ['**/*.stories.tsx'],
  }
)
