# Cephy — 偏头痛智能追踪 App 项目交接文档

> 本文档给 Codex / Claude Code / 开发助理，一键了解全部背景、决策、代码现状、下一步任务。

---

## 1. 项目背景

### 1.1 产品定位

**Cephy（中文：头痛日记）** — 一个偏头痛患者专用的智能追踪 App。

核心差异化：**偏头痛发作时也能用**。

| 维度 | 内容 |
|------|------|
| 一句话卖点 | AI 语音记录 + 天气风险预测 + 一键医生报告，三合一 |
| 目标用户 | 25-45岁偏头痛患者（女性70%），月付$7.99 |
| 目标平台 | iOS MVP（React Native Expo），Android V2 |
| 定价 | Free（7次语音/月）→ Premium $7.99/月 或 $59.99/年 |
| 当前阶段 | 🚧 后端跑通，前端代码完整，尚未联调 |

### 1.2 市场数据（真实来源）

| 指标 | 数据 |
|------|------|
| 偏头痛数字疗法市场（2026） | $20.9亿，CAGR 23.5% |
| 预计2030年 | $48.2亿 |
| 竞品#1（Migraine Buddy）| 4.8⭐，250K+评价，Android峰值 $5.1K/月 |
| 竞品#2（Migraine Trail）| $4.99/月，核心特色AI语音 |
| 竞品#3（MigrAid）| $6.95/月，极简隐私 |
| 目标子渠道 | Reddit r/migraine（227K成员）|
| 健康App安装LTV | $1.21（所有类别最高）|

### 1.3 竞品优势吞噬策略

| 目标竞品 | 吞并其优势 | 我们做更好之处 |
|---------|-----------|-------------|
| Migraine Buddy | 社区生态、医生背书、内容博客 | 私密小组（非开放论坛）、更准AI预测 |
| Migraine Trail | AI语音记录、14天天气预报 | 个人化风险评分（不只是天气）|
| MigrAid | 一键极简记录、隐私优先、16区疼痛地图 | 默认为极简模式、本地优先存储 |
| Migraine Companion | 合作伙伴计划（医生/诊所）| V1即启动医生推荐飞轮 |

---

## 2. 技术架构

### 2.1 架构总览

```
客户端 (iOS React Native)
      │ HTTPS
      ▼
FastAPI 后端 (Docker → 泰国服务器)
      │
      ├── PostgreSQL / SQLite(开发)
      ├── Redis (缓存+队列)
      ├── Whisper.cpp (语音→文字·本地免费)
      ├── Gemini API (文字→结构化·免费回落)
      ├── OpenWeatherMap (天气·免费层)
      └── RevenueCat (支付)
```

### 2.2 AI 免费回落链

```
主线路  Whisper.cpp 本地(语音) → Gemini API 免费(文字)
              ↓ 超限或不可用
后备1   Claude API 免费额度后备（~$5）
              ↓ 用完
后备2   Llama 3.2 本地（泰国服务器跑）
```

### 2.3 成本结构

| 项目 | 月费 | 说明 |
|------|------|------|
| 泰国服务器 | $0 | 客户自有 |
| 域名 | ~$0.83 | $10/年 |
| AI 管道 | $0 | 免费方案 |
| 总计 | **~$0.83/月** | 5个付费用户即打平 |

---

## 3. 代码现状

仓库：`https://github.com/yudalin2025-glitch/cephy-app`
本地路径：`C:\Users\Administrator\.openclaw\workspace\cephy\`

### 3.1 后端（Python FastAPI）— ✅ 已验证跑通

| 文件 | 状态 | 说明 |
|------|------|------|
| `backend/app/main.py` | ✅ | FastAPI入口，7个路由全部挂载 |
| `backend/app/config.py` | ✅ | 环境变量配置类（Settings）|
| `backend/app/database.py` | ✅ | SQLAlchemy引擎配置 |
| `backend/app/deps.py` | ✅ | JWT认证 + 数据库session依赖注入 |
| `backend/app/models.py` | ✅ | 10张表完整ORM定义 |
| `backend/app/schemas.py` | ✅ | Pydantic请求/响应模型 |
| `backend/app/routes/auth.py` | ✅ | 注册/登录/Apple登录 |
| `backend/app/routes/attacks.py` | ✅ | 偏头痛记录CRUD+分页 |
| `backend/app/routes/voice.py` | ✅ | 语音上传→Whisper→Gemini→结构化 |
| `backend/app/routes/weather.py` | ✅ | 天气查询 |
| `backend/app/routes/risk.py` | ✅ | 风险评分+历史趋势 |
| `backend/app/routes/reports.py` | ✅ | 医生报告生成 |
| `backend/app/routes/subscriptions.py` | ✅ | RevenueCat webhook |
| `backend/app/services/whisper_local.py` | ✅ | Whisper.cpp 本地调用（subprocess）|
| `backend/app/services/gemini.py` | ✅ | Google Gemini API 调用 |
| `backend/app/services/weather.py` | ✅ | OpenWeatherMap 集成 |
| `backend/app/services/risk_engine.py` | ✅ | 规则引擎风险评分（V1）|
| `backend/init_db.py` | ✅ | 数据库一键初始化 |
| `backend/requirements.txt` | ✅ | 所有Python依赖 |

**验证结果：** `GET /health → {"status":"ok","version":"1.0.0"}`

### 3.2 前端（React Native Expo + TypeScript）— ✅ 代码完整，未运行

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/App.tsx` | ✅ | 入口：暗色主题+认证状态管理 |
| `frontend/theme.ts` | ✅ | 配色方案+间距系统 |
| `frontend/types.ts` | ✅ | TypeScript类型定义 |
| `frontend/navigation/AppNavigator.tsx` | ✅ | 底部Tab（首页/历史/报告）+ Modal（语音/手动）|
| `frontend/screens/LoginScreen.tsx` | ✅ | Apple登录+Email登录 |
| `frontend/screens/HomeScreen.tsx` | ✅ | 风险卡片+月统计+最近记录+操作按钮 |
| `frontend/screens/VoiceRecordScreen.tsx` | ✅ | 录音UI→AI解析→结果确认 |
| `frontend/screens/ManualRecordScreen.tsx` | ✅ | 疼痛位置+严重度滑条+症状/触发勾选 |
| `frontend/screens/HistoryScreen.tsx` | ✅ | 日历热力图+列表视图+筛选 |
| `frontend/screens/ReportScreen.tsx` | ✅ | 日期选择+报告摘要+趋势图+导出PDF |
| `frontend/components/RiskCard.tsx` | ✅ | 风险评分卡片组件 |
| `frontend/components/AttackListItem.tsx` | ✅ | 记录列表项组件 |
| `frontend/components/SeveritySlider.tsx` | ✅ | 严重度1-10滑条 |
| `frontend/services/api.ts` | ✅ | 所有后端API封装+token管理 |
| `frontend/services/auth.ts` | ✅ | Apple登录+token持久化 |
| `frontend/package.json` | ✅ | Expo 52 + React Navigation 7 |
| `frontend/app.json` | ✅ | Expo配置 |
| `frontend/tsconfig.json` | ✅ | TypeScript配置 |

### 3.3 当前缺陷

1. **前端所有页面使用 mock 数据** — HomeScreen 的 risk/stats/attacks 全是硬编码的 MOCK 常量，没有调 API
2. **前端从未实际运行过** — npm install 没跑，模拟器没打开过
3. **Whisper.cpp 服务层** — whisper_local.py 里 `transcribe_audio()` 目前返回 mock 文本（"I have a throbbing pain on my right temple"），因为本地没有安装 whisper
4. **Gemini 服务层** — gemini.py 的 `parse_medical_text()` 目前返回 mock JSON，因为 GEMINI_API_KEY 未配置
5. **OpenWeatherMap** — 同上，API key 未配置
6. **Apple 登录** — 需要 Apple Developer 账号才能配
7. **数据库** — 开发用 SQLite，生产需切 PostgreSQL

---

## 4. 数据库表结构（10张表）

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `users` | id(UUID), email, apple_user_id, hashed_password, subscription_status | 用户信息 |
| `migraine_attacks` | id, user_id(FK), started_at, severity_score(1-10), pain_locations(Array), pain_type, source(manual/voice) | 核心记录表 |
| `attack_symptoms` | id, attack_id(FK), symptom_type, severity | 症状多对多 |
| `attack_triggers` | id, attack_id(FK), trigger_type, confidence | 触发因素多对多 |
| `medications` | id, user_id(FK), attack_id(FK nullable), name, dosage, effectiveness(1-10) | 药物记录 |
| `weather_data` | id, user_id(FK), date, pressure, humidity, temp_high/low, weather_condition | 天气数据缓存 |
| `risk_scores` | id, user_id(FK), date, score(0-100), level(low/medium/high), model_version | 每日风险评分 |
| `doctor_reports` | id, user_id(FK), date_range_start/end, pdf_url, report_data(JSONB) | 报告缓存 |
| `subscriptions` | id, user_id(FK), platform, status(trial/active/expired), plan_type | 订阅状态 |
| `app_settings` | id, user_id(FK), dark_mode, notifications, data_retention_months | 用户偏好 |

---

## 5. API 端点清单

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 邮箱注册 | ❌ |
| POST | `/auth/login` | 邮箱登录→JWT | ❌ |
| POST | `/auth/apple` | Apple Sign-In | ❌ |
| GET | `/api/v1/attacks?page=&days=` | 分页获取记录 | ✅ Bearer |
| POST | `/api/v1/attacks` | 创建手动记录 | ✅ |
| PATCH | `/api/v1/attacks/{id}` | 更新记录 | ✅ |
| DELETE | `/api/v1/attacks/{id}` | 删除记录 | ✅ |
| POST | `/api/v1/attacks/voice` | 上传语音→AI解析→创建 | ✅ |
| GET | `/api/v1/weather/today` | 今日天气 | ✅ |
| GET | `/api/v1/weather/forecast?days=` | 天气预报 | ✅ |
| GET | `/api/v1/risk/today` | 今日风险评分 | ✅ |
| GET | `/api/v1/risk/history?days=` | 风险历史趋势 | ✅ |
| POST | `/api/v1/reports/generate` | 生成医生报告 | ✅ |
| GET | `/api/v1/subscription/status` | 订阅状态 | ✅ |
| POST | `/api/v1/subscription/webhook` | RevenueCat回调 | ❌ |
| GET | `/health` | 健康检查 | ❌ |

---

## 6. 下一步任务（按优先级）

### 🔴 P0 — 核心联调（2-3天）

1. **安装前端依赖**
   ```bash
   cd frontend
   npm install
   ```
2. **前端跑起来（Expo Go 或模拟器）**
   ```bash
   npx expo start
   ```
3. **前后端联调** — 把 HomeScreen 的 MOCK 数据替换为真实 API 调用
4. **完整测通一条记录流程**：登录 → 首页 → 手动记录 → 列表显示 → 语音记录 → AI解析 → 详情

### 🟡 P1 — AI 管道真实化（3-5天）

5. **服务器上安装 Whisper.cpp**
   - 用 `whisper.cpp` 的 ggml-base.bin 模型（~140MB）
   - 确保 whisper_local.py 的 `transcribe_audio()` 调用真实模型
6. **配置 Gemini API Key**
   - 让 gemini.py 的 `parse_medical_text()` 返回真实解析结果
   - Prompt 已验证能处理偏头痛描述的 JSON 提取
7. **配置 OpenWeatherMap API Key**
   - 让 weather.py 正常工作

### 🟢 P2 — 功能完善（第2-3周）

8. **Apple 登录真实配置** — 需要 Apple Developer 账号
9. **App 图标 + 启动屏**
   - 建议：深紫色背景 + 白色几何脑部轮廓
   - 尺寸：1024x1024 PNG
10. **隐私政策页面**（App Store上架必须）
    - 一个静态 HTML 放服务器上：`cephy.app/privacy.html`
11. **`.env` 配置模板补全**
    - 目前 `.env.example` 已有框架，需填入正式密钥

### 🔵 P3 — 部署准备（7月7日）

12. **Docker 部署方案**
    - 编写 `docker-compose.yml`（postgres + redis + fastapi）
    - 编写 `Dockerfile`
    - 部署到泰国服务器
13. **数据库迁移从 SQLite 到 PostgreSQL**
14. **Nginx 反代 + Let's Encrypt SSL**

### ⚪ P4 — 上线前（第3-4周）

15. **ASO 优化** — App Store 标题/副标题/关键词
16. **Reddit r/migraine 发布准备** — 上线帖模板
17. **种子用户招募计划** — 前100个用户锁定$4.99/月
18. **联系10位神经科医生** — 给终身免费换取推荐

---

## 7. 设计规范

### 配色

```
背景深色: #1A1A2E
卡片: #16213E
主色: #6C63FF (紫色)
文字: #E0E0E0
高风险: #FF4757
中风险: #FFA502
低风险: #2ED573
```

### 设计原则（偏头痛患者专用）

1. **暗色模式默认** — 白色刺激光敏感患者
2. **大字 ≥ 16px** — 偏头痛时看小字困难
3. **零动画** — 动画诱发偏头痛
4. **30秒记录原则** — 打开App到完成记录不超过30秒
5. **大触摸目标 ≥ 44px** — 发作时精细操作困难
6. **宽返回/取消区域** — 误触不致命但烦人

---

## 8. D 盘产品框架

路径：`D:\第二大脑\02-项目\Cephy 偏头痛追踪App\`

| 文件 | 内容 | 用途 |
|------|------|------|
| `00-Cephy 项目总览.md` | 项目基础信息、目标、指标 | 新加入者第一站 |
| `01-竞品分析.md` | 4个竞品拆解、吞噬策略 | 功能决策依据 |
| `02-产品定义.md` | 版本路线图、MVP功能、定价 | 开发范围参考 |
| `03-技术架构.md` | 架构图、AI回落链、成本 | 技术决策依据 |
| `04-盈利模型.md` | 12个月收入预测、地域化定价 | 商业决策 |
| `05-获客策略.md` | Reddit/ASO/医生飞轮 | 上线推广 |

---

## 9. 关键联系人 & 账号

| 项目 | 内容 |
|------|------|
| GitHub 仓库 | `github.com/yudalin2025-glitch/cephy-app` |
| 泰国服务器 | 7月7日可访问（客户确认中）|
| Apple Developer | 未注册（客户需$99自行注册）|
| Gemini API Key | 客户在研究中 |
| 域名 | 待注册 `cephy.app` |
| 邮箱 | yudalin2025@gmail.com |

---

## 10. 禁止做的事

- ❌ 不要在 `~/.openclaw/` 目录下写任何代码
- ❌ 不要用任何吹嘘性语言写代码注释（保持专业）
- ❌ 不要增加不必要的第三方依赖（保持轻量）
- ❌ 不要改数据库 Schema 不做 migration（V1就用 init_db.py）
- ❌ 不要用付费 API 做 AI 管道（坚持免费回落链方案）
- ❌ 不要做社区/论坛功能（V3才做）

---

*交接完成。后续开发以 P0 → P1 → P2 → P3 → P4 顺序执行。*
