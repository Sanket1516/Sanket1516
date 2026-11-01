// Telemetry dashboard — rendered by GitHub Actions from the GitHub GraphQL API.
// Replaces third-party stats cards (rate-limited / frequently down) with one
// self-hosted SVG in the SIGNAL design language.
//
//   GITHUB_TOKEN=… node scripts/stats.mjs --user Sanket1516 --out dist/stats.svg
//   node scripts/stats.mjs --fixture scripts/fixtures/sample.json --out preview/stats.svg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { C, FONT, svg, defs, card, label, text, led, PAGE, nest, strip } from './design.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const USER = arg('user', process.env.GITHUB_USER || 'Sanket1516');
const OUT = arg('out', 'dist/stats.svg');
const FIXTURE = arg('fixture');

// ── data ─────────────────────────────────────────────────────────────────────
async function gql(query, variables) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'sanket1516-profile' },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && !json.errors) return json.data;
    if (attempt >= 3) throw new Error(`GraphQL ${res.status}: ${JSON.stringify(json.errors || json).slice(0, 400)}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

async function fetchData(login) {
  const base = await gql(`query($login:String!){ user(login:$login){
      name createdAt
      followers{ totalCount }
      repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100, orderBy:{field:PUSHED_AT,direction:DESC}){
        totalCount
        nodes{ isFork stargazerCount forkCount
          languages(first:10, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
      }
      contributionsCollection{ contributionYears }
  } }`, { login });
  const u = base.user;
  const years = u.contributionsCollection.contributionYears;
  const days = [];
  for (const y of years) {
    const from = `${y}-01-01T00:00:00Z`, to = `${y}-12-31T23:59:59Z`;
    const d = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
        contributionsCollection(from:$from,to:$to){ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`, { login, from, to });
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks) for (const c of w.contributionDays) days.push({ date: c.date, count: c.contributionCount });
  }
  const repos = u.repositories.nodes.filter((r) => !r.isFork);
  const langs = {};
  for (const r of repos) for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  return {
    login, followers: u.followers.totalCount, repos: u.repositories.totalCount,
    stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
    forks: repos.reduce((s, r) => s + r.forkCount, 0),
    languages: langs, days,
  };
}

// ── derive ───────────────────────────────────────────────────────────────────
function derive(data, today = new Date()) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const todayS = iso(today);
  const byDate = new Map();
  for (const d of data.days) if (d.date <= todayS) byDate.set(d.date, d.count);
  const dates = [...byDate.keys()].sort();
  const total = dates.reduce((s, k) => s + byDate.get(k), 0);

  // streaks (a day with 0 contributions today doesn't break the current streak yet)
  let longest = { len: 0 }, run = { len: 0 };
  for (const k of dates) {
    if (byDate.get(k) > 0) { run = run.len ? { ...run, len: run.len + 1, end: k } : { len: 1, start: k, end: k }; if (run.len > longest.len) longest = { ...run }; } else run = { len: 0 };
  }
  let cur = { len: 0 }; const cursor = new Date(todayS + 'T00:00:00Z');
  if (!byDate.get(todayS)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (byDate.get(iso(cursor)) > 0) { cur = { len: cur.len + 1, start: iso(cursor), end: cur.end || iso(cursor) }; cursor.setUTCDate(cursor.getUTCDate() - 1); }

  // last 53 weeks aligned to Sunday, as GitHub draws it
  const end = new Date(todayS + 'T00:00:00Z');
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - end.getUTCDay() - 52 * 7);
  const weeks = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wi = Math.floor((d - start) / 864e5 / 7);
    (weeks[wi] ||= []).push({ date: iso(d), count: byDate.get(iso(d)) || 0, dow: d.getUTCDay() });
  }
  const yearTotal = weeks.flat().reduce((s, d) => s + d.count, 0);
  const langTotal = Object.values(data.languages).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1]).map(([name, size]) => ({ name, pct: size / langTotal * 100 }));
  return { ...data, total, longest, current: cur, weeks, yearTotal, languages, today: todayS };
}

// ── render ───────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n.toLocaleString('en-US');
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const short = (s) => s ? `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8, 10)}` : '—';
const RAMP = ['#121826', '#0E3A4A', '#13708A', '#2A8BF2', '#8B5CF6'];
const LANG_COLORS = [C.cyan, C.blue, C.violet, C.lilac, '#5EEAD4', C.mute];

function render(s) {
  const W = 1200, H = 720, p = 'st';
  let b = defs(p, { animateBrand: true });

  // KPI row
  const kpis = [
    ['CONTRIBUTIONS', fmt(s.total), 'all-time · public'],
    ['CURRENT STREAK', `${s.current.len}d`, s.current.len ? `${short(s.current.start)} → today` : 'next commit starts it'],
    ['LONGEST STREAK', `${s.longest.len}d`, s.longest.len ? `${short(s.longest.start)} → ${short(s.longest.end)}` : '—'],
    ['STARS EARNED', fmt(s.stars), `${fmt(s.forks)} fork${s.forks === 1 ? '' : 's'}`],
    ['FOLLOWERS', fmt(s.followers), 'say hi →'],
    ['PUBLIC REPOS', fmt(s.repos), 'and counting'],
  ];
  const kw = (W - 5 * 16) / 6;
  kpis.forEach(([k, v, sub], i) => {
    const x = i * (kw + 16);
    b += card(p, x, 0, kw, 150, { ticks: false });
    b += label(x + 22, 38, k, { size: 11.5, spacing: 1.6, color: C.mute });
    b += `<text x="${x + 22}" y="98" font-family="${FONT.sans}" font-size="46" font-weight="800" letter-spacing="-1" fill="${i < 3 ? `url(#${p}-brand)` : C.text}">${v}</text>`;
    b += label(x + 22, 128, sub, { size: 11.5, spacing: .4, color: C.dim });
  });

  // calendar
  const CY = 166;
  b += card(p, 0, CY, 800, 300);
  b += label(32, CY + 44, '04.2 — CONTRIBUTION CALENDAR · 12 MONTHS');
  b += `<text x="768" y="${CY + 46}" font-family="${FONT.sans}" font-size="20" font-weight="700" fill="${C.text}" text-anchor="end">${fmt(s.yearTotal)} <tspan fill="${C.mute}" font-weight="500" font-size="15">in the last year</tspan></text>`;
  const gx = 30, gy = CY + 104, pitch = 14, cs = 11;
  const max = Math.max(1, ...s.weeks.flat().map((d) => d.count));
  let lastMonth = -1;
  s.weeks.forEach((wk, wi) => {
    const m = +wk[0].date.slice(5, 7) - 1;
    if (m !== lastMonth && wk[0].date.slice(8) <= '07' && wi < 52) { b += label(gx + wi * pitch, gy - 14, MON[m], { size: 11, spacing: 1 }); lastMonth = m; }
    wk.forEach((d) => {
      const lvl = d.count === 0 ? 0 : Math.min(4, 1 + Math.floor((d.count / max) * 3.999));
      b += `<rect x="${gx + wi * pitch}" y="${gy + d.dow * pitch}" width="${cs}" height="${cs}" rx="2.5" fill="${RAMP[lvl]}"/>`;
    });
  });
  // sweeping scan beam over the calendar
  b += `<rect x="${gx}" y="${gy - 4}" width="3" height="${7 * pitch + 6}" rx="1.5" fill="${C.cyan}" opacity=".7"><animate attributeName="x" values="${gx - 6};${gx + 53 * pitch}" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" keyTimes="0;.05;.9;1" dur="6s" repeatCount="indefinite"/></rect>`;
  const ly = gy + 7 * pitch + 30;
  b += label(gx, ly, 'LESS', { size: 11, spacing: 1 });
  RAMP.forEach((c, i) => b += `<rect x="${gx + 44 + i * 16}" y="${ly - 10}" width="${cs}" height="${cs}" rx="2.5" fill="${c}"/>`);
  b += label(gx + 44 + 5 * 16 + 6, ly, 'MORE', { size: 11, spacing: 1 });
  b += led(768 - (`SYNCED ${s.today}`.length * 7.6) - 14, ly - 4, C.mint, 3.5);
  b += label(768, ly, `SYNCED ${s.today}`, { size: 11, anchor: 'end', spacing: 1 });

  // languages
  b += card(p, 816, CY, 384, 300);
  b += label(848, CY + 44, '04.3 — LANGUAGES');
  const top = s.languages.slice(0, 5); const other = s.languages.slice(5).reduce((a, l) => a + l.pct, 0);
  const rows = other > 0.05 ? [...top, { name: 'Other', pct: other }] : top;
  let bx = 848; const bw = 320;
  rows.forEach((l, i) => { const w = Math.max(2, bw * l.pct / 100); b += `<rect x="${bx.toFixed(1)}" y="${CY + 70}" width="${(w - 2).toFixed(1)}" height="10" rx="3" fill="${LANG_COLORS[i]}"/>`; bx += w; });
  rows.forEach((l, i) => {
    const y = CY + 118 + i * 30;
    b += `<rect x="848" y="${y - 10}" width="10" height="10" rx="2.5" fill="${LANG_COLORS[i]}"/>`;
    b += text(870, y, l.name, { size: 16, weight: 600, color: C.text });
    b += label(1168, y, `${l.pct.toFixed(1)}%`, { size: 13, anchor: 'end', color: C.dim, spacing: 0 });
  });

  // weekly activity
  const AY = 482, AH = 238;
  b += card(p, 0, AY, W, AH);
  b += label(32, AY + 44, '04.4 — WEEKLY ACTIVITY · 53 WEEKS');
  const weekly = s.weeks.map((w) => w.reduce((a, d) => a + d.count, 0));
  const wmax = Math.max(1, ...weekly);
  const px = 32, pw = W - 64, py = AY + 72, ph = AH - 112;
  const pts = weekly.map((v, i) => [px + (i / (weekly.length - 1)) * pw, py + ph - (v / wmax) * ph]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  [0, .5, 1].forEach((f) => b += `<path d="M${px} ${(py + ph * f).toFixed(1)}H${px + pw}" stroke="${C.line}" stroke-dasharray="2 6"/>`);
  b += `<linearGradient id="${p}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".28"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></linearGradient>`;
  b += `<path d="${line}L${px + pw} ${py + ph}L${px} ${py + ph}Z" fill="url(#${p}-area)"/>`;
  b += `<path d="${line}" stroke="url(#${p}-brand)" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="4000" stroke-dashoffset="4000"><animate attributeName="stroke-dashoffset" from="4000" to="0" dur="3s" fill="freeze"/></path>`;
  const peakI = weekly.indexOf(wmax); const [pkx, pky] = pts[peakI];
  b += `<circle cx="${pkx.toFixed(1)}" cy="${pky.toFixed(1)}" r="4.5" fill="${C.text}"/><circle cx="${pkx.toFixed(1)}" cy="${pky.toFixed(1)}" r="10" stroke="${C.cyan}" opacity=".6"/>`;
  const peakTxt = `PEAK · ${wmax} / WEEK OF ${short(s.weeks[peakI][0].date)}`;
  const flip = pkx > W - 320; // near the right edge: put the label on the left of the point
  b += label(flip ? pkx - 18 : pkx + 18, Math.max(pky + 4, py + 10), peakTxt, { size: 11.5, color: C.dim, spacing: 1, anchor: flip ? 'end' : 'start' });
  const [lx, lyy] = pts[pts.length - 1];
  b += led(lx, lyy, C.cyan, 3.5);
  b += label(px, AY + AH - 18, short(s.weeks[0][0].date), { size: 11, spacing: 1 });
  b += label(px + pw, AY + AH - 18, 'NOW', { size: 11, anchor: 'end', spacing: 1 });

  return svg(W, H, b, { title: `GitHub telemetry for ${s.login}`, desc: `${s.total} contributions, ${s.current.len}-day current streak, ${s.longest.len}-day longest streak, ${s.stars} stars, ${s.followers} followers, ${s.repos} public repositories.` });
}

// ── main ─────────────────────────────────────────────────────────────────────
const data = FIXTURE ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : await fetchData(USER);
if (!FIXTURE && !data.days.length) throw new Error('No contribution data returned — refusing to publish an empty dashboard');
const today = FIXTURE ? new Date(data.today + 'T12:00:00Z') : new Date();
const inner = render(derive(data, today));
// Frame the dashboard as one strip of the page (same background, grid and
// spine as the static assets) using the layout written by build-assets.
const layout = JSON.parse(readFileSync(new URL('../assets/layout.json', import.meta.url), 'utf8'));
const n = nest(inner, PAGE.M, 0, PAGE.W - 2 * PAGE.M);
const out = strip({ y0: layout.stats.y, h: layout.stats.h, glows: layout.glows, seed: 41, body: n.el,
  title: inner.match(/<title id="t">([\s\S]*?)<\/title>/)[1], desc: inner.match(/<desc id="d">([\s\S]*?)<\/desc>/)[1] });
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(Buffer.byteLength(out) / 1024).toFixed(1)} kB)`);
