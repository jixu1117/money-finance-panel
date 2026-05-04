export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function formatPercent(value, digits = 2) {
  return `${Number(value).toFixed(digits)}%`;
}

export function computeFedCorridor({ iorb, onRrp, reserves }) {
  const top = clamp(iorb, 0, 10);
  const bottom = clamp(onRrp, 0, 10);
  const reserveLevel = clamp(reserves, 0.5, 6);
  const spread = Math.max(0.05, top - bottom);
  const scarcityPenalty = reserveLevel < 2.2 ? (2.2 - reserveLevel) * 0.38 : 0;
  const abundantReservesDrag = reserveLevel > 4.2 ? (reserveLevel - 4.2) * 0.04 : 0;
  const effr = clamp(bottom + spread * 0.72 + scarcityPenalty - abundantReservesDrag, bottom, top + 0.35);
  const targetMid = (top + bottom) / 2;
  const distance = Math.abs(effr - targetMid);

  let status = "正常";
  let note = "IORB 顶和 ON RRP 底有效夹住 EFFR，充足准备金框架运行平稳。";
  if (reserveLevel < 1.6) {
    status = "偏紧";
    note = "准备金偏少，银行间借贷价格容易顶到走廊上沿。";
  } else if (distance > 0.8) {
    status = "需校准";
    note = "工具利差较宽，EFFR 与政策意图的距离变大。";
  }

  return {
    top,
    bottom,
    reserves: reserveLevel,
    effr: Number(effr.toFixed(2)),
    spread: Number(spread.toFixed(2)),
    targetMid: Number(targetMid.toFixed(2)),
    status,
    note
  };
}

export function computeMoneyLayers({ cash, demandDeposits, timeDeposits, moneyFunds }) {
  const m0 = clamp(cash, 0, 100);
  const m1 = m0 + clamp(demandDeposits, 0, 200);
  const m2 = m1 + clamp(timeDeposits, 0, 300);
  const m3 = m2 + clamp(moneyFunds, 0, 300);
  return {
    m0: Number(m0.toFixed(1)),
    m1: Number(m1.toFixed(1)),
    m2: Number(m2.toFixed(1)),
    m3: Number(m3.toFixed(1))
  };
}

export function computeLoanMarket({ policyRate, incomeGrowth, riskPremium }) {
  const rate = clamp(policyRate, 0, 12);
  const income = clamp(incomeGrowth, -5, 8);
  const risk = clamp(riskPremium, 0, 8);
  const demand = clamp(72 + income * 4.2 - rate * 5.4 - risk * 2.2, 5, 100);
  const supply = clamp(38 + rate * 5.8 - risk * 4.8, 5, 100);
  const gap = Number((supply - demand).toFixed(1));
  let signal = "均衡附近";
  if (gap > 15) signal = "资金偏宽";
  if (gap < -15) signal = "融资偏紧";
  return {
    demand: Number(demand.toFixed(1)),
    supply: Number(supply.toFixed(1)),
    gap,
    signal
  };
}

export function gradeChoice(question, selected) {
  return {
    ok: question.answer === selected,
    answer: question.answer,
    explanation: question.explanation
  };
}
