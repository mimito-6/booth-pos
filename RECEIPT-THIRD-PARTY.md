# Receipt engine — third-party notices

The optional receipt feature ships a pre-bundled engine
(`openbooth-receipt-bridge.global.js`). That bundle includes the following
third-party open-source components. All are MIT-licensed and compatible with
OpenBooth's own MIT license.

> **Source / 原始碼:** the engine is built from the open-source **receipt-engine**
> project — https://github.com/mimito-6/receipt-engine (MIT).

> ⚠️ This file documents the **receipt add-on only**. The core OpenBooth app has
> **no runtime dependencies** (see the main README). The receipt files
> (`openbooth-receipt-bridge.global.js`, `openbooth-receipt.js`) are an optional
> drop-in and are not part of the zero-dependency core.

## Bundled libraries

### qrcode-generator
- Author: Kazuhiko Arase
- License: MIT
- Source: https://github.com/kazuhikoarase/qrcode-generator
- Use: renders the QR code printed on receipts.

### Zod
- Author: Colin McDonnell and contributors
- License: MIT
- Source: https://github.com/colinhacks/zod
- Use: validates the receipt document / template config shape.

## Runtime network resources

### Google Fonts
- When a receipt is rendered with a **designed (non-thermal) template**, the
  engine may fetch the configured web fonts from `fonts.googleapis.com`.
- Those fonts are served under the SIL Open Font License (OFL) or Apache 2.0,
  per each font family.
- This fetch happens **only** for the colour share/download render. Thermal
  printing and the rest of OpenBooth remain fully offline. If the network is
  unavailable, the receipt falls back to system fonts.

---

If you redistribute the bundle, keep this notice with it. The engine is built
from the open-source **receipt-engine** project — regenerate the bundle from
there: https://github.com/mimito-6/receipt-engine
