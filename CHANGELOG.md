# Changelog

All notable changes to OpenBooth are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.4] — 2026-06

Settings & internationalisation polish.

### Changed
- **Language is now chosen in Settings**, not on the home screen. The Settings
  language field is marked with a 🌐 globe icon and the universal word
  "Language" (e.g. `🌐 語言 · Language`) so anyone can find it. First run still
  auto-detects the browser locale, so non-Chinese visitors land in their own
  language and the Settings tile is already translated. The home-screen
  language switcher (and its CSS) were removed.
- **Home**: removed the duplicate "Front desk" tile (the big "Open stall"
  button already opens it) and shortened that button's label.
- **Checkout**: simplified the cash pad to a single "Exact" button — the
  numeric keypad and typed amount already cover everything else.
- **Settings**: clearer data-backup button labels (which export includes
  sales/customer data vs. which is the shareable, sales-free preset); the
  post-sale toggle now reads "Show receipt".

### Fixed
- **Internationalisation**: localized 10 remaining hardcoded Traditional-Chinese
  strings that a non-Chinese user could hit (full-storage save error, shared-
  preset import dialog, invalid-link toast, mascot/logo label, preset-too-large
  toast, image-processing error, payment-QR alt text, and the event/contact/
  payment placeholder examples). All four locales stay aligned at 227 keys.
- Code of Conduct now uses private GitHub channels instead of a public email.

## [0.1.3] — 2026-06

Internationalisation, pre-order UX, and OSS-repo polish.

### Added
- **Korean (`ko`) UI locale** — full translation; home-screen language switch now shows native names: 繁體中文 / 日本語 / English / 한국어.
- **Korean Won (`KRW`, ₩)** added to the currency list.
- New built-in **ocean** theme (cool palette).
- **Helper-lock (PIN) mode** — lock the back-office, hide revenue & history, keep only the sell flow available; unlock with a 4-digit PIN. Survives reload.
- **Post-sale thank-you card** (Settings → "Show thank-you card after sale").
- **Per-product sales CSV** export on the RECORD screen.
- PICKUP: **reversible 3-segment status toggle** ([待取 ｜ 已通知 ｜ 已取貨]) — any state to any state, not just one-way.
- PICKUP: **customisable pre-order notification template** (Settings) with `{items}` / `{amount}` variables; edit screen shows a **live preview** that updates as you type, plus a one-tap "copy to clipboard" button.
- Zero-dependency **pricing tests** (`node tests/pricing.test.js`) — covers bundles, combos, freebies, manual override, discount, gift-threshold.
- Repo polish for OSS: **`AGENTS.md`**, GitHub Actions **CI** (JS syntax, pricing tests, 4-locale alignment, preset JSON validation), issue & PR templates, **`SECURITY.md`**, **`CODE_OF_CONDUCT.md`**, social preview image.

### Changed
- Home: native-name language switcher replaces the old single-locale label.
- Settings → About: dropped the hardcoded version string; tagline now goes through i18n (no manual edit per release).
- Demo stall rewritten with **neutral round prices (5 / 10 / 100)**; removed 緞帶吊飾; gift threshold lowered to NT$100 so it triggers with the new tiers.
- Cash pad: removed redundant "Exact" shortcut — typing the amount or "+denom" buttons handle the same case.

### Fixed
- Code of Conduct: removed public email address (private GitHub channels only) to avoid scraping.
- Stray empty files (`OB`, `HTTP`, etc.) cleaned out of the repo root.

## [0.1.2] — 2026-06

Multilingual polish.

### Added
- In-app **language switcher on the home screen** — buttons show each language's native name, so visitors who can't read the current UI can still find theirs.

### Changed
- Project renamed to **OpenBooth** with a clean flat market-stall icon.
- Home tiles no longer show grey English code labels under each icon.
- Removed the hardcoded Chinese changelog block from Home (it didn't follow the language switch).

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
