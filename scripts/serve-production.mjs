import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';

const port = Number(process.env.PORT ?? 4700);
const root = process.env.STATIC_ROOT
  ? normalize(process.env.STATIC_ROOT)
  : join(process.cwd(), 'dist', 'email-agent-web-app', 'browser');
const basePath = '/email-agent';
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

if (!existsSync(join(root, 'index.html'))) {
  throw new Error('Production build not found. Run npm run build first.');
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    response.writeHead(308, { Location: `${basePath}/` });
    response.end();
    return;
  }

  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    response.writeHead(404).end('Not found');
    return;
  }

  const relativePath = pathname.slice(basePath.length).replace(/^\/+/, '');
  const candidate = normalize(join(root, relativePath));
  const isAsset =
    relativePath &&
    candidate.startsWith(root) &&
    existsSync(candidate) &&
    statSync(candidate).isFile();
  const filePath = isAsset ? candidate : join(root, 'index.html');
  const extension = extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] ?? 'application/octet-stream';
  const isHashedAsset =
    /-[A-Z0-9]{8,}\.(css|js)$/i.test(filePath) ||
    /-v\d+\.[a-z0-9]+$/i.test(filePath);
  const cacheControl = isHashedAsset
    ? 'public, max-age=31536000, immutable'
    : isAsset
      ? 'public, max-age=86400'
      : 'no-cache';
  const canCompress = /^(text\/|application\/(javascript|json))/.test(contentType);
  const useGzip = canCompress && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');

  response.setHeader('Content-Type', contentType);
  response.setHeader('Cache-Control', cacheControl);
  response.setHeader('Vary', 'Accept-Encoding');

  if (useGzip) {
    response.setHeader('Content-Encoding', 'gzip');
    createReadStream(filePath).pipe(createGzip({ level: 6 })).pipe(response);
    return;
  }

  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Production server: http://localhost:${port}${basePath}/`);
});
