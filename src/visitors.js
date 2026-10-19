// Client side of the visitors' book.

async function request(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error('visitors book ' + r.status);
  return r.json();
}

export const submitVisit = (day, results) =>
  request('/api/visit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day, results }) });

export const fetchVisits = (day) => request(`/api/visit?day=${day}`);

// ?demo only: a clearly labelled, seeded crowd so the panel can be previewed
// before real visitors exist. It is never mixed with real data.
export function demoVisits(day, results) {
  let a = day * 2654435761 + 12345;
  const rand = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const n = 212;
  const p = 0.6;
  const choose = (k) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (8 - k + i)) / i; return c; };
  const hist = Array.from({ length: 9 }, (_, k) => Math.round(n * choose(k) * p ** k * (1 - p) ** (8 - k)));
  const ruled = Array.from({ length: 8 }, () => n - Math.floor(rand() * 6));
  const right = ruled.map((r) => Math.round(r * (0.42 + rand() * 0.5)));
  let you = 0;
  results.forEach((v, i) => { if (v !== null) { ruled[i]++; if (v === 1) { right[i]++; you++; } } });
  hist[you]++;
  const total = n + 1;
  const mean = hist.reduce((s, c, i) => s + c * i, 0) / total;
  let seen = 0, median = 0;
  for (let i = 0; i < 9; i++) { seen += hist[i]; if (seen >= total / 2) { median = i; break; } }
  return { n: total, hist, ruled, right, mean, median, demo: true };
}
