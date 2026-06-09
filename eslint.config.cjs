const coreWebVitals = require('eslint-config-next/core-web-vitals');
const typescript = require('eslint-config-next/typescript');
const prettierConfig = require('eslint-config-prettier');

module.exports = [...coreWebVitals, ...typescript, prettierConfig];
