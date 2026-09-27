// Inlines the single-mode build (dist-single/) into self-contained HTML files:
//   release/AgriCluster.html          complete page — double-click to open, works offline
//   release/artifact/agricluster.html page body only, for publishing as a hosted page
// Run via `npm run build:single`.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = "dist-single";
const html = readFileSync(join(dist, "index.html"), "utf8");
const assets = readdirSync(join(dist, "assets"));
const js = assets.find((f) => f.endsWith(".js"));
const css = assets.find((f) => f.endsWith(".css"));
if (!js || !css || assets.filter((f) => f.endsWith(".js")).length !== 1) {
  throw new Error(`Expected exactly one JS and one CSS file in ${dist}/assets, found: ${assets.join(", ")}`);
}

// Never let bundled code close the inline <script> early.
const script = readFileSync(join(dist, "assets", js), "utf8").replace(/<\/script/gi, "<\\/script");
const style = readFileSync(join(dist, "assets", css), "utf8").replace(/<\/style/gi, "<\\/style");
const favicon = `data:image/svg+xml;base64,${readFileSync(join(dist, "favicon.svg")).toString("base64")}`;

// Function replacers: bundled code contains "$" sequences that string replacers would interpret.
const full = html
  .replace(/<script type="module"[^>]*src="[^"]+"><\/script>/, () => "")
  .replace(/<link rel="stylesheet"[^>]*href="[^"]+">/, () => `<style>${style}</style>`)
  .replace('href="/favicon.svg"', () => `href="${favicon}"`)
  .replace("</body>", () => `<script type="module">${script}</script>\n</body>`);

if (full.includes('src="/assets') || full.includes('href="/assets')) throw new Error("An asset reference was not inlined.");

// Hosted-page variant: the host supplies <html>/<head>/<body>, so emit content only.
const fonts = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*fonts\.(?:googleapis|gstatic)[^>]*>/g)].map((m) => m[0]).join("\n");
const fragment = [
  "<title>AgriCluster</title>",
  '<meta name="description" content="AgriCluster — Small Farms. Shared Resources. Smarter Decisions." />',
  fonts,
  `<style>${style}</style>`,
  '<div id="root"></div>',
  `<script type="module">${script}</script>`,
].join("\n");

mkdirSync("release/artifact", { recursive: true });
writeFileSync("release/AgriCluster.html", full, "utf8");
writeFileSync("release/artifact/agricluster.html", fragment, "utf8");
const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
console.log(`release/AgriCluster.html (${kb(full)})\nrelease/artifact/agricluster.html (${kb(fragment)})`);
