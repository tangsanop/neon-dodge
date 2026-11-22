# NEON DODGE — built from one prompt

A short video on X about an AI coding agent building a tiny browser game
from a single prompt — and the game itself, built from that very prompt.

## The game

**NEON DODGE** is a neon arcade dodger in one self-contained HTML file
(`game/index.html`, no libraries, no network at runtime):

- Steer a glowing ship with the arrow keys (or the mouse).
- Dodge the falling asteroids, grab the stars for +25 points.
- 3 lives, a score that climbs as you survive, levels that speed up.
- Game-over screen with your score and best, restart with R.

It was playtested in headless Chromium with a scripted steering bot:
a full loop (title → play → game over → restart) runs with zero console
errors.

## The one prompt

> Build a tiny neon arcade game: steer a glowing ship, dodge falling
> asteroids, collect stars for points — 3 lives, score, game over screen.
> One HTML file, no libraries.

## The video

`video/final.mp4` (16:9, 1920×1080, 41 seconds, H.264 + AAC):

1. Hook — "I gave my AI agent ONE prompt."
2. The prompt itself, typed out on screen.
3. The agent working — writing the game, playtesting it in headless Chrome.
4. Real gameplay footage, recorded while the bot played the finished game.
5. The make.fun referral end card from the press pack, with referral code
   `yt1awwmr` typed into its field.

The video was rendered in this session with ffmpeg from the recorded
gameplay and a synthesized chiptune bed (`video/synth.mjs`); the render
steps live in `video/render.sh` and the playtest in `video/playtest.mjs`.

## How to run the game

Open `game/index.html` in any modern browser, or serve the `game/`
folder with any static server and visit it. No build step, no internet
needed while playing.

## The post

The video goes out natively on X from a public account. The exact post
text is in `POST_TEXT.txt`; the post's address goes in `POST.json`
(placeholder until it is posted). `main.ts` copies `POST.json` to the
output directory — that is all it does.

Entered on [make.fun](https://make.fun/?ref=yt1awwmr)
