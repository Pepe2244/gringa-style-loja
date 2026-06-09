/* eslint-disable @typescript-eslint/no-require-imports */
const coreWebVitals = require('eslint-config-next/core-web-vitals');
const typescript = require('eslint-config-next/typescript');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...coreWebVitals,
  ...typescript,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/set-state-in-effect': 'off'
    }
  }
];
