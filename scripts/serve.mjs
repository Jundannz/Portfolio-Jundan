#!/usr/bin/env node
/* Server statis kecil untuk pengembangan & tes (tanpa dependency).
   Pemakaian: node scripts/serve.mjs [folder] [port]  (default: . 8000) */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || process.env.PORT || 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.ico': 'image/x-icon'
};

// Folder yang tidak boleh disajikan (meniru isi dist/ di production)
const ALLOWED = /^\/(?:index\.html|works\.html|project\.html|(?:assets|css)\/[^\\]+|js\/(?:works-core|works-store|pages|script|dino)\.js|data\/works\.json)$/;

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join(root, pathname);
  if (!file.startsWith(root + path.sep) || !ALLOWED.test(pathname) || pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(404).end('Not found'); return; }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} di http://localhost:${port}/`);
});
