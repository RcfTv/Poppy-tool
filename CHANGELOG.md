# Changelog

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
