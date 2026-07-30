# Chat Navigator AI 🔖

Ek chhota Chrome extension jo **ChatGPT** ki chat me aap ke saare sawalon
(prompts) ki ek numbered list bana deta hai. Aap unhe **search** kar sakte ho
aur kisi bhi sawal par **click** karte hi page seedha us message tak scroll ho
jaata hai — bilkul waise jaise aap ke sir wale extension me hota hai.

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

## Agar list khaali dikhe

ChatGPT apna page structure kabhi-kabhi badalta rehta hai. Us soorat me
`content.js` me sirf yeh line update karni hogi:

```js
const USER_MSG_SELECTOR = '[data-message-author-role="user"]';
```

## Customize karna ho to

- Panel ki jagah/rang: `styles.css` me `.cnai-panel` aur `--teal` (#2dd4bf) values.
- Preview length: `content.js` me `MAX_PREVIEW_LEN`.
- Sirf apne prompts ki bajaye AI ke jawab bhi chahiye ho to selector me
  `[data-message-author-role="assistant"]` add kar sakte ho.
