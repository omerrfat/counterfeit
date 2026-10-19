import { promises as fs } from 'node:fs';
import path from 'node:path';

// Dev-only persistence: a JSON file next to the project. Good enough to see the
// visitors' book work locally; use the Upstash store in production.
export function fileStore(file) {
  let chain = Promise.resolve();
  const read = async () => {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return {}; }
  };
  return {
    incr(k, fields) {
      chain = chain.then(async () => {
        const all = await read();
        const h = (all[k] ||= {});
        for (const [f, v] of Object.entries(fields)) h[f] = (h[f] || 0) + v;
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(all, null, 2));
      });
      return chain;
    },
    async getAll(k) { await chain; return (await read())[k] || {}; },
  };
}
