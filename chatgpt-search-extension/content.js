/*
 * Chat Navigator AI — content script
 * -----------------------------------
 * ChatGPT page par ek chhota sa panel dikhata hai jisme is conversation ke
 * saare user prompts (sawal) number ke sath list hote hain. Aap search bar se
 * unhe filter kar sakte ho, aur kisi bhi item par click karo to page us message
 * tak scroll ho jaata hai aur wo message ek pal ke liye highlight ho jaata hai.
 *
 * Yeh poora kaam sirf DOM par hota hai — koi network call, koi data collection
 * nahi. Extension aapki chat kahin nahi bhejta.
 */
(function () {
  "use strict";

  // Ek hi baar inject karein (SPA navigation par dobara chal sakta hai).
  if (window.__chatNavigatorAiLoaded) return;
  window.__chatNavigatorAiLoaded = true;

  // -- Constants -----------------------------------------------------------
  // ChatGPT har user message ko is attribute se mark karta hai. Agar kabhi
  // OpenAI markup badle to yahan selector update karna kaafi hoga.
  const USER_MSG_SELECTOR = '[data-message-author-role="user"]';
  const HIGHLIGHT_CLASS = "cnai-highlight";
  const MAX_PREVIEW_LEN = 90; // list me kitne characters ka preview dikhana hai

  // -- State ---------------------------------------------------------------
  let panelEl = null;
  let listEl = null;
  let searchEl = null;
  let countEl = null;
  let prompts = []; // { el, text }
  let isOpen = true;
  let refreshTimer = null;

  // -- Helpers -------------------------------------------------------------

  // Page se saare user prompts nikaalo (document order me).
  function collectPrompts() {
    const nodes = Array.from(document.querySelectorAll(USER_MSG_SELECTOR));
    return nodes
      .map((el) => ({ el, text: (el.innerText || "").trim() }))
      .filter((p) => p.text.length > 0);
  }

  // Text ka chhota preview banao list ke liye.
  function preview(text) {
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > MAX_PREVIEW_LEN
      ? oneLine.slice(0, MAX_PREVIEW_LEN) + "…"
      : oneLine;
  }

  // Kisi message tak scroll karo aur usay thodi der highlight karo.
  function goToPrompt(item) {
    if (!item.el || !document.body.contains(item.el)) return;
    item.el.scrollIntoView({ behavior: "smooth", block: "center" });
    item.el.classList.add(HIGHLIGHT_CLASS);
    window.setTimeout(() => item.el.classList.remove(HIGHLIGHT_CLASS), 1600);
  }

  // Search query ke hisaab se list items ko dikhao/chhupao.
  function applyFilter() {
    const q = (searchEl.value || "").trim().toLowerCase();
    let visible = 0;
    listEl.querySelectorAll(".cnai-item").forEach((li) => {
      const text = li.dataset.text || "";
      const match = q === "" || text.toLowerCase().includes(q);
      li.style.display = match ? "" : "none";
      if (match) visible++;
    });
    countEl.textContent = q
      ? `${visible} / ${prompts.length} sawal`
      : `${prompts.length} sawal`;
  }

  // List ko dobara render karo (jab naye messages aayein ya chat change ho).
  function render() {
    prompts = collectPrompts();
    listEl.innerHTML = "";

    if (prompts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "cnai-empty";
      empty.textContent = "Is chat me abhi koi sawal nahi mila.";
      listEl.appendChild(empty);
      countEl.textContent = "0 sawal";
      return;
    }

    prompts.forEach((item, idx) => {
      const li = document.createElement("button");
      li.type = "button";
      li.className = "cnai-item";
      li.dataset.text = item.text;
      li.title = item.text; // hover par poora sawal dikhe

      const num = document.createElement("span");
      num.className = "cnai-num";
      num.textContent = "#" + (idx + 1);

      const txt = document.createElement("span");
      txt.className = "cnai-text";
      txt.textContent = preview(item.text);
      txt.setAttribute("dir", "auto"); // Urdu/English dono theek dikhein

      li.appendChild(num);
      li.appendChild(txt);
      li.addEventListener("click", () => goToPrompt(item));
      listEl.appendChild(li);
    });

    applyFilter();
  }

  // Naye messages ke liye render ko halka sa debounce karke chalao.
  function scheduleRender() {
    if (refreshTimer) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(render, 300);
  }

  // -- UI ------------------------------------------------------------------

  function buildPanel() {
    panelEl = document.createElement("div");
    panelEl.className = "cnai-panel";
    panelEl.setAttribute("dir", "rtl"); // Urdu labels ke liye

    // Header: title + refresh + minimize
    const header = document.createElement("div");
    header.className = "cnai-header";

    const title = document.createElement("div");
    title.className = "cnai-title";
    title.innerHTML = '<span class="cnai-logo">🔖</span> Chat Navigator <b>AI</b>';

    const actions = document.createElement("div");
    actions.className = "cnai-actions";

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "cnai-icon-btn";
    refreshBtn.title = "List refresh karein";
    refreshBtn.textContent = "⟳";
    refreshBtn.addEventListener("click", render);

    const minBtn = document.createElement("button");
    minBtn.type = "button";
    minBtn.className = "cnai-icon-btn";
    minBtn.title = "Chhupayein / dikhayein";
    minBtn.textContent = "—";
    minBtn.addEventListener("click", () => togglePanel());

    actions.appendChild(refreshBtn);
    actions.appendChild(minBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // Search box
    const searchWrap = document.createElement("div");
    searchWrap.className = "cnai-search";
    searchEl = document.createElement("input");
    searchEl.type = "text";
    searchEl.placeholder = "سوال تلاش کریں…  (search)";
    searchEl.setAttribute("dir", "auto");
    searchEl.addEventListener("input", applyFilter);
    searchWrap.appendChild(searchEl);

    // List
    listEl = document.createElement("div");
    listEl.className = "cnai-list";

    // Footer count
    countEl = document.createElement("div");
    countEl.className = "cnai-count";
    countEl.textContent = "0 sawal";

    panelEl.appendChild(header);
    panelEl.appendChild(searchWrap);
    panelEl.appendChild(listEl);
    panelEl.appendChild(countEl);
    document.body.appendChild(panelEl);
  }

  // Panel ko poori tarah dikhao/chhupao (chhota launcher button ke sath).
  let launcherEl = null;
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
    render();

    // Jab DOM me naye messages aayein to list auto-update ho.
    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.body, { childList: true, subtree: true });

    // Toolbar icon click par toggle (background.js se message).
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "CNAI_TOGGLE_PANEL") togglePanel();
    });
  }

  // document_idle par body available hoti hai, phir bhi safe rahein.
  if (document.body) {
    init();
  } else {
    window.addEventListener("DOMContentLoaded", init, { once: true });
  }
})();
