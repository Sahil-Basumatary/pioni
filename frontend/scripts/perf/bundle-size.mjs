#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const DIST_DIR = fileURLToPath(new URL("../../dist", import.meta.url));
const REPORTED_EXTENSIONS = new Set([".js", ".css"]);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return collectFiles(path);
      return [path];
    }),
  );
  return files.flat();
}

function formatKib(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error("dist/ not found - run `npm run build` first.");
    process.exit(1);
  }

  const files = (await collectFiles(DIST_DIR)).filter((file) =>
    REPORTED_EXTENSIONS.has(file.slice(file.lastIndexOf("."))),
  );

  const rows = [];
  let rawTotal = 0;
  let gzipTotal = 0;
  let brotliTotal = 0;

  for (const file of files.sort()) {
    const buffer = await readFile(file);
    const raw = (await stat(file)).size;
    const gzip = gzipSync(buffer, { level: 9 }).length;
    // Brotli at max quality mirrors what the static host serves to browsers.
    const brotli = brotliCompressSync(buffer, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;

    rawTotal += raw;
    gzipTotal += gzip;
    brotliTotal += brotli;

    rows.push({
      file: relative(DIST_DIR, file),
      raw: formatKib(raw),
      gzip: formatKib(gzip),
      brotli: formatKib(brotli),
    });
  }

  console.table(rows);
  console.log("Totals:");
  console.log(`  raw:    ${formatKib(rawTotal)}`);
  console.log(`  gzip:   ${formatKib(gzipTotal)}`);
  console.log(`  brotli: ${formatKib(brotliTotal)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
