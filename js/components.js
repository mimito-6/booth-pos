/* ============================================================
   OpenBooth — Shared UI components
   ============================================================ */
(function () {
  window.OB = window.OB || {};
  const { el } = OB.util;
  const t = window.t;

  function header(opts) {
    opts = opts || {};
    const left = el("div", { class: "header-left" });
    if (opts.onBack) {
      left.appendChild(el("button", { class: "back-btn", "aria-label": t("back"), html: "‹", onclick: opts.onBack }));
    }
    const titleWrap = el("div", { style: "min-width:0" }, [el("div", { class: "title", text: opts.title || "" })]);
    if (opts.subtitle) titleWrap.appendChild(el("div", { class: "subtitle", text: opts.subtitle }));
    left.appendChild(titleWrap);

    const top = el("div", { class: "header-top" }, [left]);
    if (opts.right) {
      const r = el("div", { style: "display:flex;gap:6px;align-items:center" });
      (Array.isArray(opts.right) ? opts.right : [opts.right]).forEach((b) => {
        if (!b) return;
        r.appendChild(el("button", { class: "icon-btn", "aria-label": b.label || "", html: b.icon, onclick: b.onClick }));
      });
      top.appendChild(r);
    }
    const h = el("header", { class: "header" }, [top]);
    if (opts.belowNode) h.appendChild(opts.belowNode);
    return h;
  }

  function statsRow(stats) {
    const row = el("div", { class: "stats" });
    stats.forEach((s) => {
      row.appendChild(
        el("div", { class: "stat" }, [
          el("div", { class: "stat-label", text: s.label }),
          el("div", { class: "stat-value " + (s.small ? "small" : ""), html: s.value + (s.unit ? ' <span class="unit">' + OB.util.esc(s.unit) + "</span>" : "") }),
        ])
      );
    });
    return row;
  }

  function emptyState(emoji, text) {
    return el("div", { class: "empty-state" }, [el("span", { class: "emoji", text: emoji || "📦" }), el("div", { text: text || "" })]);
  }

  // Bottom sheet. Returns { root, body, footer, close }
  function sheet(opts) {
    opts = opts || {};
    const overlay = el("div", { class: "sheet-overlay boo-transient open" });
    const sheetEl = el("div", { class: "sheet boo-transient " + (opts.tall ? "tall" : "") });
    const body = el("div", { class: "sheet-body" });
    const footer = el("div", { class: "sheet-footer" });

    function close() {
      overlay.classList.remove("open");
      sheetEl.classList.remove("open");
      setTimeout(() => {
        overlay.remove();
        sheetEl.remove();
      }, 280);
      if (opts.onClose) opts.onClose();
    }

    const head = el("div", { class: "sheet-header" }, [
      el("div", { class: "sheet-title", text: opts.title || "" }),
      el("button", { class: "sheet-close", html: "×", onclick: close }),
    ]);
    sheetEl.appendChild(el("div", { class: "sheet-handle" }));
    sheetEl.appendChild(head);
    sheetEl.appendChild(body);
    if (opts.footer !== false) sheetEl.appendChild(footer);
    overlay.addEventListener("click", close);

    document.body.appendChild(overlay);
    document.body.appendChild(sheetEl);
    requestAnimationFrame(() => {
      overlay.classList.add("open");
      sheetEl.classList.add("open");
    });
    return { root: sheetEl, body, footer, close };
  }

  function field(labelText, inputNode, hint) {
    const f = el("div", { class: "field" }, [el("label", { text: labelText }), inputNode]);
    if (hint) f.appendChild(el("div", { class: "field-hint", text: hint }));
    return f;
  }
  function input(attrs) {
    return el("input", Object.assign({ type: "text" }, attrs || {}));
  }
  function toggle(on, onChange) {
    const tg = el("div", { class: "toggle " + (on ? "on" : "") });
    tg.addEventListener("click", () => {
      const next = !tg.classList.contains("on");
      tg.classList.toggle("on", next);
      onChange(next);
    });
    return tg;
  }

  OB.ui = { header, statsRow, emptyState, sheet, field, input, toggle };
})();
