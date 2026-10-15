import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        destinations: resolve(__dirname, "destinations.html"),
        experiences: resolve(__dirname, "experiences.html"),
        guides: resolve(__dirname, "guides.html"),
      },
    },
  },
});