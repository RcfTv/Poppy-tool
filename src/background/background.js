// Poppy Tool - by Rcf
// - Shows Windows / system notifications for the panel (click = back to the tab).
// - Keeps the latest status of each lootbox tab for the toolbar popup.
// - Watchdog: if a running tab stops sending heartbeats (page crashed, network error
//   page...), it reloads that tab so the panel can resume the session.
const notifTab = {};

async function getTabs() { return (await chrome.storage.session.get('tabs')).tabs || {}; }
async function setTabs(tabs) { await chrome.storage.session.set({ tabs }); }

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'ap-notify') {
    chrome.notifications.create('', {
      type: 'basic', iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: msg.title, message: msg.message, priority: 2,
    }, id => { if (id && sender.tab) notifTab[id] = { tabId: sender.tab.id, windowId: sender.tab.windowId }; });
  }
  if (msg?.type === 'ap-beat' && sender.tab) {
    getTabs().then(tabs => {
      const prev = tabs[sender.tab.id] || {};
      tabs[sender.tab.id] = { ...msg.status, tabId: sender.tab.id, windowId: sender.tab.windowId, last: Date.now(),
        reloads: msg.status.running ? (prev.reloads || 0) : 0 };
      if (msg.status.running) chrome.action.setBadgeText({ text: '▶', tabId: sender.tab.id });
      else chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
      return setTabs(tabs);
    });
  }
});

chrome.notifications.onClicked.addListener(id => {
  const t = notifTab[id];
  if (t) { chrome.tabs.update(t.tabId, { active: true }); chrome.windows.update(t.windowId, { focused: true }); }
  chrome.notifications.clear(id);
  delete notifTab[id];
});
chrome.notifications.onClosed.addListener(id => { delete notifTab[id]; });
chrome.tabs.onRemoved.addListener(async tabId => { const tabs = await getTabs(); delete tabs[tabId]; setTabs(tabs); });

// watchdog: a running tab silent for 3 minutes gets reloaded (max 20 times in a row)
const ensureAlarm = () => chrome.alarms.create('ap-watch', { periodInMinutes: 1 });
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
async function watch() {
  const tabs = await getTabs();
  for (const [id, t] of Object.entries(tabs)) {
    if (!t.running || !t.resume || Date.now() - t.last < 180000) continue;
    if ((t.reloads || 0) >= 20) { t.running = false; continue; }
    t.reloads = (t.reloads || 0) + 1; t.last = Date.now();
    try { await chrome.tabs.reload(+id); } catch (e) { delete tabs[id]; }
  }
  await setTabs(tabs);
}
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'ap-watch') watch(); });
ensureAlarm();
