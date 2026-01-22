import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/wxcc-widget-holdtimer.ts',
      name: 'WxccWidgetHoldTimer',
      fileName: () => 'index.js',
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        format: 'iife',
        name: 'WxccWidgetHoldTimer',
        globals: {},
        extend: true
      }
    },
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});