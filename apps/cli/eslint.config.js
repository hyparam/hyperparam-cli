import javascript from '@eslint/js'
import globals from 'globals'
import typescript from 'typescript-eslint'
import sharedEslintRules from '../../shared.eslint.config.js'
const { sharedJsRules } = sharedEslintRules

export default [
  {
    ignores: ['public/build/', 'coverage/'],
  },
  {
    plugins: {
      typescript,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    rules: {
      ...javascript.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...sharedJsRules,
    },
  },
]
