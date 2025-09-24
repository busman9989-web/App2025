// packages/api/tsup.config.ts (FINALIZED)

import { defineConfig } from 'tsup';

export default defineConfig({
  // EXPLICITLY list ALL primary entry points that tsup should compile.
  entry: [
    'src/server.ts',          // Main API entry point
    'src/seed.ts',            // Seeding script
    'src/resource.routes.ts', // Your resource routes file
    // Add any other top-level route files here (e.g., 'src/auth.routes.ts' if it exists)
  ],
  outDir: 'dist',
  format: ['cjs'],
  target: 'es2021',
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['bcryptjs'], // Keep externalizing bcryptjs for now
  // Explicitly tell tsup to use your tsconfig.json for compilation settings and path aliases
  tsconfig: './tsconfig.json',
});