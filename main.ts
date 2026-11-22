// Entry program for the make.fun bounty
// "The agent builds a game from one prompt".
// It copies POST.json from this repository into the output directory.
// Nothing else: no network, no clock, no files outside the repository.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? ".";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";

const src = join(botDir, "POST.json");
// Fail loudly instead of copying a broken post file: it must be a JSON
// object with a url string. The copy itself stays byte for byte.
const parsed = JSON.parse(readFileSync(src, "utf8"));
if (typeof parsed !== "object" || parsed === null || typeof parsed.url !== "string") {
  throw new Error("POST.json must be a JSON object with a url string");
}

mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "POST.json"));
