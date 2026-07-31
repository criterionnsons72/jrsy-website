# مفتی صاحب — Mufti Sahab

**سوال جواب with Allama Dr. Syed Zameer Akhtar Naqvi**

A simple, fully responsive **Urdu RTL** chatbot web app. It answers religious
questions according to the **Shia Ithna Ashari** school, presenting replies with
references to the Quran, Ahadith-e-Ahl-e-Bait (a.s.), Allama Dr. Syed Zameer
Akhtar Naqvi, and other reputable Shia scholars.

Built to be easy for non-technical users, with a clean chat interface, readable
Urdu (Nastaliq) typography, and clear feedback for every state.

> ⚠️ **Adab / Disclaimer:** This is an AI assistant that provides *scholarly
> guidance only*. It is **not** a substitute for a qualified scholar, mujtahid,
> or marja'. For important or personal matters, please consult a qualified Shia
> scholar / marja'.

---

## Security: the API key stays on the server

- The Groq API key is read **only** from the `GROQ_API_KEY` environment variable
  on the server (`server.js`).
- It is **never** sent to the browser and does not appear in any HTML, CSS, JS,
  page source, or logs.
- The frontend only ever talks to this app's own `POST /api/chat` endpoint,
  which adds the key server-side before calling Groq.
- `.env` is git-ignored (see `.gitignore`), so the key is never committed.

---

## Requirements

- **Node.js 18 or newer** (uses the built-in `fetch` and HTTP server — **no npm
  dependencies to install**).
- A Groq API key — get one free at <https://console.groq.com/keys>.

---

## How to run (3 steps)

```bash
# 1. Go into the app folder
cd mufti-sahab

# 2. Create your .env file and paste your Groq key into it
cp .env.example .env
#    then open .env and set:  GROQ_API_KEY=gsk_xxxxxxxx...

# 3. Start the app
npm start
#    (equivalent to: node server.js)
```

Then open **<http://localhost:3000>** in your browser and start chatting.

To change the port: `PORT=8080 npm start` (or set `PORT` in `.env`).

---

## Files created

| File                    | Purpose                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `server.js`             | Zero-dependency Node server: serves the UI + `/api/chat` proxy |
| `public/index.html`     | Urdu RTL chat page                                             |
| `public/styles.css`     | Responsive design + Nastaliq/Amiri typography                 |
| `public/app.js`         | Chat logic, state handling, lightweight markdown renderer      |
| `.env.example`          | Template for environment variables                             |
| `.env`                  | Your real secrets (git-ignored — you create this)             |
| `.gitignore`            | Keeps `.env` and secrets out of git                           |
| `package.json`          | `npm start` script + metadata                                 |
| `README.md`             | This file                                                     |

---

## Handled states

The UI gives clear, Urdu feedback for every situation:

- **Loading** — animated typing indicator while the answer is generated.
- **Success** — the formatted answer appears with proper headings.
- **Empty input** — asks the user to type a question first.
- **Invalid key** — tells you the server's `GROQ_API_KEY` is wrong/missing.
- **Rate limit** — asks the user to wait and try again (soft warning style).
- **Network error** — connection problems are reported clearly.
- **Server error** — unexpected server issues are handled gracefully.

There is also a **نئی گفتگو (reset)** button to clear the conversation.

---

## Endpoints

- `GET /` — the chat web page.
- `POST /api/chat` — body: `{ "messages": [{ "role": "user", "content": "..." }] }`
  → returns `{ "reply": "..." }` or `{ "error": "...", "message": "..." }`.
- `GET /api/health` — `{ "ok": true, "keyConfigured": true|false }`.

---

## Configuration

| Variable        | Default                     | Description                     |
| --------------- | --------------------------- | ------------------------------- |
| `GROQ_API_KEY`  | _(required)_                | Your Groq API key (server-only) |
| `GROQ_MODEL`    | `llama-3.3-70b-versatile`   | Groq model to use               |
| `PORT`          | `3000`                      | Local server port               |
