// Generates every static SVG in /assets from the SIGNAL design system.
//   npm install && npm run build
// Icons are inlined from the `simple-icons` package so the README never
// depends on a third-party icon CDN at render time.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as si from 'simple-icons';
import {
  C, FONT, T, svg, defs, card, label, text, chips, packet, led, para, monoW, esc,
} from './design.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });
const files = {};
const emit = (name, content) => { files[name] = content; writeFileSync(join(OUT, name), content.replace(/\n\s*\n/g, '\n')); };

// ── icons ────────────────────────────────────────────────────────────────────
const CUSTOM = { // hand-drawn 24×24 glyphs for tools simple-icons doesn't ship
  sql: '<ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" fill="none" stroke="currentColor" stroke-width="2"/>',
  chroma: '<circle cx="8.5" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15.5" cy="12" r="6" fill="currentColor" opacity=".55"/>',
  playwright: '<path d="M3 6.5 12 3l9 3.5v6.2c0 4.6-3.8 7.6-9 8.3-5.2-.7-9-3.7-9-8.3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>',
  matlab: '<path d="M2 17 8 13l3 2 5-11 6 15-4-2-3 4-4-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  powerbi: '<rect x="3" y="13" width="4.5" height="8" rx="1" fill="currentColor" opacity=".5"/><rect x="9.75" y="8" width="4.5" height="13" rx="1" fill="currentColor" opacity=".75"/><rect x="16.5" y="3" width="4.5" height="18" rx="1" fill="currentColor"/>',
  embeddings: '<circle cx="5" cy="6" r="2.2" fill="currentColor"/><circle cx="18" cy="5" r="2.2" fill="currentColor"/><circle cx="12" cy="13" r="2.6" fill="currentColor"/><circle cx="5" cy="19" r="2.2" fill="currentColor"/><circle cx="19" cy="18" r="2.2" fill="currentColor"/><path d="M5 6l7 7 6-8M12 13l-7 6M12 13l7 5" stroke="currentColor" stroke-width="1.3" opacity=".6"/>',
};
function icon(slug, x, y, size, color = C.text) {
  if (CUSTOM[slug]) return `<g transform="translate(${x} ${y}) scale(${size / 24})" color="${color}">${CUSTOM[slug]}</g>`;
  const ic = si['si' + slug[0].toUpperCase() + slug.slice(1)];
  if (!ic) throw new Error('missing icon ' + slug);
  return `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${ic.path}" fill="${color}"/>`;
}
const brandHex = (slug, fallback = C.cyan) => {
  const ic = si['si' + slug[0].toUpperCase() + slug.slice(1)]; if (!ic) return fallback;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(ic.hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 60 ? fallback : '#' + ic.hex; // near-black brands get the group accent
};

// ── typing effect (pure SMIL, discrete steps → real keystroke feel) ─────────
function typer(p, phrases, x, y, size, { step = 0.075, hold = 1.9, del = 0.028, gap = 0.45, color = C.text } = {}) {
  const cw = size * 0.6; const events = phrases.map(() => []); const all = []; let t = 0;
  phrases.forEach((ph, i) => {
    for (let k = 1; k <= ph.length; k++) { t += step; events[i].push([t, k * cw]); all.push([t, k * cw]); }
    t += hold;
    for (let k = ph.length - 1; k >= 0; k--) { t += del; events[i].push([t, k * cw]); all.push([t, k * cw]); }
    t += gap;
  });
  const total = +t.toFixed(3);
  const anim = (pts) => {
    const seq = [[0, 0], ...pts];
    const kt = seq.map(([s]) => (s / total).toFixed(5)).join(';');
    const vs = seq.map(([, v]) => v.toFixed(2)).join(';');
    return { kt, vs };
  };
  let out = '';
  phrases.forEach((ph, i) => {
    const { kt, vs } = anim(events[i]);
    out += `<clipPath id="${p}-ty${i}"><rect x="${x}" y="${y - size}" width="0" height="${size * 1.4}"><animate attributeName="width" calcMode="discrete" dur="${total}s" repeatCount="indefinite" keyTimes="${kt}" values="${vs}"/></rect></clipPath>`;
    out += `<text clip-path="url(#${p}-ty${i})" x="${x}" y="${y}" font-family="${FONT.mono}" font-size="${size}" fill="${color}" textLength="${monoW(ph, size)}" lengthAdjust="spacingAndGlyphs">${esc(ph)}</text>`;
  });
  const { kt, vs } = anim(all);
  out += `<rect x="${x + 2}" y="${y - size * 0.82}" width="${size * 0.5}" height="${size * 1.02}" rx="2" fill="${C.cyan}">`
    + `<animate attributeName="x" calcMode="discrete" dur="${total}s" repeatCount="indefinite" keyTimes="${kt}" values="${vs.split(';').map((v) => (+v + x + 2).toFixed(2)).join(';')}"/>`
    + `<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="${T.beat * 0.8}s" repeatCount="indefinite"/></rect>`;
  return out;
}

// ── pixel art ────────────────────────────────────────────────────────────────
function pixels(map, x, y, px, palette) {
  let out = '';
  map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (palette[ch]) out += `<rect x="${x + c * px}" y="${y + r * px}" width="${px}" height="${px}" fill="${palette[ch]}"/>`;
  }));
  return out;
}
const HAND = [
  '....oo.........',
  '...oxxo.oo.....',
  '...oxxooxxo.oo.',
  '...oxxooxxooxxo',
  '.oooxxooxxooxxo',
  'oxxoxxooxxooxxo',
  'oxxoxxxxxxxxxxo',
  'oxxxxxxxxxxxxxo',
  '.oxxxxxxxxxxxo.',
  '.oxxxxxxxxxxxo.',
  '..oxxxxxxxxxo..',
  '...oxxxxxxxo...',
  '....ooooooo....',
];
const DOC = [
  'ooooooooo..',
  'oxxxxxxxoo.',
  'oxccccxxooo',
  'oxxxxxxxxxo',
  'oxcccccccxo',
  'oxxxxxxxxxo',
  'oxcccccxxxo',
  'oxxxxxxxxxo',
  'oxccccccxxo',
  'oxxxxxxxxxo',
  'ooooooooooo',
];

// ═════════════════════════════════════════════════════════════════════════════
//  HERO
// ═════════════════════════════════════════════════════════════════════════════
function hero() {
  const W = 1200, H = 620, p = 'h';
  const cx = 948, cy = 300;
  const ell = (rx, ry) => `M${-rx} 0a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  const orbits = [
    { rx: 190, ry: 62, rot: -18, dur: 14, c: C.cyan },
    { rx: 172, ry: 54, rot: 42, dur: 18, c: C.violet },
    { rx: 150, ry: 46, rot: 102, dur: 11, c: C.blue },
  ];
  const nodes = [
    { x: 792, y: 118, k: 'UI', s: 'react' },
    { x: 1110, y: 128, k: 'API', s: 'node' },
    { x: 1112, y: 474, k: 'CLOUD', s: 'aws' },
    { x: 786, y: 482, k: 'AI', s: 'automation' },
  ];
  const hex = (r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');

  let b = defs(p, { animateBrand: true });
  b += `<clipPath id="h-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="28"/></clipPath>`;
  b += `<g clip-path="url(#h-clip)"><rect width="${W}" height="${H}" fill="${C.void}"/>`;
  b += `<rect width="${W}" height="${H}" fill="url(#h-dots)" opacity=".55"/>`;
  b += `<g><circle cx="220" cy="140" r="420" fill="url(#h-glowc)"/><animateTransform attributeName="transform" type="translate" values="0 0;40 26;0 0" dur="${T.slow}s" repeatCount="indefinite"/></g>`;
  b += `<g><circle cx="${cx}" cy="${cy}" r="360" fill="url(#h-glowv)"/><animateTransform attributeName="transform" type="translate" values="0 0;-30 18;0 0" dur="${T.slow * 1.3}s" repeatCount="indefinite"/></g>`;
  b += `<circle cx="560" cy="640" r="300" fill="url(#h-glowb)"/>`;
  // horizon scanline — the page's signature "signal" sweeping the canvas
  b += `<rect x="0" y="0" width="${W}" height="2" fill="url(#h-brand)" opacity=".22"><animate attributeName="y" values="-10;${H + 10}" dur="${T.drift}s" repeatCount="indefinite"/></rect>`;
  b += '</g>';
  b += `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="28" stroke="url(#h-edge)"/>`;

  // top bar
  b += led(78, 58, C.mint, 4.5);
  b += label(98, 63, 'SYSTEM ONLINE', { color: C.dim, size: 14 });
  b += label(270, 63, '·  SANKET.SYS  ·  BUILD 2026.11', { color: C.mute, size: 14 });
  b += label(W - 64, 63, 'SHIRPUR, IN  ⟶  THE CLOUD', { color: C.mute, size: 14, anchor: 'end' });
  b += `<path d="M64 88H${W - 64}" stroke="${C.line}" />`;

  // greeting with pixel hand
  b += `<g transform="translate(66 154)"><g>${pixels(HAND, 0, 0, 3.4, { o: C.cyan, x: '#0E3B4A' })}<animateTransform attributeName="transform" type="rotate" values="0 26 44;16 26 44;-8 26 44;16 26 44;0 26 44;0 26 44" keyTimes="0;.12;.24;.36;.48;1" dur="${T.beat * 3}s" repeatCount="indefinite"/></g></g>`;
  b += text(130, 190, 'Hello, world — I’m', { size: 30, color: C.dim, weight: 500 });

  // name
  b += `<text x="60" y="300" font-family="${FONT.sans}" font-size="112" font-weight="800" letter-spacing="-3" fill="url(#h-brand)" textLength="620" lengthAdjust="spacingAndGlyphs">Sanket Mali</text>`;
  b += `<text x="60" y="300" font-family="${FONT.sans}" font-size="112" font-weight="800" letter-spacing="-3" fill="none" stroke="#fff" stroke-opacity=".08" textLength="620" lengthAdjust="spacingAndGlyphs">Sanket Mali</text>`;

  // identity line
  b += text(64, 356, 'Full-Stack Engineer', { size: 28, color: C.text, weight: 600 });
  b += `<text x="64" y="394" font-family="${FONT.sans}" font-size="22" fill="${C.dim}">MERN <tspan fill="${C.cyan}">/</tspan> AWS Cloud <tspan fill="${C.blue}">/</tspan> DevOps <tspan fill="${C.violet}">/</tspan> Distributed Systems <tspan fill="${C.lilac}">/</tspan> AI</text>`;

  // terminal prompt with typing
  b += `<rect x="64.5" y="430.5" width="612" height="67" rx="16" fill="${C.panel}" stroke="${C.line2}"/>`;
  b += `<circle cx="88" cy="464" r="4" fill="${C.line2}"/><circle cx="102" cy="464" r="4" fill="${C.line2}"/><circle cx="116" cy="464" r="4" fill="${C.line2}"/>`;
  b += `<text x="138" y="472" font-family="${FONT.mono}" font-size="22" fill="${C.cyan}">~$</text>`;
  b += typer(p, [
    'ship MERN apps end-to-end',
    'deploy containers on AWS',
    'design distributed systems',
    'inspect packets in C++17',
    'automate workflows with AI',
  ], 180, 472, 22);

  // meta chips
  b += chips(64, 528, ['B.TECH CSE · NMIMS MPSTME', 'CLASS OF 2027', 'IEEE DELCON 2025'], { size: 14, h: 32, color: C.dim });

  // ── orbital system diagram ──
  b += `<g opacity=".9">`;
  nodes.forEach((n, i) => {
    const path = `M${cx} ${cy}L${n.x} ${n.y}`;
    b += `<path d="${path}" stroke="${C.mute}" stroke-opacity=".55" stroke-dasharray="3 7"/>`;
    b += packet(path, { dur: T.pulse, begin: i * 0.9, color: [C.cyan, C.blue, C.violet, C.lilac][i], r: 2.6 });
    b += packet(`M${n.x} ${n.y}L${cx} ${cy}`, { dur: T.pulse * 1.3, begin: i * 0.9 + 1.7, color: C.text, r: 1.8, tail: false });
  });
  orbits.forEach((o) => {
    b += `<g transform="translate(${cx} ${cy}) rotate(${o.rot})"><path d="${ell(o.rx, o.ry)}" stroke="${C.line2}" stroke-width="1.2"/>`
      + `<g><circle r="5" fill="${o.c}"/><circle r="12" fill="${o.c}" opacity=".18"/><animateMotion dur="${o.dur}s" repeatCount="indefinite" path="${ell(o.rx, o.ry)}"/></g></g>`;
  });
  b += `</g>`;
  b += `<g><circle cx="${cx}" cy="${cy}" r="86" stroke="${C.cyan}" stroke-opacity=".5" stroke-dasharray="2 10" /><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${T.slow * 1.5}s" repeatCount="indefinite"/></g>`;
  b += `<polygon points="${hex(60)}" fill="${C.panel}" stroke="url(#h-brand)" stroke-width="2"/>`;
  b += `<polygon points="${hex(46)}" fill="none" stroke="${C.line2}"/>`;
  b += `<text x="${cx}" y="${cy + 12}" font-family="${FONT.mono}" font-size="34" font-weight="700" fill="url(#h-brand)" text-anchor="middle" textLength="46" lengthAdjust="spacingAndGlyphs">SM</text>`;
  nodes.forEach((n) => {
    const w = monoW(n.k, 13) + 30;
    b += `<rect x="${n.x - w / 2 + .5}" y="${n.y - 17.5}" width="${w - 1}" height="35" rx="10" fill="${C.panel}" stroke="${C.line2}"/>`;
    b += `<circle cx="${n.x - w / 2 + 12}" cy="${n.y}" r="3" fill="${C.mint}"/>`;
    b += label(n.x + 6, n.y + 5, n.k, { size: 13, color: C.text, anchor: 'middle', spacing: 1.5 });
  });
  b += label(W - 64, 584, 'FIG.00 — A SYSTEM IS ONLY AS GOOD AS ITS CONNECTIONS', { size: 11.5, anchor: 'end', spacing: 1.8 });

  emit('hero.svg', svg(W, H, b, { title: 'Sanket Mali — Full-Stack Engineer', desc: 'Animated hero: greeting, name, typing terminal and an orbital system diagram.' }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION HEADER  (module bar with an index, title and a travelling packet)
// ═════════════════════════════════════════════════════════════════════════════
function header(file, idx, title, cmd) {
  const W = 1200, H = 116, p = 's' + idx;
  let b = defs(p);
  b += card(p, 0, 0, W, H, { ticks: false, r: 20 });
  b += `<text x="40" y="78" font-family="${FONT.mono}" font-size="44" font-weight="700" fill="none" stroke="url(#${p}-brand)" stroke-width="1.4" textLength="58" lengthAdjust="spacingAndGlyphs">${idx}</text>`;
  b += `<path d="M120 30V86" stroke="${C.line2}"/>`;
  b += label(146, 46, `SECTION ${idx}`, { size: 13, color: C.cyan });
  b += text(144, 86, title, { size: 34, weight: 750 });
  b += label(W - 40, 46, cmd, { size: 13, anchor: 'end', color: C.mute, spacing: 1 });
  b += `<path d="M560 78H${W - 40}" stroke="${C.line2}" stroke-dasharray="2 6"/>`;
  [0, 1, 2, 3].forEach((i) => b += `<circle cx="${560 + i * ((W - 600) / 3)}" cy="78" r="3" fill="${C.panel2}" stroke="${C.mute}"/>`);
  b += packet(`M560 78H${W - 40}`, { dur: T.pulse * 1.4, color: C.cyan });
  b += packet(`M560 78H${W - 40}`, { dur: T.pulse * 1.4, begin: T.pulse * 0.7, color: C.violet, r: 2.4 });
  emit(file, svg(W, H, b, { title: `${idx} — ${title}`, desc: cmd }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  ABOUT — bento
// ═════════════════════════════════════════════════════════════════════════════
function about() {
  const W = 1200, H = 640, p = 'a';
  let b = defs(p, { animateBrand: true });
  // A — identity
  b += card(p, 0, 0, 744, 384);
  b += `<circle cx="640" cy="80" r="220" fill="url(#a-glowc)"/>`;
  b += label(40, 58, '01.A — IDENTITY');
  b += text(40, 134, 'I engineer full-stack', { size: 52, weight: 800, spacing: -1.2 });
  b += text(40, 194, 'systems — and the', { size: 52, weight: 800, spacing: -1.2 });
  b += `<text x="40" y="254" font-family="${FONT.sans}" font-size="52" font-weight="800" letter-spacing="-1.2" fill="url(#a-brand)">cloud they run on.</text>`;
  b += para(40, 306, 'Computer Science undergrad at NMIMS MPSTME, working across the MERN stack, AWS, DevOps and AI-driven automation — from first commit to production.', { max: 66, size: 19, lh: 1.55 });

  // B — education
  b += card(p, 760, 0, 440, 184);
  b += label(796, 52, '01.B — EDUCATION');
  b += text(796, 98, 'NMIMS MPSTME', { size: 34, weight: 800 });
  b += text(796, 128, 'B.Tech · Computer Science', { size: 19, color: C.dim, weight: 500 });
  const bx = 796, bw = 368, by = 162, prog = 0.86;
  b += `<path d="M${bx} ${by}H${bx + bw}" stroke="${C.line2}" stroke-width="3" stroke-linecap="round"/>`;
  b += `<path d="M${bx} ${by}H${bx + bw * prog}" stroke="url(#a-brand)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${bw}" stroke-dashoffset="${bw}"><animate attributeName="stroke-dashoffset" from="${bw}" to="${bw * (1 - prog)}" dur="2.4s" fill="freeze"/></path>`;
  b += led(bx + bw * prog, by, C.cyan, 3.5);
  b += label(bx, by - 12, '2023', { size: 12 });
  b += label(bx + bw, by - 12, '2027', { size: 12, anchor: 'end' });

  // C — CGPA
  b += card(p, 760, 200, 440, 184);
  b += label(796, 252, '01.C — CGPA');
  b += `<text x="796" y="338" font-family="${FONT.sans}" font-size="80" font-weight="800" letter-spacing="-2" fill="url(#a-brand)">3.47</text>`;
  b += text(970, 338, '/ 4.00', { size: 26, color: C.mute, weight: 600 });
  const R = 46, rc = 2 * Math.PI * R, val = 3.47 / 4;
  b += `<g transform="rotate(-90 1110 292)"><circle cx="1110" cy="292" r="${R}" stroke="${C.line2}" stroke-width="6"/>`
    + `<circle cx="1110" cy="292" r="${R}" stroke="url(#a-brandv)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${rc.toFixed(1)}" stroke-dashoffset="${rc.toFixed(1)}"><animate attributeName="stroke-dashoffset" from="${rc.toFixed(1)}" to="${(rc * (1 - val)).toFixed(1)}" dur="2.4s" fill="freeze"/></circle></g>`;
  b += label(1110, 297, 'GPA', { size: 13, anchor: 'middle', color: C.dim, spacing: 2 });

  // D — research
  b += card(p, 0, 400, 384, 240);
  b += label(36, 452, '01.D — RESEARCH');
  b += `<g>${pixels(DOC, 290, 432, 5, { o: C.violet, x: '#1A1433', c: C.lilac })}</g>`;
  b += text(36, 516, 'IEEE DELCON', { size: 36, weight: 800 });
  b += text(36, 550, '2025 · Published paper', { size: 19, color: C.dim, weight: 500 });
  b += label(36, 604, 'IEEE XPLORE · DOC 11400349 ↗', { size: 13, color: C.cyan, spacing: 1.2 });

  // E — focus
  b += card(p, 400, 400, 520, 240);
  b += label(436, 452, '01.E — FOCUS AREAS');
  const focus = [
    ['Full-stack · MERN', C.cyan], ['Cloud · AWS', C.blue], ['DevOps & distributed systems', C.violet], ['AI & automation', C.lilac],
  ];
  focus.forEach(([t, c], i) => {
    const y = 494 + i * 38;
    b += `<rect x="436" y="${y - 13}" width="14" height="14" rx="3" fill="${c}" opacity=".9"/>`;
    b += text(466, y, t, { size: 22, weight: 600 });
    b += label(884, y, `0${i + 1}`, { size: 13, anchor: 'end' });
  });

  // F — learning
  b += card(p, 936, 400, 264, 240);
  b += label(968, 452, '01.F — LEARNING');
  ['System Design', 'Distributed Systems', 'Cloud Computing'].forEach((t, i) => { b += text(968, 496 + i * 32, t, { size: 19, weight: 600, color: i ? C.dim : C.text }); });
  b += `<rect x="968" y="592" width="200" height="6" rx="3" fill="${C.line2}"/>`;
  b += `<rect x="968" y="592" width="60" height="6" rx="3" fill="url(#a-brand)"><animate attributeName="x" values="968;1108;968" dur="${T.pulse}s" repeatCount="indefinite"/></rect>`;
  b += label(968, 620, 'compiling…', { size: 12, spacing: 1 });

  emit('about.svg', svg(W, H, b, { title: 'About Sanket Mali', desc: 'B.Tech Computer Science at NMIMS MPSTME (2023–2027), CGPA 3.47/4.00, IEEE DELCON 2025 paper; focus on MERN, AWS, DevOps, distributed systems and AI automation.' }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ═════════════════════════════════════════════════════════════════════════════
function box(x, y, w, h, title, sub, { hl = false, p } = {}) {
  return `<rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.panel}" stroke="${hl ? `url(#${p}-brand)` : C.line2}" stroke-width="${hl ? 1.6 : 1}"/>`
    + label(x + 14, y + 25, title, { size: 13, color: hl ? C.cyan : C.text, spacing: 1.4, weight: 600 })
    + (sub ? text(x + 14, y + 47, sub, { size: 14, color: C.mute, weight: 500 }) : '');
}
function features(x, y, list, { size = 18, lh = 34 } = {}) {
  return list.map((f, i) => `<text x="${x}" y="${y + i * lh}" font-family="${FONT.mono}" font-size="${size - 2}" fill="${C.cyan}">▸</text>` + text(x + 22, y + i * lh, f, { size, color: C.dim, weight: 500 })).join('');
}

function smartCampus() {
  const W = 1200, H = 660, p = 'p1';
  let b = defs(p, { animateBrand: true });
  b += card(p, 0, 0, W, H);
  b += `<circle cx="160" cy="80" r="260" fill="url(#${p}-glowc)"/>`;
  b += label(44, 60, '02.1 — FLAGSHIP · MERN · AWS', { color: C.cyan });
  b += text(44, 128, 'Smart Campus', { size: 56, weight: 800, spacing: -1.4 });
  b += `<text x="44" y="190" font-family="${FONT.sans}" font-size="56" font-weight="800" letter-spacing="-1.4" fill="url(#${p}-brand)">Entry Monitoring</text>`;
  b += para(44, 236, 'Real-time gate monitoring for a college campus: biometric terminals in — live dashboards, curfew alerts and parent notifications out.', { max: 48, size: 19 });
  b += features(44, 334, [
    'Biometric sync — eSSL X990 via ADMS push',
    'Auto entry / exit / re-entry state toggle',
    'Curfew violations & warden exit approvals',
    'RBAC: admin · security · warden',
    'Socket.IO live alerts & terminal heartbeat',
    'Email + SMS parent alerts, fire-and-forget',
  ], { size: 17, lh: 33 });
  b += chips(44, 548, ['React 18', 'Vite', 'Node.js', 'Express', 'MongoDB', 'Socket.IO', 'JWT', 'Tailwind', 'Docker', 'AWS ECS'], { size: 13, h: 28, maxW: 480 });

  // diagram panel
  const X = 568, Y = 36, PW = 596, PH = 588;
  b += `<rect x="${X + .5}" y="${Y + .5}" width="${PW - 1}" height="${PH - 1}" rx="18" fill="${C.void}" stroke="${C.line}"/>`;
  b += `<rect x="${X + 1}" y="${Y + 1}" width="${PW - 2}" height="${PH - 2}" rx="18" fill="url(#${p}-grid)" opacity=".7"/>`;
  b += label(X + 22, Y + 34, 'FIG.02 — EVENT PATH', { size: 12 });
  b += led(X + PW - 30, Y + 30, C.mint, 3.5);
  b += label(X + PW - 44, Y + 34, 'LIVE', { size: 12, anchor: 'end', color: C.mint });
  const cols = [X + 24, X + 222, X + 420], bw = 152, bh = 62, rows = [Y + 66, Y + 166, Y + 266];
  const mid = (c, r) => [cols[c] + bw / 2, rows[r] + bh / 2];
  const N = [
    [0, 0, 'BIOMETRIC', 'eSSL X990 · ADMS'], [0, 1, 'GATE DESK', 'SAP ID fallback'], [0, 2, 'ENROLMENT', 'Excel bulk upload'],
    [1, 0, 'AUTH', 'JWT · bcrypt · RBAC'], [1, 1, 'EXPRESS API', 'Helmet · rate-limit', true], [1, 2, 'NOTIFY', 'Nodemailer · SMS'],
    [2, 0, 'MONGODB', 'Mongoose 8'], [2, 1, 'SOCKET.IO', 'live events'], [2, 2, 'DASHBOARDS', 'React · Chart.js'],
  ];
  const [ax, ay] = mid(1, 1);
  const edges = [
    [cols[0] + bw, mid(0, 0)[1], cols[1], ay - 14], [cols[0] + bw, mid(0, 1)[1], cols[1], ay], [cols[0] + bw, mid(0, 2)[1], cols[1], ay + 14],
    [ax, rows[1], ax, rows[0] + bh], [ax, rows[1] + bh, ax, rows[2]],
    [cols[1] + bw, ay - 14, cols[2], mid(2, 0)[1]], [cols[1] + bw, ay, cols[2], ay], [mid(2, 1)[0], rows[1] + bh, mid(2, 2)[0], rows[2]],
  ];
  edges.forEach(([x1, y1, x2, y2], i) => {
    const d = `M${x1} ${y1}C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;
    b += `<path d="${d}" stroke="${C.line2}" stroke-width="1.4"/>`;
    b += packet(d, { dur: 2.4 + (i % 3) * 0.5, begin: i * 0.37, color: [C.cyan, C.blue, C.violet][i % 3], r: 2.8, tail: false });
  });
  N.forEach(([c, r, t, s, hl]) => { b += box(cols[c], rows[r], bw, bh, t, s, { hl, p }); });

  // delivery pipeline
  const PY = Y + 392;
  b += `<path d="M${X + 22} ${PY - 22}H${X + PW - 22}" stroke="${C.line}"/>`;
  b += label(X + 22, PY + 6, 'FIG.03 — DELIVERY PIPELINE', { size: 12 });
  const steps = [['git push', 92], ['GH ACTIONS', 122], ['AMAZON ECR', 122], ['ECS FARGATE', 140]];
  let sx = X + 24; const sy = PY + 28; const pts = [];
  steps.forEach(([t, w], i) => {
    b += `<rect x="${sx + .5}" y="${sy + .5}" width="${w - 1}" height="47" rx="12" fill="${C.panel}" stroke="${i === 3 ? `url(#${p}-brand)` : C.line2}"/>`;
    b += label(sx + w / 2, sy + 29, t, { size: 12.5, anchor: 'middle', color: i === 3 ? C.cyan : C.text, spacing: 1 });
    pts.push([sx, sx + w]); sx += w + 22;
  });
  for (let i = 0; i < pts.length - 1; i++) {
    const d = `M${pts[i][1]} ${sy + 24}H${pts[i + 1][0]}`;
    b += `<path d="${d}" stroke="${C.mute}"/>`;
    b += packet(d, { dur: 1.2, begin: i * 0.4, color: C.cyan, r: 2.4, tail: false });
  }
  b += `<text x="${X + 24}" y="${sy + 92}" font-family="${FONT.mono}" font-size="13" fill="${C.dim}">ALB <tspan fill="${C.mute}">routes</tspan> /api/* <tspan fill="${C.cyan}">→</tspan> backend-tg <tspan fill="${C.mute}">·</tspan> / <tspan fill="${C.cyan}">→</tspan> frontend-tg</text>`;
  b += `<text x="${X + 24}" y="${sy + 118}" font-family="${FONT.mono}" font-size="13" fill="${C.dim}">Nginx <tspan fill="${C.mute}">serves the React build ·</tspan> MongoDB Atlas <tspan fill="${C.mute}">behind it</tspan></text>`;

  emit('project-smart-campus.svg', svg(W, H, b, { title: 'Smart Campus Entry Monitoring System', desc: 'MERN platform with biometric terminal sync, real-time Socket.IO dashboards, RBAC and CI/CD to AWS ECS Fargate.' }));
}

function smartForm() {
  const W = 732, H = 580, p = 'p2';
  let b = defs(p, { animateBrand: true });
  b += card(p, 0, 0, W, H);
  b += `<circle cx="640" cy="120" r="240" fill="url(#${p}-glowv)"/>`;
  b += label(40, 58, '02.2 — AI · RAG · PRIVACY-FIRST', { color: C.lilac });
  const lock = 'NEVER AUTO-SUBMITS';
  const lw = monoW(lock, 12) + lock.length * 1.2 + 44;
  b += `<rect x="${W - 40 - lw + .5}" y="38.5" width="${lw - 1}" height="29" rx="14.5" fill="#0B231C" stroke="${C.mint}" stroke-opacity=".5"/>`;
  b += `<circle cx="${W - 40 - lw + 18}" cy="53" r="3.5" fill="${C.mint}"/>`;
  b += label(W - 40 - lw + 30, 57.5, lock, { size: 12, color: C.mint, spacing: 1.2 });
  b += text(40, 124, 'Smart Form', { size: 50, weight: 800, spacing: -1.2 });
  b += `<text x="40" y="180" font-family="${FONT.sans}" font-size="50" font-weight="800" letter-spacing="-1.2" fill="url(#${p}-brand)">Auto-Filling</text>`;
  b += para(40, 222, 'Reads your own documents, turns them into verified facts, and fills web forms only after you approve each value.', { max: 62, size: 19 });

  // pipeline
  const y = 300, nodes = [['DOCS', 'PDF · scans'], ['OCR', 'RapidOCR'], ['FACTS', 'verified'], ['GRAPH', 'LangGraph'], ['FORM', 'Chrome MV3']];
  const nw = 112, gap = (W - 80 - nw * nodes.length) / (nodes.length - 1);
  nodes.forEach(([t, s], i) => {
    const x = 40 + i * (nw + gap);
    b += `<rect x="${x + .5}" y="${y + .5}" width="${nw - 1}" height="111" rx="14" fill="${C.panel2}" stroke="${i === 4 ? `url(#${p}-brand)` : C.line2}"/>`;
    b += label(x + nw / 2, y + 88, t, { size: 13, anchor: 'middle', color: C.text, spacing: 1.5, weight: 600 });
    b += text(x + nw / 2, y + 104, s, { size: 12, anchor: 'middle', color: C.mute, weight: 500 });
    if (i < nodes.length - 1) {
      const d = `M${x + nw + 4} ${y + 40}H${x + nw + gap - 4}`;
      b += `<path d="${d}" stroke="${C.mute}" stroke-dasharray="2 4"/>`;
      b += packet(d, { dur: 1.4, begin: i * 0.45, color: [C.cyan, C.blue, C.violet, C.lilac][i], r: 2.4, tail: false });
    }
    const gx = x + nw / 2, gy = y + 40;
    if (i === 0) b += pixels(DOC, gx - 22, gy - 24, 4, { o: C.cyan, x: '#0E2A36', c: C.dim });
    if (i === 1) b += `<rect x="${gx - 24}" y="${gy - 22}" width="48" height="44" rx="6" stroke="${C.blue}" stroke-dasharray="6 4"/><rect x="${gx - 26}" y="${gy - 22}" width="52" height="2" fill="${C.cyan}"><animate attributeName="y" values="${gy - 22};${gy + 20};${gy - 22}" dur="2.2s" repeatCount="indefinite"/></rect>`;
    if (i === 2) [0, 1, 2].forEach((k) => { b += `<rect x="${gx - 26}" y="${gy - 20 + k * 15}" width="40" height="8" rx="4" fill="${C.line2}"/><path d="M${gx + 18} ${gy - 16 + k * 15}l3 3 6-7" stroke="${C.mint}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`; });
    if (i === 3) { const pts = [[gx, gy - 20], [gx - 22, gy + 2], [gx + 22, gy + 2], [gx, gy + 22]]; b += `<path d="M${pts[0]}L${pts[1]}M${pts[0]}L${pts[2]}M${pts[1]}L${pts[3]}M${pts[2]}L${pts[3]}" stroke="${C.violet}"/>`; pts.forEach(([a, c]) => b += `<circle cx="${a}" cy="${c}" r="5" fill="${C.panel}" stroke="${C.lilac}" stroke-width="1.6"/>`); }
    if (i === 4) [0, 1, 2].forEach((k) => { const fw = 54; b += `<rect x="${gx - 30}" y="${gy - 22 + k * 16}" width="${fw + 6}" height="11" rx="3" stroke="${C.line2}"/><rect x="${gx - 28}" y="${gy - 20 + k * 16}" width="0" height="7" rx="2" fill="url(#${p}-brand)"><animate attributeName="width" values="0;0;${fw};${fw};0" keyTimes="0;${(0.2 + k * 0.15).toFixed(2)};${(0.35 + k * 0.15).toFixed(2)};.92;1" dur="5s" repeatCount="indefinite"/></rect>`; });
  });

  b += label(40, 450, 'RULES FIRST · LLM FILLS GAPS · SCHEMA-VALIDATED', { size: 12, spacing: 1.4 });
  b += chips(40, 474, ['FastAPI', 'MongoDB', 'ChromaDB', 'LangGraph', 'Celery', 'Redis', 'React 19', 'TypeScript', 'Playwright'], { size: 13, h: 28, maxW: W - 80 });
  emit('project-smart-form.svg', svg(W + 16, H, b, { title: 'Smart Form Auto-Filling System', desc: 'FastAPI + LangGraph + ChromaDB RAG pipeline with a Chrome MV3 extension that fills forms only after user approval.' }));
}

function dpi() {
  const W = 468, H = 580, p = 'p3';
  let b = defs(p);
  b += card(p, 0, 0, W, H);
  b += label(36, 58, '02.3 — SYSTEMS · C++17', { color: C.cyan });
  b += text(36, 124, 'DPI Engine', { size: 50, weight: 800, spacing: -1.2 });
  b += para(36, 166, 'Multi-threaded deep packet inspection: reads PCAPs, extracts TLS SNI, classifies & blocks apps.', { max: 40, size: 18 });
  // thread topology
  const cx = W / 2, y0 = 254;
  const flow = [C.cyan, C.blue, C.violet, C.lilac];
  const fpX = [70, 179, 289, 398], lbX = [124, 344];
  const r = (x, y, w, t, c = C.line2) => `<rect x="${x - w / 2 + .5}" y="${y - 15.5}" width="${w - 1}" height="31" rx="9" fill="${C.panel2}" stroke="${c}"/>` + label(x, y + 4.5, t, { size: 11.5, anchor: 'middle', color: C.text, spacing: 1 });
  const yR = y0, yL = y0 + 64, yF = y0 + 128, yW = y0 + 192;
  fpX.forEach((x, i) => {
    const lb = lbX[i >> 1];
    const d = `M${cx} ${yR + 16}C${cx} ${yR + 46} ${lb} ${yL - 46} ${lb} ${yL - 16}M${lb} ${yL + 16}C${lb} ${yL + 46} ${x} ${yF - 46} ${x} ${yF - 16}M${x} ${yF + 16}C${x} ${yF + 46} ${cx} ${yW - 46} ${cx} ${yW - 16}`;
    b += `<path d="${d}" stroke="${C.line2}"/>`;
    const m = `M${cx} ${yR + 16}C${cx} ${yR + 46} ${lb} ${yL - 46} ${lb} ${yL - 16}L${lb} ${yL + 16}C${lb} ${yL + 46} ${x} ${yF - 46} ${x} ${yF - 16}L${x} ${yF + 16}C${x} ${yF + 46} ${cx} ${yW - 46} ${cx} ${yW - 16}`;
    b += packet(m, { dur: 3.2, begin: i * 0.8, color: flow[i], r: 3, tail: false });
  });
  b += r(cx, yR, 150, 'READER · PCAP');
  lbX.forEach((x, i) => b += r(x, yL, 96, `LB${i}`));
  fpX.forEach((x, i) => b += r(x, yF, 80, `FP${i}`, flow[i]));
  b += r(cx, yW, 150, 'WRITER · PCAP', C.mute);
  b += label(36, yW + 44, 'hash(5-tuple) → same flow, same FP', { size: 12, color: C.mute, spacing: .6 });
  b += chips(36, 520, ['C++17', 'threads', 'TLS SNI', 'PCAP'], { size: 13, h: 28, maxW: W - 72 });
  emit('project-dpi.svg', svg(W, H, b, { title: 'DPI Engine — Packet Analyzer', desc: 'C++17 deep packet inspection with reader, load-balancer and fast-path threads using consistent hashing on the 5-tuple.' }));
}

function metromind() {
  const W = 468, H = 580, p = 'p4';
  let b = defs(p);
  b += card(p, 0, 0, W, H);
  b += label(36, 58, '02.4 — AI · MICROSERVICES', { color: C.lilac });
  b += text(36, 124, 'MetroMind', { size: 50, weight: 800, spacing: -1.2 });
  b += `<text x="${36 + 250}" y="124" font-family="${FONT.sans}" font-size="50" font-weight="800" fill="url(#${p}-brand)">.</text>`;
  b += para(36, 166, 'AI document management: OCR, classification, semantic search and workflows across 13 FastAPI services.', { max: 40, size: 18 });
  const cx = W / 2, cy = 374, R = 112;
  const svcs = ['AUTH', 'DOC', 'OCR', 'AI', 'SRCH', 'NTF', 'INT', 'ANL', 'TASK', 'FLOW', 'SEC', 'BAK', 'RPT'];
  b += `<circle cx="${cx}" cy="${cy}" r="${R}" stroke="${C.line2}" stroke-dasharray="2 5"/>`;
  b += `<g><path d="M${cx} ${cy}L${cx} ${cy - R - 18}A${R + 18} ${R + 18} 0 0 1 ${(cx + (R + 18) * Math.sin(0.7)).toFixed(1)} ${(cy - (R + 18) * Math.cos(0.7)).toFixed(1)}Z" fill="url(#${p}-brandv)" opacity=".16"/><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${T.drift / 2}s" repeatCount="indefinite"/></g>`;
  svcs.forEach((s, i) => {
    const a = (i / svcs.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    b += `<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${C.line}"/>`;
    b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${C.panel2}" stroke="${C.line2}"><animate attributeName="stroke" values="${C.line2};${C.lilac};${C.line2}" dur="${T.drift / 2}s" begin="${((i / svcs.length) * T.drift / 2).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    b += label(x, y + 3.5, s, { size: 8.5, anchor: 'middle', color: C.dim, spacing: 0 });
  });
  b += `<circle cx="${cx}" cy="${cy}" r="42" fill="${C.panel}" stroke="url(#${p}-brand)" stroke-width="1.6"/>`;
  b += label(cx, cy - 2, 'API', { size: 13, anchor: 'middle', color: C.cyan, spacing: 1.5, weight: 600 });
  b += label(cx, cy + 14, 'GATEWAY', { size: 9.5, anchor: 'middle', color: C.mute, spacing: 1 });
  b += chips(36, 520, ['FastAPI', 'PostgreSQL', 'FAISS', 'Grafana'], { size: 13, h: 28, maxW: W - 72 });
  emit('project-metromind.svg', svg(W, H, b, { title: 'MetroMind AI DMS', desc: 'AI-powered document management system: API gateway in front of 13 FastAPI services with OCR, embeddings and real-time notifications.' }));
}

function passguard() {
  const W = 732, H = 580, p = 'p5';
  let b = defs(p, { animateBrand: true });
  b += card(p, 0, 0, W, H);
  b += `<circle cx="120" cy="460" r="260" fill="url(#${p}-glowb)"/>`;
  b += label(40, 58, '02.5 — SECURITY · REAL-TIME', { color: C.cyan });
  b += text(40, 124, 'PassGuard', { size: 50, weight: 800, spacing: -1.2 });
  b += `<text x="40" y="180" font-family="${FONT.sans}" font-size="50" font-weight="800" letter-spacing="-1.2" fill="url(#${p}-brand)">Attack Simulator</text>`;
  b += para(40, 222, 'Scores passwords with entropy maths, then races dictionary, hybrid and brute-force attacks live over WebSockets.', { max: 62, size: 19 });
  // formula + field
  b += `<rect x="40.5" y="292.5" width="270" height="139" rx="16" fill="${C.panel2}" stroke="${C.line2}"/>`;
  b += label(60, 322, 'ENTROPY', { size: 12 });
  b += `<text x="60" y="366" font-family="${FONT.mono}" font-size="28" font-weight="700" fill="url(#${p}-brand)">H = L·log₂(N)</text>`;
  b += `<rect x="60.5" y="384.5" width="230" height="29" rx="8" fill="${C.void}" stroke="${C.line2}"/>`;
  b += `<text x="72" y="405" font-family="${FONT.mono}" font-size="16" fill="${C.dim}" letter-spacing="3">••••••••••</text>`;
  // attack lanes
  const lanes = [['DICTIONARY', '~14M RockYou entries', 0.62, C.cyan], ['HYBRID', '~230 mutations / word', 0.84, C.blue], ['BRUTE FORCE', 'CPU · GPU · cluster', 1, C.violet]];
  lanes.forEach(([t, s, f, c], i) => {
    const y = 300 + i * 46, x = 336, w = 356;
    b += label(x, y + 4, t, { size: 12, color: C.text, spacing: 1.2, weight: 600 });
    b += text(x + w, y + 4, s, { size: 13, color: C.mute, anchor: 'end', weight: 500 });
    b += `<rect x="${x}" y="${y + 14}" width="${w}" height="8" rx="4" fill="${C.line}"/>`;
    const k1 = (i * 0.28).toFixed(2), k2 = (i * 0.28 + 0.3).toFixed(2);
    b += `<rect x="${x}" y="${y + 14}" width="0" height="8" rx="4" fill="${c}"><animate attributeName="width" values="0;0;${w * f};${w * f};0" keyTimes="0;${k1};${k2};.94;1" dur="7s" repeatCount="indefinite"/></rect>`;
  });
  b += text(336, 436, 'Sequential orchestration — stops early on a hit', { size: 14, color: C.mute, weight: 500 });
  b += chips(40, 470, ['Flask-SocketIO', 'MongoDB', 'React 19', 'Recharts', 'Tailwind 4', 'Framer Motion'], { size: 13, h: 28, maxW: W - 80 });
  emit('project-passguard.svg', svg(W + 16, H, `<g transform="translate(16 0)">${b}</g>`, { title: 'PassGuard — Password Strength & Attack Simulation', desc: 'Entropy-based password scoring with live dictionary, hybrid and brute-force attack simulation streamed over Socket.IO.' }));
}

function wanderlust() {
  const W = 1200, H = 320, p = 'p6';
  let b = defs(p, { animateBrand: true });
  b += card(p, 0, 0, W, H);
  b += label(44, 58, '02.6 — FULL-STACK · MARKETPLACE', { color: C.lilac });
  b += text(44, 122, 'Wanderlust', { size: 50, weight: 800, spacing: -1.2 });
  b += para(44, 164, 'Airbnb-style stay booking — listings, maps, Razorpay payments, host messaging, admin moderation and AI helpers.', { max: 58, size: 19 });
  b += chips(44, 238, ['Node.js', 'Express', 'MongoDB', 'EJS', 'Passport', 'Cloudinary', 'Mapbox', 'Razorpay'], { size: 13, h: 28, maxW: 560 });
  // route map
  const X = 660, Y = 28, PW = 512, PH = 264;
  b += `<rect x="${X + .5}" y="${Y + .5}" width="${PW - 1}" height="${PH - 1}" rx="18" fill="${C.void}" stroke="${C.line}"/>`;
  b += `<rect x="${X + 1}" y="${Y + 1}" width="${PW - 2}" height="${PH - 2}" rx="18" fill="url(#${p}-dots)"/>`;
  const pins = [[X + 70, Y + 190], [X + 210, Y + 96], [X + 330, Y + 170], [X + 444, Y + 78]];
  const route = `M${pins[0]}Q${X + 120} ${Y + 90} ${pins[1]}T${pins[2]}T${pins[3]}`;
  b += `<path d="${route}" stroke="url(#${p}-brand)" stroke-width="2" stroke-dasharray="6 6"><animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite"/></path>`;
  b += packet(route, { dur: 6, color: C.cyan, r: 4 });
  pins.forEach(([x, y], i) => {
    b += `<path d="M${x} ${y}c-9-12-14-18-14-25a14 14 0 1 1 28 0c0 7-5 13-14 25z" fill="${C.panel}" stroke="${[C.cyan, C.blue, C.violet, C.lilac][i]}" stroke-width="1.6"/><circle cx="${x}" cy="${y - 25}" r="4.5" fill="${[C.cyan, C.blue, C.violet, C.lilac][i]}"/>`;
  });
  const tag = (x, y, t) => { const w = monoW(t, 12) + 24; return `<rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="27" rx="8" fill="${C.panel2}" stroke="${C.line2}"/>` + label(x + 12, y + 18, t, { size: 12, color: C.dim, spacing: .8 }); };
  b += tag(X + 24, Y + 22, '₹ RAZORPAY CHECKOUT');
  b += tag(X + 270, Y + 214, 'AI · COHERE + GROQ');
  b += tag(X + 360, Y + 120, 'MAPBOX GEO');
  emit('project-wanderlust.svg', svg(W, H, b, { title: 'Wanderlust — stay booking platform', desc: 'Express + MongoDB marketplace with Mapbox, Cloudinary, Razorpay, Passport auth and AI-generated listing content.' }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  TECH ECOSYSTEM
// ═════════════════════════════════════════════════════════════════════════════
function stack() {
  const W = 1200, p = 't', H = 4 * 184 + 3 * 16;
  const groups = [
    // [title, width, items[[slug,label]], accent]
    [['LANGUAGES', 520, [['cplusplus', 'C++'], ['python', 'Python'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['openjdk', 'Java'], ['sql', 'SQL']], C.cyan],
      ['FRONTEND', 664, [['react', 'React'], ['vite', 'Vite'], ['tailwindcss', 'Tailwind'], ['mui', 'Material UI'], ['bootstrap', 'Bootstrap'], ['ejs', 'EJS'], ['chartdotjs', 'Chart.js']], C.blue]],
    [['BACKEND', 600, [['nodedotjs', 'Node.js'], ['express', 'Express'], ['fastapi', 'FastAPI'], ['flask', 'Flask'], ['socketdotio', 'Socket.IO'], ['jsonwebtokens', 'JWT'], ['passport', 'Passport']], C.violet],
      ['DATABASES', 584, [['mongodb', 'MongoDB'], ['postgresql', 'PostgreSQL'], ['mysql', 'MySQL'], ['redis', 'Redis'], ['oracle', 'PL/SQL'], ['chroma', 'ChromaDB']], C.cyan]],
    [['CLOUD & INFRASTRUCTURE', 664, [['amazonwebservices', 'AWS'], ['awsfargate', 'Fargate'], ['amazonecs', 'ECS · ECR'], ['amazonec2', 'EC2'], ['amazons3', 'S3'], ['amazondynamodb', 'DynamoDB'], ['amazoniam', 'IAM'], ['linux', 'Linux']], C.blue],
      ['DEVOPS & MONITORING', 520, [['githubactions', 'Actions'], ['docker', 'Docker'], ['nginx', 'Nginx'], ['prometheus', 'Prometheus'], ['grafana', 'Grafana'], ['celery', 'Celery']], C.violet]],
    [['AI & MACHINE LEARNING', 520, [['langchain', 'LangGraph'], ['huggingface', 'Transformers'], ['embeddings', 'Embeddings'], ['opencv', 'OpenCV'], ['spacy', 'spaCy'], ['googlegemini', 'Gemini']], C.lilac],
      ['TOOLS & PLATFORMS', 664, [['git', 'Git'], ['github', 'GitHub'], ['gnubash', 'Bash'], ['pytest', 'pytest'], ['vitest', 'Vitest'], ['playwright', 'Playwright'], ['wireshark', 'Wireshark'], ['powerbi', 'Power BI']], C.cyan]],
  ];
  let b = defs(p);
  let n = 0;
  groups.forEach((row, ri) => {
    let x = 0; const y = ri * 200;
    row.forEach(([title, w, items, accent]) => {
      n++;
      b += card(p, x, y, w, 184, { ticks: false });
      b += `<rect x="${x + 28}" y="${y + 30}" width="8" height="8" rx="2" fill="${accent}"/>`;
      b += label(x + 46, y + 39, `03.${n} — ${title}`, { size: 13, color: C.dim });
      b += label(x + w - 28, y + 39, String(items.length).padStart(2, '0'), { size: 13, anchor: 'end' });
      items.forEach(([slug, name], i) => {
        const tx = x + 28 + i * 76, ty = y + 62;
        b += `<rect x="${tx + .5}" y="${ty + .5}" width="59" height="59" rx="14" fill="${C.panel2}" stroke="${C.line2}"/>`;
        b += icon(slug, tx + 16, ty + 16, 28, '#DCE3F0');
        b += `<circle cx="${tx + 50}" cy="${ty + 10}" r="2.6" fill="${CUSTOM[slug] ? accent : brandHex(slug, accent)}"/>`;
        b += text(tx + 30, ty + 84, name, { size: 12.5, anchor: 'middle', color: C.mute, family: FONT.mono, weight: 500, fit: name.length > 9 ? 64 : undefined });
      });
      x += w + 16;
    });
  });
  emit('stack.svg', svg(W, H, b, { title: 'Technology ecosystem', desc: 'Languages, frontend, backend, databases, cloud, DevOps, AI/ML and tooling used across Sanket Mali’s projects.' }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  LINK CHIPS, DIVIDER, FOOTER
// ═════════════════════════════════════════════════════════════════════════════
function linkChip(file, slug, name, hint) {
  const W = 280, H = 68, p = 'l' + slug;
  let b = defs(p);
  b += card(p, 0, 0, W, H, { ticks: false, r: 18 });
  b += `<rect x="14.5" y="14.5" width="39" height="39" rx="11" fill="${C.panel2}" stroke="${C.line2}"/>`;
  b += icon(slug, 23, 23, 22, C.text);
  b += text(68, 32, name, { size: 19, weight: 700 });
  b += label(68, 52, hint, { size: 11.5, spacing: 1 });
  b += `<text x="${W - 22}" y="42" font-family="${FONT.mono}" font-size="18" fill="${C.cyan}" text-anchor="end">↗</text>`;
  emit(file, svg(W, H, b, { title: name, desc: hint }));
}
CUSTOM.mail = '<rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="2"/>';
CUSTOM.globe = '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19" fill="none" stroke="currentColor" stroke-width="1.6"/>';
CUSTOM.paper = '<path d="M6 2h9l5 5v15H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 2v6h6M9 13h8M9 17h6" fill="none" stroke="currentColor" stroke-width="2"/>';

function divider() {
  const W = 1200, H = 40, p = 'dv';
  let b = defs(p);
  b += `<path d="M0 20H${W}" stroke="${C.line2}" stroke-dasharray="1 7"/>`;
  [0.25, 0.5, 0.75].forEach((f) => b += `<rect x="${W * f - 4}" y="16" width="8" height="8" transform="rotate(45 ${W * f} 20)" fill="${C.panel2}" stroke="${C.mute}"/>`);
  b += packet(`M0 20H${W}`, { dur: T.drift / 2, color: C.cyan });
  b += packet(`M${W} 20H0`, { dur: T.drift / 2, begin: T.drift / 4, color: C.violet, r: 2.4 });
  emit('divider.svg', svg(W, H, b, { title: 'divider', desc: 'animated packet trace' }));
}

function footer() {
  const W = 1200, H = 300, p = 'f';
  let b = defs(p, { animateBrand: true });
  b += `<clipPath id="f-clip"><rect width="${W}" height="${H}" rx="28"/></clipPath>`;
  b += `<g clip-path="url(#f-clip)"><rect width="${W}" height="${H}" fill="${C.void}"/><rect width="${W}" height="${H}" fill="url(#f-dots)" opacity=".5"/>`;
  b += `<circle cx="${W / 2}" cy="${H + 40}" r="420" fill="url(#f-glowv)"/><circle cx="${W / 2}" cy="${H + 60}" r="260" fill="url(#f-glowc)"/></g>`;
  b += `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="28" stroke="url(#f-edge)"/>`;
  b += label(W / 2, 58, 'END OF TRANSMISSION', { size: 13, anchor: 'middle', color: C.mute, spacing: 4 });
  // signature — the name is drawn as a stroke, then filled
  const sig = `font-family="${FONT.sans}" font-size="84" font-weight="300" font-style="italic" letter-spacing="-1" text-anchor="middle" textLength="520" lengthAdjust="spacingAndGlyphs"`;
  b += `<text x="${W / 2}" y="158" ${sig} fill="url(#f-brand)" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.32;.45;.92;1" dur="9s" repeatCount="indefinite"/>Sanket Mali</text>`;
  b += `<text x="${W / 2}" y="158" ${sig} fill="none" stroke="url(#f-brand)" stroke-width="1.2" stroke-dasharray="1400" stroke-dashoffset="1400"><animate attributeName="stroke-dashoffset" values="1400;0;0;1400" keyTimes="0;.38;.92;1" dur="9s" repeatCount="indefinite"/>Sanket Mali</text>`;
  b += `<path d="M${W / 2 - 230} 184H${W / 2 + 230}" stroke="${C.line2}"/>`;
  b += packet(`M${W / 2 - 230} 184H${W / 2 + 230}`, { dur: T.pulse, color: C.cyan, r: 2.4 });
  b += text(W / 2, 222, 'Thanks for stopping by — let’s build something that scales.', { size: 20, color: C.dim, anchor: 'middle', weight: 500 });
  b += label(W / 2, 262, 'HAND-BUILT SVG · SMIL ANIMATION · REGENERATED BY GITHUB ACTIONS', { size: 11.5, anchor: 'middle', color: C.mute, spacing: 2 });
  emit('footer.svg', svg(W, H, b, { title: 'Signature — Sanket Mali', desc: 'Animated hand-drawn signature footer.' }));
}

// ── run ──────────────────────────────────────────────────────────────────────
hero();
header('section-01.svg', '01', 'whoami', '$ cat ~/about.md');
header('section-02.svg', '02', 'Selected work', '$ ls ~/projects --sort=impact');
header('section-03.svg', '03', 'Technology ecosystem', '$ tree ~/stack -L 2');
header('section-04.svg', '04', 'Telemetry', '$ watch -n 12h github --stats');
header('section-05.svg', '05', 'Signal trace', '$ snake --eat ~/contributions');
about();
smartCampus(); smartForm(); dpi(); metromind(); passguard(); wanderlust();
stack();
linkChip('link-linkedin.svg', 'linkedin', 'LinkedIn', 'CONNECT');
linkChip('link-email.svg', 'mail', 'Email', 'SANKETMALI0909');
linkChip('link-portfolio.svg', 'globe', 'Portfolio', 'SANKETMALI.DEV');
linkChip('link-paper.svg', 'paper', 'IEEE paper', 'DELCON 2025');
divider();
footer();

const total = Object.values(files).reduce((s, f) => s + Buffer.byteLength(f), 0);
console.log(Object.entries(files).map(([k, v]) => `${k.padEnd(28)} ${(Buffer.byteLength(v) / 1024).toFixed(1)} kB`).join('\n'));
console.log(`— ${Object.keys(files).length} files, ${(total / 1024).toFixed(1)} kB total`);
