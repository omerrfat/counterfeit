// The visitors' book: anonymous, aggregate-only. For each daily case we keep
// counters, never individual results:
//   n        visitors who finished the case
//   h0..h8   how many of them judged exactly k exhibits correctly
//   r0..r7   how many ruled on exhibit i at all
//   c0..c7   how many of those ruled it correctly
//
// A store is anything with:
//   incr(key, { field: amount })  atomically add to hash fields
//   getAll(key)                   -> { field: number } (empty object if none)

const MAX_DAY = 100000;
const key = (day) => `counterfeit:day:${day}`;

export function summarise(h = {}) {
  const num = (k) => Number(h[k]) || 0;
  const n = num('n');
  const hist = Array.from({ length: 9 }, (_, i) => num('h' + i));
  const ruled = Array.from({ length: 8 }, (_, i) => num('r' + i));
  const right = Array.from({ length: 8 }, (_, i) => num('c' + i));
  const total = hist.reduce((s, c, i) => s + c * i, 0);
  const mean = n ? total / n : 0;
  let median = 0;
  if (n) {
    let seen = 0;
    for (let i = 0; i < hist.length; i++) { seen += hist[i]; if (seen >= n / 2) { median = i; break; } }
  }
  return { n, hist, ruled, right, mean, median };
}

function parseResults(results) {
  if (!Array.isArray(results) || results.length !== 8) return null;
  if (!results.every((v) => v === 0 || v === 1 || v === null)) return null;
  return results;
}

export async function handleVisit({ method, query = {}, body = null }, store) {
  if (method === 'GET') {
    const day = Number(query.day);
    if (!Number.isInteger(day) || day < 0 || day > MAX_DAY) return { status: 400, json: { error: 'bad day' } };
    return { status: 200, json: summarise(await store.getAll(key(day))) };
  }
  if (method === 'POST') {
    const day = Number(body?.day);
    const results = parseResults(body?.results);
    if (!Number.isInteger(day) || day < 0 || day > MAX_DAY || !results) return { status: 400, json: { error: 'bad body' } };
    const fields = { n: 1 };
    let correct = 0;
    results.forEach((v, i) => {
      if (v === null) return;
      fields['r' + i] = 1;
      if (v === 1) { fields['c' + i] = 1; correct++; }
    });
    fields['h' + correct] = 1;
    await store.incr(key(day), fields);
    return { status: 200, json: summarise(await store.getAll(key(day))) };
  }
  return { status: 405, json: { error: 'method not allowed' } };
}

// ---- stores ----

export function memoryStore() {
  const data = new Map();
  return {
    async incr(k, fields) {
      const h = data.get(k) || {};
      for (const [f, v] of Object.entries(fields)) h[f] = (h[f] || 0) + v;
      data.set(k, h);
    },
    async getAll(k) { return { ...(data.get(k) || {}) }; },
  };
}

// Upstash Redis over REST. Works from any serverless runtime with fetch.
export function upstashStore(url, token) {
  const call = async (path, init) => {
    const r = await fetch(url + path, { ...init, headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
    if (!r.ok) throw new Error('upstash ' + r.status);
    return r.json();
  };
  return {
    async incr(k, fields) {
      await call('/pipeline', { method: 'POST', body: JSON.stringify(Object.entries(fields).map(([f, v]) => ['HINCRBY', k, f, v])) });
    },
    async getAll(k) {
      const { result } = await call('/hgetall/' + encodeURIComponent(k), { method: 'GET' });
      const out = {};
      for (let i = 0; i < (result || []).length; i += 2) out[result[i]] = Number(result[i + 1]);
      return out;
    },
  };
}
