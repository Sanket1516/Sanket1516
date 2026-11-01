// ─────────────────────────────────────────────────────────────────────────────
//  SIGNAL — the design system behind github.com/Sanket1516
//  Every SVG in this profile is generated from the tokens below, so the whole
//  page shares one palette, one type scale, one border language and one tempo.
//  Zero dependencies: this module is also imported by the stats workflow.
// ─────────────────────────────────────────────────────────────────────────────

export const C = {
  void: '#05060A',      // deepest background (hero)
  panel: '#0A0D14',     // card surface
  panel2: '#0F131D',    // raised surface / tiles
  line: '#1A2030',      // hairline borders
  line2: '#252D40',     // stronger borders, grid
  text: '#EEF2F8',      // primary text
  dim: '#A7B0C4',       // secondary text
  mute: '#667089',      // tertiary text, labels
  cyan: '#22D3EE',      // signal
  blue: '#3B82F6',      // transport
  violet: '#8B5CF6',    // compute
  lilac: '#B79CFF',     // violet for text on dark
  mint: '#34D399',      // status: online / ok (used sparingly)
};

export const FONT = {
  sans: "'Segoe UI Variable Display','Segoe UI',Inter,-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,'JetBrains Mono','Cascadia Code',Menlo,Consolas,'Liberation Mono',monospace",
};

// Animation tempo — everything breathes on multiples of the same beat.
export const T = { beat: 1.2, pulse: 3.6, drift: 12, slow: 24 };

export const RADIUS = 22;

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Monospace advance ≈ 0.6em in every common mono face; we also pin text width
// with textLength so layouts stay identical across macOS / Windows / Linux.
export const monoW = (str, size) => String(str).length * size * 0.6;

export function svg(w, h, body, { title = '', desc = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
${body}
</svg>
`;
}

// Shared <defs>: brand gradient, dot grid, soft glows. `id` prefixes avoid
// collisions when several SVGs are inlined into one document (preview tooling).
export function defs(p = 'x', { animateBrand = false } = {}) {
  return `<defs>
  <linearGradient id="${p}-brand" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox" spreadMethod="reflect">
    <stop offset="0" stop-color="${C.cyan}"/><stop offset=".5" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.violet}"/>
    ${animateBrand ? `<animateTransform attributeName="gradientTransform" type="translate" values="0 0;1 0;0 0" dur="${T.slow / 2}s" repeatCount="indefinite"/>` : ''}
  </linearGradient>
  <linearGradient id="${p}-brandv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.violet}"/>
  </linearGradient>
  <linearGradient id="${p}-edge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.cyan}" stop-opacity=".55"/><stop offset=".35" stop-color="${C.line2}" stop-opacity=".9"/>
    <stop offset=".7" stop-color="${C.line}"/><stop offset="1" stop-color="${C.violet}" stop-opacity=".5"/>
  </linearGradient>
  <radialGradient id="${p}-glowc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".22"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-glowv" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.violet}" stop-opacity=".24"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-glowb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.blue}" stop-opacity=".2"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/></radialGradient>
  <pattern id="${p}-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${C.line2}"/></pattern>
  <pattern id="${p}-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" stroke="${C.line}" stroke-width="1"/></pattern>
</defs>`;
}

// The signature card: rounded panel, gradient hairline, registration ticks.
export function card(p, x, y, w, h, { fill = C.panel, ticks = true, edge = true, r = RADIUS } = {}) {
  const t = 10, o = 14;
  const tk = ticks ? `<g stroke="${C.mute}" stroke-width="1.2" opacity=".7">
    <path d="M${x + o} ${y + o + t}V${y + o}H${x + o + t}"/><path d="M${x + w - o - t} ${y + o}H${x + w - o}V${y + o + t}"/>
    <path d="M${x + o} ${y + h - o - t}V${y + h - o}H${x + o + t}"/><path d="M${x + w - o - t} ${y + h - o}H${x + w - o}V${y + h - o - t}"/></g>` : '';
  return `<rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${fill}" stroke="${edge ? `url(#${p}-edge)` : C.line}"/>${tk}`;
}

export function label(x, y, str, { color = C.mute, size = 15, anchor = 'start', spacing = 2.4, weight = 500 } = {}) {
  return `<text x="${x}" y="${y}" font-family="${FONT.mono}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${color}" text-anchor="${anchor}">${esc(str)}</text>`;
}

export function text(x, y, str, { size = 24, color = C.text, weight = 600, anchor = 'start', family = FONT.sans, spacing = 0, fit, opacity } = {}) {
  const tl = fit ? ` textLength="${fit}" lengthAdjust="spacingAndGlyphs"` : '';
  const op = opacity != null ? ` opacity="${opacity}"` : '';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${color}" text-anchor="${anchor}"${tl}${op}>${esc(str)}</text>`;
}

// Small technology chip (mono, outlined).
export function chips(x, y, items, { size = 15, gap = 8, pad = 12, h = 30, maxW = 9999, color = C.dim } = {}) {
  let cx = x, cy = y, out = '';
  for (const it of items) {
    const w = monoW(it, size) + pad * 2;
    if (cx + w > x + maxW) { cx = x; cy += h + gap; }
    out += `<rect x="${cx + .5}" y="${cy + .5}" width="${w - 1}" height="${h - 1}" rx="${h / 2}" fill="${C.panel2}" stroke="${C.line2}"/>`
      + `<text x="${cx + w / 2}" y="${cy + h / 2 + size * .35}" font-family="${FONT.mono}" font-size="${size}" fill="${color}" text-anchor="middle" textLength="${monoW(it, size)}" lengthAdjust="spacingAndGlyphs">${esc(it)}</text>`;
    cx += w + gap;
  }
  return out;
}

// A packet: a bright dot that travels along a path, with a fading tail.
export function packet(path, { dur = T.pulse, begin = 0, color = C.cyan, r = 3.2, tail = true } = {}) {
  const motion = `<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}" rotate="auto"/>`;
  return `<g>${tail ? `<rect x="-22" y="-1.2" width="22" height="2.4" rx="1.2" fill="${color}" opacity=".35"/>` : ''}<circle r="${r}" fill="${color}"/><circle r="${r * 2.6}" fill="${color}" opacity=".16"/>${motion}</g>`;
}

// Status LED that breathes on the shared beat.
export function led(x, y, color = C.mint, r = 5) {
  return `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${color}" opacity=".18"><animate attributeName="r" values="${r * 1.4};${r * 2.8};${r * 1.4}" dur="${T.beat * 2}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0;.35" dur="${T.beat * 2}s" repeatCount="indefinite"/></circle><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
}

// Wrap plain text into lines of at most `max` characters (proportional-safe
// because we size `max` conservatively for each block).
export function wrap(str, max) {
  const words = str.split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export function para(x, y, str, { max = 50, size = 20, lh = 1.5, color = C.dim, weight = 400, family = FONT.sans } = {}) {
  return wrap(str, max).map((l, i) => text(x, y + i * size * lh, l, { size, color, weight, family })).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE — the README is assembled from horizontal "strips" stacked with zero
//  gap. Every strip shares one background (same colour, a 24-unit dot grid
//  that lines up across seams, static page-level glows, falling light
//  streaks) and the left "spine" rail, so the page reads as one surface.
//  All strips are drawn in a 1200-unit page coordinate space; strip heights
//  are multiples of the grid so the dots stay aligned from top to bottom.
// ─────────────────────────────────────────────────────────────────────────────
export const PAGE = { W: 1200, M: 48, RAIL: 24, GRID: 24, BG: C.void };
export const snap = (h) => Math.ceil(h / PAGE.GRID - 1e-9) * PAGE.GRID;

// Embed a finished SVG document inside a strip, scaled to width `w`.
export function nest(svgStr, x, y, w) {
  const open = svgStr.match(/<svg\b[^>]*>/)[0];
  const vb = open.match(/viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  const [vx, vy, W, H] = vb.slice(1).map(Number);
  const h = w * H / W;
  const body = svgStr.slice(svgStr.indexOf(open) + open.length).replace(/<\/svg>\s*$/, '')
    .replace(/<title id="t">[\s\S]*?<\/title>/, '').replace(/<desc id="d">[\s\S]*?<\/desc>/, '');
  return { el: `<svg x="${x}" y="${y}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" viewBox="${vx} ${vy} ${W} ${H}">${body}</svg>`, h };
}

// Page-level ambient light: static (so seams between images stay invisible)
// glows parked just off the left/right edges, alternating colour.
export function pageGlows(totalH) {
  const out = []; const cols = ['c', 'v', 'b'];
  for (let y = 1000, i = 0; y < totalH + 400; y += 760, i++) out.push([i % 2 ? PAGE.W + 90 : -90, y, 540, cols[i % 3]]);
  return out;
}

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

export function strip({ x0 = 0, y0 = 0, w = PAGE.W, h, body = '', title = '', desc = '', glows = [], rail = true,
  railFrom = 0, railTo, node, round, id = 'pg', streaks = 3, seed = 1 }) {
  const r = 28;
  let d = `<defs>
  <pattern id="${id}-pd" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="translate(${-(x0 % 24)} 0)"><circle cx="1" cy="1" r="1" fill="${C.line2}"/></pattern>
  <radialGradient id="${id}-gc"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".16"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}-gv"><stop offset="0" stop-color="${C.violet}" stop-opacity=".2"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}-gb"><stop offset="0" stop-color="${C.blue}" stop-opacity=".16"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}-sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".85" stop-color="${C.cyan}" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
  <linearGradient id="${id}-rl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".8"/><stop offset=".5" stop-color="${C.blue}" stop-opacity=".7"/><stop offset="1" stop-color="${C.violet}" stop-opacity=".8"/></linearGradient>`;
  const clip = round === 'top' ? `M0 ${r}Q0 0 ${r} 0H${w - r}Q${w} 0 ${w} ${r}V${h}H0Z`
    : round === 'bottom' ? `M0 0H${w}V${h - r}Q${w} ${h} ${w - r} ${h}H${r}Q0 ${h} 0 ${h - r}Z` : null;
  if (clip) d += `<clipPath id="${id}-clip"><path d="${clip}"/></clipPath>`;
  d += '</defs>';
  let bg = `<rect width="${w}" height="${h}" fill="${PAGE.BG}"/><rect width="${w}" height="${h}" fill="url(#${id}-pd)" opacity=".5"/>`;
  for (const [gx, gy, gr, gc] of glows) {
    const cx = gx - x0, cy = gy - y0;
    if (cy + gr < 0 || cy - gr > h || cx + gr < 0 || cx - gr > w) continue;
    bg += `<circle cx="${cx}" cy="${cy}" r="${gr}" fill="url(#${id}-g${gc})"/>`;
  }
  // falling light streaks — the page's "background video"
  const rnd = rng(seed);
  for (let i = 0; i < streaks; i++) {
    const sx = (60 + rnd() * (PAGE.W - 120) - x0).toFixed(0); const len = 90 + rnd() * 90; const dur = ((h + len) / (55 + rnd() * 50)).toFixed(2);
    if (sx < 4 || sx > w - 4) continue;
    bg += `<rect x="${sx}" y="${-len}" width="1.4" height="${len.toFixed(0)}" fill="url(#${id}-sk)"><animate attributeName="y" values="${-len};${h}" dur="${dur}s" begin="-${(rnd() * dur).toFixed(2)}s" repeatCount="indefinite"/></rect>`;
  }
  let rl = '';
  if (rail && x0 === 0) {
    const to = railTo ?? h;
    rl += `<path d="M${PAGE.RAIL} ${railFrom}V${to}" stroke="url(#${id}-rl)" stroke-width="2"/>`;
    rl += packet(`M${PAGE.RAIL} ${railFrom - 30}V${to}`, { dur: ((to - railFrom + 30) / 110).toFixed(2), color: C.cyan, r: 2.6 });
    const n = node == null ? [] : [].concat(node);
    for (const ny of n) {
      rl += `<path d="M${PAGE.RAIL} ${ny}H${PAGE.M - 4}" stroke="${C.cyan}" stroke-opacity=".6"/>`;
      rl += `<rect x="${PAGE.RAIL - 6}" y="${ny - 6}" width="12" height="12" transform="rotate(45 ${PAGE.RAIL} ${ny})" fill="${PAGE.BG}" stroke="${C.cyan}" stroke-width="1.5"/>`;
      rl += led(PAGE.RAIL, ny, C.cyan, 2.6);
    }
  }
  const inner = `<g${clip ? ` clip-path="url(#${id}-clip)"` : ''}>${bg}${rl}${body}</g>`;
  return svg(w, h, d + inner, { title, desc });
}
