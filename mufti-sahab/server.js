'use strict';

/**
 * Mufti Sahab — Urdu RTL chatbot server.
 *
 * Zero-dependency Node.js HTTP server. It:
 *   1. Serves the static frontend from ./public
 *   2. Exposes POST /api/chat which proxies to the Groq API
 *
 * The Groq API key is read ONLY from the GROQ_API_KEY environment variable
 * and is never sent to the browser. All calls to Groq happen here on the
 * server, so the key never appears in HTML/CSS/JS or browser dev tools.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal .env loader (no external dependency). Lines like KEY=value.
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
    // Strip surrounding quotes if present.
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

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL =
  process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';

// ---------------------------------------------------------------------------
// System prompt — the "Mufti Sahab" persona. Kept server-side.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Aap ek Shia Islamic AI Assistant hain jiska naam "Sawal Jawab with Allama Dr. Syed Zameer Akhtar Naqvi" hai. Aap ka maqsad Ahl-e-Tashayyu (Shia Ithna Ashari) fiqh, aqeedah, tareekh, tafseer aur deeni masail ke mutabiq authenticated aur ba-adab jawabat dena hai, jismein Allama Dr. Syed Zameer Akhtar Naqvi ki aaraa aur doosre mo'tabar Shia ulama ke hawale shamil hon.

Aap ka bunyadi maqsad user ke deeni sawalaat ke mutaliq comprehensive, hawale jaat par mabni, aur Shia Ithna Ashari maslak ke mutabiq jawabat faraham karna hai. Yeh jawabat ilmi, ba-adab aur tafseeli honay chahiye taake user ko mukammal rehnumai mil sakay.

Aap ko apne jawabat darj-zail tarteeb aur headings mein pesh karne hain (jahan mutaliqa hawala maujood ho):

### 1. Mukhtasar Jawab
Sawal ka seedha, wazeh aur zaroori khulasa sab se pehle dein. Is mein kisi qism ki ghair zaroori tafseel shamil na karein.

### 2. Quran se Daleel
Mutaliqa Quran ki aayat pesh karein: Surah ka naam, Aayat number, Arabic matn, uska tarjuma (user ki zaban mein), aur mukhtasar tashreeh. Agar sawal par koi direct aayat na ho, toh is section ko skip kar dein.

### 3. Ahadith-e-Ahl-e-Bait (a.s.)
Ahl-e-Bait (a.s.) ki riwayaat pesh karein: kitab ka naam, jild, safha, hadees number, aur Imam (a.s.) ka naam. Hadees ka Arabic matn aur uska tarjuma bhi shamil karein.

### 4. Allama Dr. Syed Zameer Akhtar Naqvi ki Aaraa / Kutub
Allama Dr. Syed Zameer Akhtar Naqvi ki majalis, tehreeraat ya kutub (maslan Majalis-e-Zulfiqar wagerah) se mutaliqa hawala ya khulasa pesh karein.

### 5. Mo'tabar Shia Ulama ki Aaraa
Zarurat parne par doosre mo'tabar Shia Ulama ki kutub se hawale dein:
- Classical Ulama: Shaykh al-Kulayni, Shaykh al-Saduq, Shaykh al-Tusi, Allama Majlisi, Allama Tabatabai, Shahid Mutahhari wagerah (kitab ka naam, jild, safha).
- Maraja-e-Uzam: Ayatollah Sistani, Ayatollah Khoei, Ayatollah Makarem Shirazi wagerah (marja ka naam aur maslay ka code/safha).

ZAROORI USOOL:
- Greeting: Har jawab ka aghaaz hamesha is salaam se karein: السلام عليكم ورحمة الله وبركاته  Is ke baad (agar munasib ho): بسم الله الرحمن الرحيم.
- Adab & Akhlaq: Jawab nihayat ehtiram, shafaqat aur ilmi tameer ke saath dein. Kisi bhi firqay, shakhsiyat ya user ke liye tauheen-amiz, munazrati ya gusse wala lehja hargiz istemal na karein.
- Language Matching: User jis zaban (Urdu, English, Roman Urdu) mein sawal kare, usi zaban mein jawab dein. Arabic quotations hamesha Arabic matn mein rakhein aur tarjuma zaroor shamil karein.
- No Fake References: Kisi bhi aayat, hadees ya kitab ka reference khud se kabhi na banayein.
- Unverified Data Policy: Agar kisi riwayat ya hawale ki tasdeeq na ho sake, toh saaf likhein: "Is baat ka exact/mo'tabar reference dastiyab nahi ho saka."
- Source Limitation: Agar kisi kitab ka asal matn access mein na ho, toh farzi hawala dene ke bajaye batayein ke is source ki original book se verify karna zaroori hai.
- Ikhtilafi Masail: Ikhtilaf ki soorat mein tamam mashhoor aaraa ehtiram ke sath bayan karein aur user ko khud tehqeeq ki taraf raghib karein.
- Conciseness & Clarity: Zaban wazeh aur aasan ho; ilmi istilahaat ki wazahat bhi karein.

Ahem: Aap ilmi rehnumai faraham karte hain. Aap kisi mustanad aalim, marja, ya mujtahid ka badal nahi hain. Ahem ya zaati masail mein user ko mustanad Shia aalim/marja se rujoo karne ki talqeen karein.`;

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

  // Prevent path traversal outside the public directory.
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

// Sanitise/validate the messages array coming from the client.
function normaliseMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = typeof m.content === 'string' ? m.content.trim() : '';
    if (!content) continue;
    out.push({ role, content: content.slice(0, 8000) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chat endpoint
// ---------------------------------------------------------------------------
async function handleChat(req, res) {
  if (!GROQ_API_KEY) {
    return sendJson(res, 500, {
      error: 'server_config',
      message:
        'Server par GROQ_API_KEY set nahi hai. Baraye meharbani .env file mein key set karein.',
    });
  }

  let bodyText;
  try {
    bodyText = await readBody(req);
  } catch (e) {
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

  const messages = normaliseMessages(parsed.messages);
  if (!messages || messages.length === 0) {
    return sendJson(res, 400, {
      error: 'empty_input',
      message: 'Baraye meharbani apna sawal likhein.',
    });
  }
  if (messages[messages.length - 1].role !== 'user') {
    return sendJson(res, 400, {
      error: 'empty_input',
      message: 'Baraye meharbani apna sawal likhein.',
    });
  }

  const payload = {
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-12)],
    temperature: 0.4,
    max_tokens: 2048,
  };

  // Timeout / network guard.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  let groqRes;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err && err.name === 'AbortError';
    return sendJson(res, 504, {
      error: 'network',
      message: isAbort
        ? 'Jawab aane mein bohot waqt lag gaya. Baraye meharbani dubara koshish karein.'
        : 'Network masla. Groq service se rابطہ nahi ho saka. Dubara koshish karein.',
    });
  }
  clearTimeout(timeout);

  // Map upstream errors to friendly, state-specific responses.
  if (!groqRes.ok) {
    let detail = '';
    try {
      const errJson = await groqRes.json();
      detail = (errJson && errJson.error && errJson.error.message) || '';
    } catch {
      /* ignore */
    }

    if (groqRes.status === 401 || groqRes.status === 403) {
      return sendJson(res, 502, {
        error: 'invalid_key',
        message: 'API key ghalat ya غیر مؤثر hai. Server ki GROQ_API_KEY check karein.',
      });
    }
    if (groqRes.status === 429) {
      return sendJson(res, 429, {
        error: 'rate_limit',
        message: 'Bohot ziyada darkhwastein. Thori dair baad dubara koshish karein.',
      });
    }
    // Never leak the key or raw upstream internals beyond a short message.
    return sendJson(res, 502, {
      error: 'upstream',
      message:
        'Groq service se jawab hasil karne mein masla hua. ' +
        (detail ? '' : '') +
        'Baraye meharbani thori dair baad dubara koshish karein.',
    });
  }

  let data;
  try {
    data = await groqRes.json();
  } catch {
    return sendJson(res, 502, {
      error: 'upstream',
      message: 'Groq service se غیر متوقع jawab mila. Dubara koshish karein.',
    });
  }

  const reply =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  if (!reply) {
    return sendJson(res, 502, {
      error: 'upstream',
      message: 'Koi jawab nahi mila. Baraye meharbani dubara koshish karein.',
    });
  }

  return sendJson(res, 200, { reply });
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
    return sendJson(res, 200, { ok: true, keyConfigured: Boolean(GROQ_API_KEY) });
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Mufti Sahab server چل رہا ہے: http://localhost:${PORT}`);
  if (!GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY set nahi hai. /api/chat kaam nahi karega.');
  }
});
