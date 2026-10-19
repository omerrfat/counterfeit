import gsap from 'gsap';
import './styles.css';
import { getPuzzle, dayIndexFor, msToNextCase, rankFor, MAX_SCORE } from './content.js';
import { loadStore, saveStore, resetStore } from './store.js';
import * as sfx from './audio.js';
import { Beam } from './beam.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const params = new URLSearchParams(location.search);
if (params.has('reset')) resetStore();
// The in-app preview reports reduced motion; ?motion=full lets us test the real thing.
const RM = params.get('motion') === 'full' ? false : matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = (x) => (RM ? 0.01 : x);
const COARSE = matchMedia('(pointer: coarse)').matches;

const store = loadStore();
const dayIdx = params.has('day') ? Math.max(0, parseInt(params.get('day'), 10) - 1) : dayIndexFor();
const puzzle = getPuzzle(dayIdx);
const rec = (store.days[dayIdx] ||= { stamps: Array(8).fill(null), battery: 1, done: false, assisted: false });
const save = () => saveStore(store);

const app = $('#app');
const stage = $('#stage');
const wall = $('#wall');
const gallery = $('#gallery');
const deck = $('#deck');

let state = rec.done ? 'reveal' : 'title';
let selected = null;
let wager = 1;
let helpOpen = false;

const beam = new Beam($('#dark'), $('#dust'), { reduced: RM });
beam.battery = rec.battery;
beam.s.dark = state === 'reveal' ? 0 : 1;

// ---------- Static copy ----------
$('#wingName').textContent = `The ${puzzle.wing.replace(/^The /, '')} wing`.replace('The The', 'The');
$('#caseNo').textContent = `No. ${puzzle.number}`;
$('#titleWing').textContent = `Today’s wing: ${puzzle.wing}`;
$('#titleWord').innerHTML = [...'Counterfeit'].map((c) => `<span>${c}</span>`).join('');
const ruledCount = () => rec.stamps.filter(Boolean).length;
$('#beginNote').textContent = `Case No. ${puzzle.number}`;
if (ruledCount() > 0 && !rec.done) $('#btnBegin').textContent = 'Continue inspection';

// ---------- Gallery ----------
const els = [];
puzzle.order.forEach((ci, slot) => {
  const c = puzzle.claims[ci];
  const el = document.createElement('article');
  el.className = 'exhibit';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-pressed', 'false');
  el.dataset.i = ci;
  el.style.setProperty('--tilt', puzzle.tilts[slot].toFixed(2) + 'deg');
  el.innerHTML = `
    <div class="frame">
      <div class="label">
        <p class="verdict-line">${c.real ? 'Genuine' : 'Forgery'}</p>
        <h3 class="subject">${c.subject}</h3>
        <p class="claim">${c.text}</p>
        <p class="truth"><b>${c.real ? 'Also:' : 'In fact:'}</b> ${c.truth}</p>
      </div>
      <div class="ink" aria-hidden="true"><div class="ink-stamp"><span></span><i></i></div></div>
      <div class="badge" aria-hidden="true"></div>
    </div>`;
  el.addEventListener('click', () => {
    if (state !== 'play') return;
    select(ci, { aim: COARSE });
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(ci, { aim: true }); }
  });
  el.addEventListener('focus', () => {
    if (state === 'play' && el.matches(':focus-visible')) select(ci, { aim: true });
  });
  gallery.appendChild(el);
  els[ci] = el;
});
const inkRot = (ci) => ((ci * 37) % 11) - 5;

// ---------- Beam & pointer ----------
const qRotY = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'power3.out' });
const qRotX = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'power3.out' });
let intro = null;

function aimPointer(e) {
  if (state === 'reveal') return;
  if (intro) { intro.kill(); intro = null; }
  beam.aim(e.clientX, e.clientY - (e.pointerType === 'touch' ? 76 : 0));
  if (!RM && e.pointerType === 'mouse') {
    qRotY((e.clientX / innerWidth - 0.5) * 2.4);
    qRotX(-(e.clientY / innerHeight - 0.5) * 1.6);
  }
}
addEventListener('pointermove', aimPointer, { passive: true });
addEventListener('pointerdown', aimPointer, { passive: true });

function aimAt(el) {
  const r = el.getBoundingClientRect();
  beam.aim(r.left + r.width / 2, r.top + r.height / 2);
}

function runIntro() {
  const W = innerWidth, H = innerHeight;
  const p = { t: 0 };
  beam.s.x = -140; beam.s.y = H * 0.4;
  beam.s.flick = 0;
  beam.flicker(5);
  const lerp = gsap.utils.interpolate;
  intro = gsap.timeline({ delay: D(0.5) }).to(p, {
    t: 1, duration: D(4.6), ease: 'sine.inOut',
    onUpdate() {
      const t = p.t;
      if (t < 0.6) { const u = t / 0.6; beam.aim(lerp(W * 0.14, W * 0.86, u), H * 0.4 + Math.sin(u * 6.28) * 22); }
      else if (t < 0.85) { const u = (t - 0.6) / 0.25; beam.aim(lerp(W * 0.8, W * 0.3, u), lerp(H * 0.4, H * 0.55, u)); }
      else { const u = (t - 0.85) / 0.15; beam.aim(lerp(W * 0.3, W * 0.5, u), lerp(H * 0.55, H * 0.8, u)); }
    },
    onComplete() { intro = null; },
  });
}

// ---------- Battery ----------
const DRAIN_SECONDS = 150;
const fill = $('#batteryFill');
let lastGauge = 0, lastSave = 0;
gsap.ticker.add((time, dt) => {
  if (state !== 'play' || helpOpen || document.hidden) return;
  rec.battery = Math.max(0, rec.battery - Math.min(dt, 100) / 1000 / DRAIN_SECONDS);
  beam.battery = rec.battery;
  if (time - lastGauge > 0.2) {
    lastGauge = time;
    fill.style.transform = `scaleX(${rec.battery.toFixed(3)})`;
    $('#battery').classList.toggle('low', rec.battery < 0.22);
    $('#battery').setAttribute('aria-label', `Torch battery ${Math.round(rec.battery * 100)} percent`);
  }
  if (time - lastSave > 4) { lastSave = time; save(); }
});
fill.style.transform = `scaleX(${rec.battery})`;

// ---------- Selecting & stamping ----------
function select(ci, { aim = false } = {}) {
  selected = ci;
  els.forEach((el, i) => {
    el.classList.toggle('is-selected', i === ci);
    el.setAttribute('aria-pressed', String(i === ci));
  });
  if (aim) aimAt(els[ci]);
  sfx.select();
  updateDeck();
}

function updateDeck() {
  const ruled = ruledCount();
  const can = state === 'play' && selected !== null;
  $('#stampReal').disabled = !can;
  $('#stampFake').disabled = !can;
  $('#btnClose').disabled = ruled < 8;
  const name = selected !== null ? puzzle.claims[selected].subject : null;
  $('#progressText').textContent = ruled === 8 ? 'All eight ruled' : name ? `${name}: ${ruled} of 8 ruled` : ruled ? `${ruled} of 8 ruled` : 'Choose an exhibit';
}

function setWager(w) {
  wager = w;
  $$('.chip').forEach((c) => c.setAttribute('aria-checked', String(+c.dataset.w === w)));
}
$$('.chip').forEach((c) => c.addEventListener('click', () => { setWager(+c.dataset.w); sfx.select(); }));

function renderInk(ci, animate) {
  const st = rec.stamps[ci];
  const el = els[ci];
  const ink = $('.ink', el);
  const stamp = $('.ink-stamp', el);
  ink.className = 'ink ink-' + st.v;
  $('span', stamp).textContent = st.v === 'real' ? 'Genuine' : 'Forgery';
  $('i', stamp).textContent = '×' + st.w;
  const rot = inkRot(ci);
  gsap.killTweensOf(stamp);
  if (!animate) { gsap.set(stamp, { opacity: 0.92, scale: 1, rotation: rot, y: 0 }); return; }

  gsap.set(stamp, { opacity: 0, scale: 2.7, rotation: rot - 14, y: -46 });
  const heavy = st.w;
  gsap.timeline()
    .to(stamp, { opacity: 1, scale: 1, rotation: rot, y: 0, duration: D(0.16), ease: 'power4.in' })
    .add(() => impact(el, st, heavy))
    .to(stamp, { opacity: 0.92, duration: D(0.5) });
}

function impact(el, st, weight) {
  sfx.stampThud(weight);
  beam.pulse();
  if (RM) return;
  gsap.timeline()
    .to(stage, { y: 3 + weight * 2, duration: 0.04 })
    .to(stage, { y: -2, duration: 0.05 })
    .to(stage, { y: 0, duration: 0.35, ease: 'elastic.out(1.4, 0.35)' });
  gsap.fromTo($('.frame', el), { scale: 0.965 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
  const color = st.v === 'real' ? '#2c5ba8' : '#bf3b30';
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 7 + weight * 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'splat';
    dot.style.background = color;
    dot.style.left = '50%'; dot.style.top = '50%';
    el.appendChild(dot);
    const a = Math.random() * 6.28, d = gsap.utils.random(0.2, 0.6) * Math.min(r.width, 260);
    gsap.to(dot, {
      x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7, scale: gsap.utils.random(0.4, 1.4), opacity: 0,
      duration: gsap.utils.random(0.35, 0.7), ease: 'power3.out', onComplete: () => dot.remove(),
    });
  }
}

function stamp(verdict) {
  if (state !== 'play' || selected === null) return;
  rec.stamps[selected] = { v: verdict, w: wager };
  rec.assisted ||= document.body.classList.contains('lights-on');
  save();
  renderInk(selected, true);
  updateDeck();
}
$('#stampReal').addEventListener('click', () => stamp('real'));
$('#stampFake').addEventListener('click', () => stamp('fake'));
$('#btnClose').addEventListener('click', () => { if (ruledCount() === 8) reveal(true); });

addEventListener('keydown', (e) => {
  if (helpOpen || e.metaKey || e.ctrlKey || e.altKey) return;
  if (state === 'play') {
    const k = e.key.toLowerCase();
    if (k === 'g') stamp('real');
    else if (k === 'f') stamp('fake');
    else if (k >= '1' && k <= '3') setWager(+k);
    else if (k === 'escape') { selected = null; els.forEach((el) => el.classList.remove('is-selected')); updateDeck(); }
  }
});

// ---------- Scoring ----------
const verdictOk = (ci) => {
  const st = rec.stamps[ci];
  return st ? (st.v === 'real') === puzzle.claims[ci].real : null;
};
function scoreOf() {
  return rec.stamps.reduce((s, st, i) => (st ? s + (verdictOk(i) ? st.w : -st.w) : s), 0);
}

// ---------- Reveal ----------
function applyReveal(ci) {
  const el = els[ci];
  const st = rec.stamps[ci];
  const ok = verdictOk(ci);
  el.classList.add('is-revealed', puzzle.claims[ci].real ? 'is-real' : 'is-fake');
  const badge = $('.badge', el);
  badge.textContent = st ? (ok ? '+' : '−') + st.w : '–';
  badge.className = 'badge ' + (ok === null ? 'none' : ok ? 'ok' : 'bad');
  const real = puzzle.claims[ci].real ? 'Genuine' : 'Forgery';
  const ruled = st ? `you ruled ${st.v === 'real' ? 'Genuine' : 'Forgery'} ×${st.w}` : 'not ruled';
  $('.verdict-line', el).textContent = `${real} · ${ruled}`;
}

function buildResult() {
  const score = scoreOf();
  $('#rankName').textContent = rankFor(score);
  $('#rankScore').textContent = `${score} of ${MAX_SCORE}${rec.assisted ? ' (house lights on)' : ''}`;
  const pips = $('#pips');
  pips.innerHTML = '';
  puzzle.claims.forEach((_, i) => {
    const ok = verdictOk(i);
    const p = document.createElement('span');
    p.className = 'pip ' + (ok === null ? 'none' : ok ? 'ok' : 'bad');
    pips.appendChild(p);
  });
  const s = store.stats;
  $('#streakLine').textContent = `Streak ${s.streak} · Played ${s.played} · Best streak ${s.best}`;
  tickCountdown();
}

function tickCountdown() {
  const ms = msToNextCase();
  const h = String(Math.floor(ms / 3.6e6)).padStart(2, '0');
  const m = String(Math.floor((ms % 3.6e6) / 6e4)).padStart(2, '0');
  const s = String(Math.floor((ms % 6e4) / 1e3)).padStart(2, '0');
  $('#nextCase').textContent = `Next case in ${h}:${m}:${s}`;
}
setInterval(() => { if (state === 'reveal') tickCountdown(); }, 1000);

function showResult(animate) {
  $('#deckPlay').hidden = true;
  $('#deckResult').hidden = false;
  deck.hidden = false;
  buildResult();
  if (!animate) return;
  const score = scoreOf();
  const proxy = { v: 0 };
  const label = $('#rankScore');
  gsap.fromTo(deck, { yPercent: 100 }, { yPercent: 0, duration: D(0.7), ease: 'power3.out' });
  gsap.from('#rankName', { opacity: 0, y: 14, duration: D(0.6), delay: 0.2 });
  gsap.from('.pip', { scale: 0, duration: D(0.35), stagger: 0.06, delay: 0.3, ease: 'back.out(2)' });
  gsap.to(proxy, {
    v: score, duration: D(1.1), delay: 0.3, ease: 'power2.out',
    onUpdate: () => { label.textContent = `${Math.round(proxy.v)} of ${MAX_SCORE}${rec.assisted ? ' (house lights on)' : ''}`; },
  });
}

function reveal(animate) {
  state = 'reveal';
  if (!rec.counted) {
    const s = store.stats;
    s.streak = s.last === dayIdx - 1 ? s.streak + 1 : 1;
    s.best = Math.max(s.best, s.streak);
    s.last = dayIdx;
    s.played += 1;
    rec.counted = true;
  }
  rec.done = true;
  rec.score = scoreOf();
  save();

  selected = null;
  els.forEach((el) => { el.classList.remove('is-selected'); el.setAttribute('aria-pressed', 'false'); });
  app.className = 'is-reveal';
  wall.scrollTop = 0;

  if (!animate) {
    gsap.set('#title', { autoAlpha: 0 });
    gsap.set(wall, { autoAlpha: 1 });
    document.body.classList.add('lights-on');
    beam.s.dark = 0;
    sfx.brighten(true);
    els.forEach((_, i) => { if (rec.stamps[i]) renderInk(i, false); applyReveal(i); });
    showResult(false);
    return;
  }

  const tl = gsap.timeline();
  tl.to(deck, { yPercent: 100, duration: D(0.4), ease: 'power2.in' })
    .add(() => { sfx.flicker(5); beam.flicker(5); }, 0.1)
    .add(() => { sfx.lightsOn(); sfx.brighten(true); }, D(1.0))
    .to(beam.s, { dark: 0, duration: D(1.3), ease: 'power2.inOut' }, D(1.0));
  const start = D(2.1);
  puzzle.order.forEach((ci, n) => {
    const t = start + n * D(0.34);
    const frame = $('.frame', els[ci]);
    tl.to(frame, { rotationY: 90, duration: D(0.15), ease: 'power2.in' }, t)
      .add(() => { applyReveal(ci); sfx.flip(verdictOk(ci)); }, t + D(0.15))
      .to(frame, { rotationY: 0, duration: D(0.38), ease: 'back.out(1.5)' }, t + D(0.15))
      .from($('.badge', els[ci]), { scale: 0, duration: D(0.35), ease: 'back.out(3)' }, t + D(0.35));
  });
  tl.add(() => { sfx.fanfare(); showResult(true); }, start + puzzle.order.length * D(0.34) + D(0.4));
}

// ---------- Beginning ----------
function begin() {
  if (state !== 'title') return;
  sfx.init();
  sfx.startAmbience();
  sfx.click();
  if (intro) { intro.kill(); intro = null; }
  state = 'play';
  app.className = 'is-play';
  deck.hidden = false;
  updateDeck();
  els.forEach((_, i) => { if (rec.stamps[i]) renderInk(i, false); });

  const tl = gsap.timeline({
    onComplete() {
      if (!store.seenHelp) { store.seenHelp = true; save(); $('#help').showModal(); }
    },
  });
  tl.add(() => { sfx.flicker(3); beam.flicker(3); }, 0)
    .to('.begin', { opacity: 0, y: 20, duration: D(0.35) }, 0)
    .to('#title', { autoAlpha: 0, scale: 1.07, duration: D(0.8), ease: 'power2.in' }, 0.1)
    .set(wall, { autoAlpha: 1 }, 0.5)
    .from(wall, { scale: 0.94, duration: D(1.0), ease: 'power3.out' }, 0.5)
    .from('.exhibit', {
      opacity: 0, y: 46, rotationX: -16, transformOrigin: '50% 100%',
      duration: D(0.8), stagger: D(0.07), ease: 'power3.out',
    }, 0.6)
    .from(deck, { yPercent: 100, duration: D(0.7), ease: 'power3.out' }, 1.0);
}
$('#btnBegin').addEventListener('click', begin);

// ---------- HUD ----------
const help = $('#help');
$('#btnHelp').addEventListener('click', () => { help.showModal(); });
help.addEventListener('close', () => { helpOpen = false; });
help.addEventListener('toggle', () => { helpOpen = help.open; });
new MutationObserver(() => { helpOpen = help.open; }).observe(help, { attributes: true, attributeFilter: ['open'] });

$('#btnLights').addEventListener('click', (e) => {
  const on = document.body.classList.toggle('lights-on');
  e.currentTarget.setAttribute('aria-pressed', String(on));
  if (on && state === 'play') rec.assisted = true;
  sfx.click();
  toast(on ? 'House lights on. Your result will be marked as assisted.' : 'Lights off');
});

const soundBtn = $('#btnSound');
function applySound() {
  soundBtn.setAttribute('aria-pressed', String(store.sound));
  sfx.setEnabled(store.sound);
}
soundBtn.addEventListener('click', () => { store.sound = !store.sound; save(); sfx.init(); applySound(); });
applySound();

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  gsap.killTweensOf(t);
  gsap.timeline().fromTo(t, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25 }).to(t, { opacity: 0, duration: 0.4 }, '+=2.2');
}

// ---------- Sharing ----------
$('#btnShare').addEventListener('click', async () => {
  const grid = puzzle.claims.map((_, i) => { const ok = verdictOk(i); return ok === null ? '⬛' : ok ? '🟩' : '🟥'; }).join('');
  const wagers = rec.stamps.map((s) => (s ? s.w : '-')).join('');
  const text = [
    `Counterfeit No. ${puzzle.number} · ${puzzle.wing}`,
    grid,
    `${rankFor(rec.score)}, ${rec.score}/${MAX_SCORE}${rec.assisted ? ' (lights on)' : ''}`,
    `Confidence ${wagers}`,
    location.origin + location.pathname,
  ].join('\n');
  try {
    if (navigator.share && COARSE) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
  } catch {
    toast('Could not copy. Select the result and copy it manually.');
  }
});

// ---------- Boot ----------
gsap.set(wall, { autoAlpha: 0 });
if (state === 'reveal') {
  app.className = 'is-reveal';
  reveal(false);
} else {
  runIntro();
}

if (params.has('debug')) window.__cf = { rec, puzzle, beam, stamp, select, reveal, begin, store };
