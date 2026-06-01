/* ============================================================
   OpenBooth — Utilities
   ============================================================ */
(function () {
  window.OB = window.OB || {};
  const t = window.t;

  // ---- DOM ----
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function")
          node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  // ---- Security: escape user-entered strings before innerHTML ----
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---- Money (integer-only; no floats) ----
  function fmtMoney(n) {
    const s = window.OB.store ? window.OB.store.get().settings : null;
    const symbol = s ? s.currencySymbol : "NT$";
    const code = s ? s.currencyCode : "TWD";
    const v = Math.round(Number(n) || 0);
    let body;
    try {
      body = v.toLocaleString(code === "JPY" ? "ja-JP" : "en-US");
    } catch (e) {
      body = String(v);
    }
    return symbol + body;
  }

  // common denominations by currency, used for cash quick-keys
  function denominations() {
    const s = window.OB.store ? window.OB.store.get().settings : null;
    const code = s ? s.currencyCode : "TWD";
    if (code === "JPY") return [100, 500, 1000, 5000, 10000];
    if (code === "USD") return [1, 5, 10, 20, 50, 100];
    return [50, 100, 500, 1000]; // TWD default
  }

  // ---- ids ----
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
  }

  // ---- dates ----
  function fmtTime(ts) {
    const loc = window.OB.i18n.getLocale();
    const map = { "zh-Hant": "zh-TW", ja: "ja-JP", en: "en-US" };
    try {
      return new Date(ts).toLocaleTimeString(map[loc] || "zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }
  function fmtDate(ts) {
    const loc = window.OB.i18n.getLocale();
    const map = { "zh-Hant": "zh-TW", ja: "ja-JP", en: "en-US" };
    try {
      return new Date(ts).toLocaleDateString(map[loc] || "zh-TW");
    } catch (e) {
      return "";
    }
  }

  // ---- toast ----
  let toastTimer;
  function toast(msg, type) {
    let node = $("#toast");
    if (!node) {
      node = el("div", { id: "toast", class: "toast" });
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.className = "toast show " + (type || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 1900);
  }

  // ---- clipboard ----
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fallback
      const ta = el("textarea", { style: "position:fixed;opacity:0" });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e2) {}
      document.body.removeChild(ta);
      return true;
    }
  }

  // ---- file download / upload ----
  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: (mime || "text/plain") + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function pickFile(accept) {
    return new Promise((resolve) => {
      const input = el("input", { type: "file", accept: accept || "*", style: "display:none" });
      input.addEventListener("change", () => {
        resolve(input.files && input.files[0] ? input.files[0] : null);
      });
      document.body.appendChild(input);
      input.click();
      setTimeout(() => document.body.removeChild(input), 60000);
    });
  }
  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsText(file);
    });
  }

  // ---- image downscale → dataURL (keeps storage small) ----
  function fileToScaledDataURL(file, maxDim, quality) {
    maxDim = maxDim || 360;
    quality = quality || 0.8;
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = el("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = r.result;
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ---- CSV ----
  function toCSV(rows) {
    // rows: array of arrays
    return (
      "﻿" +
      rows
        .map((r) => r.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(","))
        .join("\r\n")
    );
  }
  function parseCSV(text) {
    // minimal RFC-4180-ish parser; handles quotes, commas, newlines
    text = text.replace(/^﻿/, "");
    const rows = [];
    let row = [],
      field = "",
      inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQ = false;
        } else field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") {
          row.push(field);
          field = "";
        } else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else field += c;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim() !== ""));
  }

  // ---- confirm sheet (replaces native confirm for nicer UX) ----
  function confirmDialog(message, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const overlay = el("div", { class: "sheet-overlay open", style: "z-index:300" });
      const sheet = el("div", { class: "sheet open", style: "z-index:301;max-height:auto" });
      const body = el("div", { class: "sheet-body", style: "padding:24px 20px 8px" }, [
        el("div", { style: "font-size:16px;line-height:1.5", text: message }),
      ]);
      const footer = el("div", { class: "sheet-footer" });
      const actions = el("div", { class: "actions" });
      const noBtn = el("button", { class: "btn btn-secondary", text: opts.no || t("no") });
      const yesBtn = el("button", {
        class: "btn " + (opts.danger ? "btn-primary" : "btn-primary"),
        text: opts.yes || t("yes"),
      });
      if (opts.danger) yesBtn.style.background = "var(--danger)";
      function close(v) {
        overlay.classList.remove("open");
        sheet.classList.remove("open");
        setTimeout(() => {
          overlay.remove();
          sheet.remove();
        }, 250);
        resolve(v);
      }
      noBtn.addEventListener("click", () => close(false));
      yesBtn.addEventListener("click", () => close(true));
      overlay.addEventListener("click", () => close(false));
      actions.appendChild(noBtn);
      actions.appendChild(yesBtn);
      footer.appendChild(actions);
      sheet.appendChild(el("div", { class: "sheet-handle" }));
      sheet.appendChild(body);
      sheet.appendChild(footer);
      document.body.appendChild(overlay);
      document.body.appendChild(sheet);
    });
  }

  OB.util = {
    $,
    $$,
    el,
    esc,
    fmtMoney,
    denominations,
    uuid,
    fmtTime,
    fmtDate,
    toast,
    copyText,
    downloadFile,
    pickFile,
    readFileText,
    fileToScaledDataURL,
    toCSV,
    parseCSV,
    confirmDialog,
  };
})();
