// Zero-dependency static server for the production build (dist/), with SPA
// fallback so deep links like /farmer/market work. Run `npm run serve`.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^([/\\])+/, "");
  let file = join(root, path);
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a file");
  } catch {
    file = join(root, "index.html"); // client-side route
  }
  try {
    const body = await readFile(file);
    const cache = file.includes(`${join("dist", "assets")}`) ? "public, max-age=31536000, immutable" : "no-cache";
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream", "Cache-Control": cache }).end(body);
  } catch {
    res.writeHead(500).end("Build not found — run `npm run build` first.");
  }
}).listen(port, () => console.log(`AgriCluster running at http://localhost:${port}`));
