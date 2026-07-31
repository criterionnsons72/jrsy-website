'use strict';

/**
 * Mufti Sahab — local development server (`npm start`).
 *
 * Zero-dependency Node.js HTTP server. It:
 *   1. Serves the static frontend from ./public
 *   2. Exposes POST /api/chat which proxies to the Groq API
 *
 * The Groq API key is read ONLY from the GROQ_API_KEY environment variable
 * and is never sent to the browser. The actual Groq call lives in lib/groq.js,
 * which is shared with the Vercel serverless function (api/chat.js).
 *
 * NOTE: On Vercel this file is NOT used — Vercel serves /public statically and
 * runs api/chat.js as a serverless function. This server is for local runs.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal .env loader (no external dependency). Lines like KEY=value.
// On Vercel, env vars come from the dashboard, so this only matters locally.
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

// Require the shared core AFTER loadEnv so it sees the loaded variables.
const { getChatResponse } = require('./lib/groq');

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const publicDir = path.join(__dirname, 'public');
  const filePath = path.normalize(path.join(publicDir, urlPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req, limitBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Chat endpoint (delegates to the shared core)
// ---------------------------------------------------------------------------
async function handleChat(req, res) {
  let bodyText;
  try {
    bodyText = await readBody(req);
  } catch {
    return sendJson(res, 413, {
      error: 'payload_too_large',
      message: 'Aap ka paigham bohot bara hai.',
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(bodyText || '{}');
  } catch {
    return sendJson(res, 400, {
      error: 'bad_request',
      message: 'Darkhwast ka format durust nahi hai.',
    });
  }

  const result = await getChatResponse(parsed.messages);
  return sendJson(res, result.status, result.body);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChat(req, res).catch(() => {
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: 'server_error',
          message: 'Server mein غیر متوقع masla. Baraye meharbani dubara koshish karein.',
        });
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      keyConfigured: Boolean(process.env.GROQ_API_KEY),
    });
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Mufti Sahab server چل رہا ہے: http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY set nahi hai. /api/chat kaam nahi karega.');
  }
});
