// Frames the Platane/snk output as a strip of the page so it sits on the same
// continuous background as everything else.
//   node scripts/snake-strip.mjs dist/snake-dark.svg dist/snake.svg
import { readFileSync, writeFileSync } from 'node:fs';
import { C, PAGE, defs, card, label, led, nest, strip } from './design.mjs';

const [src, dst] = process.argv.slice(2);
const raw = readFileSync(src, 'utf8');
if (!/<svg\b/.test(raw)) throw new Error(`${src} is not an SVG`);
const layout = JSON.parse(readFileSync(new URL('../assets/layout.json', import.meta.url), 'utf8'));
const { M, W } = PAGE, h = layout.snake.h, cardH = h - 24, cw = W - 2 * M;

const probe = nest(raw, 0, 0, 1000);
const ratio = probe.h / 1000;
const maxW = cw - 64, maxH = cardH - 84;
const w = Math.min(maxW, maxH / ratio);
const n = nest(raw, M + (cw - w) / 2, 58 + (maxH - w * ratio) / 2, w);

let body = defs('sn') + card('sn', M, 0, cw, cardH);
body += label(M + 32, 38, '05.1 — CONTRIBUTION GRAPH, CONSUMED IN REAL TIME', { size: 12 });
body += led(W - M - 40, 34, C.mint, 3.5);
body += label(W - M - 54, 38, 'LIVE', { size: 12, anchor: 'end', color: C.mint });
body += n.el;

writeFileSync(dst, strip({ y0: layout.snake.y, h, glows: layout.glows, seed: 53, body,
  title: 'Contribution snake', desc: 'Animated snake eating the contribution graph.' }));
console.log(`wrote ${dst}`);
