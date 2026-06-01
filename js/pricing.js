/* ============================================================
   BOO-POS — Pricing engine (pure functions, integer money)
   Pipeline: base price → bundle tiers → manual override →
             tokuten(free) → cart discount → gift thresholds.
   No floats: all amounts are integers in the smallest unit.
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};

  // Greedy bundle pricing for a single product line.
  // rules: [{qty, price, label}] ; returns {total, note}
  function applyBundle(unitPrice, qty, rules) {
    if (!rules || !rules.length) return { total: unitPrice * qty, note: "" };
    const sorted = rules.slice().filter((r) => r.qty > 0 && r.price >= 0).sort((a, b) => b.qty - a.qty);
    let remaining = qty;
    let total = 0;
    const notes = [];
    for (const r of sorted) {
      if (remaining >= r.qty) {
        const n = Math.floor(remaining / r.qty);
        total += n * r.price;
        remaining -= n * r.qty;
        notes.push((r.label || r.qty + "→" + r.price) + " ×" + n);
      }
    }
    total += remaining * unitPrice;
    return { total, note: notes.join(" · ") };
  }

  // Compute a full sale from cart lines.
  function calcSale(state, cart) {
    const lines = [];
    let originalTotal = 0;
    let subtotal = 0;
    let itemCount = 0;

    (cart.lines || []).forEach((cl) => {
      if (cl.qty <= 0) return;
      let name = "",
        basePrice = 0,
        rules = null,
        kind = cl.kind;
      if (cl.kind === "product") {
        const p = state.products.find((x) => x.id === cl.refId);
        if (!p) return;
        name = p.name;
        basePrice = p.price;
        rules = p.bundleRules;
      } else {
        const c = state.combos.find((x) => x.id === cl.refId);
        if (!c) return;
        name = c.name;
        basePrice = c.price;
      }
      itemCount += cl.qty;

      const original = basePrice * cl.qty;
      let lineTotal,
        note = "",
        effUnit = basePrice;

      if (cl.isTokuten) {
        lineTotal = 0;
        effUnit = 0;
      } else if (cl.manualUnitPrice != null) {
        effUnit = Math.round(cl.manualUnitPrice);
        lineTotal = effUnit * cl.qty;
      } else if (cl.kind === "product" && rules && rules.length) {
        const b = applyBundle(basePrice, cl.qty, rules);
        lineTotal = b.total;
        note = b.note;
      } else {
        lineTotal = original;
      }

      lines.push({
        uid: cl.uid,
        kind,
        refId: cl.refId,
        name,
        qty: cl.qty,
        isTokuten: !!cl.isTokuten,
        manual: cl.manualUnitPrice != null,
        unitPrice: effUnit,
        basePrice,
        lineTotal,
        bundleNote: note,
      });
      originalTotal += cl.isTokuten ? 0 : original;
      subtotal += lineTotal;
    });

    const discount = Math.max(0, Math.round(cart.discount || 0));
    const bundleSaved = Math.max(0, originalTotal - subtotal);
    const grandTotal = Math.max(0, subtotal - discount);

    // gift thresholds (use grandTotal pre-gift, i.e. what they spend)
    const gifts = (state.giftThresholds || [])
      .filter((g) => g.enabled && grandTotal >= g.minAmount)
      .sort((a, b) => b.minAmount - a.minAmount);

    return { lines, originalTotal, subtotal, bundleSaved, discount, grandTotal, itemCount, gifts };
  }

  BOO.pricing = { calcSale, applyBundle };
})();
