#!/usr/bin/env node
/**
 * Hard rule enforcement: no hardcoded CSS values in components/routes.
 * Allowed locations: src/styles.css, *.css files, SVG `viewBox`/`d` attrs.
 *
 * Bans (in src/**\/*.{ts,tsx}, excluding tests + generated files):
 *   - Hex color literals: #fff, #cc785c, #181715, #ff112233 etc.
 *   - Tailwind arbitrary lengths: w-[340px], h-[72px], text-[14px]
 *   - Tailwind arbitrary colors:  bg-[#cc785c], text-[#181715]
 *   - Inline style={{ ... }} object literals (also caught by ESLint, double-checked here)
 *
 * Exit non-zero on any hit. Used in `pnpm validate`.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../src", import.meta.url));

const SKIP_FILES = new Set([
  "routeTree.gen.ts",
]);

const SKIP_PATH_FRAGMENTS = [
  `${sep}__tests__${sep}`,
  `${sep}icons${sep}BrandIcons.tsx`,
  // shadcn/ui primitives are vendored upstream — they use a fixed set of
  // arbitrary Tailwind values (ring-[3px], top-[50%], w-[8rem]) that are
  // idiomatic to shadcn. We accept them rather than diverging from the
  // upstream templates. Our own components must still comply.
  `${sep}components${sep}ui${sep}`,
];

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;
const TW_ARB_PX = /\b\w+-\[\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|svh|svw)\]/g;
const TW_ARB_COLOR = /\b\w+-\[#[0-9a-fA-F]{3,8}\]/g;
const INLINE_STYLE = /style=\{\{/g;

const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    if (SKIP_PATH_FRAGMENTS.some((frag) => full.includes(frag))) continue;
    await scan(full);
  }
}

async function scan(file) {
  const src = await readFile(file, "utf8");
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    // Respect explicit per-line opt-outs for genuinely-dynamic values
    // (e.g. lazy-loaded CodeMirror inner height passed via style prop):
    //   `style={{ width: w }} // check-no-magic-css-allow`
    if (line.includes("check-no-magic-css-allow")) return;

    // Skip lines that look like SVG path data ("d=") or viewBox attributes,
    // and tolerate hex colors in pure SVG fill/stroke attributes if any creep
    // into icon files. We deny everywhere else.
    const stripped = line
      .replace(/d="[^"]*"/g, "")
      .replace(/viewBox="[^"]*"/g, "");

    const hexMatches = stripped.match(HEX_COLOR);
    if (hexMatches) {
      for (const m of hexMatches) {
        violations.push({ file, line: i + 1, kind: "hex-color", value: m });
      }
    }
    const arbPxMatches = stripped.match(TW_ARB_PX);
    if (arbPxMatches) {
      for (const m of arbPxMatches) {
        violations.push({ file, line: i + 1, kind: "tw-arb-length", value: m });
      }
    }
    const arbColorMatches = stripped.match(TW_ARB_COLOR);
    if (arbColorMatches) {
      for (const m of arbColorMatches) {
        violations.push({ file, line: i + 1, kind: "tw-arb-color", value: m });
      }
    }
    const inlineStyleMatches = stripped.match(INLINE_STYLE);
    if (inlineStyleMatches) {
      for (const _m of inlineStyleMatches) {
        violations.push({
          file,
          line: i + 1,
          kind: "inline-style",
          value: "style={{...}}",
        });
      }
    }
  });
}

try {
  await stat(ROOT);
} catch {
  console.error(`[check-no-magic-css] src/ not found at ${ROOT}`);
  process.exit(1);
}

await walk(ROOT);

if (violations.length === 0) {
  console.log("[check-no-magic-css] OK — no hardcoded CSS literals in src/");
  process.exit(0);
}

console.error(
  `[check-no-magic-css] FAILED — ${violations.length} hardcoded CSS literal(s) found:\n`,
);
for (const v of violations) {
  const rel = v.file.replace(ROOT, "src");
  console.error(`  ${rel}:${v.line}  [${v.kind}]  ${v.value}`);
}
console.error(
  "\nFix: move tokens into src/styles.css and reference via classes / var(--token).",
);
process.exit(1);
