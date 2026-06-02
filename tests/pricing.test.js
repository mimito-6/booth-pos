const assert = require("node:assert/strict");

global.window = { OB: {} };
global.OB = window.OB;
require("../js/pricing.js");

const { calcSale } = window.OB.pricing;

function run(name, fn) {
  try {
    fn();
    return { name, ok: true };
  } catch (error) {
    return { name, ok: false, error };
  }
}

const state = {
  products: [
    {
      id: "sticker",
      name: "Sticker",
      price: 40,
      bundleRules: [
        { qty: 3, price: 100, label: "3 for 100" },
        { qty: 5, price: 150, label: "5 for 150" },
      ],
    },
    { id: "print", name: "Print", price: 80, bundleRules: [] },
    { id: "book", name: "Book", price: 120, bundleRules: [] },
  ],
  combos: [{ id: "set", name: "Set", price: 150 }],
  giftThresholds: [{ id: "gift", minAmount: 500, rewardText: "Bonus card", enabled: true }],
};

const sale = calcSale(state, {
  discount: 70,
  lines: [
    { uid: "a", kind: "product", refId: "sticker", qty: 8 },
    { uid: "b", kind: "combo", refId: "set", qty: 2 },
    { uid: "c", kind: "product", refId: "print", qty: 1, isTokuten: true },
    { uid: "d", kind: "product", refId: "book", qty: 2, manualUnitPrice: 60 },
  ],
});

const results = [
  run("multi-tier bundle pricing is greedy", () => {
    const line = sale.lines.find((l) => l.refId === "sticker");
    assert.equal(line.lineTotal, 250);
    assert.match(line.bundleNote, /5 for 150/);
    assert.match(line.bundleNote, /3 for 100/);
  }),
  run("combo line totals use combo price and quantity", () => {
    const line = sale.lines.find((l) => l.refId === "set");
    assert.equal(line.lineTotal, 300);
    assert.equal(line.unitPrice, 150);
  }),
  run("freebie lines cost 0", () => {
    const line = sale.lines.find((l) => l.refId === "print");
    assert.equal(line.lineTotal, 0);
    assert.equal(line.unitPrice, 0);
  }),
  run("manual price override replaces base unit price", () => {
    const line = sale.lines.find((l) => l.refId === "book");
    assert.equal(line.unitPrice, 60);
    assert.equal(line.lineTotal, 120);
    assert.equal(line.manual, true);
  }),
  run("cart discount lowers grand total", () => {
    assert.equal(sale.subtotal, 670);
    assert.equal(sale.discount, 70);
    assert.equal(sale.grandTotal, 600);
  }),
  run("gift threshold triggers from grand total", () => {
    assert.deepEqual(sale.gifts.map((g) => g.rewardText), ["Bonus card"]);
  }),
];

const failed = results.filter((r) => !r.ok);
results.forEach((r) => {
  console.log((r.ok ? "PASS" : "FAIL") + " " + r.name);
  if (!r.ok) console.error(r.error.stack || r.error.message);
});

if (failed.length) {
  console.error(`${failed.length}/${results.length} pricing tests failed`);
  process.exit(1);
}

console.log(`${results.length}/${results.length} pricing tests passed`);
