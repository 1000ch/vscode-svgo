import type {FlatXoConfig} from 'xo';

const config: FlatXoConfig = {
  space: 2,
  rules: {
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
  },
};

export default config;
