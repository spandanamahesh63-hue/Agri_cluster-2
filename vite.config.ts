import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Serves the MongoDB API (netlify/functions/api.mts) at /api during `npm run dev`,
// the same way Netlify serves it on the website.
function devApi(env: Record<string, string>): Plugin {
  return {
    name: "agricluster-dev-api",
    apply: "serve",
    configureServer(server) {
      for (const k of ["MONGODB_URI", "MONGODB_DB"]) if (env[k] && !process.env[k]) process.env[k] = env[k];
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const { default: handler } = await server.ssrLoadModule("/netlify/functions/api.mts");
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

// `public/` still holds the legacy prototype (index.html + Express server),
// so static assets for the new app live in `static/` instead.
//
// `vite build --mode single` produces one JS + one CSS file (no lazy chunks)
// in dist-single/, which scripts/make-single.mjs inlines into a single HTML
// file that opens by double-click. See README → "Sharing with judges".
export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    plugins: [react(), tailwindcss(), devApi(loadEnv(mode, process.cwd(), ""))],
    publicDir: "static",
    server: {
      port: 5173,
      // Folders outside the app. Office/browser temp files there lock up the watcher on Windows.
      watch: { ignored: ["**/deck/**", "**/release/**", "**/_backup/**", "**/dist/**", "**/dist-single/**"] },
    },
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
