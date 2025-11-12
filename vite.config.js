import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/beat_sequencer/', // dit is je repo-naam
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
});