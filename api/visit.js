// Vercel serverless function for the visitors' book.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (e.g. via the Upstash
// integration in the Vercel Marketplace) to persist counts. Without them the
// function falls back to memory, which resets whenever the function cold-starts.
import { handleVisit, memoryStore, upstashStore } from '../server/visits.js';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const store = url && token ? upstashStore(url, token) : memoryStore();
if (!(url && token)) console.warn('Visitors’ book is using in-memory storage. Set the Upstash env vars to persist it.');

export default async function handler(req, res) {
  try {
    const { status, json } = await handleVisit({ method: req.method, query: req.query, body: req.body }, store);
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'visitors’ book unavailable' });
  }
}
