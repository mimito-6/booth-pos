/* ============================================================
   OpenBooth — PICKUP view (pre-orders + CSV import/export)
   ============================================================ */
(function () {
  window.OB = window.OB || {};
  const U = OB.util;
  const { el, esc, fmtMoney, toast, confirmDialog, copyText } = U;
  const t = window.t;

  let search = "";
  let filter = "all";

  function render(root) {
    const st = OB.store.get();
    search = "";
    filter = "all";
    const view = el("div", { class: "view active" });
    view.appendChild(
      OB.ui.header({
        title: t("nav_pickup"),
        onBack: () => OB.router.go("home"),
        right: [
          { icon: "＋", label: t("add_preorder"), onClick: () => edit(null) },
          { icon: "📥", label: t("import_csv"), onClick: importCsv },
          { icon: "📤", label: t("export_csv"), onClick: exportCsv },
        ],
      })
    );
    const main = el("main");

    // status pills
    const counts = { pending: 0, notified: 0, picked: 0 };
    st.preorders.forEach((p) => (counts[p.status] = (counts[p.status] || 0) + 1));
    const pills = el("div", { class: "status-pills" });
    [["pending", "st_pending"], ["notified", "st_notified"], ["picked", "st_picked"]].forEach(([k, key]) => {
      pills.appendChild(
        el("div", { class: "status-pill " + k, onclick: () => { filter = filter === k ? "all" : k; renderList(); } }, [
          el("span", { class: "n", text: counts[k] || 0 }),
          el("span", { class: "t", text: t(key) }),
        ])
      );
    });
    main.appendChild(pills);

    main.appendChild(
      el("div", { class: "search-box" }, [
        el("input", { type: "search", placeholder: t("search_preorders"), oninput: (e) => { search = e.target.value.trim().toLowerCase(); renderList(); } }),
      ])
    );

    const listEl = el("div", { id: "preList" });
    main.appendChild(listEl);
    view.appendChild(main);
    root.appendChild(view);

    function renderList() {
      const st2 = OB.store.get();
      listEl.innerHTML = "";
      let items = st2.preorders.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      if (filter !== "all") items = items.filter((p) => p.status === filter);
      if (search) items = items.filter((p) => (p.customerName + " " + p.itemsText + " " + (p.contact || "")).toLowerCase().includes(search));
      if (!items.length) {
        listEl.appendChild(OB.ui.emptyState("📋", t("no_preorders")));
        return;
      }
      items.forEach((p) => listEl.appendChild(row(p)));
    }

    function row(p) {
      const badge = el("span", { class: "badge " + p.status, text: t("st_" + p.status) });
      const r = el("div", { class: "list-row" });
      r.appendChild(
        el("div", { class: "list-main", onclick: () => edit(p) }, [
          el("div", { class: "list-title" }, [document.createTextNode(p.customerName || "—"), badge]),
          el("div", { class: "list-sub", text: p.itemsText + (p.contact ? " · " + p.contact : "") }),
        ])
      );
      r.appendChild(
        el("div", { class: "list-end" }, [
          el("div", { class: "list-amount", text: fmtMoney(p.amount) }),
          el("div", { style: "display:flex;gap:4px;margin-top:6px;justify-content:flex-end" }, [
            p.status === "pending" ? el("button", { class: "mini-btn", text: t("st_notified"), onclick: () => mark(p, "notified") }) : null,
            p.status !== "picked" ? el("button", { class: "mini-btn", text: t("st_picked"), onclick: () => mark(p, "picked") }) : null,
            el("button", { class: "mini-btn", text: "📋", onclick: () => copyNotify(p) }),
          ]),
        ])
      );
      return r;
    }

    function mark(p, status) {
      p.status = status;
      OB.store.upsertPreorder(p);
      renderList();
      // refresh pill counts
      OB.router.refresh();
    }

    function copyNotify(p) {
      const msg = t("notify_template", { items: p.itemsText, amount: fmtMoney(p.amount) });
      copyText(msg).then(() => toast(t("copied"), "success"));
    }

    async function importCsv() {
      const f = await U.pickFile(".csv,text/csv");
      if (!f) return;
      const text = await U.readFileText(f);
      const rows = U.parseCSV(text);
      if (!rows.length) return;
      let start = 0;
      const head = rows[0].join(",").toLowerCase();
      if (/customer|顧客|名前|name|品項|item/.test(head)) start = 1;
      let n = 0;
      for (let i = start; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] && !r[2]) continue;
        OB.store.upsertPreorder({
          customerName: (r[0] || "").trim(),
          contact: (r[1] || "").trim(),
          itemsText: (r[2] || "").trim(),
          amount: Math.round(Number(r[3])) || 0,
          deposit: Math.round(Number(r[4])) || 0,
          status: "pending",
        });
        n++;
      }
      toast(t("imported") + " " + n, "success");
      OB.router.refresh();
    }

    function exportCsv() {
      const st2 = OB.store.get();
      const rows = [[t("customer_name"), t("contact"), t("items_text"), t("amount"), t("deposit"), "status"]];
      st2.preorders.forEach((p) => rows.push([p.customerName, p.contact, p.itemsText, p.amount, p.deposit || 0, p.status]));
      U.downloadFile("preorders.csv", U.toCSV(rows), "text/csv");
      toast(t("exported"), "success");
    }

    renderList();
  }

  function edit(po) {
    const isNew = !po;
    const data = po ? Object.assign({}, po) : { customerName: "", contact: "", itemsText: "", amount: 0, deposit: 0, status: "pending" };
    const sh = OB.ui.sheet({ title: isNew ? t("add_preorder") : t("nav_pickup") });

    const nameI = OB.ui.input({ value: data.customerName });
    const contactI = OB.ui.input({ value: data.contact || "", placeholder: "Twitter / Plurk / Line…" });
    const itemsI = el("textarea", { rows: 2 });
    itemsI.value = data.itemsText || "";
    const amountI = OB.ui.input({ type: "number", inputmode: "numeric", value: data.amount });
    const depositI = OB.ui.input({ type: "number", inputmode: "numeric", value: data.deposit || 0 });

    sh.body.appendChild(OB.ui.field(t("customer_name"), nameI));
    sh.body.appendChild(OB.ui.field(t("contact"), contactI));
    sh.body.appendChild(OB.ui.field(t("items_text"), itemsI));
    sh.body.appendChild(el("div", { class: "field-row" }, [OB.ui.field(t("amount"), amountI), OB.ui.field(t("deposit"), depositI)]));

    const saveBtn = el("button", { class: "btn btn-primary", text: t("save"), onclick: save });
    const actions = el("div", { class: "actions" }, [saveBtn]);
    if (!isNew) actions.insertBefore(el("button", { class: "btn btn-secondary", text: t("delete"), onclick: del }), saveBtn);
    sh.footer.appendChild(actions);

    function save() {
      if (!nameI.value.trim() && !itemsI.value.trim()) {
        toast(t("required"), "danger");
        return;
      }
      data.customerName = nameI.value.trim();
      data.contact = contactI.value.trim();
      data.itemsText = itemsI.value.trim();
      data.amount = Math.round(Number(amountI.value)) || 0;
      data.deposit = Math.round(Number(depositI.value)) || 0;
      OB.store.upsertPreorder(data);
      sh.close();
      OB.router.refresh();
    }
    function del() {
      confirmDialog(t("confirm_delete", { name: data.customerName || "—" }), { danger: true }).then((ok) => {
        if (!ok) return;
        OB.store.deletePreorder(data.id);
        sh.close();
        OB.router.refresh();
      });
    }
  }

  OB.router.register("pickup", render);
})();
