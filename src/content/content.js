/*
 * Poppy Tool - by Rcf   (v3.0.0)
 * Chrome extension content script for the Cripsum lootbox page (any language).
 *
 * - Reads the REAL result of every pull from the site's server reply.
 * - Rarities, odds, characters, pity, 50/50, free pulls and end dates come from the site.
 * - Stop on a rarity, a character, a NEW character, a gem floor, a daily budget,
 *   a number of opens, a timer or a clock time - or run in Endless mode.
 * - Queue of lootboxes, auto-resume after a reload, anti-freeze watchdog.
 * - Alerts, auto-refill gems from Godos, luck/gap charts, collection, duplicates,
 *   history + CSV, FR / EN / IT panel, toolbar popup.
 *
 * Runs in the page's own context ("world": "MAIN") so it can see the site's data.
 * bridge.js (extension context) relays notifications, heartbeats and popup commands.
 */
(() => {
const main = async () => {
  if (!/lootbox/i.test(location.pathname)) return;
  for (let i = 0; i < 60 && !document.querySelector('[data-banner-select]'); i++) await new Promise(r => setTimeout(r, 250));

  // ---------- stop any older copy ----------
  if (window.__ap?.running) {
    window.__ap.stop = true;
    await new Promise(r => { const i = setInterval(() => { if (!window.__ap.running) { clearInterval(i); r(); } }, 100); });
  }
  window.__ap?.cleanup?.();

  // ---------- storage ----------
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem('ap-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem('ap-' + k, JSON.stringify(v)); } catch (e) {} },
    del: k => { try { localStorage.removeItem('ap-' + k); } catch (e) {} },
  };
  const post = msg => window.postMessage(Object.assign({ __ap: true }, msg), location.origin);

  // no lootboxes on this page (logged out, error...) but a run was going: try again in a minute
  if (!document.querySelector('[data-banner-select]')) {
    const res = store.get('resume', null);
    if (res && Date.now() - res.savedAt < 20 * 60000 && (res.reloads || 0) < 30) {
      res.reloads = (res.reloads || 0) + 1; store.set('resume', res);
      setTimeout(() => location.reload(), 60000);
    }
    return;
  }

  const INIT = window.GACHA_INIT || {};
  const SITE_LANG = (INIT.lang || document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  const settingsRaw = store.get('settings', {});
  const pickLang = pref => {
    const l = (pref && pref !== 'auto' ? pref : (navigator.language || 'en')).slice(0, 2).toLowerCase();
    return ['fr', 'it', 'en'].includes(l) ? l : 'en';
  };
  const LANG = pickLang(settingsRaw.lang);

  // ======================================================================
  // Text
  // ======================================================================
  const EN = {
    idle: 'Idle', running: 'Running', stopping: 'Stopping…', stopped: 'Stopped', by: 'by Rcf',
    tPull: 'Pull', tQueue: 'Queue', tMissions: 'Missions', tStats: 'Stats', tHistory: 'History', tSettings: 'Settings',
    mDaily: 'Daily', mWeekly: 'Weekly', mReady: 'ready', mDone: 'done', mClaimAll: 'Claim all', mClaiming: 'Claiming…',
    mAuto: 'Auto-claim missions', mAutoSub: 'collect finished missions for you', mResetIn: t => `resets in ${t}`,
    mClaimed: n => `Claimed ${n} reward${n > 1 ? 's' : ''}`, mNothing: 'Nothing to claim', mClaimErr: 'Claim failed',
    mLoading: 'Loading…', mErr: 'Could not load missions', mReadyNotif: n => `${n} mission reward${n > 1 ? 's' : ''} ready to claim!`, mReadyTitle: 'Poppy Tool — missions',
    lootbox: 'Lootbox', free: 'Free', stopAt: 'Stop when I get', rarities: 'Rarities', characters: 'Characters', orBetter: 'or better',
    endless: 'Endless mode', endlessSub: 'never stop on a drop', stopNew: 'Stop on a NEW character', stopNewSub: 'one you don\'t own yet',
    maxOpens: 'Max 10× opens', noLimit: '∞', paid: 'Spend gems', start: 'Start', stop: 'Stop',
    opens: 'Opens', pulls: 'Pulls', time: 'Time', spent: 'Spent', perMin: '/min',
    session: 'This session', best: 'Best pulls', none: 'Nothing rare yet', isNew: 'NEW',
    pity: 'Pity', guaranteed: (label, n) => `${label} guaranteed within ${n}`, softFrom: n => `boosted from ${n}`,
    endsIn: t => `Ends in ${t}`, ended: 'Ended', endsSoon: (name, t) => `${name} ends in ${t}!`,
    freeLeft: n => `${n} free pull${n > 1 ? 's' : ''} left`, freeUsed: 'Free pulls used up',
    fifty: '50/50', won: 'won', lost: 'lost', nextFeatured: 'Next high-tier drop is the featured one',
    featuredWithin: n => `Featured guaranteed within ${n} pulls (site rule)`,
    needPaid: 'This lootbox costs gems — turn on “Spend gems”.',
    done: 'Limit reached', noGems: 'Not enough gems', notFree: '10× is not free anymore',
    cantOpen: 'This lootbox cannot be opened now', refused: 'The site refused to open (out of gems/pulls?)',
    noBanner: 'Could not open that lootbox', got: 'Got', gotNew: 'New character', timeUp: 'Timer finished',
    gemFloor: n => `Gem floor reached (${n})`, godosFloor: n => `Godos reserve reached (${n})`, refillFail: 'Auto-refill failed',
    budgetHit: n => `Daily budget reached (${n} Godos)`, resumed: 'Resumed after a reload', frozen: 'Page frozen — reloading…',
    destinyPicked: n => `Rate-up set to ${n}`,
    godos: 'Godos', gems: 'Gems', convert: 'Convert', convTitle: 'Convert Godos → Gems', rate: n => `${n} Godos = 1 Gem`,
    cost: 'Cost', multis: n => `= ${n} × 10-pull`, confirm: 'Confirm', converting: 'Converting…',
    converted: (g, c) => `+${g} Gems (−${c} Godos)`, notEnough: 'Not enough Godos', convError: 'Conversion failed',
    refilled: (g, c) => `Auto-refill: +${g} Gems (−${c} Godos)`,
    useQueue: 'Run the queue', useQueueSub: 'instead of the single lootbox on the Pull tab', repeatQueue: 'Repeat the queue',
    addStep: '+ Add a step', step: 'Step', stepOpens: '10× opens', untilOut: '0 = until it can\'t open', queueEmpty: 'The queue is empty.',
    queueNote: 'Stop conditions from the Pull tab and Settings apply to the whole queue.', stepOf: (i, n) => `step ${i}/${n}`, queueDone: 'Queue finished',
    luck: 'Luck vs. the odds', got2: 'got', expected: 'expected', luckNote: 'Pity guarantees push rare drops above the raw odds.',
    luckyBy: p => `${p}% luckier than average`, unluckyBy: p => `${p}% less lucky than average`, tooEarly: 'Pull a bit more to see your luck.',
    luckChart: 'Special+ drops over time', gapChart: 'Pulls between two Special+ drops', avgGap: n => `average ${n}`,
    you: 'You', average: 'Expected', noData: 'Not enough data yet.',
    collection: 'Collection', missing: 'Missing', allOwned: 'You own them all!', hidden: '??? (hidden)',
    dupes: 'Most duplicated', copies: 'copies', dupesNote: 'Filled as you pull.',
    historyEmpty: 'No sessions yet.', exportHist: 'History CSV', exportPulls: 'This session CSV', clearHist: 'Clear',
    clearConfirm: 'Click again to clear', reason: 'End',
    sStop: 'Stop conditions', timer: 'Stop after (minutes)', stopClock: 'Stop at (time)', keepGems: 'Stop if gems go below',
    budget: 'Daily budget (Godos, 1 Gem = {n})', spentToday: n => `spent today: ${n} Godos`,
    sRefill: 'Gems & free pulls', autoRefill: 'Auto-refill gems from Godos', autoRefillSub: 'when a paid lootbox runs out', keepGodos: 'Always keep at least (Godos)',
    freeFirst: 'Use free pulls first', freeFirstSub: 'spends a lootbox\'s free pulls before anything else',
    autoDestiny: 'Auto-pick the rate-up', autoDestinySub: 'when your target character can be chosen',
    sAlerts: 'Alerts', alertFrom: 'Alert me from', sound: 'Sound', notify: 'Windows notification', titleBlink: 'Tab title',
    volume: 'Volume', freeReminder: 'Free-pull reminder', freeReminderSub: 'when a lootbox\'s free pulls come back',
    testAlert: 'Test', sSafety: 'Long runs', autoResume: 'Auto-resume', autoResumeSub: 'continues after a reload or a crash',
    watchdog: 'Anti-freeze', watchdogSub: 'reloads the page if nothing happens for 2 minutes',
    speed: 'Pull speed', slow: 'Slow', normal: 'Normal', fast: 'Fast',
    sLook: 'Look', language: 'Panel language', auto: 'Auto', accent: 'Accent colour', accentAuto: 'Lootbox colour',
    theme: 'Light theme', compact: 'Compact mode', compactSub: 'only the counter and the button',
    shortcut: 'Alt+P = Start / Stop', alertTitle: r => `Poppy Tool — ${r}!`, testMsg: 'This is how an alert looks.',
    finished: 'Poppy Tool stopped', endWarnTitle: 'Poppy Tool — event ending',
    freeBack: (name, n) => `${n} free pull${n > 1 ? 's' : ''} back on ${name}!`, freeBackTitle: 'Poppy Tool — free pulls', search: 'Search…', noMatch: 'No match',
  };
  const FR = {
    idle: 'En attente', running: 'En cours', stopping: 'Arrêt…', stopped: 'Arrêté',
    tPull: 'Pull', tQueue: 'File', tMissions: 'Missions', tStats: 'Stats', tHistory: 'Historique', tSettings: 'Réglages',
    mDaily: 'Quotidiennes', mWeekly: 'Hebdo', mReady: 'prêtes', mDone: 'faites', mClaimAll: 'Tout réclamer', mClaiming: 'Réclamation…',
    mAuto: 'Réclamer les missions auto', mAutoSub: 'récupère les missions terminées pour toi', mResetIn: t => `réinit. dans ${t}`,
    mClaimed: n => `${n} récompense${n > 1 ? 's' : ''} réclamée${n > 1 ? 's' : ''}`, mNothing: 'Rien à réclamer', mClaimErr: 'Échec de réclamation',
    mLoading: 'Chargement…', mErr: 'Impossible de charger les missions', mReadyNotif: n => `${n} récompense${n > 1 ? 's' : ''} de mission à réclamer !`, mReadyTitle: 'Poppy Tool — missions',
    lootbox: 'Lootbox', free: 'Gratuit', stopAt: 'M\'arrêter quand j\'ai', rarities: 'Raretés', characters: 'Personnages', orBetter: 'ou mieux',
    endless: 'Mode infini', endlessSub: 'ne jamais s\'arrêter sur un drop', stopNew: 'Arrêt sur un NOUVEAU perso', stopNewSub: 'un perso que tu n\'as pas encore',
    maxOpens: 'Max ouvertures 10×', paid: 'Dépenser des gemmes', start: 'Lancer', stop: 'Arrêter',
    opens: 'Ouvertures', pulls: 'Pulls', time: 'Temps', spent: 'Dépensé', perMin: '/min',
    session: 'Cette session', best: 'Meilleurs pulls', none: 'Rien de rare pour l\'instant', isNew: 'NOUVEAU',
    pity: 'Pity', guaranteed: (label, n) => `${label} garanti dans ${n}`, softFrom: n => `boost à partir de ${n}`,
    endsIn: t => `Se termine dans ${t}`, ended: 'Terminé', endsSoon: (name, t) => `${name} se termine dans ${t} !`,
    freeLeft: n => `${n} pull${n > 1 ? 's' : ''} gratuit${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}`, freeUsed: 'Pulls gratuits épuisés',
    fifty: '50/50', won: 'gagnés', lost: 'perdus', nextFeatured: 'Le prochain drop haut de gamme sera le perso mis en avant',
    featuredWithin: n => `Perso mis en avant garanti en ${n} pulls max (règle du site)`,
    needPaid: 'Cette lootbox coûte des gemmes — active « Dépenser des gemmes ».',
    done: 'Limite atteinte', noGems: 'Pas assez de gemmes', notFree: 'Le 10× n\'est plus gratuit',
    cantOpen: 'Impossible d\'ouvrir cette lootbox', refused: 'Le site refuse d\'ouvrir (plus de gemmes/pulls ?)',
    noBanner: 'Impossible d\'ouvrir cette lootbox', got: 'Obtenu', gotNew: 'Nouveau perso', timeUp: 'Minuteur terminé',
    gemFloor: n => `Réserve de gemmes atteinte (${n})`, godosFloor: n => `Réserve de Godos atteinte (${n})`, refillFail: 'Recharge automatique échouée',
    budgetHit: n => `Budget du jour atteint (${n} Godos)`, resumed: 'Repris après un rechargement', frozen: 'Page bloquée — rechargement…',
    destinyPicked: n => `Rate-up réglé sur ${n}`,
    godos: 'Godos', gems: 'Gemmes', convert: 'Convertir', convTitle: 'Convertir Godos → Gemmes', rate: n => `${n} Godos = 1 Gemme`,
    cost: 'Coût', multis: n => `= ${n} × pull de 10`, confirm: 'Confirmer', converting: 'Conversion…',
    converted: (g, c) => `+${g} Gemmes (−${c} Godos)`, notEnough: 'Pas assez de Godos', convError: 'Conversion échouée',
    refilled: (g, c) => `Recharge : +${g} Gemmes (−${c} Godos)`,
    useQueue: 'Utiliser la file', useQueueSub: 'au lieu de la lootbox de l\'onglet Pull', repeatQueue: 'Répéter la file',
    addStep: '+ Ajouter une étape', step: 'Étape', stepOpens: 'ouvertures 10×', untilOut: '0 = jusqu\'à ce que ça bloque', queueEmpty: 'La file est vide.',
    queueNote: 'Les conditions d\'arrêt de l\'onglet Pull et des Réglages s\'appliquent à toute la file.', stepOf: (i, n) => `étape ${i}/${n}`, queueDone: 'File terminée',
    luck: 'Chance par rapport aux taux', got2: 'eus', expected: 'attendus', luckNote: 'Les garanties de pity font monter les drops rares au-dessus des taux bruts.',
    luckyBy: p => `${p} % plus chanceux que la moyenne`, unluckyBy: p => `${p} % moins chanceux que la moyenne`, tooEarly: 'Fais encore quelques pulls pour voir ta chance.',
    luckChart: 'Drops Special+ au fil du temps', gapChart: 'Pulls entre deux drops Special+', avgGap: n => `moyenne ${n}`,
    you: 'Toi', average: 'Attendu', noData: 'Pas encore assez de données.',
    collection: 'Collection', missing: 'Manquants', allOwned: 'Tu les as tous !', hidden: '??? (caché)',
    dupes: 'Plus gros doublons', copies: 'exemplaires', dupesNote: 'Se remplit au fil des pulls.',
    historyEmpty: 'Aucune session pour l\'instant.', exportHist: 'CSV historique', exportPulls: 'CSV de la session', clearHist: 'Effacer',
    clearConfirm: 'Clique encore pour effacer', reason: 'Fin',
    sStop: 'Conditions d\'arrêt', timer: 'Arrêter après (minutes)', stopClock: 'Arrêter à (heure)', keepGems: 'Arrêter si les gemmes passent sous',
    budget: 'Budget du jour (Godos, 1 Gemme = {n})', spentToday: n => `dépensé aujourd\'hui : ${n} Godos`,
    sRefill: 'Gemmes et pulls gratuits', autoRefill: 'Recharger les gemmes avec les Godos', autoRefillSub: 'quand une lootbox payante est à court', keepGodos: 'Toujours garder au moins (Godos)',
    freeFirst: 'Utiliser d\'abord les pulls gratuits', freeFirstSub: 'dépense les pulls gratuits d\'une lootbox avant tout',
    autoDestiny: 'Choisir le rate-up tout seul', autoDestinySub: 'quand ton perso cible peut être choisi',
    sAlerts: 'Alertes', alertFrom: 'M\'alerter à partir de', sound: 'Son', notify: 'Notification Windows', titleBlink: 'Titre de l\'onglet',
    volume: 'Volume', freeReminder: 'Rappel de pulls gratuits', freeReminderSub: 'quand les pulls gratuits d\'une lootbox reviennent',
    testAlert: 'Tester', sSafety: 'Sessions longues', autoResume: 'Reprise automatique', autoResumeSub: 'continue après un rechargement ou un plantage',
    watchdog: 'Anti-blocage', watchdogSub: 'recharge la page si rien ne bouge pendant 2 minutes',
    speed: 'Vitesse de pull', slow: 'Lente', normal: 'Normale', fast: 'Rapide',
    sLook: 'Apparence', language: 'Langue du panneau', auto: 'Auto', accent: 'Couleur d\'accent', accentAuto: 'Couleur de la lootbox',
    theme: 'Thème clair', compact: 'Mode compact', compactSub: 'juste le compteur et le bouton',
    shortcut: 'Alt+P = Lancer / Arrêter', alertTitle: r => `Poppy Tool — ${r} !`, testMsg: 'Voilà à quoi ressemble une alerte.',
    finished: 'Poppy Tool arrêté', endWarnTitle: 'Poppy Tool — fin d\'event',
    freeBack: (name, n) => `${n} pull${n > 1 ? 's' : ''} gratuit${n > 1 ? 's' : ''} de retour sur ${name} !`, freeBackTitle: 'Poppy Tool — pulls gratuits', search: 'Rechercher…', noMatch: 'Aucun résultat',
  };
  const IT = {
    idle: 'In attesa', running: 'In corso', stopping: 'Arresto…', stopped: 'Fermato',
    tPull: 'Pull', tQueue: 'Coda', tMissions: 'Missioni', tStats: 'Statistiche', tHistory: 'Cronologia', tSettings: 'Impostazioni',
    mDaily: 'Giornaliere', mWeekly: 'Settimanali', mReady: 'pronte', mDone: 'fatte', mClaimAll: 'Riscuoti tutto', mClaiming: 'Riscatto…',
    mAuto: 'Riscatto missioni auto', mAutoSub: 'riscuote le missioni finite per te', mResetIn: t => `reset tra ${t}`,
    mClaimed: n => `${n} ricompens${n > 1 ? 'e' : 'a'} riscossa`, mNothing: 'Niente da riscuotere', mClaimErr: 'Riscatto fallito',
    mLoading: 'Caricamento…', mErr: 'Impossibile caricare le missioni', mReadyNotif: n => `${n} ricompens${n > 1 ? 'e' : 'a'} missione da riscuotere!`, mReadyTitle: 'Poppy Tool — missioni',
    lootbox: 'Lootbox', free: 'Gratis', stopAt: 'Fermati quando trovo', rarities: 'Rarità', characters: 'Personaggi', orBetter: 'o meglio',
    endless: 'Modalità infinita', endlessSub: 'non fermarti mai su un drop', stopNew: 'Fermati su un personaggio NUOVO', stopNewSub: 'uno che non hai ancora',
    maxOpens: 'Max aperture 10×', paid: 'Spendi gemme', start: 'Avvia', stop: 'Ferma',
    opens: 'Aperture', pulls: 'Pull', time: 'Tempo', spent: 'Spese',
    session: 'Questa sessione', best: 'Pull migliori', none: 'Ancora niente di raro', isNew: 'NUOVO',
    guaranteed: (label, n) => `${label} garantito entro ${n}`, softFrom: n => `aumenta da ${n}`,
    endsIn: t => `Finisce tra ${t}`, ended: 'Finito', endsSoon: (name, t) => `${name} finisce tra ${t}!`,
    freeLeft: n => `${n} pull gratis rimast${n > 1 ? 'i' : 'o'}`, freeUsed: 'Pull gratis finiti',
    won: 'vinti', lost: 'persi', nextFeatured: 'Il prossimo drop alto sarà quello in evidenza',
    featuredWithin: n => `In evidenza garantito entro ${n} pull (regola del sito)`,
    needPaid: 'Questa lootbox costa gemme — attiva “Spendi gemme”.',
    done: 'Limite raggiunto', noGems: 'Gemme insufficienti', notFree: 'Il 10× non è più gratis',
    cantOpen: 'Questa lootbox non si può aprire ora', refused: 'Il sito non apre (gemme/pull finite?)',
    noBanner: 'Impossibile aprire questa lootbox', got: 'Trovato', gotNew: 'Nuovo personaggio', timeUp: 'Timer finito',
    gemFloor: n => `Soglia gemme raggiunta (${n})`, godosFloor: n => `Riserva Godos raggiunta (${n})`, refillFail: 'Ricarica automatica fallita',
    budgetHit: n => `Budget giornaliero raggiunto (${n} Godos)`, resumed: 'Ripreso dopo un ricaricamento', frozen: 'Pagina bloccata — ricarico…',
    godos: 'Godos', gems: 'Gemme', convert: 'Converti', convTitle: 'Converti Godos → Gemme', rate: n => `${n} Godos = 1 Gemma`,
    cost: 'Costo', confirm: 'Conferma', converting: 'Conversione…', notEnough: 'Godos insufficienti', convError: 'Conversione non riuscita',
    useQueue: 'Usa la coda', repeatQueue: 'Ripeti la coda', addStep: '+ Aggiungi un passo', step: 'Passo', stepOpens: 'aperture 10×',
    queueEmpty: 'La coda è vuota.', queueDone: 'Coda finita', luck: 'Fortuna rispetto alle probabilità', got2: 'avuti', expected: 'attesi',
    collection: 'Collezione', missing: 'Mancanti', allOwned: 'Li hai tutti!', dupes: 'Più doppioni', copies: 'copie',
    historyEmpty: 'Ancora nessuna sessione.', clearHist: 'Svuota', reason: 'Fine',
    sStop: 'Condizioni di arresto', timer: 'Fermati dopo (minuti)', stopClock: 'Fermati alle (ora)', keepGems: 'Fermati se le gemme scendono sotto',
    sAlerts: 'Avvisi', alertFrom: 'Avvisami da', sound: 'Suono', notify: 'Notifica Windows', titleBlink: 'Titolo della scheda', testAlert: 'Prova',
    sLook: 'Aspetto', language: 'Lingua del pannello', theme: 'Tema chiaro', compact: 'Modalità compatta',
    shortcut: 'Alt+P = Avvia / Ferma', finished: 'Poppy Tool fermato',
  };
  const T = Object.assign({}, EN, { fr: FR, it: IT }[LANG] || {});
  const FR_RAR = { comune: 'Commun', raro: 'Rare', epico: 'Épique', leggendario: 'Légendaire', speciale: 'Spécial', segreto: 'Secret', theone: 'The One' };

  // ======================================================================
  // Site data
  // ======================================================================
  const FALLBACK_RAR = [
    { key: 'comune', label: 'Common', color: '#9ca3af' }, { key: 'raro', label: 'Rare', color: '#38bdf8' },
    { key: 'epico', label: 'Epic', color: '#c084fc' }, { key: 'leggendario', label: 'Legendary', color: '#fbbf24' },
    { key: 'speciale', label: 'Special', color: '#ffffff' }, { key: 'segreto', label: 'Secret', color: '#a855f7' },
    { key: 'theone', label: 'The One', color: '#60a5fa' },
  ];
  const localLabel = (key, siteLabel) => (LANG === 'fr' ? FR_RAR[key] : LANG === SITE_LANG ? siteLabel : null) || siteLabel || key;
  const RAR = (Array.isArray(INIT.rarities) && INIT.rarities.length ? INIT.rarities : FALLBACK_RAR)
    .map(r => ({ key: r.key, label: localLabel(r.key, r.label), color: r.color || '#9ca3af' }));
  const rank = key => RAR.findIndex(r => r.key === key);           // higher = rarer
  const rInfo = key => RAR.find(r => r.key === key) || { key, label: key, color: '#9ca3af' };
  const NOTABLE = Math.max(0, rank('speciale'));                   // Special and up
  const GPS = Math.max(1, parseInt(INIT.godosPerShard, 10) || 100);   // Godos per Gem, set by the site

  // ---------- helpers ----------
  // timers run in a small worker so Chrome doesn't slow them down when the tab is in the background
  const timerWorker = (() => {
    try {
      const w = new Worker(URL.createObjectURL(new Blob(['onmessage=e=>setTimeout(()=>postMessage(e.data.id),e.data.ms)'], { type: 'text/javascript' })));
      const waiting = new Map(); let seq = 0;
      w.onmessage = e => { const r = waiting.get(e.data); waiting.delete(e.data); r?.(); };
      return { sleep: ms => new Promise(r => { const id = ++seq; waiting.set(id, r); w.postMessage({ id, ms }); }), w };
    } catch (e) { return null; }
  })();
  const sleep = ms => timerWorker ? timerWorker.sleep(ms) : new Promise(r => setTimeout(r, ms));
  const vis = el => !!el && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getBoundingClientRect().width > 0;
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const byId = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const overlayOn = () => byId('gacha-overlay')?.classList.contains('is-visible');
  const popupOpen = () => !!window.LootboxModal?.anyOpen?.();
  // the site's pop-ups are native <dialog>s: a fake Escape key doesn't close them, their own close() does (never "confirm")
  const closePopups = () => document.querySelectorAll('dialog.lm[open]').forEach(d => { try { window.LootboxModal?.close?.(d); } catch (e) {} });
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
  const pageBalance = cls => { const e = [...document.querySelectorAll('.' + cls)].find(vis) || document.querySelector('.' + cls); return e ? e.textContent.trim() : '?'; };
  const num = s => parseInt(String(s).replace(/[^\d]/g, ''), 10);
  const NL = LANG === 'fr' ? 'fr-FR' : LANG;
  const fmt = n => (n ?? 0).toLocaleString(NL);
  const fmtDec = (n, d = 1) => (n ?? 0).toLocaleString(NL, { maximumFractionDigits: d });
  const fmtProb = p => p == null ? '' : (p >= 1 ? +p.toFixed(1) : +p.toPrecision(2)).toLocaleString(NL, { maximumFractionDigits: 4 }) + '%';
  const fmtTime = ms => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return (h ? h + 'h ' : '') + String(m).padStart(h ? 2 : 1, '0') + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
  const fmtLeft = ms => { const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor(m / 60) % 24; return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m % 60}m`; };
  const textOn = hex => { const c = (hex || '#2f9df4').replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? '#0b0f1a' : '#ffffff'; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // ---------- session state ----------
  const freshSession = () => ({
    n: 0, pulls: 0, counts: {}, expected: {}, feed: [], log: [], hit: null, fifty: { won: 0, lost: 0 },
    series: [], gaps: [], sinceRare: 0, startedAt: 0, endedAt: 0, sessionId: null, queuePos: 0, stepOpens: 0, spentGems: 0,
  });
  const ap = window.__ap = Object.assign({ running: false, stop: false, onPulls: null, lastGems: null, lastGodos: null }, freshSession());

  // ======================================================================
  // Read the real pull results from the site's server reply
  // ======================================================================
  if (!window.__apFetchHooked) {
    window.__apFetchHooked = true;
    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
      const res = await origFetch.apply(this, arguments);
      try {
        const url = typeof input === 'string' ? input : input?.url || '';
        if (/api_gacha_(multi_)?pull/.test(url)) {
          res.clone().json().then(data => {
            if (data?.status !== 'success') return;
            // single pulls come back flat, multi pulls as a list: make both a list
            const pulls = Array.isArray(data.pulls) ? data.pulls : data.personaggio ? [data] : null;
            if (pulls) window.__ap?.onPulls?.(data, pulls);
          }).catch(() => {});
        }
      } catch (e) {}
      return res;
    };
  }

  // ---------- lootboxes on the page ----------
  const banners = [];
  document.querySelectorAll('[data-banner-select]').forEach(card => {
    const id = card.dataset.bannerSelect;
    if (banners.some(b => b.id === id)) return;
    const view = byId('banner-view-' + id);
    if (!view) return;
    // the site keys its lootboxes by `key` ("standard", event slug...), older pages by `id`
    const info = (INIT.banners || []).find(b => String(b.key ?? b.id) === id) || (INIT.banners || []).find(b => String(b.id) === id) || {};
    const btn10 = view.querySelector('[data-pull-qty="10"]');
    const free = view.dataset.costo === '0';
    const countdown = view.dataset.stato !== 'prossimamente' ? view.querySelector('[data-countdown]')?.dataset.countdown : '';
    const endsAt = Date.parse(String(info.data_fine || view.dataset.dataFine || countdown || '').replace(' ', 'T')) || null;
    banners.push({
      id, view, info, free, endsAt,
      name: clean(info.nome || view.querySelector('h1,h2,.lb-title')?.textContent || card.innerText).slice(0, 48),
      cost: free ? T.free : clean(btn10?.lastElementChild?.textContent || btn10?.innerText.split('\n').pop()),
      accent: view.dataset.accent || '#2f9df4',
      pityGroup: view.dataset.pityGruppo || info.pity_gruppo || 'standard',
      freeLeft: Math.max(0, parseInt(info.uso?.gratis_rimaste ?? view.dataset.gratis ?? 0, 10) || 0),
    });
  });
  const bannerById = id => banners.find(b => b.id === String(id));

  // everything the site's "Details & rates" knows about a lootbox
  const detailsCache = {};
  const loadDetails = async id => {
    if (detailsCache[id]) return detailsCache[id];
    let d = null;
    try {
      const r = await fetch(`/api/gacha/dettagli.php?banner=${encodeURIComponent(id)}&lang=${SITE_LANG}`, { credentials: 'same-origin' });
      const j = await r.json();
      if (j?.ok) d = j;
    } catch (e) {}
    const odds = Array.isArray(d?.rarita)
      ? d.rarita.map(x => ({ key: x.rarita, label: localLabel(x.rarita, x.label), color: x.colore, prob: x.prob, count: x.count }))
      : RAR.slice().reverse().map(r => ({ ...r, prob: null, count: null }));
    const pool = Array.isArray(d?.pool) ? d.pool.map(p => ({ id: p.id, name: p.nome, rarity: p.rarita, img: p.img, featured: !!p.featured, owned: !!p.posseduto })) : [];
    const b = bannerById(id);
    if (b && d?.banner?.uso) b.freeLeft = Math.max(0, parseInt(d.banner.uso.gratis_rimaste, 10) || 0);
    return (detailsCache[id] = { odds, pool, pity: d?.pity || null, costShards: d?.banner?.costo_shards ?? null, featured: d?.banner?.featured || [] });
  };

  // ======================================================================
  // UI (inside a shadow root so the site's CSS can't touch it)
  // ======================================================================
  byId('ap-host')?.remove(); byId('ap-box')?.remove();
  const host = document.createElement('div');
  host.id = 'ap-host';
  host.style.cssText = 'position:fixed;z-index:2147483647';
  ['keydown', 'keyup', 'keypress'].forEach(t => host.addEventListener(t, e => e.stopPropagation()));
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  const toggle = (id, title, sub = '') => `<label class="toggle" id="${id}Row"><span class="sw"><input type="checkbox" id="${id}"><i></i></span>
    <span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></label>`;
  const bannerOptions = sel => banners.map(b => `<option value="${esc(b.id)}"${b.id === sel ? ' selected' : ''}>${esc(b.name)} — ${esc(b.cost)}</option>`).join('');

  root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; }
  .panel { --accent:#2f9df4; --on-accent:#fff;
    --bg: rgba(12,16,28,.93); --fg:#e5e7eb; --strong:#fff; --muted:#9ca3af; --faint:#6b7280;
    --card: rgba(255,255,255,.04); --card2: rgba(255,255,255,.07); --line: rgba(255,255,255,.08); --field: rgba(255,255,255,.05); --grid: rgba(255,255,255,.07);
    width: 350px; max-height: calc(100vh - 32px); overflow: auto; scrollbar-width: thin;
    font: 12.5px/1.45 "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg);
    background: var(--bg); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
    border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 18px 50px rgba(0,0,0,.45); }
  .panel.light { --bg: rgba(250,251,253,.96); --fg:#1f2937; --strong:#0b0f1a; --muted:#6b7280; --faint:#9ca3af;
    --card: rgba(15,23,42,.04); --card2: rgba(15,23,42,.08); --line: rgba(15,23,42,.1); --field: #fff; --grid: rgba(15,23,42,.08); box-shadow: 0 18px 50px rgba(15,23,42,.18); }
  .head { display:flex; align-items:center; gap:8px; padding: 11px 10px 11px 14px; cursor: grab; touch-action: none; user-select: none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%); border-radius: 18px 18px 0 0; }
  .head button { cursor: pointer; }
  .logo { width: 30px; height: 30px; border-radius: 9px; display:grid; place-items:center; background: var(--accent); color: var(--on-accent); flex: none; overflow: hidden; }
  .logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .logo.has-img { background: none; box-shadow: 0 0 0 1.5px var(--accent); }
  .title { font-weight: 700; font-size: 14px; color: var(--strong); letter-spacing:.2px; white-space: nowrap; }
  .by { font-size: 10.5px; color: var(--muted); }
  .pill { margin-left:auto; display:flex; align-items:center; gap:6px; font-size: 11px; padding: 3px 9px; border-radius: 999px;
    background: var(--card2); border: 1px solid var(--line); white-space: nowrap; max-width: 130px; overflow: hidden; }
  .pill span:last-child { overflow: hidden; text-overflow: ellipsis; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7280; flex: none; }
  .pill.run .dot { background:#22c55e; animation: pulse 1.6s infinite; }
  .pill.found .dot { background:#fbbf24; } .pill.err .dot { background:#ef4444; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.6); } 70% { box-shadow: 0 0 0 7px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
  .icon-btn { background: none; border: 0; color: var(--muted); width: 24px; height: 24px; border-radius: 7px; display:grid; place-items:center; flex: none; }
  .icon-btn:hover { background: var(--card2); color: var(--strong); }
  .tabs { display:flex; gap: 0; padding: 0 6px; border-bottom: 1px solid var(--line); }
  .tab { flex: 1; background: none; border: 0; font: inherit; font-size: 10.5px; font-weight: 600; color: var(--muted); padding: 8px 1px 9px; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; position: relative; }
  .tab:hover { color: var(--strong); } .tab.on { color: var(--strong); border-bottom-color: var(--accent); }
  .tbadge { display:inline-block; min-width: 15px; height: 15px; line-height: 15px; padding: 0 3px; margin-left: 3px; border-radius: 999px;
    background: var(--accent); color: var(--on-accent); font-size: 9px; font-weight: 800; vertical-align: top; }
  .tbadge[hidden] { display: none; }
  .m { display:flex; align-items:center; gap: 8px; padding: 6px 8px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); border-left: 3px solid transparent; margin-bottom: 5px; }
  .m.ready { border-left-color: var(--accent); }
  .m .mi { min-width:0; flex:1; }
  .m .mt { color: var(--strong); font-weight: 600; font-size: 12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .m .mp { font-size: 10.5px; color: var(--muted); }
  .m .mbar { height: 4px; border-radius: 999px; background: var(--card2); margin-top: 4px; overflow:hidden; }
  .m .mbar i { display:block; height:100%; background: var(--accent); border-radius:999px; }
  .m .mtag { font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 6px; flex:none; }
  .m .mtag.r { background: var(--accent); color: var(--on-accent); } .m .mtag.c { background: var(--card2); color: var(--muted); }
  .page { padding: 12px 14px 14px; display: grid; gap: 12px; } .page[hidden] { display: none; }
  .panel.min .tabs, .panel.min .page, .panel.min .mini { display: none !important; } .panel.min { width: auto; } .panel.min .head { border-radius: 18px; }
  .mini { display: none; padding: 10px 12px 12px; gap: 8px; align-items: center; }
  .panel.compact { width: 310px; } .panel.compact .tabs, .panel.compact .page { display: none !important; } .panel.compact .mini { display: flex; }
  .mini .mstat { flex: 1; min-width: 0; font-size: 11.5px; color: var(--muted); line-height: 1.3; } .mini .mstat b { color: var(--strong); font-size: 13px; }
  .mini .mstat span { display:block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini .go { width: auto; padding: 8px 16px; }
  label.f { display:grid; gap: 5px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); }
  select, input[type=number], input[type=time] { width: 100%; font: inherit; font-size: 12.5px; text-transform: none; letter-spacing: 0; color: var(--strong);
    background: var(--field); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; outline: none; color-scheme: dark; }
  .panel.light select, .panel.light input { color-scheme: light; }
  select:focus, input:focus { border-color: var(--accent); }
  /* searchable combobox that replaces a native <select> */
  .combo { position: relative; }
  .combo-btn { width: 100%; display:flex; align-items:center; gap: 8px; font: inherit; font-size: 12.5px; text-align: left; cursor: pointer;
    color: var(--strong); background: var(--field); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; }
  .combo-btn:hover { border-color: color-mix(in srgb, var(--accent) 50%, var(--line)); }
  .combo-btn[aria-expanded="true"] { border-color: var(--accent); }
  .combo-btn:disabled { opacity: .5; cursor: default; }
  .combo-btn .combo-val { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:flex; align-items:center; gap: 7px; }
  .combo-btn svg { flex: none; color: var(--muted); transition: transform .15s; }
  .combo-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
  .combo-pop { --accent:#2f9df4; --fg:#e5e7eb; --strong:#fff; --muted:#9ca3af; --faint:#6b7280; --field: rgba(255,255,255,.06);
    --card2: rgba(255,255,255,.09); --line: rgba(255,255,255,.1);
    position: fixed; z-index: 2147483647; background: #0e131fF7; border: 1px solid var(--line); border-radius: 12px; color: var(--fg);
    box-shadow: 0 14px 40px rgba(0,0,0,.5); overflow: hidden; display:flex; flex-direction: column; backdrop-filter: blur(18px) saturate(140%); }
  .combo-pop.light { --fg:#1f2937; --strong:#0b0f1a; --muted:#6b7280; --faint:#9ca3af; --field:#fff; --card2: rgba(15,23,42,.08); --line: rgba(15,23,42,.12);
    background: #fbfcfeF7; box-shadow: 0 14px 40px rgba(15,23,42,.22); }
  .combo-search { margin: 8px; width: calc(100% - 16px); }
  .combo-list { overflow: auto; scrollbar-width: thin; padding: 0 6px 6px; }
  .combo-group { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); padding: 8px 8px 4px; }
  .combo-item { display:flex; align-items:center; gap: 8px; padding: 7px 8px; border-radius: 8px; cursor: pointer; font-size: 12.5px; color: var(--fg);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .combo-item:hover, .combo-item.active { background: var(--card2); color: var(--strong); }
  .combo-item.sel { color: var(--strong); font-weight: 600; }
  .combo-item.sel::after { content: '✓'; margin-left: auto; color: var(--accent); }
  .combo-item .dotc { width: 9px; height: 9px; border-radius: 3px; flex: none; box-shadow: 0 0 0 1px var(--line); }
  .combo-empty { padding: 10px 8px; color: var(--faint); font-size: 11.5px; text-align: center; }
  .swatches { display:flex; flex-wrap: wrap; gap: 6px; }
  .swatch { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--line); cursor: pointer; padding: 0; position: relative; }
  .swatch.sel { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent); }
  .swatch.auto { background: conic-gradient(#f87171,#fbbf24,#34d399,#38bdf8,#a855f7,#f87171); }
  .swatch.auto span { position:absolute; inset:5px; border-radius: 4px; background: var(--bg); font-size: 12px; display:grid; place-items:center; color: var(--fg); }
  input[type=range] { width: 100%; accent-color: var(--accent); }
  .vol { display:flex; align-items:center; gap: 10px; } .vol input { flex: 1; } .vol .icon-btn { flex: none; }
  select option, select optgroup { background: #111827; color: #f3f4f6; } .panel.light select option, .panel.light select optgroup { background:#fff; color:#111; }
  select:disabled, input:disabled { opacity: .5; }
  .row { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .toggle { display:flex; align-items:center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); cursor: pointer; user-select: none; }
  .toggle b { display:block; color: var(--strong); font-weight: 600; font-size: 12.5px; } .toggle small { color: var(--muted); font-size: 10.5px; }
  .sw { position: relative; width: 34px; height: 20px; flex: none; }
  .sw input { opacity: 0; width: 0; height: 0; position: absolute; }
  .sw i { position:absolute; inset:0; border-radius: 999px; background: rgba(127,127,127,.35); transition: .2s; }
  .sw i::after { content:''; position:absolute; left:3px; top:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition: .2s; }
  .sw input:checked + i { background: var(--accent); } .sw input:checked + i::after { transform: translateX(14px); background: var(--on-accent); }
  .sw input:disabled + i { opacity: .5; }
  .toggle.off { opacity:.5; pointer-events:none; }
  .go { width: 100%; border: 0; border-radius: 12px; padding: 10px; font: inherit; font-weight: 700; font-size: 13.5px; cursor: pointer;
    background: var(--accent); color: var(--on-accent); box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 35%, transparent); transition: transform .08s, filter .15s; }
  .go:hover { filter: brightness(1.08); } .go:active { transform: scale(.98); }
  .go.stop { background: #ef4444; color: #fff; box-shadow: 0 6px 18px rgba(239,68,68,.35); }
  .msg { font-size: 11.5px; color: #f87171; } .msg:empty { display:none; } .msg.ok { color: #f59e0b; }
  .info { display:flex; flex-wrap: wrap; gap: 5px; } .info:empty { display: none; }
  .tag { font-size: 11px; padding: 3px 8px; border-radius: 999px; background: var(--card2); color: var(--fg); border: 1px solid var(--line); }
  .tag.warn { background: rgba(245,158,11,.15); border-color: rgba(245,158,11,.4); }
  .stats { display:grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .stat { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 6px 7px; min-width: 0; }
  .stat b { display:block; color: var(--strong); font-size: 13.5px; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .stat span { font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); }
  .box { display:grid; gap: 5px; padding: 8px 10px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); }
  .box[hidden] { display: none; }
  .box .top { display:flex; justify-content: space-between; gap: 8px; font-size: 11.5px; color: var(--muted); } .box .top b { color: var(--strong); }
  .box .sub { font-size: 10.5px; color: var(--muted); } .box .sub:empty { display: none; }
  .bar { height: 6px; border-radius: 999px; background: var(--card2); overflow: hidden; position: relative; }
  .bar i { position:absolute; left:0; top:0; bottom:0; background: var(--accent); border-radius: 999px; transition: width .3s; }
  .bar u { position:absolute; top:0; bottom:0; width: 2px; background: #f59e0b; opacity: .8; }
  .sec { font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); margin-bottom: 6px; display:flex; justify-content:space-between; gap: 8px; }
  .rars { display:grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
  .rar { display:flex; align-items:center; gap: 7px; font-size: 12px; min-width: 0; }
  .c { width: 8px; height: 8px; border-radius: 3px; flex: none; box-shadow: 0 0 0 1px var(--line); display: inline-block; }
  .rar .n { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--strong); font-weight: 600; }
  .rar .lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rar .p { color: var(--faint); font-size: 10px; }
  .feed { display:grid; gap: 5px; max-height: 190px; overflow:auto; scrollbar-width: thin; }
  .item { display:flex; align-items:center; gap: 8px; padding: 5px 6px; border-radius: 10px; background: var(--card); border-left: 3px solid var(--c); }
  .item img { width: 30px; height: 30px; border-radius: 7px; object-fit: cover; flex: none; background: var(--card2); }
  .item .nm { color: var(--strong); font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .rl { font-size: 10.5px; color: var(--muted); font-weight: 600; }
  .item .meta { min-width: 0; flex: 1; }
  .badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 5px; background: #22c55e; color: #052e12; margin-left: 5px; vertical-align: middle; }
  .empty { color: var(--faint); font-size: 11.5px; text-align:center; padding: 6px; }
  .wallet { display:flex; align-items:center; gap: 8px; border-top: 1px solid var(--line); padding-top: 10px; }
  .bal { display:flex; align-items:center; gap: 6px; padding: 5px 8px; border-radius: 10px; background: var(--card); min-width: 0; }
  .bal img { width: 18px; height: 18px; object-fit: contain; }
  .bal b { color: var(--strong); font-variant-numeric: tabular-nums; font-size: 12.5px; }
  .chip { font: inherit; font-size: 11.5px; font-weight: 600; color: var(--fg); cursor: pointer; padding: 6px 10px; border-radius: 10px;
    background: var(--card2); border: 1px solid var(--line); white-space: nowrap; }
  .chip:hover { filter: brightness(1.15); } .chip.on { background: var(--accent); color: var(--on-accent); border-color: transparent; }
  .wallet .chip { margin-left: auto; }
  .conv { display:grid; gap: 8px; padding: 10px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); }
  .conv[hidden] { display: none; }
  .cv-top { display:flex; justify-content: space-between; font-size: 11px; color: var(--muted); } .cv-top b { color: var(--fg); font-weight: 600; }
  .cv-row { display:grid; grid-template-columns: auto auto 1fr auto auto; gap: 5px; }
  .cv-row button { font: inherit; font-size: 11.5px; font-weight: 600; color: var(--fg); background: var(--card2); border: 1px solid var(--line);
    border-radius: 8px; padding: 0 9px; cursor: pointer; }
  .cv-row input, .qstep input { text-align: center; padding: 7px 6px; font-weight: 700; -moz-appearance: textfield; }
  .cv-row input::-webkit-outer-spin-button, .cv-row input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .cv-sum { display:flex; justify-content: space-between; align-items: baseline; font-size: 11.5px; color: var(--muted); }
  .cv-sum b { color: var(--strong); font-size: 12.5px; }
  .conv .cv-go { width:100%; border:0; border-radius: 10px; padding: 8px; font: inherit; font-weight: 700; cursor:pointer; color:#fff;
    background: linear-gradient(135deg, #7c3aed, #2563eb); }
  .conv .cv-go:disabled { opacity: .5; cursor: default; } .conv .cv-go.confirm { background: #f59e0b; color: #1f1300; }
  .qlist { display:grid; gap: 6px; }
  .qstep { display:grid; grid-template-columns: 22px 1fr 64px 24px; gap: 6px; align-items: center; padding: 6px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); }
  .qstep.cur { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .qstep .i { font-weight: 700; color: var(--muted); text-align: center; }
  .qstep select { padding: 6px 8px; font-size: 12px; } .qstep input { padding: 6px 4px; font-size: 12px; }
  .luck { display:grid; gap: 4px; }
  .lrow { display:grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: center; font-size: 12px; }
  .lrow .h { font-size: 10px; text-transform: uppercase; color: var(--muted); }
  .lrow .v { text-align: right; font-variant-numeric: tabular-nums; color: var(--strong); min-width: 44px; }
  .lrow .up { color: #16a34a; } .lrow .down { color: #dc2626; }
  .verdict { padding: 8px 10px; border-radius: 10px; background: var(--card); font-weight: 600; color: var(--strong); }
  .note { font-size: 10.5px; color: var(--faint); } .note:empty { display: none; }
  .chart { position: relative; } .chart svg { display:block; width: 100%; height: auto; overflow: visible; }
  .chart .tip { position:absolute; pointer-events:none; background: var(--strong); color: var(--bg); font-size: 11px; padding: 4px 7px; border-radius: 7px;
    white-space: nowrap; transform: translate(-50%, -115%); opacity: 0; transition: opacity .1s; }
  .chart .tip.on { opacity: 1; }
  .legend { display:flex; gap: 12px; font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .legend i { display:inline-block; width: 14px; height: 0; border-top: 2px solid var(--accent); vertical-align: middle; margin-right: 5px; }
  .legend i.exp { border-top: 2px dashed var(--muted); }
  .miss { display:flex; flex-wrap: wrap; gap: 4px; max-height: 120px; overflow: auto; }
  .miss span { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--card2); border-left: 3px solid var(--c); }
  .dup { display:grid; grid-template-columns: 1fr auto; gap: 3px 10px; font-size: 12px; }
  .dup b { color: var(--strong); font-variant-numeric: tabular-nums; text-align: right; }
  .hist { display:grid; gap: 6px; max-height: 330px; overflow: auto; }
  .hrow { padding: 8px 10px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); display: grid; gap: 3px; }
  .hrow .t { display:flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--muted); }
  .hrow .t b { color: var(--strong); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hrow .d { font-size: 11px; color: var(--fg); } .hrow .r { font-size: 10.5px; color: var(--faint); }
  .btns { display:flex; gap: 6px; flex-wrap: wrap; }
  .group { display:grid; gap: 8px; }
  .gtitle { font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); font-weight: 600; }
  .hint { font-size: 10.5px; color: var(--faint); text-align: center; }
  .ghost { position: fixed; border: 2px dashed var(--accent); border-radius: 18px; background: color-mix(in srgb, var(--accent) 10%, transparent);
    pointer-events: none; opacity: 0; transition: opacity .15s, left .15s, top .15s; z-index: -1; }
  .ghost.on { opacity: 1; }
  .panel.dragging { box-shadow: 0 24px 70px rgba(0,0,0,.6); } .panel.dragging .head { cursor: grabbing; }
</style>
<div class="ghost" id="ghost"></div>
<div class="panel" id="panel">
  <div class="head">
    <div class="logo" id="logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.5l7.1-.6z"/></svg></div>
    <div><div class="title">Poppy Tool</div><div class="by">${T.by}</div></div>
    <div class="pill" id="pill"><span class="dot"></span><span id="state">${T.idle}</span></div>
    <button class="icon-btn" id="cmp" title="${T.compact}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path id="cmppath" d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg></button>
    <button class="icon-btn" id="min" title="–"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path id="minpath" d="M5 12h14"/></svg></button>
  </div>

  <div class="mini" id="mini">
    <div class="mstat"><b id="mOpens">0</b> ${T.opens.toLowerCase()} · <b id="mTime">0m 00s</b><span id="mBest">–</span></div>
    <button class="go" id="mGo">${T.start}</button>
  </div>

  <div class="tabs" id="tabs">
    <button class="tab on" data-tab="pull">${T.tPull}</button><button class="tab" data-tab="queue">${T.tQueue}</button>
    <button class="tab" data-tab="stats">${T.tStats}</button><button class="tab" data-tab="history">${T.tHistory}</button>
    <button class="tab" data-tab="settings">${T.tSettings}</button>
  </div>

  <!-- PULL -->
  <div class="page" data-page="pull">
    <label class="f">${T.lootbox}<select id="banner">${bannerOptions()}</select></label>
    <div class="info" id="bInfo"></div>
    <label class="f">${T.stopAt}<select id="target"></select></label>
    ${toggle('endless', T.endless, T.endlessSub)}
    ${toggle('stopNew', T.stopNew, T.stopNewSub)}
    <div class="row">
      <label class="f">${T.maxOpens}<input type="number" id="max" min="0" placeholder="${T.noLimit}"></label>
      <div style="align-self:end">${toggle('paid', T.paid)}</div>
    </div>
    <button class="go" id="go">${T.start}</button>
    <div class="msg" id="msg"></div>
    <div class="box" id="pityBox"><div class="top"><span>${T.pity} <b id="pityN">–</b></span><span id="pityTxt"></span></div><div class="bar"><u id="pitySoft"></u><i id="pityBar" style="width:0"></i></div></div>
    <div class="box" id="fiftyBox" hidden><div class="top"><span>${T.fifty}</span><span><b id="fWon">0</b> ${T.won} · <b id="fLost">0</b> ${T.lost}</span></div>
      <div class="sub" id="fGuar"></div><div class="sub" id="fRule"></div></div>
    <div class="stats">
      <div class="stat"><b id="sOpens">0</b><span>${T.opens}</span></div>
      <div class="stat"><b id="sPulls">0</b><span>${T.pulls}</span></div>
      <div class="stat"><b id="sTime">0m 00s</b><span>${T.time}</span></div>
      <div class="stat"><b id="sSpent">0</b><span>${T.spent}</span></div>
    </div>
    <div><div class="sec"><span>${T.session}</span><span id="rate"></span></div><div class="rars" id="rars"></div></div>
    <div><div class="sec"><span>${T.best}</span></div><div class="feed" id="feed"></div></div>
    <div class="wallet">
      <div class="bal" title="${T.godos}"><img src="/img/godos.png" alt=""><b id="coins">–</b></div>
      <div class="bal" title="${T.gems}"><img src="/img/godoshards.png" alt=""><b id="gems">–</b></div>
      <button class="chip" id="cvToggle">${T.convert}</button>
    </div>
    <div class="conv" id="conv" hidden>
      <div class="cv-top"><b>${T.convTitle}</b><span id="cvRate"></span></div>
      <div class="cv-row">
        <button data-d="-10">−10</button><button data-d="-1">−1</button>
        <input type="number" id="cvQty" min="1" value="10">
        <button data-d="1">+1</button><button data-d="10">+10</button>
      </div>
      <div class="cv-sum"><span>${T.cost}: <b id="cvCost">–</b></span><span id="cvGain"></span></div>
      <div class="cv-row" style="grid-template-columns:1fr auto"><button class="cv-go" id="cvGo">${T.convert}</button><button id="cvMax">Max</button></div>
    </div>
    <div class="hint">${T.shortcut}</div>
  </div>

  <!-- QUEUE -->
  <div class="page" data-page="queue" hidden>
    ${toggle('useQueue', T.useQueue, T.useQueueSub)}
    <div class="qlist" id="qlist"></div>
    <div class="btns"><button class="chip" id="qAdd">${T.addStep}</button></div>
    ${toggle('repeatQueue', T.repeatQueue)}
    <div class="note">${T.untilOut} · ${T.queueNote}</div>
  </div>

  <!-- STATS -->
  <div class="page" data-page="stats" hidden>
    <div><div class="sec"><span>${T.luck}</span><span id="luckPulls"></span></div>
      <div class="verdict" id="verdict"></div>
      <div class="luck" id="luck" style="margin-top:8px"></div>
      <div class="note" style="margin-top:6px">${T.luckNote}</div></div>
    <div><div class="sec"><span>${T.luckChart}</span></div>
      <div class="legend"><span><i></i>${T.you}</span><span><i class="exp"></i>${T.average}</span></div>
      <div class="chart" id="chLuck"></div></div>
    <div><div class="sec"><span>${T.gapChart}</span><span id="gapAvg"></span></div><div class="chart" id="chGap"></div></div>
    <div><div class="sec"><span>${T.collection}</span><span id="collN"></span></div>
      <div class="bar" style="height:8px"><i id="collBar" style="width:0"></i></div>
      <div class="sec" style="margin-top:10px"><span>${T.missing}</span></div>
      <div class="miss" id="miss"></div></div>
    <div><div class="sec"><span>${T.dupes}</span></div><div class="dup" id="dupes"></div></div>
  </div>

  <!-- HISTORY -->
  <div class="page" data-page="history" hidden>
    <div class="btns"><button class="chip" id="expHist">${T.exportHist}</button><button class="chip" id="expPulls">${T.exportPulls}</button><button class="chip" id="clrHist">${T.clearHist}</button></div>
    <div class="hist" id="hist"></div>
  </div>

  <!-- SETTINGS -->
  <div class="page" data-page="settings" hidden>
    <div class="group"><div class="gtitle">${T.sStop}</div>
      <div class="row"><label class="f">${T.timer}<input type="number" id="timer" min="0" placeholder="${T.noLimit}"></label>
        <label class="f">${T.stopClock}<input type="time" id="clock"></label></div>
      <div class="row"><label class="f">${T.keepGems}<input type="number" id="keepGems" min="0" placeholder="0"></label>
        <label class="f">${T.budget.replace('{n}', GPS)}<input type="number" id="budget" min="0" placeholder="${T.noLimit}"></label></div>
      <div class="note" id="spentToday"></div></div>
    <div class="group"><div class="gtitle">${T.sRefill}</div>
      ${toggle('freeFirst', T.freeFirst, T.freeFirstSub)}
      ${toggle('autoRefill', T.autoRefill, T.autoRefillSub)}
      <label class="f">${T.keepGodos}<input type="number" id="keepGodos" min="0" placeholder="0"></label>
      ${toggle('autoDestiny', T.autoDestiny, T.autoDestinySub)}</div>
    <div class="group"><div class="gtitle">${T.sSafety}</div>
      <label class="f">${T.speed}<select id="speed"><option value="slow">${T.slow}</option><option value="normal">${T.normal}</option><option value="fast">${T.fast}</option></select></label>
      ${toggle('autoResume', T.autoResume, T.autoResumeSub)}${toggle('watchdog', T.watchdog, T.watchdogSub)}</div>
    <div class="group"><div class="gtitle">${T.sAlerts}</div>
      <label class="f">${T.alertFrom}<select id="alertFrom"></select></label>
      ${toggle('sound', T.sound)}
      <label class="f">${T.volume}<span class="vol"><input type="range" id="volume" min="0" max="100" step="5"><button class="icon-btn" id="volTest" title="${T.testAlert}"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg></button></span></label>
      ${toggle('notify', T.notify)}${toggle('titleBlink', T.titleBlink)}${toggle('freeReminder', T.freeReminder, T.freeReminderSub)}
      <div class="btns"><button class="chip" id="testAlert">${T.testAlert}</button></div></div>
    <div class="group"><div class="gtitle">${T.sLook}</div>
      <label class="f">${T.language}<select id="lang"><option value="auto">${T.auto}</option><option value="fr">Français</option><option value="en">English</option><option value="it">Italiano</option></select></label>
      <label class="f">${T.accent}<div class="swatches" id="swatches"></div></label>
      ${toggle('light', T.theme)}${toggle('compact', T.compact, T.compactSub)}</div>
  </div>
</div>`;
  const $ = s => root.querySelector(s);
  const panel = $('#panel');

  // ======================================================================
  // Settings (remembered in this browser)
  // ======================================================================
  const DEF = { banner: banners[0].id, target: 'r:theone', endless: false, stopNew: false, max: 0, paid: false,
    timer: 0, clock: '', keepGems: 0, budget: 0, autoRefill: false, keepGodos: 0, freeFirst: true, autoDestiny: true,
    autoResume: true, watchdog: true, speed: 'normal', alertFrom: 'speciale', sound: true, notify: true, titleBlink: true,
    volume: 60, freeReminder: true, accent: 'auto', light: false, compact: false, tab: 'pull', lang: 'auto', useQueue: false, repeatQueue: false, queue: [] };
  const cfg = Object.assign({}, DEF, settingsRaw);
  if (!Array.isArray(cfg.queue)) cfg.queue = [];
  const BOOL = ['endless', 'stopNew', 'paid', 'autoRefill', 'freeFirst', 'autoDestiny', 'autoResume', 'watchdog', 'sound', 'notify', 'titleBlink', 'freeReminder', 'light', 'compact', 'useQueue', 'repeatQueue'];
  const NUMS = ['max', 'timer', 'keepGems', 'budget', 'keepGodos'];
  const ACCENTS = ['#2f9df4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
  const saveCfg = () => store.set('settings', cfg);
  if (bannerById(cfg.banner)) $('#banner').value = cfg.banner;
  BOOL.forEach(k => { $('#' + k).checked = !!cfg[k]; });
  NUMS.forEach(k => { if (cfg[k]) $('#' + k).value = cfg[k]; });
  $('#clock').value = cfg.clock || '';
  $('#lang').value = cfg.lang || 'auto';
  $('#speed').value = cfg.speed || 'normal';
  $('#volume').value = cfg.volume ?? 60;
  $('#alertFrom').innerHTML = RAR.slice().reverse().filter(r => rank(r.key) >= rank('leggendario'))
    .map((r, i) => `<option value="${esc(r.key)}">${esc(r.label)}${i ? ' ' + T.orBetter : ''}</option>`).join('');
  $('#alertFrom').value = cfg.alertFrom;
  $('#swatches').innerHTML = `<button class="swatch auto" data-a="auto" title="${esc(T.accentAuto)}"><span>A</span></button>` +
    ACCENTS.map(c => `<button class="swatch" data-a="${c}" style="background:${c}" title="${c}"></button>`).join('');
  const paintSwatches = () => root.querySelectorAll('.swatch').forEach(s => s.classList.toggle('sel', s.dataset.a === (cfg.accent || 'auto')));
  root.querySelectorAll('.swatch').forEach(s => s.onclick = () => { cfg.accent = s.dataset.a; saveCfg(); paintSwatches(); paintAccent(currentBanner()); beat(); });
  paintSwatches();

  // ---------- searchable combobox that replaces the native <select> fields ----------
  const comboColor = (select, value) => {
    if (select.id === 'banner' || select.dataset.k === 'banner') return bannerById(value)?.accent;
    if (select.id === 'alertFrom') return rInfo(value).color;
    if (typeof value === 'string' && value.startsWith('r:')) return rInfo(value.slice(2)).color;
    return null;
  };
  function makeCombo(select) {
    if (!select || select.__combo) return;
    select.style.display = 'none';
    const combo = document.createElement('div'); combo.className = 'combo';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'combo-btn'; btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<span class="combo-val"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
    combo.appendChild(btn); select.after(combo);
    const valEl = btn.querySelector('.combo-val');
    let pop = null, items = [], active = -1;
    const label = () => {
      const o = select.selectedOptions[0], col = o ? comboColor(select, o.value) : null;
      valEl.innerHTML = (col ? `<span class="dotc" style="background:${esc(col)}"></span>` : '') + `<span>${esc(o ? o.textContent : '')}</span>`;
      btn.disabled = select.disabled;
    };
    const reposition = () => {
      if (!pop) return;
      const r = btn.getBoundingClientRect(), below = innerHeight - r.bottom, above = r.top;
      const maxH = Math.min(300, Math.max(below, above) - 16);
      pop.style.left = r.left + 'px'; pop.style.width = r.width + 'px';
      if (below < 240 && above > below) { pop.style.top = 'auto'; pop.style.bottom = (innerHeight - r.top + 4) + 'px'; }
      else { pop.style.bottom = 'auto'; pop.style.top = (r.bottom + 4) + 'px'; }
      const list = pop.querySelector('.combo-list'); if (list) list.style.maxHeight = (maxH - (pop.querySelector('.combo-search') ? 50 : 10)) + 'px';
    };
    const onDoc = e => { const t = e.composedPath()[0]; if (pop && !combo.contains(t) && !pop.contains(t)) close(); };
    const close = () => {
      if (!pop) return;
      pop.remove(); pop = null; items = []; active = -1; btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', onDoc, true); window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', close);
    };
    const paint = () => items.forEach((it, i) => it.el.classList.toggle('active', i === active));
    const choose = o => { if (o.value !== select.value) { select.value = o.value; select.dispatchEvent(new Event('change', { bubbles: true })); } label(); close(); btn.focus(); };
    const open = () => {
      if (pop || select.disabled) return;
      pop = document.createElement('div'); pop.className = 'combo-pop';
      if (panel.classList.contains('light')) pop.classList.add('light');
      pop.style.setProperty('--accent', getComputedStyle(panel).getPropertyValue('--accent') || '#2f9df4');
      const many = select.querySelectorAll('option').length > 8;
      pop.innerHTML = (many ? `<input class="combo-search" type="text" placeholder="${esc(T.search)}">` : '') + `<div class="combo-list"></div>`;
      root.appendChild(pop);
      const listEl = pop.querySelector('.combo-list'), search = pop.querySelector('.combo-search');
      const add = o => {
        const el = document.createElement('div'); el.className = 'combo-item' + (o.value === select.value ? ' sel' : '');
        const col = comboColor(select, o.value);
        el.innerHTML = (col ? `<span class="dotc" style="background:${esc(col)}"></span>` : '') + `<span>${esc(o.textContent)}</span>`;
        el.addEventListener('pointerdown', e => e.preventDefault());
        el.onclick = () => choose(o);
        listEl.appendChild(el); items.push({ el, opt: o });
      };
      const render = q => {
        q = (q || '').trim().toLowerCase(); listEl.innerHTML = ''; items = [];
        [...select.children].forEach(node => {
          if (node.tagName === 'OPTGROUP') {
            const opts = [...node.children].filter(o => !q || o.textContent.toLowerCase().includes(q));
            if (!opts.length) return;
            const g = document.createElement('div'); g.className = 'combo-group'; g.textContent = node.label; listEl.appendChild(g);
            opts.forEach(add);
          } else if (node.tagName === 'OPTION' && (!q || node.textContent.toLowerCase().includes(q))) add(node);
        });
        if (!items.length) { const e = document.createElement('div'); e.className = 'combo-empty'; e.textContent = T.noMatch; listEl.appendChild(e); }
        active = items.findIndex(it => it.opt.value === select.value); if (active < 0 && q && items.length) active = 0;
        paint(); items[active]?.el.scrollIntoView({ block: 'nearest' });
      };
      render(''); btn.setAttribute('aria-expanded', 'true'); reposition();
      document.addEventListener('pointerdown', onDoc, true); window.addEventListener('scroll', reposition, true); window.addEventListener('resize', close);
      if (search) {
        search.oninput = () => render(search.value);
        search.onkeydown = e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); paint(); items[active]?.el.scrollIntoView({ block: 'nearest' }); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); items[active]?.el.scrollIntoView({ block: 'nearest' }); }
          else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) choose(items[active].opt); }
          else if (e.key === 'Escape') { e.preventDefault(); close(); btn.focus(); }
        };
        setTimeout(() => search.focus(), 0);
      }
    };
    btn.onclick = () => pop ? close() : open();
    select.addEventListener('change', label);
    const mo = new MutationObserver(() => { label(); if (pop) close(); });
    mo.observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });
    label();
    select.__combo = { close, mo };
  }
  const enhanceSelects = scope => (scope || root).querySelectorAll('select').forEach(makeCombo);

  // minimise
  const setMin = m => { panel.classList.toggle('min', m); $('#minpath').setAttribute('d', m ? 'M5 12h14M12 5v14' : 'M5 12h14'); store.set('min', m); };
  $('#min').onclick = () => setMin(!panel.classList.contains('min'));
  setMin(!!store.get('min', false));

  const applyLook = () => {
    panel.classList.toggle('light', !!cfg.light);
    panel.classList.toggle('compact', !!cfg.compact);
    $('#compact').checked = !!cfg.compact;
    $('#cmppath').setAttribute('d', cfg.compact ? 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7' : 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7');
  };
  const syncStops = () => {
    const locked = ap.running;
    $('#target').disabled = locked || cfg.endless;
    $('#stopNew').disabled = locked || cfg.endless;
    $('#stopNewRow').classList.toggle('off', !!cfg.endless);
    $('#banner').disabled = locked || cfg.useQueue;
    $('#useQueue').disabled = locked;
  };
  BOOL.forEach(k => $('#' + k).addEventListener('change', () => { cfg[k] = $('#' + k).checked; saveCfg(); applyLook(); syncStops(); if (k === 'useQueue') renderQueue(); }));
  NUMS.forEach(k => $('#' + k).addEventListener('change', () => { cfg[k] = Math.max(0, parseInt($('#' + k).value, 10) || 0); saveCfg(); renderSpentToday(); }));
  $('#clock').addEventListener('change', () => { cfg.clock = $('#clock').value; saveCfg(); });
  $('#alertFrom').addEventListener('change', () => { cfg.alertFrom = $('#alertFrom').value; saveCfg(); });
  $('#target').addEventListener('change', () => { cfg.target = $('#target').value; saveCfg(); });
  $('#lang').addEventListener('change', () => { cfg.lang = $('#lang').value; saveCfg(); if (!ap.running) rebuild(); });
  $('#speed').addEventListener('change', () => { cfg.speed = $('#speed').value; saveCfg(); });
  $('#volume').addEventListener('input', () => { cfg.volume = parseInt($('#volume').value, 10) || 0; saveCfg(); });
  $('#volume').addEventListener('change', () => { unlockAudio(); chime(false); });
  $('#volTest').onclick = () => { unlockAudio(); chime(false); };
  $('#cmp').onclick = () => { cfg.compact = !cfg.compact; saveCfg(); applyLook(); if (cfg.compact) setMin(false); };
  applyLook();

  // whole-site tabs (site-modules.js): Home, Missions, Inventory, Achievements, Inbox
  if (cfg.autoClaimM) { const st = store.get('site', {}); if (st.autoM == null) { st.autoM = true; store.set('site', st); } delete cfg.autoClaimM; saveCfg(); }
  let siteMod = null;
  try {
    siteMod = window.__apSite?.mount({ root, tabsEl: $('#tabs'), beforeTab: $('[data-tab="stats"]'),
      pagesHost: $('[data-page="stats"]').parentNode, beforePage: $('[data-page="stats"]') }) || null;
  } catch (e) { console.warn('[Poppy Tool] site tabs', e); }
  // tabs
  const showTab = t => {
    root.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    root.querySelectorAll('.page').forEach(p => { p.hidden = p.dataset.page !== t; });
    cfg.tab = t; saveCfg();
    if (t === 'stats') renderStatsTab();
    if (t === 'history') renderHistory();
    if (t === 'queue') renderQueue();
    siteMod?.onShow(t);
  };
  root.querySelectorAll('.tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));

  // ---------- extension icon in the header ----------
  const showIcon = () => {
    const url = document.documentElement.dataset.apIcon;
    if (!url || $('#logo img')) return !!url;
    const img = new Image(); img.alt = '';
    img.onload = () => { $('#logo').replaceChildren(img); $('#logo').classList.add('has-img'); };
    img.src = url;
    return true;
  };
  let iconObserver = null;
  if (!showIcon()) {
    iconObserver = new MutationObserver(() => { if (showIcon()) iconObserver.disconnect(); });
    iconObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ap-icon'] });
  }

  // ---------- drag by the header, snap to the nearest corner ----------
  const MARGIN = 16;
  const CORNERS = ['br', 'bl', 'tr', 'tl'];
  let corner = CORNERS.includes(store.get('corner')) ? store.get('corner') : 'br';
  const placeAt = c => {
    host.style.transition = '';
    host.style.left = host.style.top = host.style.right = host.style.bottom = '';
    host.style[c[0] === 't' ? 'top' : 'bottom'] = MARGIN + 'px';
    host.style[c[1] === 'l' ? 'left' : 'right'] = MARGIN + 'px';
  };
  const cornerXY = (c, w, h) => ({ x: c[1] === 'l' ? MARGIN : innerWidth - w - MARGIN, y: c[0] === 't' ? MARGIN : innerHeight - h - MARGIN });
  const nearest = (px, py) => (py < innerHeight / 2 ? 't' : 'b') + (px < innerWidth / 2 ? 'l' : 'r');
  placeAt(corner);
  let drag = null;
  const head = $('.head');
  head.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const r = host.getBoundingClientRect();
    drag = { sx: e.clientX, sy: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, moved: false };
    head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moved = true; panel.classList.add('dragging');
    }
    const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - drag.w);
    const y = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - drag.h);
    host.style.transition = ''; host.style.right = host.style.bottom = '';
    host.style.left = x + 'px'; host.style.top = y + 'px';
    drag.px = e.clientX; drag.py = e.clientY;
    const c = nearest(e.clientX, e.clientY), p = cornerXY(c, drag.w, drag.h), g = $('#ghost');
    Object.assign(g.style, { left: p.x + 'px', top: p.y + 'px', width: drag.w + 'px', height: drag.h + 'px' });
    g.classList.add('on');
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    $('#ghost').classList.remove('on'); panel.classList.remove('dragging');
    if (!d.moved) return;
    const r = host.getBoundingClientRect();
    corner = nearest(d.px, d.py); store.set('corner', corner);
    const p = cornerXY(corner, r.width, r.height);
    host.style.transition = 'left .22s cubic-bezier(.2,.8,.2,1), top .22s cubic-bezier(.2,.8,.2,1)';
    host.style.left = p.x + 'px'; host.style.top = p.y + 'px';
    setTimeout(() => placeAt(corner), 240);
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);

  // ======================================================================
  // Rendering: Pull tab
  // ======================================================================
  const currentBanner = () => bannerById(ap.running && ap.bannerId ? ap.bannerId : $('#banner').value) || banners[0];
  let det = { odds: [], pool: [], pity: null };
  const setState = (text, kind) => { $('#state').textContent = text; $('#pill').title = text; $('#pill').className = 'pill' + (kind ? ' ' + kind : ''); };
  const setMsg = (text, ok) => { $('#msg').textContent = text || ''; $('#msg').className = 'msg' + (ok ? ' ok' : ''); };

  const accentOf = b => cfg.accent && cfg.accent !== 'auto' ? cfg.accent : b.accent;
  const paintAccent = b => {
    const a = accentOf(b);
    [panel, $('#ghost')].forEach(el => { el.style.setProperty('--accent', a); el.style.setProperty('--on-accent', textOn(a)); });
    $('#paidRow').classList.toggle('off', b.free);
  };
  const applyBanner = async id => {
    const b = bannerById(id) || currentBanner();
    paintAccent(b);
    det = await loadDetails(b.id);
    const rars = det.odds.slice().sort((x, y) => rank(y.key) - rank(x.key)).filter(o => rank(o.key) >= rank('leggendario'));
    const chars = det.pool.filter(p => p.id != null)
      .sort((a, c) => (c.featured - a.featured) || (rank(c.rarity) - rank(a.rarity)) || a.name.localeCompare(c.name));
    const cur = cfg.target;
    $('#target').innerHTML =
      `<optgroup label="${esc(T.rarities)}">${rars.map((o, i) =>
        `<option value="r:${esc(o.key)}">${esc(o.label)}${i ? ' ' + T.orBetter : ''}${o.prob != null ? ` · ${fmtProb(o.prob)}` : ''}</option>`).join('')}</optgroup>` +
      (chars.length ? `<optgroup label="${esc(T.characters)}">${chars.map(p =>
        `<option value="c:${esc(p.id)}">${p.featured ? '★ ' : ''}${esc(p.name)} — ${esc(rInfo(p.rarity).label)}${p.owned ? ' ✓' : ''}</option>`).join('')}</optgroup>` : '');
    // a character target is kept even when this lootbox doesn't have it (queue)
    if (cur && cur.startsWith('c:') && ![...$('#target').options].some(o => o.value === cur)) {
      const name = Object.values(detailsCache).flatMap(d => d.pool).find(p => 'c:' + p.id === cur)?.name || cur;
      $('#target').insertAdjacentHTML('beforeend', `<option value="${esc(cur)}">${esc(name)}</option>`);
    }
    $('#target').value = [...$('#target').options].some(o => o.value === cur) ? cur : $('#target').options[0]?.value;
    cfg.target = $('#target').value; saveCfg();
    renderRarities(); renderInfo(); renderPity();
    if (!$('[data-page="stats"]').hidden) renderStatsTab();
  };

  function renderInfo() {
    const b = currentBanner(), tags = [];
    if (b.endsAt) { const left = b.endsAt - Date.now(); tags.push(`<span class="tag${left < 86400000 ? ' warn' : ''}">⏳ ${left > 0 ? T.endsIn(fmtLeft(left)) : T.ended}</span>`); }
    if (b.freeLeft > 0) tags.push(`<span class="tag">🎁 ${T.freeLeft(b.freeLeft)}</span>`);
    if (ap.running && cfg.useQueue && ap.queueLen) tags.push(`<span class="tag">${T.stepOf(ap.queuePos + 1, ap.queueLen)}</span>`);
    $('#bInfo').innerHTML = tags.join('');
  }
  const renderRarities = () => {
    const list = (det.odds.length ? det.odds : RAR.map(r => ({ ...r, prob: null }))).slice().sort((x, y) => rank(y.key) - rank(x.key));
    $('#rars').innerHTML = list.map(o => {
      const r = rInfo(o.key);
      return `<div class="rar"><span class="c" style="background:${esc(o.color || r.color)}"></span>
        <span class="lbl">${esc(o.label || r.label)}${o.prob != null ? ` <span class="p">${fmtProb(o.prob)}</span>` : ''}</span>
        <span class="n">${fmt(ap.counts[o.key] || 0)}</span></div>`;
    }).join('');
  };
  const renderFeed = () => {
    $('#feed').innerHTML = ap.feed.length ? ap.feed.slice(0, 25).map(f => {
      const r = rInfo(f.rarity);
      return `<div class="item" style="--c:${esc(r.color)}">
        ${f.img ? `<img src="/img/${esc(f.img)}" alt="" loading="lazy">` : ''}
        <div class="meta"><div class="nm">${esc(f.name)}${f.isNew ? `<span class="badge">${T.isNew}</span>` : ''}</div>
        <div class="rl"><span class="c" style="background:${esc(r.color)};margin-right:5px"></span>${esc(r.label)} · #${f.open}</div></div></div>`;
    }).join('') : `<div class="empty">${T.none}</div>`;
    const top = ap.feed.slice().sort((a, b) => rank(b.rarity) - rank(a.rarity))[0];
    $('#mBest').textContent = top ? `${rInfo(top.rarity).label}: ${top.name}` : T.none;
  };
  function renderPity() {
    const b = currentBanner();
    const rules = detailsCache[b.id]?.pity || b.info.pity || {};
    const hard = rules.hard || +b.view.dataset.pityHard || 90, soft = rules.soft || +b.view.dataset.pitySoft || null;
    const st = window.GachaUI?.getPity?.(rules.gruppo || b.pityGroup);
    const cur = st?.contatore ?? b.info.pity?.contatore ?? null;
    const soglia = rules.soglia || b.view.dataset.pitySoglia;
    const tier = (INIT.tierLabels || {})[soglia] && LANG === SITE_LANG ? INIT.tierLabels[soglia] : `${rInfo(soglia).label} ${T.orBetter}`;
    $('#pityN').textContent = cur == null ? '–' : `${cur} / ${hard}`;
    $('#pityTxt').textContent = cur == null ? '' : T.guaranteed(tier, Math.max(0, hard - cur));
    $('#pityBar').style.width = cur == null ? '0' : Math.min(100, cur / hard * 100) + '%';
    $('#pitySoft').style.left = soft ? (soft / hard * 100) + '%' : '-10px';
    $('#pitySoft').title = soft ? T.softFrom(soft) : '';
    // 50/50 (lootboxes with a featured character)
    const featured = detailsCache[b.id]?.featured?.length || b.info.featured?.length;
    $('#fiftyBox').hidden = !featured;
    if (featured) {
      $('#fWon').textContent = fmt(ap.fifty.won); $('#fLost').textContent = fmt(ap.fifty.lost);
      $('#fGuar').textContent = st?.garantito ? '★ ' + T.nextFeatured : '';
      $('#fRule').textContent = rules.featured_entro ? T.featuredWithin(rules.featured_entro) : '';
    }
  }
  function wallet() {
    const st = window.GachaUI?.getState?.();
    if (st && typeof st.soldi === 'number') return { godos: st.soldi, gems: st.godoshards };
    return { godos: ap.lastGodos ?? num(pageBalance('user-points-val')), gems: ap.lastGems ?? num(pageBalance('user-shards-val')) };
  }
  const spentKey = () => 'spent-' + today();
  const spentTodayGodos = () => store.get(spentKey(), 0);
  const renderSpentToday = () => { $('#spentToday').textContent = T.spentToday(fmt(spentTodayGodos())); };
  const renderStats = () => {
    const ms = ap.startedAt ? (ap.endedAt || Date.now()) - ap.startedAt : 0;
    $('#sOpens').textContent = fmt(ap.n); $('#mOpens').textContent = fmt(ap.n);
    $('#sPulls').textContent = fmt(ap.pulls);
    $('#sTime').textContent = fmtTime(ms); $('#mTime').textContent = fmtTime(ms);
    $('#sSpent').textContent = fmt(ap.spentGems || 0);
    $('#rate').textContent = ms > 20000 ? `${fmt(Math.round(ap.pulls / (ms / 60000)))} ${T.pulls.toLowerCase()}${T.perMin}` : '';
    const w = wallet();
    $('#coins').textContent = w.godos != null && !isNaN(w.godos) ? fmt(w.godos) : '–';
    $('#gems').textContent = w.gems != null && !isNaN(w.gems) ? fmt(w.gems) : '–';
    if (!$('#conv').hidden) renderConv();
    renderPity(); renderInfo();
  };
  const renderAll = () => { renderStats(); renderRarities(); renderFeed(); if (!$('[data-page="stats"]').hidden) renderStatsTab(); };

  // ======================================================================
  // Queue tab
  // ======================================================================
  function renderQueue() {
    const q = cfg.queue, locked = ap.running && cfg.useQueue;
    $('#qlist').innerHTML = q.length ? q.map((s, i) => `<div class="qstep${locked && ap.queuePos === i ? ' cur' : ''}" data-i="${i}">
        <span class="i">${i + 1}</span><select data-k="banner">${bannerOptions(s.banner)}</select>
        <input type="number" min="0" data-k="opens" value="${s.opens || 0}" title="${esc(T.stepOpens)}">
        <button class="icon-btn" data-del="${i}" title="✕">✕</button></div>`).join('')
      : `<div class="empty">${T.queueEmpty}</div>`;
    root.querySelectorAll('.qstep').forEach(row => {
      const i = +row.dataset.i;
      row.querySelector('[data-k=banner]').onchange = e => { cfg.queue[i].banner = e.target.value; saveCfg(); };
      row.querySelector('[data-k=opens]').onchange = e => { cfg.queue[i].opens = Math.max(0, parseInt(e.target.value, 10) || 0); saveCfg(); };
      row.querySelector('[data-del]').onclick = () => { if (locked) return; cfg.queue.splice(i, 1); saveCfg(); renderQueue(); };
      row.querySelectorAll('select,input,button').forEach(el => { el.disabled = locked; });
    });
    $('#qAdd').disabled = locked;
    enhanceSelects($('#qlist'));
  }
  $('#qAdd').onclick = () => { cfg.queue.push({ banner: $('#banner').value, opens: 10 }); saveCfg(); renderQueue(); };

  // ======================================================================
  // Stats tab: luck, charts, collection, duplicates
  // ======================================================================
  function lineChart(el, pts) {
    if (pts.length < 3) { el.innerHTML = `<div class="empty">${T.noData}</div>`; return; }
    const W = 320, H = 130, L = 30, R = 10, Tp = 8, B = 20;
    const maxX = pts[pts.length - 1].x, maxY = Math.max(1, ...pts.map(p => Math.max(p.o, p.e)));
    const unit = maxY > 20 ? 10 : maxY > 5 ? 2 : 1, niceY = Math.ceil(maxY / unit) * unit;
    const X = x => L + (x / maxX) * (W - L - R), Y = y => Tp + (1 - y / niceY) * (H - Tp - B);
    const path = k => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p[k]).toFixed(1)}`).join('');
    const ticks = [0, niceY / 2, niceY];
    const last = pts[pts.length - 1];
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.luckChart)}">
      ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--grid)" stroke-width="1"/>
        <text x="${L - 6}" y="${Y(t) + 3.5}" text-anchor="end" font-size="9.5" fill="var(--muted)">${fmtDec(t)}</text>`).join('')}
      <text x="${L}" y="${H - 5}" font-size="9.5" fill="var(--muted)">0</text>
      <text x="${W - R}" y="${H - 5}" text-anchor="end" font-size="9.5" fill="var(--muted)">${fmt(maxX)} ${esc(T.pulls.toLowerCase())}</text>
      <path d="${path('e')}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>
      <path d="${path('o')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${X(last.x)}" cy="${Y(last.o)}" r="4" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/>
      <line class="cx" y1="${Tp}" y2="${H - B}" stroke="var(--muted)" stroke-width="1" opacity="0"/>
      <rect class="hit" x="${L}" y="${Tp}" width="${W - L - R}" height="${H - Tp - B}" fill="transparent"/>
    </svg><div class="tip"></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), cx = el.querySelector('.cx'), hit = el.querySelector('.hit');
    hit.addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W;
      const x = (sx - L) / (W - L - R) * maxX;
      const p = pts.reduce((a, b) => Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a);
      cx.setAttribute('x1', X(p.x)); cx.setAttribute('x2', X(p.x)); cx.setAttribute('opacity', '.5');
      tip.style.left = Math.min(80, Math.max(20, X(p.x) / W * 100)) + '%'; tip.style.top = (Y(Math.max(p.o, p.e)) / H * 100) + '%';
      tip.textContent = `${fmt(p.x)} ${T.pulls.toLowerCase()} · ${T.you}: ${fmt(p.o)} · ${T.average}: ${fmtDec(p.e)}`;
      tip.classList.add('on');
    });
    hit.addEventListener('pointerleave', () => { tip.classList.remove('on'); cx.setAttribute('opacity', '0'); });
  }
  function gapChart(el, gaps) {
    if (!gaps.length) { el.innerHTML = `<div class="empty">${T.noData}</div>`; $('#gapAvg').textContent = ''; return; }
    const size = 10, top = Math.min(10, Math.ceil((Math.max(...gaps) + 1) / size)), bins = new Array(top).fill(0);
    gaps.forEach(g => { bins[Math.min(top - 1, Math.floor(g / size))]++; });
    const W = 320, H = 110, L = 8, R = 8, Tp = 14, B = 20, maxY = Math.max(...bins);
    const slot = (W - L - R) / bins.length, bw = Math.min(24, slot - 2);
    const Y = v => Tp + (1 - v / maxY) * (H - Tp - B);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.gapChart)}">
      <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="var(--grid)" stroke-width="1"/>
      ${bins.map((v, i) => {
        const x = L + i * slot + (slot - bw) / 2, y = Y(v), h = H - B - y, r = Math.min(4, h / 2);
        const label = i === bins.length - 1 && top === 10 ? `${i * size}+` : `${i * size}–${i * size + size - 1}`;
        return `<g><title>${label}: ${v}</title>
          ${v ? `<path d="M${x},${H - B} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${H - B} Z" fill="var(--accent)"/>` : ''}
          ${v === maxY ? `<text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" font-size="9.5" fill="var(--fg)">${v}</text>` : ''}
          <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="8.5" fill="var(--muted)">${i === bins.length - 1 && top === 10 ? i * size + '+' : i * size}</text>
          <rect x="${L + i * slot}" y="${Tp}" width="${slot}" height="${H - Tp - B}" fill="transparent"/></g>`;
      }).join('')}
    </svg>`;
    $('#gapAvg').textContent = T.avgGap(fmtDec(gaps.reduce((a, b) => a + b, 0) / gaps.length));
  }
  function renderStatsTab() {
    const rows = RAR.slice().reverse().filter(r => ap.expected[r.key] != null || ap.counts[r.key]);
    const list = rows.length ? rows : RAR.slice().reverse();
    $('#luckPulls').textContent = ap.pulls ? `${fmt(ap.pulls)} ${T.pulls.toLowerCase()}` : '';
    $('#luck').innerHTML = `<div class="lrow"><span class="h"></span><span class="h v">${T.got2}</span><span class="h v">${T.expected}</span><span class="h v">±</span></div>` +
      list.map(r => {
        const got = ap.counts[r.key] || 0, exp = ap.expected[r.key];
        const diff = exp != null && exp >= 1 ? Math.round((got / exp - 1) * 100) : null;
        return `<div class="lrow"><span><span class="c" style="margin-right:6px;background:${esc(r.color)}"></span>${esc(r.label)}</span>
          <span class="v">${fmt(got)}</span><span class="v">${exp == null ? '–' : fmtDec(exp, exp < 0.1 ? 3 : exp < 10 ? 2 : 0)}</span>
          <span class="v ${diff == null ? '' : diff >= 0 ? 'up' : 'down'}">${diff == null ? '–' : (diff >= 0 ? '+' : '') + diff + '%'}</span></div>`;
      }).join('');
    const rare = RAR.filter(r => rank(r.key) >= NOTABLE);
    const gotR = rare.reduce((s, r) => s + (ap.counts[r.key] || 0), 0), expR = rare.reduce((s, r) => s + (ap.expected[r.key] || 0), 0);
    $('#verdict').textContent = expR < 1 ? T.tooEarly : (gotR >= expR ? T.luckyBy(Math.round((gotR / expR - 1) * 100)) : T.unluckyBy(Math.round((1 - gotR / expR) * 100)));
    const s = ap.series, step = Math.max(1, Math.ceil(s.length / 120));
    lineChart($('#chLuck'), [{ x: 0, o: 0, e: 0 }, ...s.filter((_, i) => i % step === 0 || i === s.length - 1)]);
    gapChart($('#chGap'), ap.gaps);
    const pool = det.pool, owned = pool.filter(p => p.owned).length;
    $('#collN').textContent = pool.length ? `${owned} / ${pool.length} (${fmtDec(owned / pool.length * 100)}%)` : '–';
    $('#collBar').style.width = pool.length ? (owned / pool.length * 100) + '%' : '0';
    const missing = pool.filter(p => !p.owned).sort((a, c) => rank(c.rarity) - rank(a.rarity));
    $('#miss').innerHTML = !pool.length ? '' : missing.length
      ? missing.map(p => `<span style="--c:${esc(rInfo(p.rarity).color)}">${esc(p.id == null ? T.hidden : p.name)}</span>`).join('')
      : `<div class="empty">${T.allOwned}</div>`;
    const dup = Object.values(store.get('dupes', {})).sort((a, b) => b.copies - a.copies).slice(0, 10);
    $('#dupes').innerHTML = dup.length
      ? dup.map(d => `<span><span class="c" style="margin-right:6px;background:${esc(rInfo(d.rarity).color)}"></span>${esc(d.name)}</span><b>${fmt(d.copies)} ${T.copies}</b>`).join('')
      : `<div class="empty" style="grid-column:1/-1">${T.dupesNote}</div>`;
  }

  // ======================================================================
  // History (kept in this browser) + CSV export
  // ======================================================================
  const HKEY = 'history';
  const getHist = () => store.get(HKEY, []);
  let runLabel = '';
  const saveSession = endText => {
    if (!ap.sessionId || !ap.n) return;
    const hist = getHist().filter(h => h.id !== ap.sessionId);
    hist.unshift({
      id: ap.sessionId, date: ap.startedAt, ms: (ap.endedAt || Date.now()) - ap.startedAt, banner: runLabel || currentBanner().name,
      opens: ap.n, pulls: ap.pulls, counts: ap.counts, spent: ap.spentGems || 0, fifty: ap.fifty,
      best: ap.feed.slice().sort((a, b) => rank(b.rarity) - rank(a.rarity)).slice(0, 5).map(f => ({ name: f.name, rarity: f.rarity, isNew: f.isNew })),
      end: endText || T.running,
    });
    store.set(HKEY, hist.slice(0, 100));
  };
  function renderHistory() {
    const hist = getHist();
    $('#hist').innerHTML = hist.length ? hist.map(h => {
      const d = new Date(h.date);
      const rares = RAR.slice().reverse().filter(r => rank(r.key) >= NOTABLE && h.counts?.[r.key]).map(r => `${h.counts[r.key]} ${r.label}`).join(' · ');
      return `<div class="hrow"><div class="t"><b>${esc(h.banner)}</b><span>${d.toLocaleDateString(NL)} ${d.toLocaleTimeString(NL, { hour: '2-digit', minute: '2-digit' })}</span></div>
        <div class="d">${fmt(h.opens)} ${T.opens.toLowerCase()} · ${fmt(h.pulls)} ${T.pulls.toLowerCase()} · ${fmtTime(h.ms)}${h.spent ? ` · ${fmt(h.spent)} ${T.gems.toLowerCase()}` : ''}</div>
        <div class="d">${esc(rares || '—')}</div>
        ${h.best?.length ? `<div class="r">${h.best.map(b => esc(b.name) + (b.isNew ? ' ✦' : '')).join(', ')}</div>` : ''}
        <div class="r">${T.reason}: ${esc(h.end)}</div></div>`;
    }).join('') : `<div class="empty">${T.historyEmpty}</div>`;
  }
  const download = (name, rows) => {
    const csv = rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  $('#expHist').onclick = () => {
    const keys = RAR.slice().reverse().map(r => r.key);
    download(`poppy-tool-history-${stamp()}.csv`, [
      ['date', 'lootbox', 'opens', 'pulls', 'minutes', 'gems_spent', ...RAR.slice().reverse().map(r => r.label), '50/50 won', '50/50 lost', 'best', 'end'],
      ...getHist().map(h => [new Date(h.date).toLocaleString(NL), h.banner, h.opens, h.pulls, Math.round(h.ms / 60000), h.spent,
        ...keys.map(k => h.counts?.[k] || 0), h.fifty?.won || 0, h.fifty?.lost || 0, (h.best || []).map(b => b.name).join(' | '), h.end]),
    ]);
  };
  $('#expPulls').onclick = () => {
    download(`poppy-tool-session-${stamp()}.csv`, [
      ['#', 'open', 'time', 'lootbox', 'character', 'rarity', 'new', 'featured', '50/50', 'copies', 'free'],
      ...ap.log.map((p, i) => [i + 1, p.open, new Date(p.t).toLocaleTimeString(NL), bannerById(p.b)?.name || p.b, p.name, rInfo(p.rarity).label,
        p.isNew ? 'yes' : '', p.featured ? 'yes' : '', p.fifty == null ? '' : p.fifty ? 'won' : 'lost', p.copies ?? '', p.free ? 'yes' : '']),
    ]);
  };
  let clrArmed = 0;
  $('#clrHist').onclick = () => {
    if (!clrArmed) { $('#clrHist').textContent = T.clearConfirm; clrArmed = setTimeout(() => { clrArmed = 0; $('#clrHist').textContent = T.clearHist; }, 3000); return; }
    clearTimeout(clrArmed); clrArmed = 0; $('#clrHist').textContent = T.clearHist;
    store.set(HKEY, []); renderHistory();
  };

  // ======================================================================
  // Alerts: sound, Windows notification (bridge.js), tab title
  // ======================================================================
  let audioCtx = null;
  const unlockAudio = () => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume?.(); } catch (e) {} };
  const chime = big => {
    if (!audioCtx) return;
    const vol = Math.max(0, Math.min(1, (cfg.volume ?? 60) / 100));
    if (!vol) return;
    (big ? [659, 784, 988, 1319] : [784, 1047]).forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i * 0.13;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28 * vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.55);
    });
  };
  const desktop = (title, message) => post({ type: 'notify', title, message });
  const baseTitle = document.title.replace(/^▶ [^·]*· /, '').replace(/^★ .* ★$/, '') || document.title;
  let titleTimer = null;
  const runTitle = () => `▶ ${fmt(ap.n)} · ${baseTitle}`;
  const setTitle = t => { if (!titleTimer) document.title = t; };
  const blinkTitle = text => {
    if (!cfg.titleBlink) return;
    clearInterval(titleTimer);
    let on = false;
    titleTimer = setInterval(() => { on = !on; document.title = on ? `★ ${text} ★` : baseTitle; }, 900);
    const stopBlink = () => { clearInterval(titleTimer); titleTimer = null; document.title = ap.running ? runTitle() : baseTitle; };
    window.addEventListener('focus', stopBlink, { once: true });
    document.addEventListener('pointerdown', stopBlink, { once: true });
  };
  const alertDrop = (pull, big) => {
    const label = rInfo(pull.rarity).label;
    if (cfg.sound) chime(big);
    if (cfg.notify) desktop(T.alertTitle(label), `${pull.name}${pull.isNew ? ` (${T.isNew})` : ''} — ${bannerById(pull.b)?.name || ''}`);
    blinkTitle(`${label}: ${pull.name}`);
  };
  $('#testAlert').onclick = () => { unlockAudio(); if (cfg.sound) chime(true); if (cfg.notify) desktop(T.alertTitle('Test'), T.testMsg); blinkTitle('Test'); };

  // event end warning: once a day per lootbox, when it ends within 24h
  banners.forEach(b => {
    if (!b.endsAt) return;
    const left = b.endsAt - Date.now();
    if (left > 0 && left < 86400000 && store.get('endwarn-' + b.id) !== today()) {
      store.set('endwarn-' + b.id, today());
      setMsg(T.endsSoon(b.name, fmtLeft(left)), true);
      if (cfg.notify) desktop(T.endWarnTitle, T.endsSoon(b.name, fmtLeft(left)));
    }
  });

  // free-pull reminder: notify when a lootbox's free pulls have come back (were 0, now > 0)
  const loadFreeCounts = async () => {
    // pull the current free-pulls count for every lootbox from the site
    await Promise.all(banners.map(b => loadDetails(b.id)));
    banners.forEach(b => {
      const seen = store.get('freeseen-' + b.id, null);
      if (cfg.freeReminder && seen === 0 && b.freeLeft > 0 && store.get('freewarn-' + b.id) !== today()) {
        store.set('freewarn-' + b.id, today());
        setMsg(T.freeBack(b.name, b.freeLeft), true);
        if (cfg.notify) desktop(T.freeBackTitle, T.freeBack(b.name, b.freeLeft));
      }
      store.set('freeseen-' + b.id, b.freeLeft);
    });
  };
  setTimeout(() => { if (!ap.running) loadFreeCounts(); }, 1200);

  // ======================================================================
  // Godos → Gems (the site's own shop conversion)
  // ======================================================================
  const maxConv = () => Math.floor((wallet().godos || 0) / GPS);
  let cvArmed = 0;
  const disarm = () => { cvArmed = 0; $('#cvGo').classList.remove('confirm'); $('#cvGo').textContent = T.convert; };
  function renderConv() {
    const q = Math.max(1, parseInt($('#cvQty').value, 10) || 1);
    $('#cvRate').textContent = T.rate(GPS);
    $('#cvCost').textContent = `${fmt(q * GPS)} ${T.godos}`;
    $('#cvGain').textContent = `+${fmt(q)} ${T.gems}  ${q >= 10 ? T.multis(Math.floor(q / 10)) : ''}`;
    $('#cvGo').disabled = q > maxConv();
    if (!cvArmed) $('#cvGo').textContent = $('#cvGo').disabled ? T.notEnough : T.convert;
  }
  const setQty = q => { $('#cvQty').value = Math.max(1, Math.min(q, Math.max(1, maxConv()))); disarm(); renderConv(); };
  $('#cvToggle').onclick = () => {
    const open = $('#conv').hidden;
    $('#conv').hidden = !open; $('#cvToggle').classList.toggle('on', open);
    if (open) renderConv(); else disarm();
  };
  root.querySelectorAll('#conv [data-d]').forEach(b => b.onclick = () => setQty((parseInt($('#cvQty').value, 10) || 0) + +b.dataset.d));
  $('#cvMax').onclick = () => setQty(maxConv());
  $('#cvQty').oninput = () => { disarm(); renderConv(); };

  async function convertGodos(shards) {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
    const res = await fetch('/api/convert_godos_to_shards.php', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ shards, csrf_token: csrf }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 'success') throw new Error(data.message || T.convError);
    // tell the lootbox page about the new balances, exactly like the shop does
    if (data.soldi_rimasti != null) { ap.lastGodos = Number(data.soldi_rimasti); window.GachaUI?.setSoldi?.(ap.lastGodos); }
    if (data.shards_rimaste != null) { ap.lastGems = Number(data.shards_rimaste); window.GachaUI?.setShards?.(ap.lastGems); }
    document.querySelectorAll('.user-points-val').forEach(e => { if (ap.lastGodos != null) e.textContent = fmt(ap.lastGodos); });
    document.querySelectorAll('.user-shards-val').forEach(e => { if (ap.lastGems != null) e.textContent = fmt(ap.lastGems); });
    return data;
  }
  $('#cvGo').onclick = async () => {
    const q = Math.max(1, parseInt($('#cvQty').value, 10) || 1);
    if (q > maxConv()) { renderConv(); return; }
    if (!cvArmed) {
      cvArmed = setTimeout(disarm, 4000);
      $('#cvGo').classList.add('confirm');
      $('#cvGo').textContent = `${T.confirm}: ${fmt(q * GPS)} → +${fmt(q)}`;
      return;
    }
    clearTimeout(cvArmed); cvArmed = 0;
    $('#cvGo').classList.remove('confirm');
    $('#cvGo').disabled = true; $('#cvGo').textContent = T.converting;
    try { const d = await convertGodos(q); setMsg(T.converted(fmt(q), fmt(d.costo_punti ?? q * GPS)), true); }
    catch (e) { setMsg(e.message || T.convError); }
    $('#cvGo').disabled = false; disarm(); renderStats(); renderConv();
  };

  // ======================================================================
  // Heartbeat for the toolbar popup and the background watchdog
  // ======================================================================
  const beat = () => {
    const top = ap.feed.slice().sort((a, b) => rank(b.rarity) - rank(a.rarity))[0];
    post({ type: 'beat', running: ap.running, resume: !!cfg.autoResume, state: $('#state').textContent, opens: ap.n, pulls: ap.pulls,
      time: ap.startedAt ? fmtTime((ap.endedAt || Date.now()) - ap.startedAt) : '', banner: currentBanner().name,
      best: top ? `${rInfo(top.rarity).label}: ${top.name}` : '', color: accentOf(currentBanner()), lang: LANG,
      labels: { start: T.start, stop: T.stop, opens: T.opens, pulls: T.pulls, time: T.time, best: T.best } });
  };
  const onCmd = e => {
    if (e.source !== window || e.data?.__ap !== true || e.data.type !== 'cmd') return;
    if (e.data.cmd === 'toggle') startStop();
    if (e.data.cmd === 'status') beat();
  };
  window.addEventListener('message', onCmd);

  // ======================================================================
  // Wiring
  // ======================================================================
  let lastBeat = 0;
  const ticker = setInterval(() => {
    renderStats();
    if (ap.running) setTitle(runTitle());
    if (Date.now() - lastBeat > (ap.running ? 15000 : 60000)) { lastBeat = Date.now(); beat(); }
  }, 1000);
  $('#banner').onchange = () => { cfg.banner = $('#banner').value; saveCfg(); applyBanner(cfg.banner); };
  await applyBanner(cfg.banner);
  syncStops();
  renderAll(); renderSpentToday();
  enhanceSelects();
  showTab(root.querySelector(`.tab[data-tab="${cfg.tab}"]`) ? cfg.tab : 'pull');

  const startStop = () => { if (ap.running) { ap.stop = true; store.del('resume'); setState(T.stopping); } else run(); };
  $('#go').onclick = startStop;
  $('#mGo').onclick = startStop;
  const onKey = e => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyP') { e.preventDefault(); e.stopPropagation(); unlockAudio(); startStop(); }
  };
  document.addEventListener('keydown', onKey, true);
  ap.cleanup = () => {
    document.removeEventListener('keydown', onKey, true); window.removeEventListener('message', onCmd);
    clearInterval(ticker); clearInterval(titleTimer); siteMod?.stop(); iconObserver?.disconnect(); timerWorker?.w.terminate();
  };
  // rebuild the whole panel (language change)
  const rebuild = () => { ap.cleanup(); host.remove(); main(); };

  const lock = on => {
    ['#max', '#paid'].forEach(id => { $(id).disabled = on; });
    [$('#go'), $('#mGo')].forEach(b => { b.textContent = on ? T.stop : T.start; b.classList.toggle('stop', on); });
    syncStops(); renderQueue();
  };

  // ======================================================================
  // Resume after a reload
  // ======================================================================
  const RESUME_MAX_AGE = 20 * 60000;
  const saveResume = () => {
    if (!cfg.autoResume || !ap.running) return;
    store.set('resume', {
      savedAt: Date.now(), reloads: ap.reloads || 0, sessionId: ap.sessionId, startedAt: ap.startedAt, runLabel,
      n: ap.n, pulls: ap.pulls, counts: ap.counts, expected: ap.expected, feed: ap.feed.slice(0, 80), log: ap.log.slice(-5000),
      fifty: ap.fifty, series: ap.series.slice(-2000), gaps: ap.gaps.slice(-2000), sinceRare: ap.sinceRare, spentGems: ap.spentGems || 0,
      queuePos: ap.queuePos, stepOpens: ap.stepOpens, bannerId: ap.bannerId,
    });
  };

  // ======================================================================
  // Main loop
  // ======================================================================
  const selectBanner = async b => {
    [...document.querySelectorAll(`[data-banner-select="${b.id}"]`)].find(vis)?.click();
    await sleep(800);
    if (!vis(b.view)) {                                   // try the site's own switcher too
      try { window.GachaUI?.switchBanner?.(b.id); } catch (e) {}
      await sleep(600);
    }
    return vis(b.view);
  };
  // pick the rate-up (site "destiny" choice) when the target character is one of the options
  const pickDestiny = async (b, charId) => {
    if (!cfg.autoDestiny || charId == null) return;
    const opt = b.view.querySelector(`[data-destiny] [data-destiny-target="${charId}"]`)
      || document.querySelector(`[data-destiny][data-banner="${b.id}"] [data-destiny-target="${charId}"]`);
    if (!opt || opt.classList.contains('is-active') || opt.disabled) return;
    opt.click();
    for (let i = 0; i < 20 && !opt.classList.contains('is-active'); i++) await sleep(150);
    if (opt.classList.contains('is-active')) setMsg(T.destinyPicked(clean(opt.textContent) || charId), true);
  };

  async function run(resume) {
    unlockAudio();
    const target = cfg.target || 'r:theone';
    const targetRank = target.startsWith('r:') ? rank(target.slice(2)) : Infinity;
    const targetChar = target.startsWith('c:') ? Number(target.slice(2)) : null;
    const endless = !!cfg.endless, stopNew = !endless && !!cfg.stopNew;
    const maxTotal = Math.max(0, parseInt($('#max').value, 10) || 0);
    const allowPaid = !!cfg.paid;
    const alertRank = rank(cfg.alertFrom);
    const gap = { slow: 3000, normal: 1500, fast: 700 }[cfg.speed] ?? 1500;   // pause between opens (the site wants a few seconds)
    const steps = cfg.useQueue
      ? cfg.queue.filter(s => bannerById(s.banner)).map(s => ({ banner: bannerById(s.banner), opens: s.opens || 0 }))
      : [{ banner: bannerById($('#banner').value) || banners[0], opens: 0 }];
    if (!steps.length) { setMsg(T.queueEmpty); return; }
    if (!cfg.useQueue && !steps[0].banner.free && !allowPaid && !(cfg.freeFirst && steps[0].banner.freeLeft > 0)) { setMsg(T.needPaid); return; }

    const deadlines = [];
    if (cfg.timer > 0) deadlines.push((resume?.startedAt || Date.now()) + cfg.timer * 60000);
    if (cfg.clock) {
      const [h, m] = cfg.clock.split(':').map(Number), d = new Date(); d.setHours(h, m, 0, 0);
      if (d.getTime() <= Date.now() - 60000) d.setDate(d.getDate() + 1);
      deadlines.push(d.getTime());
    }
    const deadline = deadlines.length ? Math.min(...deadlines) : null;

    // session
    const w0 = wallet();
    Object.assign(ap, freshSession(), {
      running: true, stop: false, startedAt: Date.now(), sessionId: Date.now().toString(36), queueLen: steps.length,
      lastGems: w0.gems, lastGodos: w0.godos, reloads: 0,
    });
    runLabel = cfg.useQueue ? steps.map(s => s.banner.name).filter((v, i, a) => a.indexOf(v) === i).join(' → ') : steps[0].banner.name;
    if (resume) {
      Object.assign(ap, {
        sessionId: resume.sessionId, startedAt: resume.startedAt, n: resume.n, pulls: resume.pulls, counts: resume.counts || {},
        expected: resume.expected || {}, feed: resume.feed || [], log: resume.log || [], fifty: resume.fifty || { won: 0, lost: 0 },
        series: resume.series || [], gaps: resume.gaps || [], sinceRare: resume.sinceRare || 0, spentGems: resume.spentGems || 0,
        queuePos: Math.min(resume.queuePos || 0, steps.length - 1), stepOpens: resume.stepOpens || 0, reloads: resume.reloads || 0,
      });
      runLabel = resume.runLabel || runLabel;
    }
    let lastProgress = Date.now();

    // every server reply = the real result of one open
    ap.onPulls = (data, pulls) => {
      if (!ap.running) return;
      lastProgress = Date.now();
      ap.n++; ap.stepOpens++;
      const bid = String(data.banner_id ?? ap.bannerId);
      let bestAlert = null;
      for (const p of pulls) {
        const c = p.personaggio || {};
        const key = c['rarità'] ?? c.rarita ?? c.rarity;
        const pull = { id: c.id, name: c.nome || '?', rarity: key, img: c.img_url, isNew: !!p.is_new, featured: !!p.featured,
          fifty: p.vinto_50_50 ?? null, copies: p.copie ?? null, free: !!p.gratuita, open: ap.n, t: Date.now(), b: bid };
        ap.pulls++;
        ap.counts[key] = (ap.counts[key] || 0) + 1;
        // expected counts use the odds of the lootbox this pull came from
        (detailsCache[bid]?.odds || []).forEach(o => { if (o.prob != null) ap.expected[o.key] = (ap.expected[o.key] || 0) + o.prob / 100; });
        // the site sends 1 / 0 (null = no 50/50 on this pull)
        if (pull.fifty === true || pull.fifty === 1) ap.fifty.won++; else if (pull.fifty === false || pull.fifty === 0) ap.fifty.lost++;
        if (ap.log.length < 300000) ap.log.push(pull);
        if (rank(key) >= NOTABLE) { ap.gaps.push(ap.sinceRare); ap.sinceRare = 0; } else ap.sinceRare++;
        if (rank(key) >= NOTABLE || p.featured || p.is_new) { ap.feed.unshift(pull); ap.feed.length = Math.min(ap.feed.length, 80); }
        if (pull.isNew) { const pc = detailsCache[bid]?.pool.find(x => x.id === pull.id); if (pc) pc.owned = true; }
        if (pull.id != null && pull.copies != null) {
          const dup = store.get('dupes', {});
          if (!dup[pull.id] || dup[pull.id].copies < pull.copies) { dup[pull.id] = { name: pull.name, rarity: key, copies: pull.copies }; store.set('dupes', dup); }
        }
        if (rank(key) >= alertRank && (!bestAlert || rank(key) > rank(bestAlert.rarity))) bestAlert = pull;
        if (!endless && !ap.hit) {
          if (rank(key) >= targetRank) ap.hit = { ...pull, why: `${T.got} ${rInfo(key).label}` };
          else if (targetChar != null && pull.id === targetChar) ap.hit = { ...pull, why: `${T.got} ${pull.name}` };
          else if (stopNew && pull.isNew) ap.hit = { ...pull, why: T.gotNew };
        }
      }
      const rareSum = RAR.filter(r => rank(r.key) >= NOTABLE).reduce((s, r) => [s[0] + (ap.counts[r.key] || 0), s[1] + (ap.expected[r.key] || 0)], [0, 0]);
      ap.series.push({ x: ap.pulls, o: rareSum[0], e: rareSum[1] });
      if (ap.series.length > 5000) ap.series = ap.series.filter((_, i) => i % 2 === 0);
      // spending: gems (and Godos) that went down because of this open
      const gemsNow = typeof data.shards_rimaste === 'number' ? data.shards_rimaste : null;
      const godosNow = typeof data.soldi_rimasti === 'number' ? data.soldi_rimasti : null;
      const gemsSpent = gemsNow != null && ap.lastGems != null ? Math.max(0, ap.lastGems - gemsNow) : 0;
      const godosSpent = godosNow != null && ap.lastGodos != null ? Math.max(0, ap.lastGodos - godosNow) : 0;
      if (gemsNow != null) ap.lastGems = gemsNow;
      if (godosNow != null) ap.lastGodos = godosNow;
      ap.spentGems = (ap.spentGems || 0) + gemsSpent;
      if (gemsSpent || godosSpent) store.set(spentKey(), spentTodayGodos() + gemsSpent * GPS + godosSpent);
      // free pulls left, straight from the site
      const b = bannerById(bid);
      if (b) {
        if (data.uso?.gratis_rimaste != null) b.freeLeft = Math.max(0, +data.uso.gratis_rimaste || 0);
        else b.freeLeft = Math.max(0, b.freeLeft - pulls.filter(p => p.gratuita).length);
      }
      if (bestAlert && !ap.hit) alertDrop(bestAlert, rank(bestAlert.rarity) >= rank('segreto'));
      renderAll(); renderSpentToday();
      saveResume();
      if (ap.n % 5 === 0) saveSession();
    };

    lock(true); setState(T.running, 'run'); setTitle(runTitle());
    setMsg(resume ? T.resumed : '', !!resume);
    renderAll(); beat();

    let end = { text: T.stopped, kind: '' };
    try {
      queue: for (let lap = 0; ; lap++) {
        const opensAtLapStart = ap.n;
        for (; ap.queuePos < steps.length; ap.queuePos++) {
          const step = steps[ap.queuePos];
          const b = step.banner, view = b.view;
          if (cfg.useQueue) end = { text: T.queueDone, kind: '' };
          ap.bannerId = b.id;
          if (cfg.useQueue) { $('#banner').value = b.id; renderQueue(); }
          await applyBanner(b.id);
          if (!(await selectBanner(b))) { end = { text: T.noBanner, kind: 'err' }; if (cfg.useQueue) { ap.stepOpens = 0; continue; } break queue; }
          await pickDestiny(b, targetChar);
          const costShards = detailsCache[b.id]?.costShards || (b.free ? 0 : 10);
          const stepEnd = txt => { end = { text: txt, kind: 'err' }; };
          let lastAct = 0, stuckSince = Date.now(), failedOpens = 0, pendingOpen = 0, single = false;

          while (!ap.stop) {
            await sleep(150);
            // anti-freeze: nothing happened for 2 minutes -> reload (the run resumes by itself)
            if (cfg.watchdog && Date.now() - lastProgress > 120000) {
              saveResume(); setMsg(T.frozen); await sleep(500);
              const r = store.get('resume', null); if (r) { r.reloads = (r.reloads || 0) + 1; store.set('resume', r); }
              location.reload(); return;
            }
            if (Date.now() - lastAct < 400) continue;

            // The site asked to convert coins into gems -> never through its popup
            if (popupOpen()) { closePopups(); escape(); stepEnd(T.noGems); break; }

            // Summary screen (10×): stop here if a condition is met, otherwise close it
            const summary = byId('phase-summary');
            if (vis(summary) && summary.querySelector('.gms-card')) {
              if (ap.hit) { end = { text: ap.hit.why, kind: 'found', msg: `${ap.hit.why}: ${ap.hit.name} (${rInfo(ap.hit.rarity).label})`, pull: ap.hit }; break queue; }
              if (maxTotal && ap.n >= maxTotal) { end = { text: T.done }; break queue; }
              if (deadline && Date.now() >= deadline) { end = { text: T.timeUp }; break queue; }
              const close = byId('btn-summary-close');
              if (vis(close)) close.click(); else escape();
              for (let t = 0; t < 30 && vis(summary); t++) await sleep(100);
              if (vis(summary)) escape();
              lastAct = Date.now() + gap; stuckSince = Date.now();
              if (step.opens && ap.stepOpens >= step.opens) break;
              continue;
            }

            // During the reveal: Skip, otherwise Next / Summary
            const skip = byId('btn-multi-skip'), next = byId('btn-multi-next');
            if (vis(skip)) { skip.click(); lastAct = Date.now(); stuckSince = Date.now(); continue; }
            if (vis(next)) { next.click(); lastAct = Date.now(); stuckSince = Date.now(); continue; }

            // Single (free) pull card: close it
            const closeOne = byId('btn-close-overlay');
            if (single && overlayOn() && vis(closeOne) && Date.now() - pendingOpen > 800) {
              if (ap.hit) { end = { text: ap.hit.why, kind: 'found', msg: `${ap.hit.why}: ${ap.hit.name} (${rInfo(ap.hit.rarity).label})`, pull: ap.hit }; break queue; }
              closeOne.click(); single = false; pendingOpen = 0; lastAct = Date.now() + Math.min(gap, 1200); stuckSince = Date.now();
              continue;
            }

            if (!overlayOn()) {
              if (deadline && Date.now() >= deadline) { end = { text: T.timeUp }; break queue; }
              if (maxTotal && ap.n >= maxTotal) { end = { text: T.done }; break queue; }
              if (step.opens && ap.stepOpens >= step.opens) break;
              const open10 = view.querySelector('[data-pull-qty="10"]');
              const open1 = view.querySelector('[data-pull-btn]:not([data-pull-qty])');
              if (!open10 || open10.disabled) { stepEnd(T.cantOpen); break; }
              if (pendingOpen && Date.now() - pendingOpen < 6000) continue;
              if (pendingOpen && ++failedOpens >= 3) { stepEnd(T.refused); break; }

              // what will this open cost?
              const paidNow = view.dataset.costo !== '0';
              const useSingle = paidNow && cfg.freeFirst && b.freeLeft > 0 && b.freeLeft < 10 && !!open1;   // last free pulls one by one
              const coveredByFree = paidNow && cfg.freeFirst && b.freeLeft >= (useSingle ? 1 : 10);
              if (paidNow && !coveredByFree) {
                if (!allowPaid) { stepEnd(ap.stepOpens && b.freeLeft === 0 ? T.freeUsed : T.notFree); break; }
                const cost = costShards;
                if (cfg.budget && spentTodayGodos() + cost * GPS > cfg.budget) { end = { text: T.budgetHit(fmt(cfg.budget)) }; break queue; }
                const gems = wallet().gems ?? 0;
                if (cfg.keepGems && gems - cost < cfg.keepGems && !cfg.autoRefill) { stepEnd(T.gemFloor(cfg.keepGems)); break; }
                const needGems = Math.max(0, cost + (cfg.keepGems || 0) - gems);
                if (needGems > 0) {
                  if (!cfg.autoRefill) { stepEnd(T.noGems); break; }
                  const godos = wallet().godos ?? 0;
                  if (godos - needGems * GPS < (cfg.keepGodos || 0)) { stepEnd(T.godosFloor(fmt(cfg.keepGodos || 0))); break; }
                  try { const d = await convertGodos(needGems); setMsg(T.refilled(fmt(needGems), fmt(d.costo_punti ?? needGems * GPS)), true); }
                  catch (e) { end = { text: T.refillFail, kind: 'err', msg: e.message }; break queue; }
                  await sleep(400);
                }
              }
              const w = wallet(); ap.lastGems = w.gems ?? ap.lastGems; ap.lastGodos = w.godos ?? ap.lastGodos;
              (useSingle ? open1 : open10).click();
              single = useSingle;
              pendingOpen = Date.now(); lastAct = Date.now(); stuckSince = Date.now();
            } else {
              if (!single) { pendingOpen = 0; failedOpens = 0; }
              if (Date.now() - stuckSince > 25000) { escape(); stuckSince = Date.now(); lastAct = Date.now(); }
            }
          }
          if (ap.stop) break queue;
          if (!cfg.useQueue) break queue;                      // single lootbox: its end is the run's end
          ap.stepOpens = 0;
          saveResume();
        }
        if (!cfg.useQueue || !cfg.repeatQueue || ap.stop) break;
        if (ap.n === opensAtLapStart) break;                   // a whole lap without opening anything: stop
        ap.queuePos = 0;
      }
      if (cfg.useQueue && end.kind === 'err' && !ap.stop) end = { text: T.queueDone, kind: '', msg: end.text };
      if (ap.stop) end = { text: T.stopped, kind: '' };
    } catch (e) {
      end = { text: T.stopped, kind: 'err', msg: e.message };
    }
    ap.running = false;
    ap.endedAt = Date.now();
    ap.onPulls = null;
    store.del('resume');
    lock(false);
    setState(end.kind === 'err' ? T.stopped : end.text, end.kind);
    setMsg(end.msg || (end.kind === 'err' ? end.text : ''), end.kind === 'found');
    if (!titleTimer) document.title = baseTitle;
    if (end.kind === 'found') alertDrop(end.pull, true);
    else if (!ap.stop && ap.n) { if (cfg.sound) chime(false); if (cfg.notify) desktop(T.finished, `${end.msg || end.text} — ${fmt(ap.n)} ${T.opens.toLowerCase()}`); }
    saveSession(end.msg || end.text);
    renderAll(); renderQueue(); beat();
    if (!$('[data-page="history"]').hidden) renderHistory();
    console.log('[poppy-tool]', end.text, { opens: ap.n, pulls: ap.pulls, counts: ap.counts, best: ap.feed.slice(0, 10) });
  }

  // ---------- auto-resume ----------
  const pending = store.get('resume', null);
  if (pending) {
    if (cfg.autoResume && Date.now() - pending.savedAt < RESUME_MAX_AGE && (pending.reloads || 0) < 50) {
      await sleep(1500);                                  // let the site settle after the reload
      run(pending);
    } else store.del('resume');
  }
};
main();
})();
