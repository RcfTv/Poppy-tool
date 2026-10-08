<div align="center">

<img src="icons/icon128.png" width="96" alt="Poppy Tool icon">

# Poppy Tool

**A Chrome extension for [Cripsum](https://cripsum.com): one widget on every page that opens lootboxes for you, and keeps your missions, inventory, achievements and inbox one click away.**

Pick a lootbox and a stop target, press Start, and Poppy Tool pulls until it gets what you want. Then "Collect everything" claims every reward you have earned in one click.

[![Release](https://img.shields.io/github/v/release/RcfTv/Poppy-tool?color=0A84FF&label=release)](https://github.com/RcfTv/Poppy-tool/releases/latest)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)
![Languages](https://img.shields.io/badge/panel-FR%20%7C%20EN%20%7C%20IT-black)
![By Rcf](https://img.shields.io/badge/by-Rcf-F05138)

</div>

---

## Why

Opening lootboxes one by one on Cripsum takes forever, and the rewards you earn are scattered across half a dozen pages.
**Poppy Tool puts it all in one panel.** It only clicks the site's own buttons and only collects rewards you have already earned (see [Safety](#safety)).

Poppy Tool was called **Auto Pull** until version 5.0.0.

## Features

### One widget, every page

The Poppy Tool panel shows on every Cripsum page. On the lootbox page it has all the pull tabs; everywhere else it keeps the whole-site tabs (Home, Missions, Inventory, Achievements, Inbox). Position, size, theme and language are shared between pages.

### The panel

Bottom-right by default, works in any language of the site.

- 🖱️ **Drag it by its top bar**: it snaps to a corner. "-" minimises it, the arrows = Compact mode.
- ⌨️ **Alt+P** = Start / Stop.
- 🌍 **French, English or Italian**: the panel speaks all three (Settings > Look).
- 🔎 **Searchable dropdowns**: every dropdown (lootbox, stop target, etc.) is searchable. Click it and type to filter, handy for the 200-character lists.

| Tab | What's inside |
|---|---|
| **Pull** | lootbox, stop target (rarity, specific character, NEW character), Endless mode, max opens, spend gems, pity bar, 50/50 tracker (event lootboxes), time left before an event ends, free pulls left, session counters, best pulls, Godos -> Gems |
| **Queue** | a list of lootboxes run one after the other (0 opens = until it can't open), optionally repeated |
| **Stats** | luck vs. the odds, Special+ drops chart, pulls-between-drops chart, collection progress + missing characters, most duplicated characters |
| **History** | every session (last 100) + CSV export of the history or of the current session |
| **Home** | dashboard: Godos, gems, fragments, collection, achievements, boxes opened; a "to do" list (mission rewards, gifts, collection rewards, unread messages, friend requests); the pity of every lootbox (shared event pity grouped, with time left); your last 7 days of Poppy Tool; shortcuts to every page. **"Collect everything"** claims, in one click, every reward you have earned: finished missions, inbox gifts and completed collections |
| **Missions** | daily & weekly missions with progress; "Claim all"; opt-in auto-claim |
| **Inventory** | your characters with search, rarity / category filters, Owned / Missing / Duplicates / Upgradable; collections with their reward and a Claim button; the inventory's own "Upgrade all" (asks for a second click to confirm) |
| **Achievements** | unlocked / total, points, what's still locked (easiest first) |
| **Inbox** | gifts waiting (Claim / opt-in auto-claim), friend requests (Accept / Decline), latest messages |
| **Settings** | stop after X minutes / at a time, gem floor, daily budget in Godos, free pulls first, auto-refill gems from Godos (with a Godos reserve), auto-pick the rate-up, pull speed (Slow / Normal / Fast), auto-resume, anti-freeze, alerts (rarity, sound + volume, Windows notification, tab title, free-pull reminder), panel language, accent colour, theme |

🔔 **Badges and alerts**: badges on the tabs show what's waiting, and you get an alert (sound + Windows notification) when a mission reward, a gift, a message or a friend request arrives, or when an event lootbox ends within 24h, on any page of the site.

### Toolbar button

Click the Poppy Tool icon from any tab: status, counters, best drop, Start/Stop, go to the tab. A "▶" badge shows while it's running.

### Long runs

- 🔁 **Auto-resume**: if the page reloads or crashes, the session continues where it was (within 20 minutes).
- 🧊 **Anti-freeze**: if nothing happens for 2 minutes, the page reloads and resumes. If the whole tab stops answering for 3 minutes, the extension reloads it.
- ⏱️ **Background timers**: timers run in a background worker, so a tab in the background keeps its pace.

## Safety

- It only clicks the site's own buttons, one 10x (or 1x for the last free pulls) at a time.
- Paid lootboxes are refused unless "Spend gems" is on.
- Godos are only converted by you, or by Auto-refill (never below your reserve, never above your daily budget).
- Every claim goes through the site's own endpoints and only collects rewards you have already earned.
- It never accepts the site's own "convert to complete the pull" popup: it stops.

## Releases

Every version is on the [Releases page](https://github.com/RcfTv/Poppy-tool/releases) with its notes and a ready-to-install `.zip`. Full notes: [CHANGELOG.md](CHANGELOG.md).

| Release | Highlights | Download |
|---------|------------|----------|
| [**5.0.3**](https://github.com/RcfTv/Poppy-tool/releases/tag/v5.0.3) (latest) | Scrollbars styled to match the panel | [poppy-tool-v5.0.3.zip](https://github.com/RcfTv/Poppy-tool/releases/download/v5.0.3/poppy-tool-v5.0.3.zip) |
| [5.0.2](https://github.com/RcfTv/Poppy-tool/releases/tag/v5.0.2) | Compatibility with the updated Cripsum lootbox page | [poppy-tool-v5.0.2.zip](https://github.com/RcfTv/Poppy-tool/releases/download/v5.0.2/poppy-tool-v5.0.2.zip) |
| [5.0.1](https://github.com/RcfTv/Poppy-tool/releases/tag/v5.0.1) | First version on GitHub | [poppy-tool-v5.0.1.zip](https://github.com/RcfTv/Poppy-tool/releases/download/v5.0.1/poppy-tool-v5.0.1.zip) |
| ≤ 5.0.0 | Released as **Auto Pull** (not on GitHub) | — |

## Install

Takes about a minute.

1. Get the extension: download `poppy-tool-vX.Y.Z.zip` from the [latest release](https://github.com/RcfTv/Poppy-tool/releases/latest) and unzip it somewhere you'll keep it (e.g. Documents), or clone it:
   ```bash
   git clone https://github.com/RcfTv/Poppy-tool.git
   ```
2. In Chrome, go to `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `poppy-tool` folder (`Poppy-tool` if you cloned it; the one with `manifest.json`).
4. Pin it: puzzle icon in Chrome's toolbar > pin **Poppy Tool**.

Coming from Auto Pull? Remove the old "Auto Pull" extension first: your settings and history are kept.

To update, download the [latest release](https://github.com/RcfTv/Poppy-tool/releases/latest) and replace the folder (or `git pull`), then click the reload arrow on Poppy Tool in `chrome://extensions`.

## Project structure

```text
Poppy-tool/
├── manifest.json              Manifest V3: permissions, scripts, icons
├── icons/                     extension icon in 16, 48 and 128 px
└── src/
    ├── background/
    │   └── background.js      service worker: notifications, per-tab state, anti-freeze alarm
    ├── content/
    │   ├── bridge.js          isolated world, document_start: relay between the page and the extension
    │   ├── site-modules.js    MAIN world: whole-site tabs (Home, Missions, Inventory, Achievements, Inbox)
    │   └── content.js         MAIN world: the panel and all the pull logic (lootbox page)
    └── popup/
        ├── popup.html         toolbar popup
        └── popup.js
```

`site-modules.js` must load before `content.js`; the manifest keeps that order.

## Credits

Built by **Rcf** with Claude Code.
Poppy Tool is an independent fan-made extension, not affiliated with Cripsum.
