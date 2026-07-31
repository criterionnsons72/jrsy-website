'use strict';

/**
 * Shared Groq chat logic used by BOTH:
 *   - server.js        (local Node server, `npm start`)
 *   - api/chat.js      (Vercel serverless function)
 *
 * The Groq API key is read ONLY from process.env.GROQ_API_KEY and is never
 * returned to the client. All error states map to friendly Urdu messages.
 */

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL =
  process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';

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

// Validate/sanitise the messages array coming from the client.
function normaliseMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role =
      m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = typeof m.content === 'string' ? m.content.trim() : '';
    if (!content) continue;
    out.push({ role, content: content.slice(0, 8000) });
  }
  return out;
}

/**
 * Core chat handler. Takes the raw `messages` array from the request body and
 * returns { status, body } — body is the JSON object to send to the client.
 */
async function getChatResponse(rawMessages) {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    return {
      status: 500,
      body: {
        error: 'server_config',
        message:
          'Server par GROQ_API_KEY set nahi hai. Baraye meharbani environment variable set karein.',
      },
    };
  }

  const messages = normaliseMessages(rawMessages);
  if (
    !messages ||
    messages.length === 0 ||
    messages[messages.length - 1].role !== 'user'
  ) {
    return {
      status: 400,
      body: {
        error: 'empty_input',
        message: 'Baraye meharbani apna sawal likhein.',
      },
    };
  }

  const payload = {
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-12)],
    temperature: 0.4,
    max_tokens: 2048,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  let groqRes;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err && err.name === 'AbortError';
    return {
      status: 504,
      body: {
        error: 'network',
        message: isAbort
          ? 'Jawab aane mein bohot waqt lag gaya. Baraye meharbani dubara koshish karein.'
          : 'Network masla. Groq service se rابطہ nahi ho saka. Dubara koshish karein.',
      },
    };
  }
  clearTimeout(timeout);

  if (!groqRes.ok) {
    if (groqRes.status === 401 || groqRes.status === 403) {
      return {
        status: 502,
        body: {
          error: 'invalid_key',
          message:
            'API key ghalat ya غیر مؤثر hai. Server ki GROQ_API_KEY check karein.',
        },
      };
    }
    if (groqRes.status === 429) {
      return {
        status: 429,
        body: {
          error: 'rate_limit',
          message:
            'Bohot ziyada darkhwastein. Thori dair baad dubara koshish karein.',
        },
      };
    }
    return {
      status: 502,
      body: {
        error: 'upstream',
        message:
          'Groq service se jawab hasil karne mein masla hua. Baraye meharbani thori dair baad dubara koshish karein.',
      },
    };
  }

  let data;
  try {
    data = await groqRes.json();
  } catch {
    return {
      status: 502,
      body: {
        error: 'upstream',
        message: 'Groq service se غیر متوقع jawab mila. Dubara koshish karein.',
      },
    };
  }

  const reply =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  if (!reply) {
    return {
      status: 502,
      body: {
        error: 'upstream',
        message: 'Koi jawab nahi mila. Baraye meharbani dubara koshish karein.',
      },
    };
  }

  return { status: 200, body: { reply } };
}

module.exports = { getChatResponse, normaliseMessages, SYSTEM_PROMPT };
