# Changelog

## 5.1.4-test — October 8, 2026 (test branch, pre-release)

- Animations everywhere, with Apple's curves (smooth deceleration and a light spring):
  - the tab highlight slides from tab to tab like an iOS segmented control; each page fades and slides in
  - the panel eases in when the page loads; dropdowns and the colour picker spring open and fade out
  - buttons, chips and swatches press in and spring back; iOS switches stretch while pressed
  - counters and tab badges bounce when their value changes; progress bars glide to their new value
  - the toolbar popup slides its content in once when it opens
- Every animation is turned off when Windows is set to reduce motion

## 5.1.3-test — October 8, 2026 (test branch, pre-release)

- Toolbar popup restyled like the panel (Apple look, light theme when the panel uses it, star of the best rarity, same language as the panel)
- Queue steps fit the panel width (the × and the switches were cut off)
- Volume sliders: iOS style with the filled part in the accent colour, on every page
- Settings: group titles stand out from the small field captions
- Best pulls drop the coloured side bar (the star shows the rarity, like every other list); the 50/50 box uses a real star
- The last emoji icons (event end, free pulls, inbox gifts) are line icons
- Light theme: the white Special star stays visible in dropdown buttons; lootbox dots stay round in the queue

## 5.1.2-test — October 8, 2026 (test branch, pre-release)

- Every rarity shows the same coloured star: characters in the "Stop when I get" dropdown, the Missing list (Stats), inventory rows, history and the Home "Last 7 days" counts
- Featured characters say "rate-up" instead of a typed ★; new characters in the history get the green NEW badge instead of ✦
- Lootbox colour dots in the dropdowns are round and the same size as the stars
- A tab brought into view is no longer half hidden under the tab bar's edge fade

## 5.1.1-test — October 8, 2026 (test branch, pre-release)

- Accent colours: 15 colours to pick from, plus a custom colour picker (saturation / brightness area, hue slider, hex field, live preview). "Pin" keeps up to 8 custom colours in the row, × removes one
- Rarity markers are coloured stars (dropdowns, session counts, best pulls, Stats, inventory filters)
- Dropdowns follow the panel when it scrolls, close once their button scrolls out of it, and use the panel style on every page (language, inventory category)
- Tab bar: one row again, the mouse wheel scrolls it sideways and the edges fade while tabs are hidden there
- Compact mode removed

## 5.1.0-test — October 8, 2026 (test branch, pre-release)

- Test version of the panel in an Apple / SwiftUI style: SF font, translucent system materials, iOS system colours (light and dark), segmented-control tabs, iOS switches, grouped inset lists and bordered / prominent buttons
- The default accent is now system blue and the accent swatches are the iOS system colours
- Only the look changes: features and settings are the same as 5.0.3

## 5.0.3 — October 8, 2026

- Scrollbars in the panel, dropdowns and lists are thin, rounded and use the accent colour (they follow the chosen accent and the light theme)

## 5.0.2 — October 7, 2026

- Compatibility with the updated Cripsum lootbox page: lootboxes are looked up in `GACHA_INIT` by `key` (fallback `id`), as the site now keys banners by key
- 50/50 results sent as 1 / 0 are counted like true / false
- The site's native `<dialog>` pop-ups are closed via `LootboxModal.close`, never confirmed
- The event end time falls back to the view's `[data-countdown]`
- Event-end warnings on every page key lootboxes the same way, and "YYYY-MM-DD HH:MM:SS" end dates are parsed the same way everywhere
- Files reorganised into `src/background`, `src/content` and `src/popup`; nothing changes in the extension itself

## 5.0.1

- First version published on GitHub
- Formerly Auto Pull: settings and history are kept when you switch
