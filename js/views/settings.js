/* ============================================================
   BOO-POS — SETTINGS view
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};
  const U = BOO.util;
  const { el, esc, toast, confirmDialog, copyText } = U;
  const t = window.t;

  const CURRENCIES = [
    { code: "TWD", symbol: "NT$" },
    { code: "JPY", symbol: "¥" },
    { code: "USD", symbol: "$" },
    { code: "CNY", symbol: "¥" },
    { code: "HKD", symbol: "HK$" },
  ];
  const THEMES = [
    { id: "warm", dots: ["#c46b43", "#faf6f0", "#6b5b95"] },
    { id: "sakura", dots: ["#e0688a", "#fdf3f5", "#8a6bc4"] },
    { id: "mono", dots: ["#1c1c1a", "#f5f5f4", "#6e6e69"] },
    { id: "night", dots: ["#e08a5c", "#1b1916", "#a48fd6"] },
  ];

  function render(root) {
    const st = BOO.store.get();
    const s = st.settings;
    const view = el("div", { class: "view active" });
    view.appendChild(BOO.ui.header({ title: t("nav_settings"), onBack: () => BOO.router.go("home") }));
    const main = el("main");

    // --- shop ---
    const shopName = BOO.ui.input({ value: s.shopName });
    shopName.addEventListener("change", () => { s.shopName = shopName.value.trim() || "BOO-POS"; BOO.store.commit(); });
    main.appendChild(BOO.ui.field(t("shop_name"), shopName));

    // mascot
    const mascotWrap = el("div", { style: "display:flex;gap:10px;align-items:center" });
    function renderMascot() {
      mascotWrap.innerHTML = "";
      if (s.mascot) mascotWrap.appendChild(el("img", { src: s.mascot, style: "width:56px;height:56px;border-radius:12px;object-fit:contain;background:var(--surface-2)" }));
      mascotWrap.appendChild(el("button", { class: "mini-btn", text: t("pick_image"), onclick: pickMascot }));
      if (s.mascot) mascotWrap.appendChild(el("button", { class: "mini-btn", text: t("remove_image"), onclick: () => { s.mascot = null; BOO.store.commit(); renderMascot(); } }));
    }
    async function pickMascot() {
      const f = await U.pickFile("image/*");
      if (!f) return;
      s.mascot = await U.fileToScaledDataURL(f, 256, 0.85);
      BOO.store.commit();
      renderMascot();
    }
    renderMascot();
    main.appendChild(BOO.ui.field("🐶 看板娘 / Mascot", mascotWrap));

    // currency + language row
    const curSel = el("select");
    CURRENCIES.forEach((c) => {
      const o = el("option", { value: c.code, text: c.code + " (" + c.symbol + ")" });
      if (c.code === s.currencyCode) o.selected = true;
      curSel.appendChild(o);
    });
    curSel.addEventListener("change", () => {
      const c = CURRENCIES.find((x) => x.code === curSel.value);
      s.currencyCode = c.code;
      s.currencySymbol = c.symbol;
      BOO.store.commit();
      toast("✓");
    });

    const langSel = el("select");
    [["zh-Hant", "繁體中文"], ["ja", "日本語"], ["en", "English"]].forEach(([v, label]) => {
      const o = el("option", { value: v, text: label });
      if (v === s.locale) o.selected = true;
      langSel.appendChild(o);
    });
    langSel.addEventListener("change", () => {
      s.locale = langSel.value;
      BOO.i18n.setLocale(s.locale);
      BOO.store.commit();
      BOO.router.refresh();
    });
    main.appendChild(el("div", { class: "field-row" }, [BOO.ui.field(t("currency"), curSel), BOO.ui.field(t("language"), langSel)]));

    // theme
    const themeGrid = el("div", { class: "theme-grid" });
    THEMES.forEach((th) => {
      const dots = el("div", { class: "theme-dots" }, th.dots.map((c) => el("span", { style: "background:" + c })));
      themeGrid.appendChild(
        el("div", { class: "theme-swatch" + (s.theme === th.id ? " active" : ""), onclick: () => { s.theme = th.id; BOO.store.commit(); document.documentElement.dataset.theme = th.id; BOO.router.refresh(); } }, [dots, el("div", { text: th.id })])
      );
    });
    main.appendChild(BOO.ui.field(t("theme"), themeGrid));

    // low stock
    const lowI = BOO.ui.input({ type: "number", inputmode: "numeric", value: s.lowStockThreshold });
    lowI.addEventListener("change", () => { s.lowStockThreshold = Math.max(0, Math.round(Number(lowI.value)) || 0); BOO.store.commit(); });
    main.appendChild(BOO.ui.field(t("low_stock"), lowI));

    // toggles
    const togSec = el("section", { class: "section settings-list" });
    [["showStock", "show_stock"], ["enableCombos", "enable_combos"], ["requireCash", "require_cash"]].forEach(([key, label]) => {
      const item = el("div", { class: "settings-item" }, [el("span", { class: "si-label", text: t(label) })]);
      item.appendChild(BOO.ui.toggle(s[key], (on) => { s[key] = on; BOO.store.commit(); }));
      togSec.appendChild(item);
    });
    main.appendChild(togSec);

    // --- data backup ---
    main.appendChild(el("h2", { class: "section-title", text: t("data_backup") }));
    main.appendChild(el("div", { class: "gift-banner", style: "background:var(--accent-light);color:var(--accent-dark)", text: t("backup_reminder") }));
    const dataSec = el("section", { class: "settings-list" });
    function action(label, fn, danger) {
      const item = el("div", { class: "settings-item" + (danger ? " danger" : ""), onclick: fn }, [el("span", { class: "si-label", text: label }), el("span", { class: "si-val", text: "→" })]);
      dataSec.appendChild(item);
    }
    action(t("export_all"), exportAll);
    action(t("import_all"), importAll);
    action(t("export_share"), exportShare);
    action(t("share_link"), shareLink);
    action(t("load_demo"), loadDemo);
    if (BOO.store.hasLegacy()) action("匯入舊版 (booth_register) 資料", importLegacy);
    action(t("clear_all"), clearAll, true);
    main.appendChild(dataSec);

    // about
    main.appendChild(el("h2", { class: "section-title", text: t("about") }));
    main.appendChild(
      el("div", { class: "update-log-box", style: "margin-bottom:24px" }, [
        el("div", { html: "<b>BOO-POS</b> · 開源擺攤收銀台 · v0.1" }),
        el("div", { style: "margin-top:6px", html: "MIT License · 100% 離線 · 資料只存在你的裝置" }),
        el("a", { href: "https://github.com", target: "_blank", rel: "noopener", style: "color:var(--accent);display:inline-block;margin-top:8px", text: "GitHub →" }),
      ])
    );

    view.appendChild(main);
    root.appendChild(view);

    // ---- data actions ----
    function exportAll() {
      U.downloadFile("boopos-backup-" + BOO.store.todayISO() + ".json", BOO.store.exportAll(), "application/json");
      toast(t("exported"), "success");
    }
    async function importAll() {
      const f = await U.pickFile(".json,application/json");
      if (!f) return;
      try {
        const txt = await U.readFileText(f);
        const obj = JSON.parse(txt);
        if (obj.kind === "boopos-preset") {
          BOO.store.applyPreset(obj);
        } else {
          BOO.store.importAll(obj);
        }
        toast(t("imported"), "success");
        BOO.router.go("home");
      } catch (e) {
        toast("⚠ " + e.message, "danger");
      }
    }
    function exportShare() {
      U.downloadFile("boopos-preset-" + BOO.store.todayISO() + ".json", JSON.stringify(BOO.store.exportPreset(), null, 2), "application/json");
      toast(t("exported"), "success");
    }
    function shareLink() {
      const code = BOO.store.encodePreset(BOO.store.exportPreset());
      const url = location.origin + location.pathname + "?config=" + code;
      if (url.length > 8000) {
        toast("設定太大，請改用「匯出設定包」檔案分享", "danger");
        return;
      }
      copyText(url).then(() => toast(t("link_copied"), "success"));
    }
    function loadDemo() {
      confirmDialog(t("load_demo") + "?").then((ok) => {
        if (!ok) return;
        BOO.store.loadDemo();
        toast("✓", "success");
        BOO.router.go("home");
      });
    }
    function importLegacy() {
      // best-effort import of old prototype transactions as generic records
      toast("舊資料偵測到，請用桌機開啟舊檔匯出 CSV 後再匯入（保留原始）", "");
    }
    function clearAll() {
      confirmDialog(t("confirm_clear"), { danger: true }).then((ok) => {
        if (!ok) return;
        confirmDialog(t("confirm_clear2"), { danger: true }).then((ok2) => {
          if (!ok2) return;
          BOO.store.clearAll();
          toast(t("cleared"));
          BOO.router.go("home");
        });
      });
    }
  }

  BOO.router.register("settings", render);
})();
