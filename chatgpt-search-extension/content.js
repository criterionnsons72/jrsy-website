/*
 * Chat Navigator AI — content script
 * -----------------------------------
 * ChatGPT page par ek chhota sa panel dikhata hai jisme is conversation ke
 * messages number ke sath list hote hain. Aap:
 *   - search bar se unhe filter kar sakte ho,
 *   - "جواب بھی" toggle se sirf apne sawal ya sawal + AI ke jawab dekh sakte ho,
 *   - kisi bhi item par ⭐ laga kar use bookmark kar sakte ho (save rehta hai),
 *   - kisi item par click karke seedha us message tak scroll kar sakte ho.
 *
 * Yeh poora kaam sirf DOM + browser storage par hota hai — koi network call,
 * koi data collection nahi. Aapki chat kahin bheji nahi jaati.
 */
(function () {
  "use strict";

  if (window.__chatNavigatorAiLoaded) return;
  window.__chatNavigatorAiLoaded = true;

  // -- Constants -----------------------------------------------------------
  const USER_SELECTOR = '[data-message-author-role="user"]';
  const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]';
  const HIGHLIGHT_CLASS = "cnai-highlight";
  const MAX_PREVIEW_LEN = 90;

  // -- State ---------------------------------------------------------------
  let panelEl, listEl, searchEl, countEl, launcherEl;
  let roleToggleBtn, bmToggleBtn;
  let prompts = []; // { el, text, role }
  let isOpen = true;
  let showAssistant = false; // false = sirf mere sawal, true = jawab bhi
  let onlyBookmarks = false;
  let bookmarks = new Set(); // is conversation ke bookmark kiye gaye texts
  let convKey = bmStorageKey();
  let refreshTimer = null;

  // -- Bookmarks (chrome.storage me save) ----------------------------------
  // Har conversation ki apni key (URL path se), taake bookmarks alag rahein.
  function bmStorageKey() {
    return "cnai_bm_" + location.pathname;
  }
  function loadBookmarks() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([convKey], (res) => {
          bookmarks = new Set((res && res[convKey]) || []);
          resolve();
        });
      } catch (e) {
        bookmarks = new Set();
        resolve();
      }
    });
  }
  function saveBookmarks() {
    try {
      chrome.storage.local.set({ [convKey]: Array.from(bookmarks) });
    } catch (e) {
      /* storage na ho to chup rahein */
    }
  }
  function toggleBookmark(text) {
    if (bookmarks.has(text)) bookmarks.delete(text);
    else bookmarks.add(text);
    saveBookmarks();
  }

  // -- Helpers -------------------------------------------------------------
  function collectPrompts() {
    const selector = showAssistant
      ? `${USER_SELECTOR}, ${ASSISTANT_SELECTOR}`
      : USER_SELECTOR;
    return Array.from(document.querySelectorAll(selector))
      .map((el) => ({
        el,
        text: (el.innerText || "").trim(),
        role:
          el.getAttribute("data-message-author-role") === "assistant"
            ? "assistant"
            : "user",
      }))
      .filter((p) => p.text.length > 0);
  }

  function preview(text) {
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > MAX_PREVIEW_LEN
      ? oneLine.slice(0, MAX_PREVIEW_LEN) + "…"
      : oneLine;
  }

  function goToPrompt(item) {
    if (!item.el || !document.body.contains(item.el)) return;
    item.el.scrollIntoView({ behavior: "smooth", block: "center" });
    item.el.classList.add(HIGHLIGHT_CLASS);
    window.setTimeout(() => item.el.classList.remove(HIGHLIGHT_CLASS), 1600);
  }

  function applyFilter() {
    const q = (searchEl.value || "").trim().toLowerCase();
    let visible = 0;
    listEl.querySelectorAll(".cnai-item").forEach((li) => {
      const text = li.dataset.text || "";
      const matchText = q === "" || text.toLowerCase().includes(q);
      const matchBm = !onlyBookmarks || bookmarks.has(text);
      const show = matchText && matchBm;
      li.style.display = show ? "" : "none";
      if (show) visible++;
    });
    countEl.textContent =
      q || onlyBookmarks
        ? `${visible} / ${prompts.length} items`
        : `${prompts.length} items`;
  }

  function render() {
    prompts = collectPrompts();
    listEl.innerHTML = "";

    if (prompts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "cnai-empty";
      empty.textContent = "Is chat me abhi kuch nahi mila.";
      listEl.appendChild(empty);
      countEl.textContent = "0 items";
      return;
    }

    prompts.forEach((item, idx) => {
      const li = document.createElement("div");
      li.className = "cnai-item" + (item.role === "assistant" ? " cnai-asst" : "");
      li.dataset.text = item.text;
      li.title = item.text;

      const num = document.createElement("span");
      num.className = "cnai-num";
      num.textContent = item.role === "assistant" ? "AI" : "#" + (idx + 1);

      const txt = document.createElement("span");
      txt.className = "cnai-text";
      txt.textContent = preview(item.text);
      txt.setAttribute("dir", "auto");
      txt.addEventListener("click", () => goToPrompt(item));

      // ⭐ Bookmark star
      const star = document.createElement("button");
      star.type = "button";
      star.className = "cnai-star" + (bookmarks.has(item.text) ? " on" : "");
      star.title = "Bookmark";
      star.textContent = bookmarks.has(item.text) ? "★" : "☆";
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmark(item.text);
        const on = bookmarks.has(item.text);
        star.classList.toggle("on", on);
        star.textContent = on ? "★" : "☆";
        if (onlyBookmarks) applyFilter();
      });

      li.appendChild(num);
      li.appendChild(txt);
      li.appendChild(star);
      listEl.appendChild(li);
    });

    applyFilter();
  }

  function scheduleRender() {
    // Agar conversation badal gayi (URL path change), to bookmarks reload karo.
    const newKey = bmStorageKey();
    if (newKey !== convKey) {
      convKey = newKey;
      loadBookmarks().then(render);
      return;
    }
    if (refreshTimer) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(render, 300);
  }

  // -- UI ------------------------------------------------------------------
  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.className = "cnai-panel";
    panelEl.setAttribute("dir", "rtl");

    // Header
    const header = document.createElement("div");
    header.className = "cnai-header";

    const title = document.createElement("div");
    title.className = "cnai-title";
    title.innerHTML = '<span class="cnai-logo">🔖</span> Chat Navigator <b>AI</b>';

    const actions = document.createElement("div");
    actions.className = "cnai-actions";

    const refreshBtn = iconBtn("⟳", "List refresh karein", render);
    const minBtn = iconBtn("—", "Chhupayein / dikhayein", () => togglePanel());
    actions.appendChild(refreshBtn);
    actions.appendChild(minBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // Search
    const searchWrap = document.createElement("div");
    searchWrap.className = "cnai-search";
    searchEl = document.createElement("input");
    searchEl.type = "text";
    searchEl.placeholder = "سوال تلاش کریں…  (search)";
    searchEl.setAttribute("dir", "auto");
    searchEl.addEventListener("input", applyFilter);
    searchWrap.appendChild(searchEl);

    // Filter chips: jawab bhi | sirf bookmarks
    const chips = document.createElement("div");
    chips.className = "cnai-chips";
    roleToggleBtn = chipBtn("💬 جواب بھی", "Sawal + AI ke jawab dikhayein", () => {
      showAssistant = !showAssistant;
      roleToggleBtn.classList.toggle("on", showAssistant);
      render();
    });
    bmToggleBtn = chipBtn("⭐ صرف بک مارک", "Sirf bookmark kiye hue dikhayein", () => {
      onlyBookmarks = !onlyBookmarks;
      bmToggleBtn.classList.toggle("on", onlyBookmarks);
      applyFilter();
    });
    chips.appendChild(roleToggleBtn);
    chips.appendChild(bmToggleBtn);

    // List + footer
    listEl = document.createElement("div");
    listEl.className = "cnai-list";
    countEl = document.createElement("div");
    countEl.className = "cnai-count";
    countEl.textContent = "0 items";

    panelEl.appendChild(header);
    panelEl.appendChild(searchWrap);
    panelEl.appendChild(chips);
    panelEl.appendChild(listEl);
    panelEl.appendChild(countEl);
    document.body.appendChild(panelEl);
  }

  function iconBtn(label, tip, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cnai-icon-btn";
    b.title = tip;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }
  function chipBtn(label, tip, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cnai-chip";
    b.title = tip;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function buildLauncher() {
    launcherEl = document.createElement("button");
    launcherEl.type = "button";
    launcherEl.className = "cnai-launcher";
    launcherEl.title = "Chat Navigator AI kholein";
    launcherEl.textContent = "🔖";
    launcherEl.style.display = "none";
    launcherEl.addEventListener("click", () => togglePanel());
    document.body.appendChild(launcherEl);
  }

  function togglePanel() {
    isOpen = !isOpen;
    panelEl.style.display = isOpen ? "" : "none";
    launcherEl.style.display = isOpen ? "none" : "flex";
    if (isOpen) render();
  }

  // -- Init ----------------------------------------------------------------
  function init() {
    buildPanel();
    buildLauncher();
    loadBookmarks().then(render);

    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.body, { childList: true, subtree: true });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "CNAI_TOGGLE_PANEL") togglePanel();
    });
  }

  if (document.body) init();
  else window.addEventListener("DOMContentLoaded", init, { once: true });
})();
