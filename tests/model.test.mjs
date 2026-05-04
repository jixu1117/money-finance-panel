import assert from "node:assert/strict";
import {
  computeFedCorridor,
  computeLoanMarket,
  computeMoneyLayers,
  gradeChoice
} from "../public/model.mjs";

const fed = computeFedCorridor({ iorb: 4.3, onRrp: 2.7, reserves: 3 });
assert.equal(fed.status, "正常");
assert.ok(fed.effr >= fed.bottom);
assert.ok(fed.effr <= fed.top + 0.35);

const tightFed = computeFedCorridor({ iorb: 4.3, onRrp: 2.7, reserves: 1.2 });
assert.equal(tightFed.status, "偏紧");

const money = computeMoneyLayers({
  cash: 10,
  demandDeposits: 20,
  timeDeposits: 30,
  moneyFunds: 40
});
assert.deepEqual(money, { m0: 10, m1: 30, m2: 60, m3: 100 });

const loan = computeLoanMarket({ policyRate: 2, incomeGrowth: 5, riskPremium: 1 });
assert.ok(loan.demand > 50);
assert.ok(["均衡附近", "资金偏宽", "融资偏紧"].includes(loan.signal));

const result = gradeChoice({ answer: 1, explanation: "ok" }, 1);
assert.equal(result.ok, true);

console.log("model tests passed");
