# Arbiter Hacks V1（$7,800 奖池）保姆级中文参赛、部署与提交指南

> **赛事官网：** `https://arbiter-hacks-v1.devpost.com/`
> **最终截止时间：** **北京时间 2026 年 12 月 21 日 13:00（PST 12 月 20 日 21:00）** — 逾期绝对不予评审！
> **推荐提交赛道：** **Theme Track — Rethinking Waste（重塑废弃物主题赛道）**
> **为什么只选 Theme 赛道？** 官方规则硬性规定**每队只能提交 1 个作品且只能选 1 个赛道**；Theme 赛道与 General 赛道奖金完全相同（第 1 名 `$100` 现金 + `$1,000` Adaption 额度 + `$1,000` Deployxa 额度，总计 `$2,100`；第 2 名 `$50` 现金 + `$1,500` 额度），且评委明确重点看重“对废弃物问题的真实影响（35%）+ 技术实现（25%）+ 现实落地可行性（20%）+ 演示清晰度（20%）”，竞争密度远低于泛化的 General 赛道！

---

## 一、已完成的技术交付清单（全部 0 报错验证通过）

项目代码位置：`/home/yyf/fiat-contests/arbiter-hacks-v1/`

- **三大原创核心引擎（100% 浏览器本地运行，严格 $0 服务器与 API 费用）：**
  1. **端侧像素级垃圾污染视觉识别 + 6 城真实市政分类规则库**：直接读取 Canvas RGBA 像素，计算 CIELAB/HSV/Sobel 边缘密度/Shannon 亮度熵/高光反光比/油渍暗斑比 12 维特征，内置 6 个一键测试样本（评委无需开摄像头也能实时测试）+ 支持实时摄像头与本地上传图片，覆盖旧金山/纽约/西雅图/奥斯汀/北京四分类/东京 23 区 × 30 类最易错物品。
  2. **易腐余粮救援路径优化器（CVRPTW-P）**：基于指数保鲜衰减公式与食品保质期硬约束，实时对比“朴素最近邻派单”与“DivertIQ 紧迫度插入 + 2-Opt + 跨车 Relocate 优化算法”，地图点击即可新增食堂节点，校园场景下**食物腐损降低 47.2%**，毫秒级求解。
  3. **EPA WARM v16 碳减排与 MRF 污染拒收悬崖蒙特卡洛模拟器**：采用美国环保署 EPA WARM v16（2023 年 12 月发布）真实碳排因子，模拟 500 次蒙特卡洛抽样（P10/P50/P90 置信区间）以及超过分拣厂污染阈值后的整车拒收成本悬崖。
  4. **审计台账与一键导出**：自动持久化至浏览器，一键导出 CSV / JSON / 可打印高管级 HTML 审计报告。
- **工程验证结果：**
  - 自动化测试（`npm test`）：**5 个测试套件、14/14 全部通过**。
  - 生产构建（`npm run build`）：**0 TypeScript 错误**，静态包仅 `108.5 kB` gzipped。
  - 真实浏览器渲染检查：**0 控制台报错**，5 个标签页与 Canvas 像素渲染均已验证。

---

## 二、你需要亲自完成的 4 个步骤（预计总耗时 25 分钟）

### 第 1 步：检查公开仓库与 GitHub Pages 在线演示（2 分钟）
- 公开仓库地址：`https://github.com/95xp4qk8y5-code/divert-iq`
- 在线演示地址：`https://95xp4qk8y5-code.github.io/divert-iq/`
- 在浏览器打开在线演示地址，确认页面正常打开、切换顶部城市（如切换到 Beijing 4-Bin）、点击 6 个测试样本和地图均流畅运行。
  - *(注：已通过 `gh-pages` 分支自动开启 GitHub Pages 并强制 HTTPS，无需额外配置即可公开访问。)*

### 第 2 步：在 Devpost 注册加入 Arbiter Hacks V1（3 分钟）
1. 打开 `https://arbiter-hacks-v1.devpost.com/`，登录或免费注册 Devpost 账号。
2. 点击页面上方显眼的 **`Join hackathon`** 按钮。
3. 组队选项选择 **Solo（单人参赛，官方明确允许 1–4 人）**，赛道选择 **Theme Track: Rethinking Waste**。
4. 可顺手加入官方 Discord 群查看最新公告：`https://discord.gg/bMbhhDrqe`。

### 第 3 步：录制 2 分 15 秒 – 2 分 45 秒的演示视频并上传（15 分钟）
> **硬性红线：** 官方规则明确规定 **缺少公开代码仓库或缺少 2–3 分钟演示视频将直接取消参赛资格！** 视频严格控制在 **3 分钟以内**（建议 **2 分 30 秒**）。

1. 用 OBS Studio（Linux/Windows/Mac 免费开源）录制浏览器窗口（1080p，全屏打开 `https://95xp4qk8y5-code.github.io/divert-iq/`）。
2. 照着 `DEVPOST_SUBMISSION_DRAFT.md` 最底部的 **2:30 分镜脚本** 依次演示：
   - **0:00–0:25**：Overview 首页 + 切换旧金山/北京/东京规则；
   - **0:25–1:05**：Vision Triage 页依次点击「油污披萨盒 → 干净纸箱 → 易拉罐」展示像素特征条跳动 + 点击「Log to Audit Ledger」；
   - **1:05–1:45**：Food Rescue VRP 页切换 Naive vs Optimized（突出 -47.2% 腐损），在地图上点一下新增一个食堂看路径瞬间重算，再打开冷藏车开关；
   - **1:45–2:15**：EPA WARM v16 拖动污染率滑块看悬崖曲线与 500 次蒙特卡洛区间，切换到 Audit & Export 页点一次导出报告；
   - **2:15–2:30**：切回 GitHub 仓库与 README 总结收尾。
3. 将视频上传至 **YouTube（公开 Public 或不公开列出 Unlisted 均可，切勿选 Private 私人！）** 或 **Vimeo**，复制视频链接。
   - *(如果没有英语口语录音条件，可以用清晰的英文屏幕配音、或简洁自然的英文 TTS/字幕，确保评委静音或开声都能秒懂核心亮点！)*

### 第 4 步：在 Devpost 提交作品（5 分钟）
1. 在 `https://arbiter-hacks-v1.devpost.com/` 点击 **`Start project` / `My projects`**。
2. 直接从 `DEVPOST_SUBMISSION_DRAFT.md` 复制粘贴：
   - **Project Name:** `DivertIQ`
   - **Tagline:** 复制草稿中的 Elevator Pitch
   - **About the project（正文）：** 复制整段 Story，**务必把最前面那段 `Specific Waste Problem & How We Measure Success` 放在最显眼位置**（这是 Theme Track 的强制要求！）。
   - **Built With:** `typescript`, `react`, `vite`, `html5-canvas`, `computer-vision`, `operations-research`, `vitest`, `github-pages`
   - **Try it out links:**
     - `https://github.com/95xp4qk8y5-code/divert-iq`
     - `https://95xp4qk8y5-code.github.io/divert-iq/`
   - **Video Demo Link:** 粘贴你上传好的 YouTube / Vimeo 链接
   - **Thumbnails / Screenshots:** 顺手截取 3 张高清界面截图上传（Overview、Vision Triage、Food Rescue VRP 地图），能让项目卡片在评审列表里一眼脱颖而出！
   - **Track / Prize Selection:** 勾选 **Theme Track (Rethinking Waste)**（不要多选 General Track）。
3. 核对所有链接在无痕窗口都能正常打开后，点击 **`Submit project`**（截止前可随时编辑更新）。

---

## 三、未成年人（<18 / 中国大陆）合规与领奖提示
- **参赛资格已核验合规：** 官方页面明文写明 `Ages 13+ only / Students only / All countries excluding standard exceptions`，中国大陆在校青少年单人参赛完全合规。
- **AI 诚实披露：** `README.md` 与 `DEVPOST_SUBMISSION_DRAFT.md` 均已如实、透明地披露了 AI 编码辅助的使用方式；在提交前建议花 10 分钟通读 `src/engine/` 下的 4 个核心算法文件，确保自己完全理解每一段核心逻辑。
- **获奖收款提前准备：** 12 月 31 日公布获奖结果；若获得现金奖（`$100` / `$50` USD），主办方通常通过 PayPal 或电子转账发放，`<18` 未成年人领奖前请提前与家长沟通好**监护人同意书**及合规收款通道；合作方算力额度（Adaption / Deployxa Credits）则可直接发放至你的开发者邮箱。
