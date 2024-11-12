import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['coverage/', 'dist/', 'es/'] },
  {
    settings: { react: { version: '18.3' } },
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      /// ^ from vite default configuration
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'arrow-spacing': 'error',
      camelcase: 'off',
      'comma-spacing': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': 'error',
      eqeqeq: 'error',
      'func-style': ['error', 'declaration'],
      indent: ['error', 2],
      'no-constant-condition': 'off',
      'no-extra-parens': 'error',
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'object-curly-spacing': ['error', 'always'],
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

      '@typescript-eslint/restrict-template-expressions': 'off',
    },
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
    ...tseslint.configs.disableTypeChecked,
  },
)
