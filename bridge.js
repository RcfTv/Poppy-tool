// Poppy Tool - by Rcf
// Runs in the extension's own context on the Cripsum pages.
// - Tells the panel (which runs in the page) where the extension icon is.
// - Relays panel -> background: Windows notifications and heartbeats (status + watchdog).
// - Relays popup -> panel: Start / Stop and status requests.
document.documentElement.dataset.apIcon = chrome.runtime.getURL('icons/icon128.png');

const send = msg => { try { chrome.runtime.sendMessage(msg); } catch (e) { /* extension reloaded */ } };

window.addEventListener('message', e => {
  if (e.source !== window || e.origin !== location.origin) return;
  const d = e.data;
  if (!d || d.__ap !== true) return;
  if (d.type === 'notify') {
    send({ type: 'ap-notify', title: String(d.title || 'Poppy Tool').slice(0, 120), message: String(d.message || '').slice(0, 300) });
  } else if (d.type === 'beat') {
    const { __ap, type, ...status } = d;
    send({ type: 'ap-beat', status });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.type === 'ap-cmd' && ['toggle', 'status'].includes(msg.cmd)) {
    window.postMessage({ __ap: true, type: 'cmd', cmd: msg.cmd }, location.origin);
    reply({ ok: true });
  }
});
