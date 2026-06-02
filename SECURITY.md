# Security Policy

## Reporting a vulnerability

If you find a security issue in OpenBooth — for example a way to corrupt or exfiltrate stored data, an XSS via user-entered product names, or anything that could compromise a seller's privacy — please **report it privately**.

Use GitHub's private vulnerability reporting:

→ https://github.com/mimito-6/openbooth/security/advisories/new

Please **do not** open a public issue for security problems.

We aim to acknowledge reports within 7 days.

## Scope

OpenBooth is a **client-only, offline-first** web app. There is no server, no account, no cloud. All data lives in `localStorage` on the seller's device.

In-scope:
- XSS / DOM injection via product / category / preset content
- Local data corruption (especially around stock derivation and price snapshots)
- Bypassing the helper-lock (PIN) screen
- Preset-import code paths (shared `?config=` link)

Out of scope:
- GitHub Pages hosting infrastructure
- Browser bugs
- The seller's choice to share their backup JSON publicly

## Defaults that protect users

- All user-entered text is escaped before rendering (`OB.util.esc` or `textContent`); never via `innerHTML`.
- Preset import / export strips `helperPin` (it must not travel between devices).
- Imported presets are JSON-only — no scripts are ever executed from a preset.

Thank you for helping keep small creators safe.
