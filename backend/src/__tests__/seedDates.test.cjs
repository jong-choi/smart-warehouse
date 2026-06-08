require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  formatSeedDate,
  getSeedDateRange,
  getWeekdaysBetween,
} = require("../utils/seedDates");

describe("seed date range", () => {
  it("uses the previous Seoul calendar day as the inclusive end", () => {
    const deploymentTime = new Date("2026-06-08T00:30:00+09:00");
    const { start, end } = getSeedDateRange(deploymentTime);

    assert.equal(formatSeedDate(start), "2025-12-07");
    assert.equal(formatSeedDate(end), "2026-06-07");
  });

  it("keeps only weekdays in the inclusive range", () => {
    const days = getWeekdaysBetween(
      new Date("2026-06-05T00:00:00.000Z"),
      new Date("2026-06-08T00:00:00.000Z")
    ).map(formatSeedDate);

    assert.deepEqual(days, ["2026-06-05", "2026-06-08"]);
  });
});
