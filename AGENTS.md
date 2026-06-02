# AGENTS.md — working on OpenBooth

Read this before making changes. OpenBooth is an offline-first POS for indie
doujin/craft-market sellers. The whole point is that it stays tiny, hackable and
dependency-free — please preserve that.

## Golden rules (do NOT break these)
- **No build step, no framework, no dependencies.** Plain HTML/CSS/JS only. The app
  must run by opening `index.html` directly (file://) and on GitHub Pages. Do not add
  npm packages, bundlers, React/Vue, TypeScript, or external CDNs.
- **One global namespace `OB`** (`window.OB`). Every JS file is an IIFE that does
  `window.OB = window.OB || {}` and hangs things off `OB.*`. Scripts are plain
  `<script>` tags loaded in order in `index.html` (NOT ES modules).
- **Security:** never put user-entered data into `innerHTML`. Build DOM with
  `OB.util.el(...)`, set text via `textContent`/`{text:...}`, or escape with
  `OB.util.esc()`. (User product names are untrusted input.)
- **Money is integer-only.** No decimals/floats. Format with `OB.util.fmtMoney`.
- **i18n:** all UI strings go through `t("key")` (from `js/i18n.js`). When you add a
  string, add the key to **all** locales (`zh-Hant`, `ja`, `en`). Never hardcode UI
  text in a view. User data (product/category names) is shown as-entered, not translated.
- **Theming:** use the CSS variables in `css/tokens.css`. Don't hardcode hex colors in
  component CSS or inline styles.
- **Keep files < 500 lines** and focused on one responsibility.

## Architecture map
```
index.html            loads css + all js in order
css/tokens.css        design tokens + themes ([data-theme="warm|sakura|mono|night"])
css/app.css           component styles
js/i18n.js            t(key, params); DICT for zh-Hant / ja / en; detect()
js/util.js            OB.util: el, esc, fmtMoney, denominations, uuid, toast,
                      copyText, downloadFile, pickFile, readFileText,
                      fileToScaledDataURL, toCSV, parseCSV, confirmDialog
js/components.js      OB.ui: header, statsRow, emptyState, sheet, field, input, toggle
js/store.js           OB.store: state + localStorage persistence + CRUD + import/export
                      + loadDemo(); keys "openbooth_v3" / "openbooth_cart_v3"
js/pricing.js         OB.pricing.calcSale(state, cart) — pure; applyBundle()
js/inventory.js       OB.inventory: derived stock, computeStockUse, remaining, canAdd*
js/stats.js           OB.stats.eventStats(state, eventId)
js/router.js          OB.router: register(name, render), go(name), back(), refresh()
js/views/*.js         home, front, stock, event, pickup, pay, record, settings
js/app.js             bootstrap: theme/locale, share-link import, customer display,
                      service worker; CACHE_NAME
sw.js                 service worker, precache list ASSETS, const CACHE
presets/demo.json     sample stall (original/generic items, no third-party IP)
```

## Key concepts
- **Derived inventory:** stock is never a mutable counter. `remaining = stockInitial −
  Σ stockUse(non-voided transactions) − cart projection`. Voiding a sale restores stock
  automatically. Combos expand into product usage via `uses:[{productId, qty}]`, snapshotted
  onto each transaction as `stockUse` at checkout.
- **Price snapshots:** transactions store `name/unitPrice/lineTotal` per line, so editing
  or deleting products later never corrupts history. Preserve this when touching checkout.
- **Inventory is global; sales stats are per-event** (`transaction.eventId`).
- **Settings/data shapes** are documented in `DESIGN.md` §4.

## How to add a new screen (view)
1. Create `js/views/<name>.js` as an IIFE; render into the root and call
   `OB.router.register("<name>", render)`.
2. Add a `<script src="js/views/<name>.js"></script>` line in `index.html` (views block).
3. If it needs a home tile, add an entry to `NAV` in `js/views/home.js`.
4. Add any new strings to all 3 locales in `js/i18n.js`.
5. Add it to the precache `ASSETS` list in `sw.js`.

## Releasing changes to users
If you change any precached asset (css/js/html/icon), **bump the cache version** in BOTH
`sw.js` (`const CACHE`) and `js/app.js` (`CACHE_NAME`), e.g. `openbooth-v4` → `openbooth-v5`.
Otherwise installed PWAs keep serving the old files.

## Run & verify (no test framework yet)
- Run: open `index.html` directly, or `npx serve .` then visit the URL.
- Tests: run `node tests/pricing.test.js` for the zero-dependency pricing engine check.
- Manual smoke test for any change:
  1. Settings (⚙) → **Load demo products**.
  2. Open Stall → tap items → check out with cash → confirm change is correct.
  3. Open DevTools console — there must be **0 errors**.
  4. If you touched i18n/UI, switch language on the home screen and confirm it still reads correctly.
- Keep the existing manual flows working: bundle pricing, combos, freebie (特典),
  gift threshold, multi-event, pre-order CSV, cash-up.

## Scope discipline
Make the smallest change that satisfies the task. Don't refactor unrelated code, don't
reformat whole files, and don't introduce a build/test toolchain unless the task explicitly
asks for it. One feature per PR; describe what you changed and how you verified it.
