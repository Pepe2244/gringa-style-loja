module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    'prettier'
  ],
  rules: {
    // Ajustes de regras específicos do projeto
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  },
  ignorePatterns: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts']
};
