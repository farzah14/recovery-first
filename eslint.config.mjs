import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const domainRestrictedImports = [
  'next',
  'next/*',
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  '@/app/*',
  '@/components/*',
  '@/features/*',
  '@/hooks/*',
  '@/lib/*',
  '@/providers/*',
];

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: domainRestrictedImports.map((group) => ({
            group: [group],
            message: 'Domain code must remain framework and infrastructure independent.',
          })),
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'supabase/.temp/**',
  ]),
]);
