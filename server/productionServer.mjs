import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const siteDir = join(rootDir, 'site');
const port = Number.parseInt(process.env.PORT ?? '3500', 10);
const host = process.env.HOST ?? '0.0.0.0';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon'],
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'akashic-research-engine' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    return serveStatic(url.pathname, req.method === 'HEAD', res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown server error' });
  }
});

server.listen(port, host, () => {
  console.log(`Akashic Research Engine listening on http://${host}:${port}`);
});

async function serveStatic(pathname, isHead, res) {
  const decodedPath = decodeURIComponent(pathname);
  const safePath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const requested = safePath === '/' ? '/index.html' : safePath;
  let filePath = join(siteDir, requested);

  if (!filePath.startsWith(siteDir)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html');
      await stat(filePath);
    }
  } catch {
    filePath = join(siteDir, 'index.html');
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', mimeTypes.get(extname(filePath)) ?? 'application/octet-stream');
  if (filePath.includes(`${join(siteDir, 'dist')}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  if (isHead) {
    return res.end();
  }

  return createReadStream(filePath).pipe(res);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(payload));
}
