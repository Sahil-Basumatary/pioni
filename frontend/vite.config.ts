/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // E2E and keyless local boots must not crash on Clerk. Production still requires a real key.
  const stubClerk =
    mode === 'e2e' ||
    (mode !== 'production' && mode !== 'test' && !env.VITE_CLERK_PUBLISHABLE_KEY)
  return {
    plugins: [
      react(),
      compression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 1024,
        logLevel: 'silent',
        skipIfLargerOrEqual: true,
      }),
      ...(process.env.ANALYZE === 'true'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    resolve: stubClerk
      ? {
          alias: {
            '@clerk/clerk-react/errors': fileURLToPath(
              new URL('./src/test/clerkErrorsStub.ts', import.meta.url),
            ),
            '@clerk/clerk-react': fileURLToPath(
              new URL('./src/test/clerkStub.tsx', import.meta.url),
            ),
          },
        }
      : undefined,
    build: {
      target: 'es2020',
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      pool: 'threads',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/main.tsx', 'src/test/**'],
        thresholds: {
          statements: 24,
          branches: 17,
          functions: 26,
          lines: 23,
        },
      },
    },
  }
})
