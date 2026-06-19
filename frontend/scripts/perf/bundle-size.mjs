#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const DIST_DIR = fileURLToPath(new URL("../../dist", import.meta.url));
const REPORTED_EXTENSIONS = new Set([".js", ".css"]);
const CHECK_BUDGET = process.argv.includes("--budget");
const KiB = 1024;

const BUDGETS = {
  totalGzip: 180 * KiB,
  totalBrotli: 160 * KiB,
  assets: [
    { name: "entry chunk", pattern: /^assets\/index-.*\.js$/, gzip: 110 * KiB },
    { name: "trading route", pattern: /^assets\/TradingPage-.*\.js$/, gzip: 65 * KiB },
    { name: "sentiment route", pattern: /^assets\/SentimentPage-.*\.js$/, gzip: 12 * KiB },
    { name: "sentiment chart", pattern: /^assets\/SentimentChart-.*\.js$/, gzip: 5 * KiB },
  ],
};

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

function assertBudget({ rows, gzipTotal, brotliTotal }) {
  const failures = [];

  if (gzipTotal > BUDGETS.totalGzip) {
    failures.push(
      `total gzip ${formatKib(gzipTotal)} exceeds ${formatKib(BUDGETS.totalGzip)}`,
    );
  }

  if (brotliTotal > BUDGETS.totalBrotli) {
    failures.push(
      `total brotli ${formatKib(brotliTotal)} exceeds ${formatKib(BUDGETS.totalBrotli)}`,
    );
  }

  for (const budget of BUDGETS.assets) {
    const matches = rows.filter((row) => budget.pattern.test(row.file));
    if (matches.length === 0) {
      failures.push(`${budget.name} chunk was not found`);
      continue;
    }

    for (const row of matches) {
      if (row.gzipBytes > budget.gzip) {
        failures.push(
          `${budget.name} ${row.file} gzip ${formatKib(row.gzipBytes)} exceeds ${formatKib(budget.gzip)}`,
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error("Performance budget failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log("Performance budget passed.");
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
      rawBytes: raw,
      gzipBytes: gzip,
      brotliBytes: brotli,
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

  if (CHECK_BUDGET) {
    assertBudget({ rows, gzipTotal, brotliTotal });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
