// Background service worker.
// Jab user toolbar me extension ke icon par click kare, to active ChatGPT tab
// ke content script ko panel toggle karne ka message bhejta hai.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "CNAI_TOGGLE_PANEL" }, () => {
    // Agar content script us page par nahi hai to error ko chup-chap ignore karo.
    void chrome.runtime.lastError;
  });
});
