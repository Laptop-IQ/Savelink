import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // React + router rarely change -> their own long-cached chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
            return "react-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
