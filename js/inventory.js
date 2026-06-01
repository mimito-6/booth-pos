/* ============================================================
   BOO-POS — Inventory (derived stock)
   Stock is GLOBAL (shared across events): remaining =
   stockInitial − sum(stockUse over non-voided transactions)
   − current cart projection. Sales STATS are per-event
   (see record view). Combos are expanded into product usage
   at checkout time and snapshotted on the transaction, so
   later combo edits never corrupt historical stock math.
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};

  // Expand a set of cart lines into {productId: qtyConsumed}.
  function computeStockUse(state, lines) {
    const use = {};
    (lines || []).forEach((cl) => {
      if (cl.qty <= 0) return;
      if (cl.kind === "product") {
        use[cl.refId] = (use[cl.refId] || 0) + cl.qty;
      } else {
        const c = state.combos.find((x) => x.id === cl.refId);
        if (!c) return;
        (c.uses || []).forEach((u) => {
          use[u.productId] = (use[u.productId] || 0) + u.qty * cl.qty;
        });
      }
    });
    return use;
  }

  // Total consumed across all committed (non-voided) transactions, all events.
  function soldGlobal(state) {
    const sold = {};
    state.transactions.forEach((tx) => {
      if (tx.voided) return;
      const su = tx.stockUse || {};
      for (const pid in su) sold[pid] = (sold[pid] || 0) + su[pid];
    });
    return sold;
  }

  // Remaining for a product, optionally subtracting the current cart.
  function remaining(state, cart, productId) {
    const p = state.products.find((x) => x.id === productId);
    if (!p) return 0;
    const init = Number(p.stockInitial);
    if (!isFinite(init)) return Infinity; // unlimited stock if blank
    const sold = soldGlobal(state)[productId] || 0;
    const cartUse = cart ? computeStockUse(state, cart.lines)[productId] || 0 : 0;
    return init - sold - cartUse;
  }

  function canAddProduct(state, cart, productId) {
    return remaining(state, cart, productId) >= 1;
  }

  function canAddCombo(state, cart, comboId) {
    const c = state.combos.find((x) => x.id === comboId);
    if (!c) return false;
    return (c.uses || []).every((u) => remaining(state, cart, u.productId) >= u.qty);
  }

  // For STOCK page: remaining ignoring cart (committed sales only).
  function committedRemaining(state, productId) {
    return remaining(state, null, productId);
  }
  function soldCount(state, productId) {
    return soldGlobal(state)[productId] || 0;
  }

  BOO.inventory = {
    computeStockUse,
    soldGlobal,
    remaining,
    canAddProduct,
    canAddCombo,
    committedRemaining,
    soldCount,
  };
})();
