// Enforces the split script budgets from spec 17.6 after `next build`.
//   first-load JS (gzip) excluding the 3D chunk <= 350 KB
//   3D chunk(s) (gzip)                          <= 450 KB
//
// Manifest keys used (Next 16, Turbopack, which has no app-build-manifest.json):
//   .next/server/app/page/react-loadable-manifest.json
//     { [moduleId]: { files: string[] } }  -> every next/dynamic chunk of "/" (the 3D set)
//   .next/server/app/page/build-manifest.json
//     polyfillFiles, rootMainFiles, pagesChunkGroupBootstrapParams["/page"].otherChunks
//   .next/server/app/page_client-reference-manifest.js
//     every "/_next/static/....js" chunk the page and root layout reference
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

export const FIRST_LOAD_LIMIT = 358400;
export const THREE_LIMIT = 460800;

export function computeBudgets({ loadable, firstLoad, sizeOf }) {
  const threeFiles = new Set();
  for (const entry of Object.values(loadable)) {
    for (const f of entry.files ?? []) if (f.endsWith(".js")) threeFiles.add(f);
  }
  const firstLoadFiles = [...new Set(firstLoad)].filter(
    (f) => f.endsWith(".js") && !threeFiles.has(f),
  );
  // An empty list means the manifest shape changed, which would hide a breach.
  if (threeFiles.size === 0) {
    throw new Error("chunk-budget: no 3D files found in the loadable manifest");
  }
  if (firstLoadFiles.length === 0) {
    throw new Error("chunk-budget: no first-load files found");
  }
  const sized = (files) => [...files].map((f) => ({ file: f, bytes: sizeOf(f) }));
  const threeSized = sized(threeFiles);
  const firstLoadSized = sized(firstLoadFiles);
  const sum = (list) => list.reduce((n, e) => n + e.bytes, 0);
  const threeBytes = sum(threeSized);
  const firstLoadBytes = sum(firstLoadSized);
  return {
    threeFiles: threeSized,
    firstLoadFiles: firstLoadSized,
    threeBytes,
    firstLoadBytes,
    ok: firstLoadBytes <= FIRST_LOAD_LIMIT && threeBytes <= THREE_LIMIT,
  };
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const root = path.join(process.cwd(), ".next");
  const pageDir = path.join(root, "server/app/page");
  const loadable = readJson(path.join(pageDir, "react-loadable-manifest.json"));
  const build = readJson(path.join(pageDir, "build-manifest.json"));
  const refs = fs.readFileSync(path.join(root, "server/app/page_client-reference-manifest.js"), "utf8");
  const refFiles = [...refs.matchAll(/\/_next\/(static\/[^"]+?\.js)/g)].map((m) => m[1]);
  const firstLoad = [
    ...(build.polyfillFiles ?? []),
    ...(build.rootMainFiles ?? []),
    ...(build.pagesChunkGroupBootstrapParams?.["/page"]?.otherChunks ?? []),
    ...refFiles,
  ];
  const sizeOf = (f) => zlib.gzipSync(fs.readFileSync(path.join(root, f)), { level: 9 }).length;
  let r;
  try {
    r = computeBudgets({ loadable, firstLoad, sizeOf });
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  for (const [label, list] of [["first-load", r.firstLoadFiles], ["3d", r.threeFiles]]) {
    for (const e of list) console.log(`chunk-budget: ${label} file ${e.file} ${e.bytes} B gzip`);
  }
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`chunk-budget: first-load ${r.firstLoadBytes} B (${kb(r.firstLoadBytes)}) limit ${FIRST_LOAD_LIMIT}`);
  console.log(`chunk-budget: 3d chunk   ${r.threeBytes} B (${kb(r.threeBytes)}) limit ${THREE_LIMIT}`);
  if (!r.ok) {
    console.error("chunk-budget: FAILED, a gzipped script budget is exceeded");
    process.exit(1);
  }
  console.log("chunk-budget: ok");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
