import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'nodeTrace',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  splitting: false,
  external: [],
})
