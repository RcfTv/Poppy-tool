// Poppy Tool - by Rcf: toolbar popup (status + Start/Stop from any tab)
const L = (navigator.language || 'en').slice(0, 2);
const TXT = {
  fr: { none: 'Aucune page lootbox Cripsum ouverte.', open: 'Ouvrir la page lootbox', go: 'Aller à l\'onglet', idle: 'En attente' },
  it: { none: 'Nessuna pagina lootbox di Cripsum aperta.', open: 'Apri la pagina lootbox', go: 'Vai alla scheda', idle: 'In attesa' },
  en: { none: 'No Cripsum lootbox page is open.', open: 'Open the lootbox page', go: 'Go to the tab', idle: 'Idle' },
};
const T = TXT[L] || TXT.en;
const main = document.getElementById('main');
// dark or light text on the accent colour, like the panel
const onAccent = hex => { const c = String(hex).replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#000' : '#fff'; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function render() {
  const { tabs = {} } = await chrome.storage.session.get('tabs');
  const open = await chrome.tabs.query({ url: ['https://cripsum.com/*lootbox*', 'https://www.cripsum.com/*lootbox*'] });
  const list = open.map(t => ({ tab: t, st: tabs[t.id] })).sort((a, b) => (b.st?.running ? 1 : 0) - (a.st?.running ? 1 : 0));
  if (!list.length) {
    main.innerHTML = `<div class="empty">${T.none}</div><button id="openBtn">${T.open}</button>`;
    document.getElementById('openBtn').onclick = () => chrome.tabs.create({ url: `https://cripsum.com/${L === 'it' ? 'it' : 'en'}/lootbox` });
    return;
  }
  const { tab, st = {} } = list[0];
  const TP = TXT[st.lang] || T;   // same language as the panel
  const lb = st.labels || { start: 'Start', stop: 'Stop', opens: 'Opens', pulls: 'Pulls', time: 'Time', best: 'Best' };
  const root = document.documentElement;
  root.classList.toggle('light', !!st.light);
  if (st.color) { root.style.setProperty('--accent', st.color); root.style.setProperty('--on-accent', onAccent(st.color)); }
  main.innerHTML = `
    <div class="state ${st.running ? 'run' : ''}"><span class="dot"></span>${esc(st.state || TP.idle)}</div>
    <div class="line">${esc(st.banner || '')}</div>
    <div class="grid"><div class="s"><b>${esc(st.opens ?? 0)}</b><span>${esc(lb.opens)}</span></div>
      <div class="s"><b>${esc(st.pulls ?? 0)}</b><span>${esc(lb.pulls)}</span></div>
      <div class="s"><b>${esc(st.time || '–')}</b><span>${esc(lb.time)}</span></div></div>
    ${st.best ? `<div class="line"><span class="c" style="background:${esc(st.bestColor || 'var(--accent)')}"></span>${esc(st.best)}</div>` : ''}
    <button id="toggle" class="${st.running ? 'stop' : ''}">${esc(st.running ? lb.stop : lb.start)}</button>
    <button id="goTab" class="alt">${TP.go}</button>`;
  document.getElementById('toggle').onclick = async () => {
    try { await chrome.tabs.sendMessage(tab.id, { type: 'ap-cmd', cmd: 'toggle' }); } catch (e) {}
    setTimeout(() => chrome.tabs.sendMessage(tab.id, { type: 'ap-cmd', cmd: 'status' }).catch(() => {}), 400);
  };
  document.getElementById('goTab').onclick = () => { chrome.tabs.update(tab.id, { active: true }); chrome.windows.update(tab.windowId, { focused: true }); window.close(); };
}
chrome.storage.session.onChanged.addListener(render);
setTimeout(() => document.body.classList.remove('intro'), 800);   // the entrance animation plays once, not on every refresh
render();
chrome.tabs.query({ url: ['https://cripsum.com/*lootbox*', 'https://www.cripsum.com/*lootbox*'] })
  .then(ts => ts.forEach(t => chrome.tabs.sendMessage(t.id, { type: 'ap-cmd', cmd: 'status' }).catch(() => {})));
