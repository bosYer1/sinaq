import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      'src/components/clubs/ClubDetail.tsx',
      'src/app/klub/[slug]/error.tsx',
    ],
    rules: {
      // These two routes intentionally force a full document navigation to avoid
      // stale RSC/client-router state on mobile Safari after a runtime failure.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    files: ['src/app/admin/actions.ts'],
    rules: {
      // Supabase's hand-maintained RPC definition still needs one narrow cast at
      // the RPC call boundary; the payload is validated before it reaches here.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
