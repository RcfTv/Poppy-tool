# Changelog

## 5.1.5 — October 8, 2026

- **Apple / SwiftUI look**: SF font, translucent materials, iOS system colours in light and dark, segmented-control tabs, iOS switches and sliders, grouped inset lists; the toolbar popup matches the panel
- **Accent colours**: 15 colours plus a custom colour picker (colour area, hue slider, hex field, live preview); "Pin" keeps up to 8 custom colours
- **Rarities** are shown with the same coloured star everywhere (dropdowns, session counts, best pulls, Stats, inventory, history, Home)
- **Animations** with Apple's curves: sliding tab highlight, pages and pop-ups easing in, buttons and switches that press in, counters that bounce, progress bars that glide (off with the system "reduce motion" setting)
- **Move the panel anywhere**: it stays where it is dropped; near a corner (or with a double-click on the header) it snaps into the corner; minimise / restore is animated
- **Dropdowns** follow the panel when it scrolls and use the panel style on every page; the tab bar scrolls with the mouse wheel
- Compact mode removed

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
