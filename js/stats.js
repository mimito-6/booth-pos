/* ============================================================
   BOO-POS — Sales statistics (per event)
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};

  function eventStats(state, eventId) {
    const txs = state.transactions.filter((t) => t.eventId === (eventId || state.currentEventId) && !t.voided);
    let revenue = 0;
    let pieces = 0; // total physical pieces moved (combos expanded, incl. freebies)
    let cashRevenue = 0;
    let giftsGiven = 0;
    const byPayment = {}; // name -> {amount, count}
    const byProduct = {}; // productId -> qty

    txs.forEach((tx) => {
      revenue += tx.grandTotal || 0;
      const pm = tx.paymentMethodName || "—";
      if (!byPayment[pm]) byPayment[pm] = { amount: 0, count: 0, type: tx.paymentType || "external" };
      byPayment[pm].amount += tx.grandTotal || 0;
      byPayment[pm].count += 1;
      if (tx.paymentType === "cash") cashRevenue += tx.grandTotal || 0;
      const su = tx.stockUse || {};
      for (const pid in su) {
        pieces += su[pid];
        byProduct[pid] = (byProduct[pid] || 0) + su[pid];
      }
      (tx.lines || []).forEach((l) => {
        if (l.isTokuten) giftsGiven += l.qty;
      });
      if (tx.giftNote) giftsGiven += 0; // gift thresholds tracked separately if needed
    });

    return { count: txs.length, revenue, pieces, cashRevenue, giftsGiven, byPayment, byProduct, txs };
  }

  BOO.stats = { eventStats };
})();
