/* ============================================================
   OpenBooth — SETTINGS view
   ============================================================ */
(function () {
  window.OB = window.OB || {};
  const U = OB.util;
  const { el, esc, toast, confirmDialog, copyText } = U;
  const t = window.t;

  const CURRENCIES = [
    { code: "TWD", symbol: "NT$" },
    { code: "JPY", symbol: "¥" },
    { code: "USD", symbol: "$" },
    { code: "KRW", symbol: "₩" },
    { code: "CNY", symbol: "¥" },
    { code: "HKD", symbol: "HK$" },
  ];
  const THEMES = [
    { id: "warm", dots: ["#c46b43", "#faf6f0", "#6b5b95"] },
    { id: "sakura", dots: ["#e0688a", "#fdf3f5", "#8a6bc4"] },
    { id: "ocean", dots: ["#087f8c", "#eef8f8", "#356da8"] },
    { id: "mono", dots: ["#1c1c1a", "#f5f5f4", "#6e6e69"] },
    { id: "night", dots: ["#e08a5c", "#1b1916", "#a48fd6"] },
  ];

  function render(root) {
    const st = OB.store.get();
    const s = st.settings;
    const view = el("div", { class: "view active" });
    view.appendChild(OB.ui.header({ title: t("nav_settings"), onBack: () => OB.router.go("home") }));
    const main = el("main");

    // --- shop ---
    const shopName = OB.ui.input({ value: s.shopName });
    shopName.addEventListener("change", () => { s.shopName = shopName.value.trim() || "OpenBooth"; OB.store.commit(); });
    main.appendChild(OB.ui.field(t("shop_name"), shopName));

    // mascot
    const mascotWrap = el("div", { style: "display:flex;gap:10px;align-items:center" });
    function renderMascot() {
      mascotWrap.innerHTML = "";
      if (s.mascot) mascotWrap.appendChild(el("img", { src: s.mascot, style: "width:56px;height:56px;border-radius:12px;object-fit:contain;background:var(--surface-2)" }));
      mascotWrap.appendChild(el("button", { class: "mini-btn", text: t("pick_image"), onclick: pickMascot }));
      if (s.mascot) mascotWrap.appendChild(el("button", { class: "mini-btn", text: t("remove_image"), onclick: () => { s.mascot = null; OB.store.commit(); renderMascot(); } }));
    }
    async function pickMascot() {
      const f = await U.pickFile("image/*");
      if (!f) return;
      s.mascot = await U.fileToScaledDataURL(f, 256, 0.85);
      OB.store.commit();
      renderMascot();
    }
    renderMascot();
    main.appendChild(OB.ui.field("攤位圖示 / Logo（選填）", mascotWrap));

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
      OB.store.commit();
      toast("✓");
    });

    const langSel = el("select");
    [["zh-Hant", "繁體中文"], ["ja", "日本語"], ["en", "English"], ["ko", "한국어"]].forEach(([v, label]) => {
      const o = el("option", { value: v, text: label });
      if (v === s.locale) o.selected = true;
      langSel.appendChild(o);
    });
    langSel.addEventListener("change", () => {
      s.locale = langSel.value;
      OB.i18n.setLocale(s.locale);
      OB.store.commit();
      OB.router.refresh();
    });
    main.appendChild(el("div", { class: "field-row" }, [OB.ui.field(t("currency"), curSel), OB.ui.field(t("language"), langSel)]));

    // theme
    const themeGrid = el("div", { class: "theme-grid" });
    THEMES.forEach((th) => {
      const dots = el("div", { class: "theme-dots" }, th.dots.map((c) => el("span", { style: "background:" + c })));
      themeGrid.appendChild(
        el("div", { class: "theme-swatch" + (s.theme === th.id ? " active" : ""), onclick: () => { s.theme = th.id; OB.store.commit(); document.documentElement.dataset.theme = th.id; OB.router.refresh(); } }, [dots, el("div", { text: th.id })])
      );
    });
    main.appendChild(OB.ui.field(t("theme"), themeGrid));

    // low stock
    const lowI = OB.ui.input({ type: "number", inputmode: "numeric", value: s.lowStockThreshold });
    lowI.addEventListener("change", () => { s.lowStockThreshold = Math.max(0, Math.round(Number(lowI.value)) || 0); OB.store.commit(); });
    main.appendChild(OB.ui.field(t("low_stock"), lowI));

    // toggles
    const togSec = el("section", { class: "section settings-list" });
    [["showStock", "show_stock"], ["enableCombos", "enable_combos"], ["requireCash", "require_cash"], ["showReceipt", "show_receipt"]].forEach(([key, label]) => {
      const item = el("div", { class: "settings-item" }, [el("span", { class: "si-label", text: t(label) })]);
      item.appendChild(OB.ui.toggle(s[key], (on) => { s[key] = on; OB.store.commit(); }));
      togSec.appendChild(item);
    });
    main.appendChild(togSec);

    // helper lock
    main.appendChild(el("h2", { class: "section-title", text: t("helper_lock") }));
    const helperSec = el("section", { class: "settings-list" });
    const pinInput = OB.ui.input({ type: "password", inputmode: "numeric", maxlength: "4", value: s.helperPin || "", placeholder: "0000" });
    pinInput.addEventListener("input", () => {
      pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 4);
    });
    helperSec.appendChild(OB.ui.field(t("helper_pin"), pinInput, t("helper_pin_hint")));
    const helperActions = el("div", { class: "actions", style: "margin-bottom:12px" }, [
      el("button", { class: "btn btn-primary", text: t("set_helper_pin"), onclick: savePin }),
      el("button", { class: "btn btn-secondary", text: t("clear_helper_pin"), onclick: clearPin }),
    ]);
    helperSec.appendChild(helperActions);
    helperSec.appendChild(el("button", { class: "btn btn-secondary btn-block", text: t("lock_now"), onclick: lockNow }));
    main.appendChild(helperSec);

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
    action(t("clear_all"), clearAll, true);
    main.appendChild(dataSec);

    // about (no version string — keep this stable across releases)
    main.appendChild(el("h2", { class: "section-title", text: t("about") }));
    main.appendChild(
      el("div", { class: "update-log-box", style: "margin-bottom:24px" }, [
        el("div", {}, [el("b", { text: "OpenBooth" }), document.createTextNode(" · " + t("about_tagline"))]),
        el("div", { style: "margin-top:6px", text: t("about_privacy") }),
        el("a", { href: "https://github.com/mimito-6/openbooth", target: "_blank", rel: "noopener", style: "color:var(--accent);display:inline-block;margin-top:8px", text: "GitHub →" }),
      ])
    );

    view.appendChild(main);
    root.appendChild(view);

    // ---- data actions ----
    function exportAll() {
      U.downloadFile("openbooth-backup-" + OB.store.todayISO() + ".json", OB.store.exportAll(), "application/json");
      toast(t("exported"), "success");
    }
    async function importAll() {
      const f = await U.pickFile(".json,application/json");
      if (!f) return;
      try {
        const txt = await U.readFileText(f);
        const obj = JSON.parse(txt);
        if (obj.kind === "openbooth-preset") {
          OB.store.applyPreset(obj);
        } else {
          OB.store.importAll(obj);
        }
        toast(t("imported"), "success");
        OB.router.go("home");
      } catch (e) {
        toast("⚠ " + e.message, "danger");
      }
    }
    function exportShare() {
      U.downloadFile("openbooth-preset-" + OB.store.todayISO() + ".json", JSON.stringify(OB.store.exportPreset(), null, 2), "application/json");
      toast(t("exported"), "success");
    }
    function shareLink() {
      const code = OB.store.encodePreset(OB.store.exportPreset());
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
        OB.store.loadDemo();
        toast("✓", "success");
        OB.router.go("home");
      });
    }
    function savePin() {
      const pin = pinInput.value.trim();
      if (!/^\d{4}$/.test(pin)) {
        toast(t("pin_must_be_4_digits"), "danger");
        return;
      }
      s.helperPin = pin;
      OB.store.commit();
      toast(t("pin_saved"), "success");
    }
    function clearPin() {
      s.helperPin = "";
      OB.store.setLocked(false);
      OB.store.commit();
      pinInput.value = "";
      toast(t("pin_cleared"), "success");
    }
    function lockNow() {
      if (!s.helperPin) {
        toast(t("lock_requires_pin"), "danger");
        return;
      }
      OB.store.setLocked(true);
      toast(t("locked"), "success");
      OB.router.go("front");
    }
    function clearAll() {
      confirmDialog(t("confirm_clear"), { danger: true }).then((ok) => {
        if (!ok) return;
        confirmDialog(t("confirm_clear2"), { danger: true }).then((ok2) => {
          if (!ok2) return;
          OB.store.clearAll();
          toast(t("cleared"));
          OB.router.go("home");
        });
      });
    }
  }

  OB.router.register("settings", render);
})();
