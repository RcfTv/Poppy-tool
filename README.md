# Poppy tool

```text
POPPY TOOL - Chrome extension by Rcf  (v5.0.2)

INSTALL (1 minute)
  1. Unzip this folder somewhere you'll keep it (e.g. Documents).
  2. In Chrome, go to  chrome://extensions  and turn on "Developer mode".
  3. Click "Load unpacked" and choose the  poppy-tool  folder (the one with manifest.json).
  4. Pin it: puzzle icon in Chrome's toolbar > pin "Poppy Tool".
     (Coming from Auto Pull? Remove the old "Auto Pull" extension first: your settings and history are kept.)

ONE WIDGET, EVERY PAGE
  The Poppy Tool panel now shows on every Cripsum page. On the lootbox page it has all the
  pull tabs; everywhere else it keeps the whole-site tabs (Home, Missions, Inventory,
  Achievements, Inbox). Position, size, theme and language are shared between pages.

THE PANEL (bottom-right by default, any language of the site)
  Drag it by its top bar: it snaps to a corner. "-" minimises it, the arrows = Compact mode.
  Alt+P = Start / Stop. The panel speaks French, English or Italian (Settings > Look).

  PULL       lootbox, stop target (rarity, specific character, NEW character), Endless mode,
             max opens, spend gems, pity bar, 50/50 tracker (event lootboxes), time left
             before an event ends, free pulls left, session counters, best pulls, Godos -> Gems.
  QUEUE      a list of lootboxes run one after the other (0 opens = until it can't open),
             optionally repeated.
  STATS      luck vs. the odds, Special+ drops chart, pulls-between-drops chart,
             collection progress + missing characters, most duplicated characters.
  HISTORY    every session (last 100) + CSV export of the history or of the current session.
  HOME       dashboard: Godos, gems, fragments, collection, achievements, boxes opened;
             a "to do" list (mission rewards, gifts, collection rewards, unread messages,
             friend requests); the pity of every lootbox (shared event pity grouped,
             with time left); your last 7 days of Poppy Tool; shortcuts to every page.
             "Collect everything" claims, in one click, every reward you have earned:
             finished missions, inbox gifts and completed collections.
  MISSIONS   daily & weekly missions with progress; "Claim all"; opt-in auto-claim.
  INVENTORY  your characters with search, rarity / category filters, Owned / Missing /
             Duplicates / Upgradable; collections with their reward and a Claim button;
             the inventory's own "Upgrade all" (asks for a second click to confirm).
  ACHIEVEMENTS  unlocked / total, points, what's still locked (easiest first).
  INBOX      gifts waiting (Claim / opt-in auto-claim), friend requests (Accept / Decline),
             latest messages.
  Badges on the tabs show what's waiting, and you get an alert (sound + Windows
  notification) when a mission reward, a gift, a message or a friend request arrives,
  or when an event lootbox ends within 24h — on any page of the site.
  SETTINGS   stop after X minutes / at a time, gem floor, daily budget in Godos,
             free pulls first, auto-refill gems from Godos (with a Godos reserve),
             auto-pick the rate-up, pull speed (Slow / Normal / Fast), auto-resume,
             anti-freeze, alerts (rarity, sound + volume, Windows notification, tab title,
             free-pull reminder), panel language, accent colour, theme.

  Every dropdown (lootbox, stop target, etc.) is now searchable: click it and type to
  filter — handy for the 200-character lists.


TOOLBAR BUTTON
  Click the Poppy Tool icon from any tab: status, counters, best drop, Start/Stop, go to the tab.
  A "▶" badge shows while it's running.

LONG RUNS
  - Auto-resume: if the page reloads or crashes, the session continues where it was
    (within 20 minutes).
  - Anti-freeze: if nothing happens for 2 minutes, the page reloads and resumes.
    If the whole tab stops answering for 3 minutes, the extension reloads it.
  - Timers run in a background worker, so a tab in the background keeps its pace.

SAFETY
  - It only clicks the site's own buttons, one 10x (or 1x for the last free pulls) at a time.
  - Paid lootboxes are refused unless "Spend gems" is on.
  - Godos are only converted by you, or by Auto-refill (never below your reserve,
    never above your daily budget).
  - Every claim goes through the site's own endpoints and only collects rewards
    you have already earned.
  - It never accepts the site's own "convert to complete the pull" popup: it stops.
```
