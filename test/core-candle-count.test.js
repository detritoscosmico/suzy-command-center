const test = require("node:test");
const assert = require("node:assert/strict");
const { generateDemoCandles } = require("../js/core.js");

test("gera os 120 candles usados pelo laboratório de replay", () => {
  const candles = generateDemoCandles({
    basePrice: 1.0875,
    count: 120,
    intervalMinutes: 5,
    random: () => 0.5,
    endTime: 1_700_000_000_000
  });

  assert.equal(candles.length, 120);
  assert.equal(candles[1].time - candles[0].time, 300_000);
});
