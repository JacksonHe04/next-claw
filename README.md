# Claw Agent (Next.js + ReAct)

Claw 是一个基于 `workspace/*.md` 的个人 AI Agent Web 应用。当前版本重点增强了：

- 后端限流（按请求来源 1 分钟最多 10 次）
- ReAct 代理循环（可调用工具并逐轮推理）
- 前端 Trace 可视化（可看到工具与推理轨迹）
- 移动端顶部与底部圆形卡片对齐修复

## 1. 核心能力

- `POST /api/chat` 使用 SSE 返回实时事件（`status` / `trace` / `delta` / `done` / `error`）
- 每次请求自动生成 Trace，并持久化到 `output/traces`（不可写时回退到系统临时目录）
- 内置 ReAct tools：
  - `search_workspace`：按关键词搜索记忆文档
  - `read_workspace_doc`：读取指定文档
  - `get_current_time`：获取上海时区时间
- 前端展示 Agent trace，回答过程更直观

## 2. 限流策略

- 维度：请求来源 IP（优先 `x-forwarded-for`，其次 `x-real-ip`）
- 窗口：60 秒
- 配额：10 次
- 触发后：返回 `429` + `Retry-After`，前端展示明显提醒

> 说明：当前使用进程内存限流，适合单实例部署。多实例建议改为 Redis 等共享存储。

## 3. ReAct 运行模式

Agent 使用“思考 -> 工具调用 -> 观察 -> 继续思考”的循环，最多 8 轮。

典型流程：

1. 模型先决定是否调用工具
2. 若有 `function_call`：执行本地工具并把结果以 `function_call_output` 回传模型
3. 无工具调用时输出最终答案
4. 前端通过 `trace` 事件展示每一轮关键步骤

## 4. 目录结构

```txt
next-claw/
  agent/
    runtime.ts          # Agent 入口（流式）
    model.ts            # ReAct 循环与模型调用
    tools.ts            # 可调用工具定义与执行
    memory.ts           # 读取 workspace/*.md
    prompt.ts           # 系统提示词
    trace.ts            # Trace 会话与落盘
  app/
    api/chat/route.ts   # SSE API + 限流
    page.tsx            # 前端主页面
    home/components/
      TopChrome.tsx
      QuestionWheel.tsx
      AgentAvatar.tsx
      ChatCard.tsx
  config/agent.config.ts
  workspace/*.md        # 记忆文件
```

## 5. 快速开始

```bash
pnpm install
cp .env.example .env.local
```

设置环境变量：

```bash
API_KEY=your_api_key
```

启动开发：

```bash
pnpm dev
```

访问：<http://localhost:3000>

## 6. 常用命令

```bash
pnpm typecheck
pnpm build
pnpm start
```

## 7. API 简要

### `POST /api/chat`

请求：

```json
{ "message": "他最近在做什么？" }
```

成功响应：`text/event-stream`

- `event: status`
- `event: trace`
- `event: delta`
- `event: done`

限流响应：

- HTTP `429`
- Header: `Retry-After`
- JSON: `{ error, retryAfter, traceId }`

## 8. 后续建议

- 将限流迁移到 Redis（支持多实例）
- Trace 增加可折叠时间线与阶段耗时
- Tools 增加网页检索/知识库检索/外部 API
