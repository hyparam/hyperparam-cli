const sharedJsRules = {
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
}

const sharedTsRules = {
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/no-unused-vars': 'warn',
}

module.exports = { sharedJsRules, sharedTsRules }
