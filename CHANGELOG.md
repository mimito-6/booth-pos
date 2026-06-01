# Changelog

All notable changes to OpenBooth are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-06

First open-source release. Rebuilt from a hardcoded single-file prototype into a
data-driven, customizable, offline-first POS.

### Added
- **Data-driven catalog** — products, categories and combos are fully editable in
  the UI (no code editing). Each entity has a stable UUID.
- **FRONT** — category tabs, quick-tap grid, live cart, product images & search.
- **CHECKOUT** — custom payment methods, cash change calculator with denomination
  quick-keys, gift-threshold (滿額禮) prompts, freebie (特典) line tagging, per-line
  price override and order rounding.
- **STOCK** — product / category / combo CRUD, image upload (auto-downscaled),
  multi-tier bundle pricing rules, derived live stock.
- **EVENT** — multiple sessions (CWT Day1/Day2…), per-event sales records, starting
  cash float.
- **PICKUP** — pre-order list, CSV import/export, pending/notified/picked status,
  copy-notice template.
- **PAY** — custom payment methods with optional payment QR image.
- **RECORD** — transactions, undo/void (restores stock), product ranking, **cash-up
  reconciliation** (float → expected vs counted), CSV export.
- **SETTINGS** — shop name, currency (TWD/JPY/USD/…), language, theme, mascot,
  full JSON backup/restore, shareable stall preset + `?config=` share link, demo data.
- Offline PWA (installable, cache-first service worker), i18n (繁中 / 日本語 /
  English), 4 themes, customer-facing display.

### Fixed (vs prototype)
- Transactions now store **price snapshots** + expanded `stockUse`, so editing or
  deleting products never corrupts historical records.
- All user-entered text is escaped on output (XSS-safe).
- Inventory is derived per the new multi-event model.

### Removed
- All third-party IP sample data from the original prototype; replaced with
  original/generic demo items.
