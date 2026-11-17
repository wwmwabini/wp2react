// Serves the built app and proxies /api/wp/* to WordPress.
// All settings come from runtime env vars, so changing them needs only a pod restart.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = process.env.PORT || 3000;
const ALLOWED = /^(posts|pages|categories|tags|users|media|comments|search)(\/|$)/;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

async function proxy(req, res, url) {
  const base = (process.env.WP_API_URL || process.env.VITE_WP_API_URL || '').replace(/\/$/, '');
  const rest = url.pathname.replace('/api/wp/', '');
  if (!base) return send(res, 500, { message: 'WP_API_URL is not set on the server.' });
  if (req.method !== 'GET' || !ALLOWED.test(rest)) return send(res, 403, { message: 'Not allowed.' });
  const headers = {};
  const { WP_USER: u, WP_APP_PASSWORD: p } = process.env;
  if (u && p) headers.Authorization = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
  try {
    const r = await fetch(`${base}/${rest}${url.search}`, { headers });
    res.writeHead(r.status, {
      'Content-Type': r.headers.get('content-type') || 'application/json',
      'X-WP-Total': r.headers.get('x-wp-total') || '',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    send(res, 502, { message: `Could not reach WordPress: ${e.message}` });
  }
}

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/wp/')) return proxy(req, res, url);
  const file = path.join(dist, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));
  try {
    if (!file.startsWith(dist)) throw 0;
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(path.join(dist, 'index.html')));
  }
}).listen(PORT, () => console.log(`Listening on ${PORT}`));