import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // UPDATE THIS: Point to your widget's TypeScript file
      entry: './src/wxcc-widget-template.ts',
      
      // UPDATE THIS: Your widget's class name
      name: 'WxccWidgetTemplate',
      
      // Output filename (keep as index.js for easy deployment)
      fileName: () => 'index.js',
      
      // IIFE format for browser compatibility
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        format: 'iife',
        name: 'WxccWidgetTemplate',  // UPDATE THIS: Match your class name
        globals: {},
        extend: true
      }
    },
    // Output to dist folder
    outDir: 'dist',
    
    // Minify for production
    sourcemap: false,
    minify: 'terser'
  }
});
