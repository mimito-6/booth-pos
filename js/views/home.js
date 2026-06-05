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

  // FRONT is not in this list — the big "開攤" button above is the front-desk
  // entry point. No need to duplicate it as a small tile.
  const NAV = [
    { name: "nav_stock", code: "STOCK", icon: "box", route: "stock" },
    { name: "nav_pay", code: "PAY", icon: "credit-card", route: "pay" },
    { name: "nav_event", code: "EVENT", icon: "calendar", route: "event" },
    { name: "nav_pickup", code: "PICKUP", icon: "clipboard", route: "pickup", badge: "preorders" },
    { name: "nav_record", code: "RECORD", icon: "receipt", route: "record" },
    { name: "nav_settings", code: "SET", icon: "settings", route: "settings" },
  ];

  function render(root) {
    const st = OB.store.get();
    const ev = OB.store.currentEvent();
    const stats = OB.stats.eventStats(st);
    const locked = OB.store.isLocked && OB.store.isLocked();

    const hero = el("div", { class: "home-hero" });
    if (st.settings.mascot) {
      hero.appendChild(el("img", { class: "home-mascot", src: st.settings.mascot, alt: "" }));
    } else {
      hero.appendChild(el("div", { class: "home-mascot-fallback", html: STALL_SVG }));
    }
    hero.appendChild(el("div", { class: "home-shop-name", text: st.settings.shopName || t("app_name") }));
    const evName = ev.name || t("no_event");
    hero.appendChild(
      el("div", { class: "home-event-line", html: '<span class="ob-ico-inline">' + OB.icon("calendar", 15) + "</span> " + esc(evName + (ev.date ? "  ·  " + ev.date : "")) })
    );

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
    const unlockBtn = locked
      ? el("button", { class: "btn btn-secondary btn-block home-unlock", text: t("unlock"), onclick: () => OB.app.unlockHelper() })
      : null;

    const stat = locked ? null : OB.ui.statsRow([
      { label: t("stat_revenue"), value: fmtMoney(stats.revenue) },
      { label: t("stat_tx"), value: stats.count, unit: t("unit_tx"), small: true },
      { label: t("stat_items"), value: stats.pieces, unit: t("unit_pcs"), small: true },
    ]);
    const statWrap = locked
      ? el("div", { class: "locked-home-note", text: t("hidden_while_locked") })
      : el("div", { style: "padding:14px 16px 0;max-width:560px;margin:0 auto" }, [stat]);

    const grid = el("div", { class: "nav-grid" });
    const pendingPre = st.preorders.filter((p) => p.status === "pending").length;
    NAV.forEach((n) => {
      const card = el("div", {
        class: "nav-card" + (n.badge && pendingPre ? " badge-wrap" : ""),
        onclick: () => {
          if (locked && n.route !== "front") {
            OB.router.go(n.route);
            return;
          }
          OB.router.go(n.route);
        },
      });
      if (n.badge && pendingPre) card.appendChild(el("span", { class: "nav-badge", text: pendingPre }));
      card.appendChild(el("span", { class: "nav-emoji nav-ico", html: OB.icon(n.icon) }));
      card.appendChild(el("span", { class: "nav-name", text: t(n.name) }));
      grid.appendChild(card);
    });

    // Language is chosen in Settings (the field there is marked with a 🌐 icon
    // and the universal word "Language"). On first run the locale auto-detects
    // from the browser, so non-Chinese visitors land in their own language and
    // the Settings tile is already in their language.
    const view = el("div", { class: "view active" });
    view.append(hero, openBtn);
    if (unlockBtn) view.appendChild(el("div", { style: "padding:0 20px;max-width:560px;margin:0 auto" }, [unlockBtn]));
    view.append(statWrap, grid);
    root.appendChild(view);
  }

  OB.router.register("home", render);
})();
