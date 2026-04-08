import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        characters: 'characters.html',
        chapters: 'chapters.html',
        export: 'export.html',
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
      ],
    },
  },
});
