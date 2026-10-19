const KEY = 'counterfeit:v1';

const fresh = () => ({ sound: true, stats: { played: 0, streak: 0, best: 0, last: -2 }, days: {} });

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.stats && s.days) return s;
  } catch { /* storage unavailable or corrupt */ }
  return fresh();
}

export function saveStore(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function resetStore() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
