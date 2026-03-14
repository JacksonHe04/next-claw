# Claw Agent (Next.js)

Claw 是一个基于 `workspace/*.md` 记忆文件驱动的个人 AI Agent Web 应用。\
当前实现包含完整链路：前端聊天 UI、SSE 流式返回、上下文组装、模型调用。

## 当前能力

- 从 `workspace` 目录读取 Markdown 记忆
- 将系统提示词 + 记忆 + 用户问题拼接为单一上下文
- 使用 OpenAI SDK（可配置 `baseUrl`）调用 `chat.completions`
- `POST /api/chat` 以 `text/event-stream` 返回真实流式增量
- Next.js 前端聊天界面（含状态提示与流式渲染）

不包含数据库、向量检索、工具调用、会话持久化。

## 技术栈

- Next.js 15
- React 19
- TypeScript 5

## 目录结构

```txt
next-claw/
  agent/
    runtime.ts          # 入口：runAgent
    memory.ts           # 读取 workspace/*.md
    context.ts          # 拼接上下文文本
    prompt.ts           # BASE_SYSTEM_PROMPT
    model.ts            # 调用模型（OpenAI SDK）
  api/
    chat.ts             # 核心 API（SSE）
  app/
    api/chat/route.ts   # Next Route Handler，转发到 api/chat.ts
    page.tsx            # 聊天页面
    globals.css         # 页面样式
    layout.tsx
  config/
    agent.config.ts     # 模型与运行参数
  workspace/            # 记忆库（Markdown）
```

## 快速开始

1. 安装依赖

```bash
pnpm install
```

1. 配置环境变量（参考 `.env.example`）

```bash
API_KEY=your_api_key
```

1. 启动开发环境

```bash
pnpm dev
```

访问 <http://localhost:3000>

## 构建与运行

```bash
pnpm typecheck
pnpm build
pnpm start
```

## 配置说明

配置文件：`config/agent.config.ts`

- `model`：模型名称
- `baseUrl`：模型服务地址（默认是火山引擎 Ark 兼容地址）
- `temperature`：采样温度
- `maxTokens`：最大输出 token
- `workspaceDir`：记忆目录（默认 `process.cwd()/workspace`）
- `apiKey`：读取 `process.env.API_KEY`

## Workspace Memory 规则

`agent/memory.ts` 会读取 `workspace` 目录下所有 `.md` 文件：

- 核心文件（固定字段）：`identity.md`
- `worldview.md`
- `resume.md`
- `projects.md`
- `personality.md`
- `faq.md`
- 其他 `.md` 将作为 `extras` 自动注入上下文（按文件名排序）
- 缺失文件会被当作空字符串，不会阻塞启动

## 请求流程

1. 前端 `app/page.tsx` 向 `POST /api/chat` 发送 `{ message }`
2. `api/chat.ts` 调用 `runAgentStream(message)`
3. `runAgentStream` 执行：读取 workspace 记忆、组装标准 messages、调用模型流式接口
4. API 以 SSE 事件流返回：

- `status`（`search_memory` / `reasoning` / `compose`）
- `delta`（模型实时增量 token）
- `done`（完成）
- `error`（异常）

## API 协议

### `POST /api/chat`

Request:

```json
{
  "message": "他在美团做了什么？"
}
```

Response: `text/event-stream`

示例事件：

```txt
event: status
data: {"stage":"search_memory"}

event: delta
data: {"text":"..."}

event: done
data: {"ok":true}
```

错误场景会返回：

```txt
event: error
data: {"error":"..."}
```
