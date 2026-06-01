/* ============================================================
   OpenBooth — HOME view (開攤一鍵啟動 + functional nav grid)
   ============================================================ */
(function () {
  window.OB = window.OB || {};
  const { el, esc, fmtMoney } = OB.util;
  const t = window.t;

  const STALL_SVG =
    '<svg viewBox="0 0 512 512" width="92" height="92" style="fill:var(--accent)" aria-hidden="true">' +
    '<path d="M104 134 H408 V194 q-25.33 30 -50.67 0 q-25.33 30 -50.67 0 q-25.33 30 -50.67 0 q-25.33 30 -50.67 0 q-25.33 30 -50.67 0 q-25.33 30 -50.67 0 Z"/>' +
    '<rect x="138" y="194" width="20" height="184" rx="6"/>' +
    '<rect x="354" y="194" width="20" height="184" rx="6"/>' +
    '<rect x="116" y="308" width="280" height="28" rx="10"/>' +
    "</svg>";

  const NAV = [
    { name: "nav_front", code: "FRONT", emoji: "🛒", route: "front", accent: true },
    { name: "nav_stock", code: "STOCK", emoji: "📦", route: "stock" },
    { name: "nav_pay", code: "PAY", emoji: "💳", route: "pay" },
    { name: "nav_event", code: "EVENT", emoji: "📅", route: "event" },
    { name: "nav_pickup", code: "PICKUP", emoji: "📋", route: "pickup", badge: "preorders" },
    { name: "nav_record", code: "RECORD", emoji: "🧾", route: "record" },
    { name: "nav_settings", code: "SET", emoji: "⚙️", route: "settings" },
  ];

  function render(root) {
    const st = OB.store.get();
    const ev = OB.store.currentEvent();
    const stats = OB.stats.eventStats(st);

    const hero = el("div", { class: "home-hero" });
    if (st.settings.mascot) {
      hero.appendChild(el("img", { class: "home-mascot", src: st.settings.mascot, alt: "" }));
    } else {
      hero.appendChild(el("div", { class: "home-mascot-fallback", html: STALL_SVG }));
    }
    hero.appendChild(el("div", { class: "home-shop-name", text: st.settings.shopName || t("app_name") }));
    const evName = ev.name || t("no_event");
    hero.appendChild(el("div", { class: "home-event-line", text: "📅 " + evName + (ev.date ? "  ·  " + ev.date : "") }));

    // offline-ready chip
    const ready = el("div", { class: "ready-chip", style: "margin-top:10px" }, [
      el("span", { class: "dot" }),
      el("span", { text: t("offline_not_ready") }),
    ]);
    OB.app.checkOfflineReady().then((ok) => {
      if (ok) {
        ready.classList.add("ok");
        ready.lastChild.textContent = t("offline_ready");
      }
    });
    hero.appendChild(ready);

    const openBtn = el("button", { class: "open-stall-btn", text: t("open_stall"), onclick: () => OB.router.go("front") });

    const stat = OB.ui.statsRow([
      { label: t("stat_revenue"), value: fmtMoney(stats.revenue) },
      { label: t("stat_tx"), value: stats.count, unit: t("unit_tx"), small: true },
      { label: t("stat_items"), value: stats.pieces, unit: t("unit_pcs"), small: true },
    ]);
    const statWrap = el("div", { style: "padding:14px 16px 0;max-width:560px;margin:0 auto" }, [stat]);

    const grid = el("div", { class: "nav-grid" });
    const pendingPre = st.preorders.filter((p) => p.status === "pending").length;
    NAV.forEach((n) => {
      const card = el("div", {
        class: "nav-card" + (n.badge && pendingPre ? " badge-wrap" : ""),
        onclick: () => OB.router.go(n.route),
      });
      if (n.badge && pendingPre) card.appendChild(el("span", { class: "nav-badge", text: pendingPre }));
      card.appendChild(el("span", { class: "nav-emoji", text: n.emoji }));
      card.appendChild(el("span", { class: "nav-name", text: t(n.name) }));
      card.appendChild(el("span", { class: "nav-code", text: n.code }));
      grid.appendChild(card);
    });

    const log = el("div", { class: "update-log" }, [
      el("div", { class: "update-log-box" }, [
        el("h4", { text: t("update_log") }),
        el("ul", {
          html:
            "<li><b>v0.1</b> · 商品/分類/套組可自訂 · 多場次 · 現金找零 · 滿額禮 · 特典</li>" +
            "<li>預購名單 CSV 匯入 · 自訂付款方式 · 收攤對帳 · 資料備份</li>" +
            "<li>離線可用 (PWA) · 繁中/日文/English · 主題色自訂</li>",
        }),
      ]),
    ]);

    // language switcher — each button shows its own language's name, so
    // a visitor who can't read the current UI can still find their language.
    const LANGS = [
      { code: "zh-Hant", label: "繁體中文" },
      { code: "ja", label: "日本語" },
      { code: "en", label: "English" },
    ];
    const cur = OB.i18n.getLocale();
    const langRow = el("div", { class: "lang-row" });
    LANGS.forEach((l) => {
      langRow.appendChild(
        el("button", {
          class: "lang-btn" + (cur === l.code ? " active" : ""),
          lang: l.code,
          text: l.label,
          onclick: () => {
            const s = OB.store.get().settings;
            if (s.locale === l.code) return;
            s.locale = l.code;
            OB.i18n.setLocale(l.code);
            OB.store.commit(); // persists + re-renders via app subscriber
          },
        })
      );
    });

    const view = el("div", { class: "view active" });
    view.append(hero, openBtn, statWrap, grid, log, langRow);
    root.appendChild(view);
  }

  OB.router.register("home", render);
})();
