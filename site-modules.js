/*
 * Poppy Tool - by Rcf  —  site modules (v5)
 * One widget for the whole Cripsum site.
 *  - On the lootbox page, content.js (Poppy Tool) mounts these tabs into its own panel.
 *  - On every other page, this file builds the same panel by itself and mounts them.
 *
 * Tabs: Home (dashboard + "collect everything"), Missions, Inventory, Achievements, Inbox.
 * Everything uses the site's own endpoints, and only claims rewards the user has earned:
 *   /api/missions/get.php + claim.php            (mission rewards)
 *   /api/inbox.php  action=claim_rewards          (gifts attached to inbox messages)
 *   /api/gacha/collezione.php + azioni.php        (collection, collection rewards)
 *   /api/game/upgrade_all_characters.php          (the inventory's own "upgrade all")
 *   /api/social/friend_requests.php + accept/decline
 *   /api/get_all_achievement.php + get_unlocked_achievement.php
 */
(() => {
  if (window.__apSite) return;
  const IS_LOOT = /\/lootbox/i.test(location.pathname);
  const PANEL_CSS = `
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
  .m .mtag.r { background: var(--accent); color: var(--on-accent); } .m .mtag.ok { background: var(--card2); color: var(--muted); }
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
`;
  const EXTRA_CSS = `
  .tabs { overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { flex: 1 0 auto; padding: 8px 7px 9px; }
  .tbadge { display:inline-block; min-width: 15px; height: 15px; line-height: 15px; padding: 0 3px; margin-left: 3px; border-radius: 999px;
    background: var(--accent); color: var(--on-accent); font-size: 9px; font-weight: 800; vertical-align: top; }
  .tbadge[hidden] { display: none; }
  .m { display:flex; align-items:center; gap: 8px; padding: 6px 8px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); border-left: 3px solid transparent; margin-bottom: 5px; }
  .m.ready { border-left-color: var(--accent); }
  .m .mi { min-width:0; flex:1; }
  .m .mt { color: var(--strong); font-weight: 600; font-size: 12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .m .mp { font-size: 10.5px; color: var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .m .mbar { height: 4px; border-radius: 999px; background: var(--card2); margin-top: 4px; overflow:hidden; }
  .m .mbar i { display:block; height:100%; background: var(--accent); border-radius:999px; }
  .m .mtag { font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 6px; flex:none; }
  .m .mtag.r { background: var(--accent); color: var(--on-accent); } .m .mtag.ok { background: var(--card2); color: var(--muted); }
  .m img { width: 30px; height: 30px; border-radius: 7px; object-fit: cover; flex: none; background: var(--card2); }
  .m .mx { font-size: 11px; color: var(--muted); flex:none; text-align:right; font-variant-numeric: tabular-nums; }
  .m .mx b { color: var(--strong); }
  .m .mbtn { font: inherit; font-size: 11px; font-weight: 700; border: 0; border-radius: 8px; padding: 5px 8px; cursor: pointer; background: var(--accent); color: var(--on-accent); flex:none; }
  .m .mbtn.dim { background: var(--card2); color: var(--fg); }
  .tiles { display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .tile { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 7px 8px; min-width: 0; }
  .tile b { display:block; color: var(--strong); font-size: 14px; font-variant-numeric: tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tile span { font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); display:flex; align-items:center; gap: 4px; }
  .tile img { width: 12px; height: 12px; object-fit: contain; }
  .plist { display:grid; gap: 5px; }
  .prow { display:grid; grid-template-columns: 1fr auto; gap: 3px 8px; align-items:center; font-size: 11.5px; }
  .prow .pn { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color: var(--fg); }
  .prow .pv { color: var(--strong); font-variant-numeric: tabular-nums; font-weight: 600; }
  .prow .bar { grid-column: 1 / -1; height: 4px; }
  .lines { display:grid; gap: 4px; font-size: 12px; }
  .lines div { display:flex; justify-content: space-between; gap: 8px; } .lines b { color: var(--strong); }
  .qlinks { display:grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
  .qlinks a { text-decoration:none; font-size: 11px; color: var(--fg); background: var(--card); border: 1px solid var(--line); border-radius: 9px; padding: 7px 4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .qlinks a:hover { background: var(--card2); color: var(--strong); }
  .sinput { width: 100%; font: inherit; font-size: 12.5px; color: var(--strong); background: var(--field); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; outline: none; }
  .sinput:focus { border-color: var(--accent); }
  .chips { display:flex; flex-wrap: wrap; gap: 4px; }
  .chips .chip { padding: 4px 8px; font-size: 11px; display:flex; align-items:center; gap: 5px; }
  .chips .chip i { width: 8px; height: 8px; border-radius: 3px; display:inline-block; }
  .more { width: 100%; }
  .smsg { font-size: 11.5px; color: #f59e0b; } .smsg:empty { display: none; } .smsg.err { color: #f87171; }
  .go.alt { background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; box-shadow: none; }
  .go.warn { background: #f59e0b; color: #1f1300; box-shadow: none; }
  `;

  // ---------------------------------------------------------------- shared helpers
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem('ap-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem('ap-' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const settings = () => store.get('settings', {});
  const pickLang = () => {
    const pref = settings().lang;
    const l = (pref && pref !== 'auto' ? pref : (navigator.language || 'en')).slice(0, 2).toLowerCase();
    return ['fr', 'it', 'en'].includes(l) ? l : 'en';
  };
  let LANG = pickLang();
  const SITE_LANG = (() => { const p = location.pathname.split('/')[1]; return ['en', 'it'].includes(p) ? p : (document.documentElement.lang || 'en').slice(0, 2); })();
  let NL = LANG === 'fr' ? 'fr-FR' : LANG;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => (Number(n) || 0).toLocaleString(NL);
  const fmtLeft = ms => { const m = Math.max(0, Math.floor(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24); return d ? `${d}d ${h % 24}h` : h ? `${h}h ${m % 60}m` : `${m}m`; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || document.body?.dataset?.csrf || window.socialCsrfToken || '';
  const getJSON = async url => { const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' }); return r.json(); };
  const postJSON = async (url, body, withCsrf = true) => {
    const tok = csrf();
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (withCsrf) headers['X-CSRF-Token'] = tok;
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(withCsrf ? { ...body, csrf_token: tok } : body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false || j.success === false || j.status === 'error') throw new Error(j.message || 'error');
    return j;
  };

  // ---------------------------------------------------------------- text
  const TXT = {
    en: {
      home: 'Home', missions: 'Missions', inventory: 'Inventory', achievements: 'Achievements', inbox: 'Inbox', settings: 'Settings',
      harvest: 'Collect everything', harvesting: 'Collecting…', harvested: (m, g, c) => `Collected: ${m} mission${m === 1 ? '' : 's'}, ${g} gift${g === 1 ? '' : 's'}, ${c} collection reward${c === 1 ? '' : 's'}`,
      nothingToCollect: 'Nothing to collect right now', godos: 'Godos', gems: 'Gems', frags: 'Fragments', collection: 'Collection', ach: 'Achievements', opened: 'Boxes opened',
      pity: 'Pity', toDo: 'To do', missionsReady: 'mission rewards ready', gifts: 'gifts to claim', unread: 'unread messages', requests: 'friend requests',
      week: 'Last 7 days', opens: 'opens', pulls: 'pulls', bestWeek: 'Best', noRuns: 'No Poppy Tool session this week.', links: 'Shortcuts', collRewards: 'collection rewards', eventBoxes: 'Event lootboxes',
      lLoot: 'Lootbox', lMiss: 'Missions', lInv: 'Inventory', lShop: 'Shop', lInbox: 'Inbox', lFriends: 'Friends', lAch: 'Achievements', lHome: 'Home', lRewind: 'Rewind',
      daily: 'Daily', weekly: 'Weekly', ready: 'ready', done: 'done', claimAll: 'Claim all', claiming: 'Claiming…', resetIn: t => `resets in ${t}`,
      autoM: 'Auto-claim missions', autoMSub: 'collects finished missions for you', claimed: n => `Claimed ${n} reward${n > 1 ? 's' : ''}`, nothing: 'Nothing to claim',
      loading: 'Loading…', loadErr: 'Could not load', search: 'Search a character…', all: 'All', owned: 'Owned', missing: 'Missing', dupes: 'Duplicates', upgradable: 'Upgradable',
      allCats: 'All categories', showMore: n => `Show ${n} more`, lv: 'Lv', copies: 'copies', collections: 'Collections', claim: 'Claim', claimedTag: 'claimed',
      upgradeAll: n => `Upgrade all (${n})`, confirmUp: 'Click again to confirm', upgraded: n => `${n} character${n > 1 ? 's' : ''} upgraded`, noMatch: 'No match',
      achDone: 'unlocked', points: 'points', locked: 'Still to unlock', unlocked: 'Unlocked',
      giftsTitle: 'Gifts', claimGifts: 'Claim gifts', autoG: 'Auto-claim gifts', autoGSub: 'claims gifts attached to your messages', reqTitle: 'Friend requests',
      accept: 'Accept', decline: 'Decline', latest: 'Latest messages', openInbox: 'Open the inbox', noReq: 'No pending request', noGift: 'No gift waiting',
      notifTitle: 'Poppy Tool', nMissions: n => `${n} mission reward${n > 1 ? 's' : ''} ready`, nGifts: n => `${n} gift${n > 1 ? 's' : ''} in your inbox`,
      nUnread: n => `${n} new message${n > 1 ? 's' : ''}`, nReq: n => `${n} new friend request${n > 1 ? 's' : ''}`,
      endsSoon: (name, t) => `${name} ends in ${t}!`, endsIn: t => `ends in ${t}`, idle: 'Up to date', todo: n => `${n} to do`,
      language: 'Panel language', auto: 'Auto', theme: 'Light theme', sound: 'Sound', notify: 'Windows notification', volume: 'Volume', accent: 'Accent colour', accentAuto: 'Default',
      lootHint: 'Lootbox auto-pull settings are on the lootbox page.',
      rar: { comune: 'Common', raro: 'Rare', epico: 'Epic', leggendario: 'Legendary', speciale: 'Special', segreto: 'Secret', theone: 'The One' },
    },
    fr: {
      home: 'Accueil', missions: 'Missions', inventory: 'Inventaire', achievements: 'Succès', inbox: 'Messages', settings: 'Réglages',
      harvest: 'Tout récupérer', harvesting: 'Récupération…', harvested: (m, g, c) => `Récupéré : ${m} mission${m > 1 ? 's' : ''}, ${g} cadeau${g > 1 ? 'x' : ''}, ${c} récompense${c > 1 ? 's' : ''} de collection`,
      nothingToCollect: 'Rien à récupérer pour l\'instant', godos: 'Godos', gems: 'Gemmes', frags: 'Fragments', collection: 'Collection', ach: 'Succès', opened: 'Box ouvertes',
      pity: 'Pity', toDo: 'À faire', missionsReady: 'récompenses de mission prêtes', gifts: 'cadeaux à réclamer', unread: 'messages non lus', requests: 'demandes d\'ami',
      week: '7 derniers jours', opens: 'ouvertures', pulls: 'pulls', bestWeek: 'Meilleurs', noRuns: 'Aucune session Poppy Tool cette semaine.', links: 'Raccourcis', collRewards: 'récompenses de collection', eventBoxes: 'Lootboxes événement',
      lLoot: 'Lootbox', lMiss: 'Missions', lInv: 'Inventaire', lShop: 'Boutique', lInbox: 'Messages', lFriends: 'Amis', lAch: 'Succès', lHome: 'Accueil', lRewind: 'Rewind',
      daily: 'Quotidiennes', weekly: 'Hebdo', ready: 'prêtes', done: 'faites', claimAll: 'Tout réclamer', claiming: 'Réclamation…', resetIn: t => `réinit. dans ${t}`,
      autoM: 'Réclamer les missions auto', autoMSub: 'récupère les missions terminées pour toi', claimed: n => `${n} récompense${n > 1 ? 's' : ''} réclamée${n > 1 ? 's' : ''}`, nothing: 'Rien à réclamer',
      loading: 'Chargement…', loadErr: 'Chargement impossible', search: 'Chercher un perso…', all: 'Tous', owned: 'Possédés', missing: 'Manquants', dupes: 'Doublons', upgradable: 'Améliorables',
      allCats: 'Toutes les catégories', showMore: n => `Afficher ${n} de plus`, lv: 'Niv', copies: 'exemplaires', collections: 'Collections', claim: 'Réclamer', claimedTag: 'réclamé',
      upgradeAll: n => `Tout améliorer (${n})`, confirmUp: 'Clique encore pour confirmer', upgraded: n => `${n} perso${n > 1 ? 's' : ''} amélioré${n > 1 ? 's' : ''}`, noMatch: 'Aucun résultat',
      achDone: 'débloqués', points: 'points', locked: 'À débloquer', unlocked: 'Débloqués',
      giftsTitle: 'Cadeaux', claimGifts: 'Réclamer les cadeaux', autoG: 'Réclamer les cadeaux auto', autoGSub: 'récupère les cadeaux joints à tes messages', reqTitle: 'Demandes d\'ami',
      accept: 'Accepter', decline: 'Refuser', latest: 'Derniers messages', openInbox: 'Ouvrir la messagerie', noReq: 'Aucune demande en attente', noGift: 'Aucun cadeau en attente',
      notifTitle: 'Poppy Tool', nMissions: n => `${n} récompense${n > 1 ? 's' : ''} de mission prête${n > 1 ? 's' : ''}`, nGifts: n => `${n} cadeau${n > 1 ? 'x' : ''} dans ta messagerie`,
      nUnread: n => `${n} nouveau${n > 1 ? 'x' : ''} message${n > 1 ? 's' : ''}`, nReq: n => `${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} d'ami`,
      endsSoon: (name, t) => `${name} se termine dans ${t} !`, endsIn: t => `fin dans ${t}`, idle: 'À jour', todo: n => `${n} à faire`,
      language: 'Langue du panneau', auto: 'Auto', theme: 'Thème clair', sound: 'Son', notify: 'Notification Windows', volume: 'Volume', accent: 'Couleur d\'accent', accentAuto: 'Par défaut',
      lootHint: 'Les réglages de l\'auto-pull sont sur la page lootbox.',
      rar: { comune: 'Commun', raro: 'Rare', epico: 'Épique', leggendario: 'Légendaire', speciale: 'Spécial', segreto: 'Secret', theone: 'The One' },
    },
    it: {
      home: 'Home', missions: 'Missioni', inventory: 'Inventario', achievements: 'Obiettivi', inbox: 'Posta', settings: 'Impostazioni',
      harvest: 'Riscuoti tutto', harvesting: 'Riscossione…', harvested: (m, g, c) => `Riscosso: ${m} missioni, ${g} regali, ${c} premi collezione`,
      nothingToCollect: 'Niente da riscuotere ora', godos: 'Godos', gems: 'Gemme', frags: 'Frammenti', collection: 'Collezione', ach: 'Obiettivi', opened: 'Casse aperte',
      toDo: 'Da fare', missionsReady: 'premi missione pronti', gifts: 'regali da riscuotere', unread: 'messaggi non letti', requests: 'richieste di amicizia',
      week: 'Ultimi 7 giorni', opens: 'aperture', pulls: 'pull', bestWeek: 'Migliori', noRuns: 'Nessuna sessione Poppy Tool questa settimana.', links: 'Scorciatoie', collRewards: 'premi collezione', eventBoxes: 'Lootbox evento',
      lLoot: 'Lootbox', lMiss: 'Missioni', lInv: 'Inventario', lShop: 'Shop', lInbox: 'Posta', lFriends: 'Amici', lAch: 'Obiettivi', lHome: 'Home', lRewind: 'Rewind',
      daily: 'Giornaliere', weekly: 'Settimanali', ready: 'pronte', done: 'fatte', claimAll: 'Riscuoti tutto', claiming: 'Riscatto…', resetIn: t => `reset tra ${t}`,
      autoM: 'Riscatto missioni auto', autoMSub: 'riscuote le missioni finite per te', nothing: 'Niente da riscuotere',
      loading: 'Caricamento…', loadErr: 'Caricamento impossibile', search: 'Cerca un personaggio…', all: 'Tutti', owned: 'Posseduti', missing: 'Mancanti', dupes: 'Doppioni', upgradable: 'Potenziabili',
      allCats: 'Tutte le categorie', lv: 'Lv', copies: 'copie', collections: 'Collezioni', claim: 'Riscuoti', claimedTag: 'riscosso',
      achDone: 'sbloccati', points: 'punti', locked: 'Da sbloccare', unlocked: 'Sbloccati',
      giftsTitle: 'Regali', claimGifts: 'Riscuoti regali', autoG: 'Riscatto regali auto', reqTitle: 'Richieste di amicizia', accept: 'Accetta', decline: 'Rifiuta',
      latest: 'Ultimi messaggi', openInbox: 'Apri la posta', idle: 'Tutto a posto', language: 'Lingua del pannello', theme: 'Tema chiaro', sound: 'Suono', notify: 'Notifica Windows',
      rar: { comune: 'Comune', raro: 'Raro', epico: 'Epico', leggendario: 'Leggendario', speciale: 'Speciale', segreto: 'Segreto', theone: 'The One' },
    },
  };
  let T;
  const setLang = () => {
    LANG = pickLang(); NL = LANG === 'fr' ? 'fr-FR' : LANG;
    T = Object.assign({}, TXT.en, TXT[LANG] || {});
    T.rar = Object.assign({}, TXT.en.rar, (TXT[LANG] || {}).rar || {});
  };
  setLang();
  const RCOL = { comune: '#9ca3af', raro: '#38bdf8', epico: '#c084fc', leggendario: '#fbbf24', speciale: '#ffffff', segreto: '#a855f7', theone: '#60a5fa' };
  const RORDER = ['theone', 'segreto', 'speciale', 'leggendario', 'epico', 'raro', 'comune'];

  // ---------------------------------------------------------------- sound + desktop notification
  let audioCtx = null;
  const unlockAudio = () => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume?.(); } catch (e) {} };
  const chime = () => {
    const s = settings(); if (s.sound === false || !audioCtx) return;
    const vol = Math.max(0, Math.min(1, (s.volume ?? 60) / 100)); if (!vol) return;
    [784, 1047].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i * 0.13;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28 * vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.55);
    });
  };
  const notify = (message) => {
    if (settings().notify !== false) window.postMessage({ __ap: true, type: 'notify', title: T.notifTitle, message }, location.origin);
    chime();
  };

  // ---------------------------------------------------------------- data
  const extractInit = html => {
    const k = html.indexOf('window.GACHA_INIT'); if (k < 0) return null;
    const i = html.indexOf('{', k); let d = 0, s = false, q = '', e = false;
    for (let j = i; j < html.length; j++) {
      const c = html[j];
      if (s) { if (e) e = false; else if (c === '\\') e = true; else if (c === q) s = false; continue; }
      if (c === '"' || c === "'") { s = true; q = c; continue; }
      if (c === '{') d++; else if (c === '}') { d--; if (!d) { try { return JSON.parse(html.slice(i, j + 1)); } catch (x) { return null; } } }
    }
    return null;
  };
  const D = { init: null, initAt: 0, missions: null, coll: null, achAll: null, achUn: null, inbox: null, friends: null, err: {} };
  const loadInit = async (force) => {
    if (window.GACHA_INIT) { D.init = window.GACHA_INIT; return D.init; }
    if (!force && D.init && Date.now() - D.initAt < 120000) return D.init;
    try { const html = await fetch(`/${SITE_LANG}/lootbox`, { credentials: 'same-origin' }).then(r => r.text()); D.init = extractInit(html) || D.init; D.initAt = Date.now(); } catch (e) {}
    return D.init;
  };
  const wallet = () => {
    const st = window.GachaUI?.getState?.();
    if (st && typeof st.soldi === 'number') return { godos: st.soldi, gems: st.godoshards };
    return { godos: D.init?.soldi, gems: D.init?.godoshards };
  };
  const pityOf = group => window.GachaUI?.getPity?.(group) || D.init?.pity?.[group] || null;
  const loadMissions = async () => { try { const j = await getJSON('/api/missions/get.php?lang=' + SITE_LANG); if (!j?.success) throw 0; D.missions = j.data; D.err.m = false; } catch (e) { D.err.m = true; } };
  const loadColl = async () => { try { const j = await getJSON('/api/gacha/collezione.php?lang=' + SITE_LANG); if (!j?.ok) throw 0; D.coll = j; D.err.c = false; } catch (e) { D.err.c = true; } };
  const loadAch = async () => { try { [D.achAll, D.achUn] = await Promise.all([getJSON('/api/get_all_achievement.php'), getJSON('/api/get_unlocked_achievement.php')]); D.err.a = false; } catch (e) { D.err.a = true; } };
  const loadInbox = async () => { try { const j = await getJSON('/api/inbox.php'); if (!j?.ok) throw 0; D.inbox = j; D.err.i = false; } catch (e) { D.err.i = true; } };
  const loadFriends = async () => { try { const j = await getJSON('/api/social/friend_requests.php'); if (!j?.success) throw 0; D.friends = j.data; } catch (e) {} };

  const mAll = () => D.missions ? [...(D.missions.daily?.missions || []), ...(D.missions.weekly?.missions || [])] : [];
  const mIsReady = m => (m.completata == 1 || m.completata === true) && !(m.riscattata == 1 || m.riscattata === true);
  const mIsClaimed = m => m.riscattata == 1 || m.riscattata === true;
  const mTarget = m => m.obiettivo ?? m.target ?? m.soglia ?? m.goal ?? m.quota ?? null;
  const giftsWaiting = () => (D.inbox?.messages || []).filter(m => Number(m.has_rewards) > 0 && Array.isArray(m.rewards) && m.rewards.length && !m.claimed_at && !Number(m.is_archived));
  const reqReceived = () => (D.friends?.received || []);
  const collClaimable = () => (D.coll?.categorie || []).filter(c => c.posseduti >= c.totale && c.totale > 0 && (Number(c.premio_godos) > 0 || c.premio_badge) && !c.riscosso);

  const claimMission = id => postJSON('/api/missions/claim.php', { user_mission_id: id });
  const claimGift = id => postJSON('/api/inbox.php', { action: 'claim_rewards', message_id: id }, false);
  const claimColl = id => postJSON('/api/gacha/azioni.php', { action: 'collezione', categoria_id: id });
  const upgradeAll = () => postJSON('/api/game/upgrade_all_characters.php', {});
  const friendAct = (what, id) => postJSON(`/api/social/${what}_friend_request.php`, { sender_id: id });

  // ---------------------------------------------------------------- mount (adds the tabs to a panel)
  function mount(ctx) {
    setLang();
    const { root } = ctx;
    const $ = s => root.querySelector(s);
    const style = document.createElement('style'); style.textContent = EXTRA_CSS; root.appendChild(style);
    const site = store.get('site', {});
    const saveSite = () => store.set('site', site);

    const TABS = [
      ['home', T.home], ['missions', T.missions], ['inventory', T.inventory], ['achievements', T.achievements], ['inbox', T.inbox],
    ];
    const toggle = (id, title, sub) => `<label class="toggle"><span class="sw"><input type="checkbox" id="${id}"><i></i></span><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></label>`;
    const PAGES = {
      home: `<div class="smsg" id="sHMsg"></div>
        <button class="go alt" id="sHarvest">${T.harvest}</button>
        <div class="tiles" id="sTiles"></div>
        <div><div class="sec"><span>${T.toDo}</span></div><div class="lines" id="sTodo"></div></div>
        <div><div class="sec"><span>${T.pity}</span></div><div class="plist" id="sPity"></div></div>
        <div><div class="sec"><span>${T.week}</span></div><div class="lines" id="sWeek"></div></div>
        <div><div class="sec"><span>${T.links}</span></div><div class="qlinks">
          ${[['lootbox', T.lLoot], ['missions', T.lMiss], ['inventario', T.lInv], ['shop', T.lShop], ['inbox', T.lInbox], ['amici', T.lFriends], ['achievements', T.lAch], ['rewind', T.lRewind], ['home', T.lHome]]
            .map(([p, l]) => `<a href="/${SITE_LANG}/${p}">${esc(l)}</a>`).join('')}</div></div>`,
      missions: `<div class="smsg" id="sMMsg"></div>
        <button class="go" id="sMClaim">${T.claimAll}</button>
        ${toggle('sAutoM', T.autoM, T.autoMSub)}
        <div id="sMList"><div class="empty">${T.loading}</div></div>`,
      inventory: `<div class="smsg" id="sIMsg"></div>
        <div class="tiles" id="sITiles"></div>
        <input class="sinput" id="sISearch" placeholder="${esc(T.search)}">
        <div class="chips" id="sIRar"></div>
        <div class="chips" id="sIMode"></div>
        <select class="sinput" id="sICat"></select>
        <div id="sIList"><div class="empty">${T.loading}</div></div>
        <div><div class="sec"><span>${T.collections}</span></div><div id="sIColl"></div></div>
        <button class="go alt" id="sIUp" hidden></button>`,
      achievements: `<div class="box"><div class="top"><span>${T.ach}</span><b id="sAN">–</b></div><div class="bar"><i id="sABar" style="width:0"></i></div><div class="sub" id="sAPts"></div></div>
        <div><div class="sec"><span>${T.locked}</span></div><div id="sALocked"><div class="empty">${T.loading}</div></div></div>
        <div><div class="sec"><span>${T.unlocked}</span></div><div id="sAUn"></div></div>`,
      inbox: `<div class="smsg" id="sGMsg"></div>
        <div><div class="sec"><span>${T.giftsTitle}</span></div><div id="sGList"></div></div>
        <button class="go" id="sGClaim">${T.claimGifts}</button>
        ${toggle('sAutoG', T.autoG, T.autoGSub)}
        <div><div class="sec"><span>${T.reqTitle}</span></div><div id="sRList"></div></div>
        <div><div class="sec"><span>${T.latest}</span><span id="sUnread"></span></div><div id="sLList"></div></div>
        <a class="chip" style="text-align:center;text-decoration:none" href="/${SITE_LANG}/inbox">${T.openInbox}</a>`,
    };
    TABS.forEach(([id, label]) => {
      const b = document.createElement('button'); b.className = 'tab'; b.dataset.tab = id;
      b.innerHTML = `${esc(label)}<span class="tbadge" id="sBadge-${id}" hidden>0</span>`;
      ctx.tabsEl.insertBefore(b, ctx.beforeTab || null);
      const p = document.createElement('div'); p.className = 'page'; p.dataset.page = id; p.hidden = true; p.innerHTML = PAGES[id];
      ctx.pagesHost.insertBefore(p, ctx.beforePage || null);
    });
    root.addEventListener('pointerdown', unlockAudio, { capture: true });

    const msg = (id, t, err) => { const e = $(id); if (!e) return; e.textContent = t || ''; e.classList.toggle('err', !!err); };
    const badge = (id, n) => { const b = $('#sBadge-' + id); if (b) { b.hidden = !n; b.textContent = n; } };

    // ---------- Home ----------
    const tile = (label, value, icon) => `<div class="tile"><b>${value}</b><span>${icon ? `<img src="${icon}" alt="">` : ''}${esc(label)}</span></div>`;
    const renderHome = () => {
      const w = wallet(), c = D.coll, un = D.achUn?.length, all = D.achAll?.length;
      $('#sTiles').innerHTML = [
        tile(T.godos, w.godos != null ? fmt(w.godos) : '–', '/img/godos.png'),
        tile(T.gems, w.gems != null ? fmt(w.gems) : '–', '/img/godoshards.png'),
        tile(T.frags, c?.frammenti ? fmt(c.frammenti.saldo) : '–'),
        tile(T.collection, c ? `${fmt(c.totali.posseduti)}/${fmt(c.totali.visibili)}` : '–'),
        tile(T.ach, all ? `${un}/${all}` : '–'),
        tile(T.opened, c ? fmt(c.totali.casse) : '–'),
      ].join('');
      const ready = mAll().filter(mIsReady).length, gifts = giftsWaiting().length, unread = D.inbox?.unread_count || 0, req = reqReceived().length, coll = collClaimable().length;
      const rows = [[ready, T.missionsReady, 'missions'], [gifts, T.gifts, 'inbox'], [coll, T.collRewards, 'inventory'], [unread, T.unread, 'inbox'], [req, T.requests, 'inbox']];
      $('#sTodo').innerHTML = rows.filter(r => r[0]).map(r => `<div><span>${esc(r[1])}</span><b>${fmt(r[0])}</b></div>`).join('') || `<div class="empty" style="justify-content:center">${T.idle} ✓</div>`;
      // pity of every lootbox
      const banners = (D.init?.banners || []);
      // banners sharing one pity counter (all event lootboxes) are shown as one row
      const groups = [];
      banners.forEach(b => { const g = groups.find(x => x.key === b.pity_gruppo && b.pity?.condiviso); if (g) g.list.push(b); else groups.push({ key: b.pity_gruppo, list: [b] }); });
      $('#sPity').innerHTML = groups.length ? groups.map(({ list }) => {
        const b = list[0], p = pityOf(b.pity_gruppo) || {}, cur = p.contatore ?? b.pity?.contatore ?? 0, hard = b.pity?.hard || 90;
        const ends = list.map(x => x.data_fine ? Date.parse(x.data_fine) - Date.now() : null).filter(x => x > 0);
        const end = ends.length ? Math.min(...ends) : null;
        const title = list.length > 1 ? `${T.eventBoxes} ×${list.length}` : b.nome;
        return `<div class="prow" title="${esc(list.map(x => x.nome).join('\n'))}"><span class="pn">${esc(title)}${end != null && end > 0 ? ` <span class="p" style="color:var(--muted);font-size:10px">· ${T.endsIn(fmtLeft(end))}</span>` : ''}</span>
          <span class="pv">${fmt(cur)}/${fmt(hard)}</span><div class="bar"><i style="width:${Math.min(100, cur / hard * 100)}%"></i></div></div>`;
      }).join('') : `<div class="empty">${T.loading}</div>`;
      // last 7 days of Poppy Tool sessions
      const since = Date.now() - 7 * 86400000, hist = store.get('history', []).filter(h => h.date >= since);
      if (!hist.length) $('#sWeek').innerHTML = `<div class="empty" style="justify-content:center">${T.noRuns}</div>`;
      else {
        const opens = hist.reduce((s, h) => s + (h.opens || 0), 0), pulls = hist.reduce((s, h) => s + (h.pulls || 0), 0);
        const counts = {}; hist.forEach(h => Object.entries(h.counts || {}).forEach(([k, v]) => counts[k] = (counts[k] || 0) + v));
        const rare = RORDER.slice(0, 3).filter(k => counts[k]).map(k => `${counts[k]} ${T.rar[k]}`).join(' · ');
        const best = hist.flatMap(h => h.best || []).sort((a, b) => RORDER.indexOf(a.rarity) - RORDER.indexOf(b.rarity)).slice(0, 3).map(b => b.name).join(', ');
        $('#sWeek').innerHTML = `<div><span>${fmt(opens)} ${T.opens} · ${fmt(pulls)} ${T.pulls}</span><b>${esc(rare || '—')}</b></div>` + (best ? `<div><span>${T.bestWeek}</span><b>${esc(best)}</b></div>` : '');
      }
    };
    $('#sHarvest').onclick = async () => {
      unlockAudio();
      const btn = $('#sHarvest'); btn.disabled = true; btn.textContent = T.harvesting; msg('#sHMsg', '');
      await Promise.all([loadMissions(), loadInbox(), loadColl()]);
      let m = 0, g = 0, c = 0, err = '';
      for (const x of mAll().filter(mIsReady)) { try { await claimMission(x.user_mission_id); x.riscattata = 1; m++; await sleep(350); } catch (e) { err = e.message; break; } }
      for (const x of giftsWaiting()) { try { await claimGift(x.message_id); x.claimed_at = 'now'; g++; await sleep(350); } catch (e) { err = e.message; break; } }
      for (const x of collClaimable()) { try { await claimColl(x.id); x.riscosso = true; c++; await sleep(350); } catch (e) { err = e.message; break; } }
      msg('#sHMsg', m + g + c ? T.harvested(m, g, c) : (err || T.nothingToCollect), !!err && !(m + g + c));
      btn.disabled = false; btn.textContent = T.harvest;
      await refreshAll(true);
    };

    // ---------- Missions ----------
    $('#sAutoM').checked = !!site.autoM;
    $('#sAutoM').onchange = () => { site.autoM = $('#sAutoM').checked; saveSite(); if (site.autoM) poll(); };
    const renderMissions = () => {
      const ready = mAll().filter(mIsReady).length;
      $('#sMClaim').disabled = !ready || claimingM;
      if (D.err.m && !D.missions) { $('#sMList').innerHTML = `<div class="empty">${T.loadErr}</div>`; return; }
      if (!D.missions) return;
      const section = (key, label) => {
        const g = D.missions[key]; if (!g?.missions?.length) return '';
        const done = g.missions.filter(mIsClaimed).length;
        const reset = g.reset_at ? ` · ${T.resetIn(fmtLeft(g.reset_at * 1000 - Date.now()))}` : '';
        return `<div class="sec"><span>${label}</span><span>${done}/${g.missions.length} ${T.done}${reset}</span></div>` + g.missions.map(m => {
          const tg = mTarget(m), r = mIsReady(m), cl = mIsClaimed(m);
          const pct = tg ? Math.min(100, Math.round((m.progresso || 0) / tg * 100)) : (cl || m.completata == 1 ? 100 : 0);
          return `<div class="m ${r ? 'ready' : ''}"><div class="mi"><div class="mt">${esc(m.titolo || m.slug || '?')}</div>
            <div class="mp">${tg != null ? `${fmt(m.progresso || 0)}/${fmt(tg)}` : esc(m.descrizione || '')}</div><div class="mbar"><i style="width:${pct}%"></i></div></div>
            ${r ? `<span class="mtag r">${T.ready}</span>` : cl ? '<span class="mtag ok">✓</span>' : ''}</div>`;
        }).join('');
      };
      $('#sMList').innerHTML = section('daily', T.daily) + section('weekly', T.weekly) || `<div class="empty">${T.nothing}</div>`;
    };
    let claimingM = false;
    const claimMissions = async () => {
      if (claimingM) return; claimingM = true; renderMissions();
      $('#sMClaim').textContent = T.claiming;
      let ok = 0, err = '';
      for (const m of mAll().filter(mIsReady)) { try { await claimMission(m.user_mission_id); m.riscattata = 1; ok++; renderMissions(); await sleep(400); } catch (e) { err = e.message; break; } }
      msg('#sMMsg', ok ? T.claimed(ok) : (err || T.nothing), !!err && !ok);
      claimingM = false; $('#sMClaim').textContent = T.claimAll;
      await loadMissions(); renderAll();
    };
    $('#sMClaim').onclick = claimMissions;

    // ---------- Inventory ----------
    const inv = { q: '', rar: new Set(), mode: 'all', cat: '', shown: 60 };
    const renderInvControls = () => {
      $('#sIRar').innerHTML = RORDER.map(k => `<button class="chip${inv.rar.has(k) ? ' on' : ''}" data-r="${k}"><i style="background:${RCOL[k]}"></i>${esc(T.rar[k])}</button>`).join('');
      $('#sIMode').innerHTML = [['all', T.all], ['owned', T.owned], ['missing', T.missing], ['dupes', T.dupes], ['up', T.upgradable]]
        .map(([k, l]) => `<button class="chip${inv.mode === k ? ' on' : ''}" data-mo="${k}">${esc(l)}</button>`).join('');
      root.querySelectorAll('#sIRar [data-r]').forEach(b => b.onclick = () => { const k = b.dataset.r; inv.rar.has(k) ? inv.rar.delete(k) : inv.rar.add(k); inv.shown = 60; renderInv(); });
      root.querySelectorAll('#sIMode [data-mo]').forEach(b => b.onclick = () => { inv.mode = b.dataset.mo; inv.shown = 60; renderInv(); });
    };
    $('#sISearch').oninput = () => { inv.q = $('#sISearch').value.trim().toLowerCase(); inv.shown = 60; renderInv(); };
    $('#sICat').onchange = () => { inv.cat = $('#sICat').value; inv.shown = 60; renderInv(); };
    let upArmed = 0;
    const renderInv = () => {
      renderInvControls();
      const c = D.coll;
      if (!c) { $('#sIList').innerHTML = `<div class="empty">${D.err.c ? T.loadErr : T.loading}</div>`; return; }
      const t = c.totali;
      $('#sITiles').innerHTML = [tile(T.owned, `${fmt(t.posseduti)}/${fmt(t.visibili)}`), tile(T.dupes, fmt(t.duplicati)), tile(T.frags, fmt(c.frammenti?.saldo))].join('');
      if (!$('#sICat').options.length) $('#sICat').innerHTML = `<option value="">${esc(T.allCats)}</option>` + (c.categorie || []).map(k => `<option value="${esc(k.slug)}">${esc(k.label || k.nome)}</option>`).join('');
      let list = (c.personaggi || []).filter(p => {
        if (inv.rar.size && !inv.rar.has(p.rarita)) return false;
        if (inv.cat && p.categoria !== inv.cat) return false;
        if (inv.mode === 'owned' && !p.posseduto) return false;
        if (inv.mode === 'missing' && p.posseduto) return false;
        if (inv.mode === 'dupes' && !(p.quantita > 1)) return false;
        if (inv.mode === 'up' && !p.potenziabile) return false;
        if (inv.q && !(p.nome || '').toLowerCase().includes(inv.q)) return false;
        return true;
      });
      list.sort(inv.mode === 'dupes' ? (a, b) => (b.quantita || 0) - (a.quantita || 0) : (a, b) => (RORDER.indexOf(a.rarita) - RORDER.indexOf(b.rarita)) || String(a.nome).localeCompare(b.nome));
      const shown = list.slice(0, inv.shown);
      $('#sIList').innerHTML = shown.length ? shown.map(p => {
        const hidden = p.mascherato && !p.posseduto;
        return `<div class="m" style="border-left-color:${RCOL[p.rarita] || 'transparent'};${p.posseduto ? '' : 'opacity:.55'}">
          ${p.img && !hidden ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : '<img alt="">'}
          <div class="mi"><div class="mt">${esc(hidden ? '???' : p.nome)}</div><div class="mp">${esc(T.rar[p.rarita] || p.rarita)}${p.potenziabile ? ' · ⬆' : ''}</div></div>
          ${p.posseduto ? `<div class="mx"><b>×${fmt(p.quantita)}</b><br>${T.lv} ${fmt(p.livello)}</div>` : ''}</div>`;
      }).join('') + (list.length > inv.shown ? `<button class="chip more" id="sIMore">${T.showMore(Math.min(60, list.length - inv.shown))}</button>` : '')
        : `<div class="empty">${T.noMatch}</div>`;
      const more = $('#sIMore'); if (more) more.onclick = () => { inv.shown += 60; renderInv(); };
      // collections + their rewards
      $('#sIColl').innerHTML = (c.categorie || []).map(k => {
        const pct = k.totale ? Math.round(k.posseduti / k.totale * 100) : 0, claimable = collClaimable().some(x => x.id === k.id);
        const reward = Number(k.premio_godos) > 0 ? `+${fmt(k.premio_godos)} ${T.godos}` : k.premio_badge ? 'badge' : '';
        return `<div class="m${claimable ? ' ready' : ''}"><div class="mi"><div class="mt">${esc(k.label || k.nome)}</div>
          <div class="mp">${fmt(k.posseduti)}/${fmt(k.totale)}${reward ? ` · ${esc(reward)}` : ''}</div><div class="mbar"><i style="width:${pct}%;background:${esc(k.colore || 'var(--accent)')}"></i></div></div>
          ${claimable ? `<button class="mbtn" data-cl="${k.id}">${T.claim}</button>` : k.riscosso ? `<span class="mtag ok">${T.claimedTag}</span>` : ''}</div>`;
      }).join('');
      root.querySelectorAll('#sIColl [data-cl]').forEach(b => b.onclick = async () => {
        b.disabled = true;
        try { await claimColl(+b.dataset.cl); msg('#sIMsg', T.claimed(1)); } catch (e) { msg('#sIMsg', e.message, true); }
        await loadColl(); renderAll();
      });
      // the inventory's own "upgrade all"
      const nUp = t.potenziabili || 0, up = $('#sIUp');
      up.hidden = !nUp;
      if (!upArmed) { up.textContent = T.upgradeAll(nUp); up.classList.remove('warn'); }
    };
    $('#sIUp').onclick = async () => {
      const up = $('#sIUp');
      if (!upArmed) { upArmed = setTimeout(() => { upArmed = 0; renderInv(); }, 4000); up.textContent = T.confirmUp; up.classList.add('warn'); return; }
      clearTimeout(upArmed); upArmed = 0; up.disabled = true;
      try { const r = await upgradeAll(); msg('#sIMsg', T.upgraded(Number(r.upgraded_count || 0))); } catch (e) { msg('#sIMsg', e.message, true); }
      up.disabled = false; await loadColl(); renderAll();
    };

    // ---------- Achievements ----------
    const renderAch = () => {
      if (!D.achAll) { $('#sALocked').innerHTML = `<div class="empty">${D.err.a ? T.loadErr : T.loading}</div>`; return; }
      const unIds = new Set((D.achUn || []).map(a => a.id));
      const name = a => LANG === 'it' ? a.nome : (a.nome_en || a.nome), desc = a => LANG === 'it' ? a.descrizione : (a.descrizione_en || a.descrizione);
      const tot = D.achAll.length, un = unIds.size;
      const ptsAll = D.achAll.reduce((s, a) => s + (a.punti || 0), 0), ptsUn = D.achAll.filter(a => unIds.has(a.id)).reduce((s, a) => s + (a.punti || 0), 0);
      $('#sAN').textContent = `${un}/${tot} ${T.achDone}`;
      $('#sABar').style.width = (tot ? un / tot * 100 : 0) + '%';
      $('#sAPts').textContent = `${fmt(ptsUn)} / ${fmt(ptsAll)} ${T.points}`;
      const row = (a, done) => `<div class="m${done ? '' : ''}" style="${done ? '' : 'opacity:.85'}"><div class="mi"><div class="mt">${esc(name(a))}</div><div class="mp">${esc(desc(a))}</div></div>
        <span class="mtag ${done ? 'ok' : 'r'}">${fmt(a.punti)} pts</span></div>`;
      const locked = D.achAll.filter(a => !unIds.has(a.id)).sort((a, b) => (a.punti || 0) - (b.punti || 0));
      $('#sALocked').innerHTML = locked.map(a => row(a, false)).join('') || '<div class="empty">✓</div>';
      $('#sAUn').innerHTML = D.achAll.filter(a => unIds.has(a.id)).map(a => row(a, true)).join('');
    };

    // ---------- Inbox ----------
    $('#sAutoG').checked = !!site.autoG;
    $('#sAutoG').onchange = () => { site.autoG = $('#sAutoG').checked; saveSite(); if (site.autoG) poll(); };
    const rewardLabel = r => {
      const v = fmt(r.reward_value);
      return { points: `${v} ${T.godos}`, godoshards: `${v} ${T.gems}`, badge: 'badge', premium: 'premium' }[r.reward_type] || `${r.reward_type} ${v}`;
    };
    const renderInbox = () => {
      const g = giftsWaiting();
      $('#sGList').innerHTML = g.length ? g.map(m => `<div class="m ready"><div class="mi"><div class="mt">${esc(LANG === 'it' ? m.title_it : (m.title_en || m.title_it))}</div>
          <div class="mp">${esc(m.rewards.map(rewardLabel).join(' + '))}</div></div></div>`).join('') : `<div class="empty">${T.noGift}</div>`;
      $('#sGClaim').disabled = !g.length || claimingG;
      const req = reqReceived();
      $('#sRList').innerHTML = req.length ? req.map(r => {
        const id = r.sender_id ?? r.id ?? r.user_id, nm = r.username ?? r.nome ?? r.display_name ?? r.name ?? ('#' + id);
        return `<div class="m"><div class="mi"><div class="mt">${esc(nm)}</div></div>
          <button class="mbtn" data-acc="${esc(id)}">${T.accept}</button><button class="mbtn dim" data-dec="${esc(id)}">${T.decline}</button></div>`;
      }).join('') : `<div class="empty">${T.noReq}</div>`;
      root.querySelectorAll('#sRList [data-acc], #sRList [data-dec]').forEach(b => b.onclick = async () => {
        b.disabled = true;
        try { await friendAct(b.dataset.acc ? 'accept' : 'decline', +(b.dataset.acc || b.dataset.dec)); } catch (e) { msg('#sGMsg', e.message, true); }
        await loadFriends(); renderAll();
      });
      const msgs = (D.inbox?.messages || []).filter(m => !Number(m.is_archived)).slice(0, 8);
      $('#sUnread').textContent = D.inbox?.unread_count ? `${D.inbox.unread_count} ${T.unread}` : '';
      $('#sLList').innerHTML = msgs.map(m => `<div class="m${Number(m.is_read) ? '' : ' ready'}"><div class="mi"><div class="mt">${esc(LANG === 'it' ? m.title_it : (m.title_en || m.title_it))}</div>
        <div class="mp">${esc(new Date((m.created_at || '').replace(' ', 'T')).toLocaleDateString(NL))}${Number(m.has_rewards) ? ' · 🎁' : ''}</div></div></div>`).join('') || `<div class="empty">${T.loading}</div>`;
    };
    let claimingG = false;
    const claimGifts = async () => {
      if (claimingG) return; claimingG = true; renderInbox();
      let ok = 0, err = '';
      for (const m of giftsWaiting()) { try { await claimGift(m.message_id); m.claimed_at = 'now'; ok++; await sleep(400); } catch (e) { err = e.message; break; } }
      msg('#sGMsg', ok ? T.claimed(ok) : (err || T.nothing), !!err && !ok);
      claimingG = false; await loadInbox(); renderAll();
    };
    $('#sGClaim').onclick = claimGifts;

    // ---------- badges, polling, alerts ----------
    const counts = () => ({ m: mAll().filter(mIsReady).length, g: giftsWaiting().length, u: D.inbox?.unread_count || 0, r: reqReceived().length, c: collClaimable().length });
    const renderBadges = () => {
      const c = counts();
      badge('missions', c.m); badge('inbox', c.g + c.u + c.r); badge('inventory', c.c); badge('home', c.m + c.g + c.r + c.c);
      ctx.onCount?.(c.m + c.g + c.u + c.r + c.c);
    };
    const renderAll = () => { renderBadges(); renderHome(); renderMissions(); renderInv(); renderAch(); renderInbox(); };
    let prev = null;
    const alertChanges = () => {
      const c = counts();
      if (prev) {
        if (c.m > prev.m) notify(T.nMissions(c.m));
        if (c.g > prev.g) notify(T.nGifts(c.g));
        if (c.u > prev.u) notify(T.nUnread(c.u));
        if (c.r > prev.r) notify(T.nReq(c.r));
      }
      prev = c;
    };
    const poll = async () => {
      await Promise.all([loadMissions(), loadInbox(), loadFriends()]);
      alertChanges(); renderAll();
      if (site.autoM && mAll().some(mIsReady)) claimMissions();
      if (site.autoG && giftsWaiting().length) claimGifts();
    };
    const refreshAll = async (force) => {
      await Promise.all([loadInit(force), loadMissions(), loadInbox(), loadFriends(), loadColl(), loadAch()]);
      if (!prev) alertChanges();
      renderAll();
    };
    // event-end warning (once a day per lootbox; the lootbox page does its own)
    const endWarnings = () => {
      if (IS_LOOT) return;
      (D.init?.banners || []).forEach(b => {
        const left = b.data_fine ? Date.parse(b.data_fine) - Date.now() : null;
        if (left > 0 && left < 86400000 && store.get('endwarn-' + b.id) !== today()) { store.set('endwarn-' + b.id, today()); notify(T.endsSoon(b.nome, fmtLeft(left))); }
      });
    };
    refreshAll().then(endWarnings);
    const timer = setInterval(poll, 120000);
    const slow = setInterval(() => { loadInit(true); loadColl(); loadAch(); }, 600000);

    return {
      ids: TABS.map(t => t[0]),
      onShow: id => {
        if (id === 'home') { loadInit(true).then(renderHome); renderHome(); }
        if (id === 'inventory' || id === 'achievements' || id === 'inbox' || id === 'missions') renderAll();
      },
      refresh: () => refreshAll(true),
      stop: () => { clearInterval(timer); clearInterval(slow); },
    };
  }

  // ---------------------------------------------------------------- the panel on every non-lootbox page
  function buildShell() {
    if (document.getElementById('ap-host')) return;
    const host = document.createElement('div'); host.id = 'ap-host';
    host.style.cssText = 'position:fixed;z-index:2147483647';
    ['keydown', 'keyup', 'keypress'].forEach(t => host.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const s = settings();
    const accent = s.accent && s.accent !== 'auto' ? s.accent : '#2f9df4';
    const textOn = hex => { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? '#0b0f1a' : '#ffffff'; };
    const toggle = (id, title, sub) => `<label class="toggle"><span class="sw"><input type="checkbox" id="${id}"><i></i></span><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></label>`;
    const ACCENTS = ['#2f9df4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
    root.innerHTML = `<style>${PANEL_CSS}</style>
<div class="ghost" id="ghost"></div>
<div class="panel${s.light ? ' light' : ''}" id="panel" style="--accent:${accent};--on-accent:${textOn(accent)}">
  <div class="head">
    <div class="logo" id="logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.5l7.1-.6z"/></svg></div>
    <div><div class="title">Poppy Tool</div><div class="by">by Rcf</div></div>
    <div class="pill" id="pill"><span class="dot"></span><span id="state">${T.idle}</span></div>
    <button class="icon-btn" id="min" title="–"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path id="minpath" d="M5 12h14"/></svg></button>
  </div>
  <div class="tabs" id="tabs"><button class="tab" data-tab="ssettings">${T.settings}</button></div>
  <div id="pages">
    <div class="page" data-page="ssettings" hidden>
      <label class="f">${T.language}<select id="lang"><option value="auto">${T.auto}</option><option value="fr">Français</option><option value="en">English</option><option value="it">Italiano</option></select></label>
      ${toggle('sound', T.sound)}
      <label class="f">${T.volume}<input type="range" id="volume" min="0" max="100" step="5"></label>
      ${toggle('notify', T.notify)}${toggle('light', T.theme)}
      <label class="f">${T.accent}<div class="swatches" id="swatches"></div></label>
      <div class="note">${T.lootHint}</div>
    </div>
  </div>
</div>`;
    const $ = q => root.querySelector(q);
    const panel = $('#panel');
    const mod = mount({ root, tabsEl: $('#tabs'), beforeTab: $('[data-tab="ssettings"]'), pagesHost: $('#pages'), beforePage: $('[data-page="ssettings"]'),
      onCount: n => { $('#state').textContent = n ? T.todo(n) : T.idle; $('#pill').className = 'pill' + (n ? ' found' : ''); } });

    // settings (shared with the lootbox panel)
    const setS = (k, v) => { const all = settings(); all[k] = v; store.set('settings', all); };
    $('#lang').value = s.lang || 'auto';
    $('#lang').onchange = () => { setS('lang', $('#lang').value); mod.stop(); host.remove(); window.__apSite = null; location.reload(); };
    $('#sound').checked = s.sound !== false; $('#sound').onchange = () => setS('sound', $('#sound').checked);
    $('#notify').checked = s.notify !== false; $('#notify').onchange = () => setS('notify', $('#notify').checked);
    $('#light').checked = !!s.light; $('#light').onchange = () => { setS('light', $('#light').checked); panel.classList.toggle('light', $('#light').checked); };
    $('#volume').value = s.volume ?? 60; $('#volume').oninput = () => setS('volume', +$('#volume').value); $('#volume').onchange = () => { unlockAudio(); chime(); };
    $('#swatches').innerHTML = `<button class="swatch auto" data-a="auto" title="${esc(T.accentAuto)}"><span>A</span></button>` + ACCENTS.map(c => `<button class="swatch" data-a="${c}" style="background:${c}"></button>`).join('');
    const paintSw = () => root.querySelectorAll('.swatch').forEach(b => b.classList.toggle('sel', b.dataset.a === (settings().accent || 'auto')));
    root.querySelectorAll('.swatch').forEach(b => b.onclick = () => {
      setS('accent', b.dataset.a); paintSw();
      const a = b.dataset.a === 'auto' ? '#2f9df4' : b.dataset.a;
      [panel, $('#ghost')].forEach(el => { el.style.setProperty('--accent', a); el.style.setProperty('--on-accent', textOn(a)); });
    });
    paintSw();

    // tabs
    const showTab = t => {
      root.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
      root.querySelectorAll('.page').forEach(p => { p.hidden = p.dataset.page !== t; });
      root.querySelector(`.tab[data-tab="${t}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      store.set('sitetab', t);
      mod.onShow(t);
    };
    root.querySelectorAll('.tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));
    const startTab = store.get('sitetab', 'home');
    showTab([...mod.ids, 'ssettings'].includes(startTab) ? startTab : 'home');

    // icon, minimise, drag + corner snap (same storage as the lootbox panel)
    const setIcon = () => { const u = document.documentElement.dataset.apIcon; if (u && !$('#logo img')) { const i = new Image(); i.onload = () => { $('#logo').replaceChildren(i); $('#logo').classList.add('has-img'); }; i.src = u; } };
    setIcon(); new MutationObserver(setIcon).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ap-icon'] });
    const setMin = m => { panel.classList.toggle('min', m); $('#minpath').setAttribute('d', m ? 'M5 12h14M12 5v14' : 'M5 12h14'); store.set('min', m); };
    $('#min').onclick = () => setMin(!panel.classList.contains('min'));
    setMin(!!store.get('min', false));
    const MARGIN = 16;
    let corner = ['br', 'bl', 'tr', 'tl'].includes(store.get('corner')) ? store.get('corner') : 'br';
    const placeAt = c => { host.style.transition = ''; host.style.left = host.style.top = host.style.right = host.style.bottom = '';
      host.style[c[0] === 't' ? 'top' : 'bottom'] = MARGIN + 'px'; host.style[c[1] === 'l' ? 'left' : 'right'] = MARGIN + 'px'; };
    const cornerXY = (c, w, h) => ({ x: c[1] === 'l' ? MARGIN : innerWidth - w - MARGIN, y: c[0] === 't' ? MARGIN : innerHeight - h - MARGIN });
    const nearest = (px, py) => (py < innerHeight / 2 ? 't' : 'b') + (px < innerWidth / 2 ? 'l' : 'r');
    placeAt(corner);
    let drag = null; const head = $('.head');
    head.addEventListener('pointerdown', e => { if (e.button !== 0 || e.target.closest('button')) return; const r = host.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, moved: false }; head.setPointerCapture(e.pointerId); e.preventDefault(); });
    head.addEventListener('pointermove', e => { if (!drag) return;
      if (!drag.moved) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return; drag.moved = true; panel.classList.add('dragging'); }
      const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - drag.w), y = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - drag.h);
      host.style.right = host.style.bottom = ''; host.style.left = x + 'px'; host.style.top = y + 'px'; drag.px = e.clientX; drag.py = e.clientY;
      const p = cornerXY(nearest(e.clientX, e.clientY), drag.w, drag.h), g = $('#ghost');
      Object.assign(g.style, { left: p.x + 'px', top: p.y + 'px', width: drag.w + 'px', height: drag.h + 'px' }); g.classList.add('on'); });
    const endDrag = () => { if (!drag) return; const d = drag; drag = null; $('#ghost').classList.remove('on'); panel.classList.remove('dragging'); if (!d.moved) return;
      const r = host.getBoundingClientRect(); corner = nearest(d.px, d.py); store.set('corner', corner); const p = cornerXY(corner, r.width, r.height);
      host.style.transition = 'left .22s cubic-bezier(.2,.8,.2,1), top .22s cubic-bezier(.2,.8,.2,1)'; host.style.left = p.x + 'px'; host.style.top = p.y + 'px';
      setTimeout(() => placeAt(corner), 240); };
    head.addEventListener('pointerup', endDrag); head.addEventListener('pointercancel', endDrag);
  }

  window.__apSite = { mount, css: EXTRA_CSS };
  if (!IS_LOOT) {
    const go = () => { if (document.querySelector('meta[name="csrf-token"]') || document.querySelector('nav, .cnav, header')) buildShell(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true }); else go();
  }
})();
