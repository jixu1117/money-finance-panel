# 货币金融学交互学习系统

一个本地优先、可重复运行的交互式教材项目。项目把《货币金融学》的章节内容整理为结构化学习卡、概念词典、SVG 折线图、自测题和可调参数模型，帮助读者从目录进入具体章节，再通过图表和模拟器理解关键概念。

## 功能

- 6 篇 25 章的章节目录，加 1 个学习系统总览模块
- 章节摘要、概念词典、误区澄清和应用说明
- 无外部图表库的 SVG 折线图组件
- 贷款市场、金融体系资金流、货币层次、Fed 利率走廊等互动模块
- 浏览器本地保存学习进度
- Node 本地服务、Docker 部署和计算模型测试

## 本地运行

```bash
npm start
```

浏览器打开：

```text
http://localhost:3000
```

如果你想换端口：

```bash
PORT=3100 npm start
```

## 测试

```bash
npm test
```

## Docker 运行

```bash
docker build -t money-finance-panel .
docker run --rm -p 3000:3000 money-finance-panel
```

## 技术结构

- `public/data.mjs`：章节内容、概念、测验和图表数据
- `public/model.mjs`：可测试的交互计算模型
- `public/app.js`：数据驱动的页面渲染和交互逻辑
- `public/styles.css`：响应式界面样式
- `server.mjs`：零框架静态服务

## 后续扩展

- 在 `public/data.mjs` 追加章节卡片、图表和测验
- 在 `public/model.mjs` 增加新的交互模型
- 接入文档解析和内容结构化流程，减少手动维护成本
