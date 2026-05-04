import { learningData } from "./data.mjs";
import {
  computeFedCorridor,
  computeLoanMarket,
  computeMoneyLayers,
  formatPercent,
  gradeChoice
} from "./model.mjs";

const storageKey = "money-finance-panel:v1";
const state = {
  chapterId: learningData.chapters[0].id,
  progress: loadProgress()
};

const elements = {
  catalog: document.querySelector("#catalog"),
  chapterTabs: document.querySelector("#chapterTabs"),
  chapterNumber: document.querySelector("#chapterNumber"),
  chapterTitle: document.querySelector("#chapterTitle"),
  chapterKicker: document.querySelector("#chapterKicker"),
  chapterBadge: document.querySelector("#chapterBadge"),
  summaryGrid: document.querySelector("#summaryGrid"),
  insightGrid: document.querySelector("#insightGrid"),
  detailStage: document.querySelector("#detailStage"),
  moduleStage: document.querySelector("#moduleStage"),
  quizBox: document.querySelector("#quizBox"),
  chapterCount: document.querySelector("#chapterCount"),
  quizDone: document.querySelector("#quizDone"),
  progressPct: document.querySelector("#progressPct"),
  resetProgress: document.querySelector("#resetProgress")
};

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(state.progress));
  renderProgress();
}

function byId(id) {
  return learningData.chapters.find((chapter) => chapter.id === id);
}

function renderProgress() {
  const done = learningData.chapters.filter((chapter) => state.progress[chapter.id]?.quizPassed).length;
  const pct = Math.round((done / learningData.chapters.length) * 100);
  elements.chapterCount.textContent = learningData.chapters.length;
  elements.quizDone.textContent = String(done);
  elements.progressPct.textContent = `${pct}%`;
}

function setChapter(id) {
  state.chapterId = id;
  render();
}

function renderCatalog() {
  elements.catalog.innerHTML = "";
  for (const part of learningData.parts) {
    const wrapper = document.createElement("section");
    wrapper.className = "part-card";
    const chapters = part.chapters.map(byId);
    wrapper.innerHTML = `
      <button class="part-head" type="button" aria-expanded="true">
        <span>
          <strong>${part.title}</strong>
          <small>${part.focus}</small>
          <em>${part.range} · ${chapters.length} 章</em>
        </span>
        <span class="chevron">⌄</span>
      </button>
      <div class="part-body"></div>
    `;
    const body = wrapper.querySelector(".part-body");
    const button = wrapper.querySelector(".part-head");
    button.addEventListener("click", () => {
      const isOpen = wrapper.classList.toggle("collapsed");
      button.setAttribute("aria-expanded", String(!isOpen));
    });
    for (const chapter of chapters) {
      const item = document.createElement("button");
      item.className = "chapter-card";
      item.type = "button";
      item.dataset.chapter = chapter.id;
      item.innerHTML = `
        <span class="chapter-icon">${chapter.number.replace("第 ", "").replace(" 章", "")}</span>
        <span>
          <small>${chapter.number}</small>
          <strong>${chapter.title}</strong>
          <em>${chapter.kicker}</em>
        </span>
        <b>${chapter.badge}</b>
      `;
      item.addEventListener("click", () => setChapter(chapter.id));
      body.appendChild(item);
    }
    elements.catalog.appendChild(wrapper);
  }
}

function renderTabs() {
  elements.chapterTabs.innerHTML = "";
  for (const chapter of learningData.chapters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = chapter.id === state.chapterId ? "active" : "";
    button.textContent = chapter.number;
    button.addEventListener("click", () => setChapter(chapter.id));
    elements.chapterTabs.appendChild(button);
  }
}

function renderChapter(chapter) {
  elements.chapterNumber.textContent = chapter.number;
  elements.chapterTitle.textContent = chapter.title;
  elements.chapterKicker.textContent = chapter.kicker;
  elements.chapterBadge.textContent = chapter.badge;

  elements.summaryGrid.innerHTML = chapter.summary
    .map((text, index) => `<div class="summary-card"><span>0${index + 1}</span><p>${text}</p></div>`)
    .join("");

  elements.insightGrid.innerHTML = chapter.cards
    .map((card) => `<div class="insight-card"><strong>${card.label}</strong><p>${card.text}</p></div>`)
    .join("");

  renderDetailStage(chapter);
  renderModule(chapter);
  renderQuiz(chapter);
  markActiveCards();
}

function markActiveCards() {
  document.querySelectorAll("[data-chapter]").forEach((node) => {
    node.classList.toggle("active", node.dataset.chapter === state.chapterId);
    node.classList.toggle("passed", Boolean(state.progress[node.dataset.chapter]?.quizPassed));
  });
}

function slider(label, id, min, max, step, value, suffix) {
  return `
    <label class="control">
      <span><b>${label}</b><output id="${id}Value">${value}${suffix}</output></span>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
    </label>
  `;
}

function renderModule(chapter) {
  if (chapter.module === "pipeline") return renderPipelineModule();
  if (chapter.module === "fed") return renderFedModule();
  if (chapter.module === "money") return renderMoneyModule();
  if (chapter.module === "loan") return renderLoanModule();
  if (chapter.module === "chart") return renderChartModule(chapter);
  return renderFlowModule();
}

function lineChart(chart) {
  const width = 640;
  const height = 260;
  const pad = { top: 26, right: 26, bottom: 42, left: 44 };
  const values = chart.series.flatMap((item) => item.values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const xStep = (width - pad.left - pad.right) / Math.max(1, chart.labels.length - 1);
  const y = (value) => height - pad.bottom - ((value - min) / span) * (height - pad.top - pad.bottom);
  const x = (index) => pad.left + index * xStep;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const gy = pad.top + ratio * (height - pad.top - pad.bottom);
      return `<line x1="${pad.left}" y1="${gy}" x2="${width - pad.right}" y2="${gy}" />`;
    })
    .join("");
  const paths = chart.series
    .map((item) => {
      const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
      const dots = item.values
        .map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3.5" fill="${item.color}" />`)
        .join("");
      return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />${dots}`;
    })
    .join("");
  const labels = chart.labels
    .map((label, index) => `<text x="${x(index)}" y="${height - 14}" text-anchor="middle">${label}</text>`)
    .join("");
  const legend = chart.series
    .map(
      (item, index) => `
        <span><i style="background:${item.color}"></i>${item.name}</span>
      `
    )
    .join("");

  return `
    <div class="chart-card">
      <div class="chart-head">
        <div>
          <p class="eyebrow">Generated visual</p>
          <h3>${chart.title}</h3>
        </div>
        <div class="chart-legend">${legend}</div>
      </div>
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${chart.title}">
        <g class="chart-grid">${grid}</g>
        <g class="chart-paths">${paths}</g>
        <g class="chart-labels">${labels}</g>
      </svg>
      <p class="module-note">${chart.insight}</p>
    </div>
  `;
}

function renderDetailStage(chapter) {
  elements.detailStage.innerHTML = `
    ${lineChart(chapter.chart)}
    <div class="detail-grid">
      <section class="term-card">
        <div class="section-title">
          <p class="eyebrow">Extracted concepts</p>
          <h3>概念词典</h3>
        </div>
        <dl>
          ${chapter.terms.map((term) => `<div><dt>${term.name}</dt><dd>${term.desc}</dd></div>`).join("")}
        </dl>
      </section>
      <section class="term-card">
        <div class="section-title">
          <p class="eyebrow">Learning notes</p>
          <h3>误区与讲法</h3>
        </div>
        <div class="explain-block">
          <strong>常见误区</strong>
          <p>${chapter.misconception}</p>
        </div>
        <div class="explain-block">
          <strong>应用说明</strong>
          <p>${chapter.application}</p>
        </div>
      </section>
    </div>
  `;
}

function renderPipelineModule() {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Content workflow</p>
        <h3>从 PDF 到交互产品</h3>
      </div>
      <span class="status-pill">可替换语料</span>
    </div>
    <div class="pipeline">
      <div><strong>01</strong><span>资料输入</span><small>PDF / 网页 / 文档</small></div>
      <div><strong>02</strong><span>内容解析</span><small>章节、概念、关系</small></div>
      <div><strong>03</strong><span>结构化 JSON</span><small>schema first</small></div>
      <div><strong>04</strong><span>组件编排</span><small>卡片、图表、模拟器</small></div>
      <div><strong>05</strong><span>测试验收</span><small>模型测试和本地部署</small></div>
    </div>
    <p class="module-note">如果把教材换成课程讲义、产品文档或内部知识库，只需要替换数据生成层，渲染和部署层可以复用。</p>
  `;
}

function renderChartModule(chapter) {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Reusable component</p>
        <h3>趋势图组件</h3>
      </div>
      <span class="status-pill">SVG 无依赖</span>
    </div>
    ${lineChart(chapter.chart)}
  `;
}

function renderFedModule() {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Interactive model</p>
        <h3>Fed 利率走廊</h3>
      </div>
      <span id="fedStatus" class="status-pill"></span>
    </div>
    <div class="corridor">
      <div class="rate-line top"><span>IORB 顶</span><strong id="iorbLabel"></strong></div>
      <div class="rate-line effr"><span>EFFR</span><strong id="effrLabel"></strong></div>
      <div class="rate-line bottom"><span>ON RRP 底</span><strong id="onRrpLabel"></strong></div>
    </div>
    <p class="module-note" id="fedNote"></p>
    <div class="control-grid">
      ${slider("IORB · 准备金余额利率", "iorb", 0, 7, 0.05, 4.3, "%")}
      ${slider("ON RRP · 隔夜逆回购利率", "onRrp", 0, 7, 0.05, 2.7, "%")}
      ${slider("银行准备金水平", "reserves", 0.5, 6, 0.1, 3.0, "T")}
    </div>
  `;

  const ids = ["iorb", "onRrp", "reserves"];
  const update = () => {
    const model = computeFedCorridor({
      iorb: document.querySelector("#iorb").value,
      onRrp: document.querySelector("#onRrp").value,
      reserves: document.querySelector("#reserves").value
    });
    document.querySelector("#iorbValue").textContent = `${Number(model.top).toFixed(2)}%`;
    document.querySelector("#onRrpValue").textContent = `${Number(model.bottom).toFixed(2)}%`;
    document.querySelector("#reservesValue").textContent = `${Number(model.reserves).toFixed(1)}T`;
    document.querySelector("#iorbLabel").textContent = formatPercent(model.top, 2);
    document.querySelector("#onRrpLabel").textContent = formatPercent(model.bottom, 2);
    document.querySelector("#effrLabel").textContent = formatPercent(model.effr, 2);
    document.querySelector("#fedStatus").textContent = model.status;
    document.querySelector("#fedNote").textContent = model.note;
    const y = 82 - ((model.effr - model.bottom) / Math.max(0.1, model.top - model.bottom)) * 58;
    document.querySelector(".rate-line.effr").style.top = `${Math.min(78, Math.max(18, y))}%`;
  };
  ids.forEach((id) => document.querySelector(`#${id}`).addEventListener("input", update));
  update();
}

function renderMoneyModule() {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Interactive model</p>
        <h3>货币层次调音台</h3>
      </div>
      <span class="status-pill">流动性</span>
    </div>
    <div class="money-stack">
      <div class="money-bar m0"><span>M0</span><strong id="m0"></strong></div>
      <div class="money-bar m1"><span>M1</span><strong id="m1"></strong></div>
      <div class="money-bar m2"><span>M2</span><strong id="m2"></strong></div>
      <div class="money-bar m3"><span>M3</span><strong id="m3"></strong></div>
    </div>
    <div class="control-grid">
      ${slider("现金", "cash", 0, 100, 1, 28, "")}
      ${slider("活期存款", "demandDeposits", 0, 200, 1, 92, "")}
      ${slider("定期与储蓄存款", "timeDeposits", 0, 300, 1, 160, "")}
      ${slider("货币基金等近似货币", "moneyFunds", 0, 300, 1, 105, "")}
    </div>
  `;
  const ids = ["cash", "demandDeposits", "timeDeposits", "moneyFunds"];
  const update = () => {
    const values = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`).value]));
    const layers = computeMoneyLayers(values);
    for (const key of ["m0", "m1", "m2", "m3"]) {
      document.querySelector(`#${key}`).textContent = layers[key];
      document.querySelector(`.${key}`).style.width = `${Math.max(18, (layers[key] / layers.m3) * 100)}%`;
    }
    ids.forEach((id) => {
      document.querySelector(`#${id}Value`).textContent = document.querySelector(`#${id}`).value;
    });
  };
  ids.forEach((id) => document.querySelector(`#${id}`).addEventListener("input", update));
  update();
}

function renderLoanModule() {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Interactive model</p>
        <h3>贷款市场压力表</h3>
      </div>
      <span id="loanSignal" class="status-pill"></span>
    </div>
    <div class="market-bars">
      <div><span>借款需求</span><meter id="loanDemand" min="0" max="100"></meter><strong id="loanDemandText"></strong></div>
      <div><span>放款供给</span><meter id="loanSupply" min="0" max="100"></meter><strong id="loanSupplyText"></strong></div>
    </div>
    <div class="control-grid">
      ${slider("政策利率", "policyRate", 0, 12, 0.1, 4.5, "%")}
      ${slider("收入增长", "incomeGrowth", -5, 8, 0.1, 2.0, "%")}
      ${slider("风险溢价", "riskPremium", 0, 8, 0.1, 1.8, "%")}
    </div>
  `;
  const ids = ["policyRate", "incomeGrowth", "riskPremium"];
  const update = () => {
    const model = computeLoanMarket(Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`).value])));
    document.querySelector("#loanDemand").value = model.demand;
    document.querySelector("#loanSupply").value = model.supply;
    document.querySelector("#loanDemandText").textContent = model.demand;
    document.querySelector("#loanSupplyText").textContent = model.supply;
    document.querySelector("#loanSignal").textContent = model.signal;
    ids.forEach((id) => {
      const suffix = id === "policyRate" || id === "incomeGrowth" || id === "riskPremium" ? "%" : "";
      document.querySelector(`#${id}Value`).textContent = `${document.querySelector(`#${id}`).value}${suffix}`;
    });
  };
  ids.forEach((id) => document.querySelector(`#${id}`).addEventListener("input", update));
  update();
}

function renderFlowModule() {
  elements.moduleStage.innerHTML = `
    <div class="module-head">
      <div>
        <p class="eyebrow">Interactive model</p>
        <h3>金融体系资金流</h3>
      </div>
      <span class="status-pill">中介价值</span>
    </div>
    <div class="flow-map">
      <div class="flow-node">储蓄者</div>
      <button class="flow-route active" type="button" data-route="market">证券市场</button>
      <button class="flow-route" type="button" data-route="bank">金融中介</button>
      <div class="flow-node">借款者</div>
    </div>
    <p class="module-note" id="flowNote">直接融资适合信息披露充分、可标准化定价的借款人。</p>
  `;
  document.querySelectorAll(".flow-route").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".flow-route").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      document.querySelector("#flowNote").textContent =
        button.dataset.route === "bank"
          ? "金融中介把筛选、监控、期限转换和风险分散打包成服务。"
          : "直接融资适合信息披露充分、可标准化定价的借款人。";
    });
  });
}

function renderQuiz(chapter) {
  const saved = state.progress[chapter.id];
  elements.quizBox.innerHTML = `
    <div class="quiz-head">
      <div>
        <p class="eyebrow">Checkpoint</p>
        <h3>一分钟自测</h3>
      </div>
      <span class="badge">${saved?.quizPassed ? "已掌握" : "待完成"}</span>
    </div>
    <p>${chapter.quiz.prompt}</p>
    <div class="choice-list">
      ${chapter.quiz.choices
        .map((choice, index) => `<button type="button" data-choice="${index}">${choice}</button>`)
        .join("")}
    </div>
    <p class="quiz-result" id="quizResult">${saved?.message || ""}</p>
  `;
  elements.quizBox.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = Number(button.dataset.choice);
      const result = gradeChoice(chapter.quiz, selected);
      state.progress[chapter.id] = {
        quizPassed: result.ok,
        message: result.ok ? `回答正确：${result.explanation}` : `再想想：${result.explanation}`
      };
      saveProgress();
      renderQuiz(chapter);
      markActiveCards();
    });
  });
}

function render() {
  renderTabs();
  renderChapter(byId(state.chapterId));
  renderProgress();
}

elements.resetProgress.addEventListener("click", () => {
  state.progress = {};
  saveProgress();
  render();
});

renderCatalog();
render();
