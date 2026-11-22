// Playtest + gameplay recorder for NEON DODGE.
// Serves game/, opens it in headless Chromium, plays it with a simple
// steering bot, captures console errors, screenshots and a video recording.
import { chromium } from "/home/hatch/workspace/makefun/node_modules/playwright-core/index.mjs";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GAME_DIR = path.resolve(__dirname, "..", "game");
const OUT = path.resolve(__dirname);
const MODE = process.argv[2] || "test"; // test | record

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const p = path.join(GAME_DIR, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: "/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: MODE === "record" ? { dir: OUT, size: { width: 1920, height: 1080 } } : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));

  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "shot-title.png") });
  console.log("title state:", await page.evaluate(() => window.render_game_to_text()));

  // deterministic logic check: advance time on the title screen, no crash
  await page.evaluate(() => window.advanceTime(3000));
  console.log("after advanceTime:", await page.evaluate(() => window.render_game_to_text()));

  // start the game
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  console.log("started:", await page.evaluate(() => window.render_game_to_text()));

  // steering bot: dodge the nearest threatening rock, else chase a star
  let held = null;
  const steer = async () => {
    const s = await page.evaluate(() => {
      const g = window.__game;
      return {
        x: g.ship.x, mode: g.mode, score: g.score, lives: g.lives,
        rocks: g.rocks.map(r => ({ x: r.x, y: r.y, r: r.r })),
        stars: g.stars.map(s => ({ x: s.x, y: s.y })),
      };
    });
    if (s.mode !== "playing") return s;
    let dir = 0;
    // push away from every rock in the corridor above the ship
    let push = 0;
    for (const r of s.rocks) {
      if (r.y > s.y - 420 && r.y < s.y + 30) {
        const dx = s.x - r.x;
        const danger = r.r + 46;
        if (Math.abs(dx) < danger) push += (dx >= 0 ? 1 : -1) * (danger - Math.abs(dx));
      }
    }
    if (push !== 0) {
      dir = push > 0 ? 1 : -1;
      if (s.x < 90) dir = 1;
      if (s.x > 870) dir = -1;
    } else {
      const star = s.stars.sort((a, b) => b.y - a.y)[0];
      if (star) dir = star.x > s.x + 12 ? 1 : star.x < s.x - 12 ? -1 : 0;
    }
    const key = dir < 0 ? "ArrowLeft" : dir > 0 ? "ArrowRight" : null;
    if (key !== held) {
      if (held) await page.keyboard.up(held);
      if (key) await page.keyboard.down(key);
      held = key;
    }
    return s;
  };

  const durMs = MODE === "record" ? 26000 : 12000;
  const t0 = Date.now();
  let lastShot = 0, lastLog = 0;
  while (Date.now() - t0 < durMs) {
    const s = await steer();
    if (!s) break;
    const now = Date.now() - t0;
    if (now - lastLog > 3000) {
      lastLog = now;
      console.log(`t=${(now / 1000).toFixed(1)}s score=${s.score} lives=${s.lives} mode=${s.mode} rocks=${s.rocks.length}`);
    }
    if (MODE === "record" && now - lastShot > 8000) {
      lastShot = now;
      await page.screenshot({ path: path.join(OUT, `shot-play-${Math.round(now / 1000)}s.png`) });
    }
    if (s.mode === "over") {
      await page.screenshot({ path: path.join(OUT, "shot-gameover.png") });
      console.log("game over reached, score:", s.score);
      if (MODE === "record") {
        // restart once for a second run inside the recording
        await page.keyboard.press("KeyR");
        await page.waitForTimeout(300);
      } else break;
    }
    await page.waitForTimeout(50);
  }
  if (held) await page.keyboard.up(held);
  console.log("final state:", await page.evaluate(() => window.render_game_to_text()));
  console.log("console errors:", JSON.stringify(errors));
  await page.screenshot({ path: path.join(OUT, "shot-final.png") });
  await ctx.close();
  await browser.close();
  server.close();
  console.log("DONE", MODE);
})().catch(e => { console.error(e); process.exit(1); });
