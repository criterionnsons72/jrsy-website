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

## Files

| File                    | Purpose                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `server.js`             | Local dev server: serves the UI + `/api/chat` proxy (`npm start`) |
| `api/chat.js`           | Vercel serverless function for `/api/chat`                     |
| `lib/groq.js`           | Shared Groq logic used by both server.js and api/chat.js       |
| `public/index.html`     | Urdu RTL chat page                                             |
| `public/styles.css`     | Responsive design + Nastaliq/Amiri typography                 |
| `public/app.js`         | Chat logic, state handling, lightweight markdown renderer      |
| `vercel.json`           | Vercel config (function timeout)                              |
| `.env.example`          | Template for environment variables                             |
| `.env`                  | Your real secrets (git-ignored — you create this locally)     |
| `.gitignore`            | Keeps `.env` and secrets out of git                           |
| `package.json`          | `npm start` script + metadata                                 |
| `README.md`             | This file                                                     |

---

## Deploy to Vercel (from GitHub)

The app is Vercel-ready: `/public` is served as static files and `api/chat.js`
runs as a serverless function. The API key lives in a Vercel Environment
Variable — never in the code.

1. Push this repo to GitHub (already done on the working branch).
2. Go to <https://vercel.com/new> and **Import** the `jrsy-website` repository.
3. In the import screen, set **Root Directory** to `mufti-sahab`
   (click *Edit* next to Root Directory and pick the `mufti-sahab` folder).
   This is important — the repo root is a different project.
4. Framework Preset: **Other** (no build step needed).
5. Open **Environment Variables** and add:
   - Name: `GROQ_API_KEY`  → Value: your Groq key (`gsk_...`)
   - (optional) `GROQ_MODEL` → e.g. `llama-3.3-70b-versatile`
6. Click **Deploy**. When it finishes you get a public URL like
   `https://your-project.vercel.app`.

To update the site later: just push new commits to the branch/repo — Vercel
redeploys automatically.

> If you ever change or add the `GROQ_API_KEY` value in Vercel, trigger a new
> deployment (Deployments → ⋯ → Redeploy) so the function picks it up.

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
