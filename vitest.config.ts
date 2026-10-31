import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        // Hairline figures load via <script> tags. Tests must not touch the network,
        // so skip loading without printing a stack trace for every render.
        settings: {
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**', // generated shadcn primitives
        'src/types/**',
        'src/data/**', // static catalogues
        'src/**/*.d.ts',
        'src/**/title-paths.ts', // generated glyph outlines
        'src/app/**/opengraph-image.tsx',
        'src/app/**/twitter-image.tsx',
      ],
      // A floor just under today's numbers (90 / 82 / 80): CI fails if coverage erodes.
      thresholds: { statements: 87, lines: 87, branches: 79, functions: 77 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
