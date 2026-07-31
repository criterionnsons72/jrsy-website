'use strict';

(function () {
  const chat = document.getElementById('chat');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusBar = document.getElementById('statusBar');

  // Conversation history sent to the server (roles: user / assistant).
  let history = [];
  let busy = false;

  const SAMPLE_QUESTIONS = [
    'نمازِ شب کی فضیلت کیا ہے؟',
    'خمس کن چیزوں پر واجب ہے؟',
    'واقعہ کربلا کا مختصر پس منظر بیان کریں',
  ];

  // --------------------------------------------------------------------
  // Rendering helpers
  // --------------------------------------------------------------------
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // A small, safe Markdown-ish renderer for the bot replies.
  function renderMarkdown(text) {
    const lines = text.split(/\r?\n/);
    let html = '';
    let listOpen = false;

    const closeList = () => {
      if (listOpen) {
        html += '</ul>';
        listOpen = false;
      }
    };

    const inline = (s) => {
      let out = escapeHtml(s);
      // Bold **...**
      out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Inline code `...`
      out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
      // Wrap Arabic runs so they use the Arabic font & sizing.
      out = out.replace(
        /([؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿\s\d.,:؛؟!()\-]{8,})/g,
        (m) => {
          // Only treat as "arabic block" if it clearly contains Arabic letters
          // and diacritics / typical Quran markers; keep it conservative.
          if (/[ً-ٰٟٕٓٔ]/.test(m) || /ﷲ|ﷺ|۔/.test(m)) {
            return '<span class="arabic">' + m + '</span>';
          }
          return m;
        }
      );
      return out;
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        closeList();
        continue;
      }
      const h3 = line.match(/^#{1,4}\s+(.*)$/);
      if (h3) {
        closeList();
        html += '<h3>' + inline(h3[1]) + '</h3>';
        continue;
      }
      const li = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
      if (li) {
        if (!listOpen) {
          html += '<ul>';
          listOpen = true;
        }
        html += '<li>' + inline(li[1]) + '</li>';
        continue;
      }
      closeList();
      html += '<p>' + inline(line) + '</p>';
    }
    closeList();
    return html;
  }

  function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
  }

  function showWelcome() {
    chat.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'welcome';
    div.innerHTML =
      '<span class="salaam">السلام علیکم ورحمۃ اللہ وبرکاتہ</span>' +
      '<p>مفتی صاحب میں خوش آمدید۔ شیعہ اثنا عشری مسلک کے مطابق اپنے دینی سوالات پوچھیں۔</p>' +
      '<p>جوابات قرآن، احادیثِ اہلِ بیت (ع) اور معتبر علما کے حوالوں کے ساتھ پیش کیے جاتے ہیں۔</p>';
    const chips = document.createElement('div');
    chips.className = 'chips';
    SAMPLE_QUESTIONS.forEach((q) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = q;
      b.addEventListener('click', () => {
        input.value = q;
        autoGrow();
        input.focus();
      });
      chips.appendChild(b);
    });
    div.appendChild(chips);
    chat.appendChild(div);
  }

  function addMessage(role, text) {
    const welcome = chat.querySelector('.welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'user') {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = renderMarkdown(text);
    }
    msg.appendChild(bubble);
    chat.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg bot typing';
    msg.id = 'typingIndicator';
    msg.innerHTML =
      '<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    chat.appendChild(msg);
    scrollToBottom();
  }

  function removeTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  // status: 'error' | 'warn' | 'info'
  function setStatus(message, kind) {
    if (!message) {
      statusBar.hidden = true;
      statusBar.textContent = '';
      statusBar.className = 'status-bar';
      return;
    }
    statusBar.hidden = false;
    statusBar.textContent = message;
    statusBar.className = 'status-bar ' + (kind || 'error');
  }

  function setBusy(state) {
    busy = state;
    sendBtn.disabled = state;
    input.disabled = state;
  }

  // --------------------------------------------------------------------
  // Networking
  // --------------------------------------------------------------------
  async function sendMessage(text) {
    setStatus('', null);
    addMessage('user', text);
    history.push({ role: 'user', content: text });

    setBusy(true);
    addTyping();

    let res;
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
    } catch (networkErr) {
      removeTyping();
      setBusy(false);
      // Network / connection error state
      setStatus(
        'نیٹ ورک مسئلہ: سرور سے رابطہ نہیں ہو سکا۔ اپنا انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
        'error'
      );
      history.pop();
      return;
    }

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* leave data empty; handled below */
    }

    removeTyping();
    setBusy(false);

    if (res.ok && data.reply) {
      // Success state
      addMessage('bot', data.reply);
      history.push({ role: 'assistant', content: data.reply });
      input.focus();
      return;
    }

    // Error states — remove the just-added user turn from history so a retry
    // does not duplicate it.
    history.pop();

    const msg = data.message || 'کوئی نامعلوم مسئلہ پیش آیا۔';
    const kind = data.error === 'rate_limit' ? 'warn' : 'error';
    setStatus(msg, kind);
  }

  // --------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------
  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }

  input.addEventListener('input', autoGrow);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const text = input.value.trim();
    if (!text) {
      // Empty-input state
      setStatus('براہِ کرم پہلے اپنا سوال لکھیں۔', 'warn');
      input.focus();
      return;
    }
    input.value = '';
    autoGrow();
    sendMessage(text);
  });

  resetBtn.addEventListener('click', () => {
    if (busy) return;
    history = [];
    setStatus('', null);
    showWelcome();
    input.value = '';
    autoGrow();
    input.focus();
  });

  // --------------------------------------------------------------------
  // Init
  // --------------------------------------------------------------------
  showWelcome();
  input.focus();
})();
