/* ============================================================
   BOO-POS — EVENT view (multi-session switching)
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};
  const U = BOO.util;
  const { el, esc, fmtMoney, toast, confirmDialog } = U;
  const t = window.t;

  function render(root) {
    const st = BOO.store.get();
    const view = el("div", { class: "view active" });
    view.appendChild(
      BOO.ui.header({
        title: t("nav_event"),
        onBack: () => BOO.router.go("home"),
        right: [{ icon: "＋", label: t("add_event"), onClick: () => edit(null) }],
      })
    );
    const main = el("main");

    st.events
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .forEach((ev) => {
        const isCurrent = ev.id === st.currentEventId;
        const stats = BOO.stats.eventStats(st, ev.id);
        const row = el("div", { class: "list-row" });
        const main2 = el("div", { class: "list-main", onclick: () => edit(ev) }, [
          el("div", { class: "list-title" }, [
            document.createTextNode(ev.name || t("no_event")),
            isCurrent ? el("span", { class: "badge notified", text: t("current_event") }) : null,
          ]),
          el("div", { class: "list-sub", text: (ev.date || "") + (ev.location ? " · " + ev.location : "") + " · " + fmtMoney(stats.revenue) + " / " + stats.count + t("unit_tx") }),
        ]);
        row.appendChild(main2);
        if (!isCurrent) {
          row.appendChild(el("button", { class: "btn btn-secondary btn-sm", style: "flex:none", text: t("switch_event"), onclick: () => doSwitch(ev) }));
        }
        main.appendChild(row);
      });

    view.appendChild(main);
    root.appendChild(view);

    function doSwitch(ev) {
      confirmDialog(t("confirm_switch", { name: ev.name || t("no_event") })).then((ok) => {
        if (!ok) return;
        BOO.store.switchEvent(ev.id);
        toast(t("switched_event"), "success");
        BOO.router.go("home");
      });
    }
  }

  function edit(ev) {
    const isNew = !ev;
    const data = ev ? Object.assign({}, ev) : { name: "", date: BOO.store.todayISO(), location: "", note: "", startFloat: 0 };
    const sh = BOO.ui.sheet({ title: isNew ? t("add_event") : t("nav_event") });

    const nameI = BOO.ui.input({ value: data.name, placeholder: "CWT / FF / Comiket Day1…" });
    const dateI = BOO.ui.input({ type: "date", value: data.date });
    const locI = BOO.ui.input({ value: data.location || "", placeholder: t("event_location") });
    const floatI = BOO.ui.input({ type: "number", inputmode: "numeric", value: data.startFloat || 0 });

    sh.body.appendChild(BOO.ui.field(t("event_name"), nameI));
    sh.body.appendChild(el("div", { class: "field-row" }, [BOO.ui.field(t("event_date"), dateI), BOO.ui.field(t("start_float"), floatI)]));
    sh.body.appendChild(BOO.ui.field(t("event_location"), locI));

    const saveBtn = el("button", { class: "btn btn-primary", text: t("save"), onclick: save });
    const actions = el("div", { class: "actions" }, [saveBtn]);
    if (!isNew && BOO.store.get().events.length > 1) {
      actions.insertBefore(el("button", { class: "btn btn-secondary", text: t("delete"), onclick: del }), saveBtn);
    }
    sh.footer.appendChild(actions);

    function save() {
      data.name = nameI.value.trim();
      data.date = dateI.value;
      data.location = locI.value.trim();
      data.startFloat = Math.max(0, Math.round(Number(floatI.value)) || 0);
      BOO.store.upsertEvent(data);
      sh.close();
      toast(t("save") + " ✓", "success");
    }
    function del() {
      confirmDialog(t("confirm_delete", { name: data.name || t("no_event") }), { danger: true }).then((ok) => {
        if (!ok) return;
        if (BOO.store.deleteEvent(data.id)) sh.close();
      });
    }
  }

  BOO.router.register("event", render);
})();
