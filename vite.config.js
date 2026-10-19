import { handleVisit } from './server/visits.js';
import { fileStore } from './server/fileStore.js';

// Serves /api/visit during `vite` and `vite preview`, backed by .data/visits.json.
function visitorsBook() {
  const store = fileStore('.data/visits.json');
  const middleware = async (req, res) => {
    try {
      let body = null;
      if (req.method === 'POST') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { body = null; }
      }
      const query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
      const { status, json } = await handleVisit({ method: req.method, query, body }, store);
      res.statusCode = status;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify(json));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e) }));
    }
  };
  return {
    name: 'counterfeit-visitors-book',
    configureServer(server) { server.middlewares.use('/api/visit', middleware); },
    configurePreviewServer(server) { server.middlewares.use('/api/visit', middleware); },
  };
}

export default { plugins: [visitorsBook()] };
