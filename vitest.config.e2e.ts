import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    // Nest/class-transformer decorators need Reflect.getMetadata; main.ts gets it via @nestjs/core.
    setupFiles: ['reflect-metadata'],
    include: ['**/*.e2e-spec.ts'],
  },
});
