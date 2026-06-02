<!-- 感謝你的 PR! Thanks for your PR! -->

## What this changes
<!-- One sentence: what does this do, from the seller's point of view? -->

## How I tested it
<!-- A short manual run-through. The bar:
     - DevTools console shows 0 errors
     - `node tests/pricing.test.js` still passes
     - If you touched UI, attach before / after screenshots
-->

## AGENTS.md checklist
- [ ] No new dependencies / build step
- [ ] No new strings hardcoded — all UI text goes through `t()` and is added to **all 4 locales** (zh-Hant / ja / en / ko)
- [ ] User-entered data is not put into `innerHTML` (used `textContent` / `OB.util.esc`)
- [ ] If precached assets changed: bumped `CACHE` in `sw.js` AND `CACHE_NAME` in `js/app.js`
- [ ] Existing flows still work (cart, checkout, cash change, undo, CSV export)
