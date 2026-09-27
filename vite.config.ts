import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `public/` still holds the legacy prototype (index.html + Express server),
// so static assets for the new app live in `static/` instead.
//
// `vite build --mode single` produces one JS + one CSS file (no lazy chunks)
// in dist-single/, which scripts/make-single.mjs inlines into a single HTML
// file that opens by double-click. See README → "Sharing with judges".
export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    plugins: [react(), tailwindcss()],
    publicDir: "static",
    server: { port: 5173 },
    build: single
      ? {
          outDir: "dist-single",
          cssCodeSplit: false,
          assetsInlineLimit: 100_000_000,
          chunkSizeWarningLimit: 2000,
          rolldownOptions: { output: { codeSplitting: false } },
        }
      : { chunkSizeWarningLimit: 600 },
  };
});
