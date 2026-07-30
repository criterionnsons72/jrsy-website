# Chat Navigator AI 🔖

Ek chhota Chrome extension jo AI chat me aap ke saare sawalon (prompts) ki ek
numbered list bana deta hai. Aap unhe **search** kar sakte ho aur kisi bhi sawal
par **click** karte hi page seedha us message tak scroll ho jaata hai.

**Kaam karta hai in par:** ChatGPT, Claude (claude.ai), Google Gemini — poora
support. DeepSeek, Grok, Perplexity, Copilot par best-effort (auto-detect).

> Poora kaam sirf aap ke browser ke andar (page ke DOM par) hota hai. Koi data
> kahin bheja nahi jaata, koi login/API key ki zaroorat nahi.

## Features

- 📋 Is conversation ke saare user prompts ki numbered list
- 🔎 Live search — likhte hi list filter ho jaati hai
- 🖱️ Kisi sawal par click karo → us message tak smooth scroll + highlight
- 💬 **"جواب بھی" toggle** — sirf apne sawal ya AI ke jawab bhi dekhein
- ⭐ **Bookmark** — kisi item par star lagao, wo save reh jaata hai; "صرف بک مارک"
  toggle se sirf bookmarks dekhein (har chat ke apne bookmarks)
- 🔄 Naye messages aate hi list khud update ho jaati hai
- ⭐ **Chhota launcher** — extension on hote hi screen par sirf ek chhota
  star/circle ⭐ aata hai; click karo to poora panel khul jaata hai, zaroorat
  na ho to minimize (—) karke wapas star bana do
- ✋ **Drag** — panel ko header se, aur launcher star ko bhi, pakad kar kahin bhi
  move karo; dono ki jagah save reh jaati hai
- 🖱️ **Double-click** panel ke header par = foran chhote star me minimize
- 🌙 Dark theme, Urdu + English dono text theek dikhte hain

## Install kaise karein (Load unpacked)

1. Chrome kholein aur address bar me jaayein: `chrome://extensions`
2. Upar dayein taraf **Developer mode** ka toggle **ON** karein.
3. **Load unpacked** button par click karein.
4. Is folder ko chunein: **`chatgpt-search-extension`**
5. Ab [chatgpt.com](https://chatgpt.com) kholein ya refresh karein — dayein
   taraf panel khud aa jaayega. ✅

Extension icon (toolbar me 🔖) par click karke panel ko chhupa/dikha bhi sakte ho.

## Kaise kaam karta hai (short)

- `manifest.json` — extension ki settings (Manifest V3).
- `content.js` — ChatGPT page par panel banata hai, prompts dhoondta hai
  (`[data-message-author-role="user"]`), search + click-to-scroll handle karta hai.
- `styles.css` — panel ka look (dark + teal).
- `background.js` — toolbar icon click par panel toggle karta hai.

## Nayi site add karni ho / list khaali dikhe

Har site ka HTML alag hota hai, is liye `content.js` me `SITE_CONFIGS` naam ka
ek config hai jisme har site ke selectors hain:

```js
const SITE_CONFIGS = [
  {
    name: "ChatGPT",
    match: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/,
    user: ['[data-message-author-role="user"]'],
    assistant: ['[data-message-author-role="assistant"]'],
  },
  // ... Claude, Gemini, DeepSeek
];
```

**Nayi site add karne ke steps:**

1. Us site par `F12` (DevTools) kholo.
2. Apne kisi message par right-click → **Inspect**.
3. Us element ka koi unique attribute/class dekho (jaise
   `data-testid="user-message"`).
4. `SITE_CONFIGS` me naya entry add karo: `match` me site ka host, `user` aur
   `assistant` me apne aur AI ke message ke selectors.
5. `manifest.json` ke `matches` me bhi us site ka URL add karo.
6. `chrome://extensions` par extension **refresh** karo.

> Site config me na ho to extension ek **generic** best-effort mode aazmata hai —
> kabhi chal jaata hai, kabhi nahi. Pukhta support ke liye upar wale steps behtar.

## Customize karna ho to

- Panel ka rang: `styles.css` me `#c9d42d` (accent) ki jagah naya rang.
- Preview length: `content.js` me `MAX_PREVIEW_LEN`.
- Nayi site ke selectors: `content.js` me `SITE_CONFIGS`.
