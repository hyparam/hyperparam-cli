import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { sharedJsRules, sharedTsRules } from '../../shared.eslint.config.js'

export default tseslint.config(
  { ignores: ['coverage/', 'dist/', 'es/'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: globals.esnext,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...sharedJsRules,
      ...sharedTsRules,
    },
  },
  {
    files: ['test/**/*.{ts}', '*.{js,ts}'],
    languageOptions: {
      ecmaVersion: globals.esnext,
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
