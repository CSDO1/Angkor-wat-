// Web server for hosting the game (Render, Railway, any Node host): serves the Vite build in dist/.
// Builds it first if dist/ is missing, so a plain `npm install` + `npm start` deploy works.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.log('[angkor] dist/ not found, building the game…');
  const { build } = await import('vite');
  await build({ logLevel: 'warn' });
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }   // ROOT ends with a separator
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  const { size } = statSync(file);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Content-Length': size,
    // hashed bundles never change; everything else revalidates
    'Cache-Control': file.includes(`${sep}assets${sep}index-`) || file.includes('-normal-') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log(`[angkor] serving on port ${PORT}`));
