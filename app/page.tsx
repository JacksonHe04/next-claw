"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "agent";
type AgentStage = "idle" | "thinking" | "speaking";

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "他在美团做了什么？",
  "为什么他很关注 AI Agent？",
  "有哪些项目是他亲自做的？",
  "他的 Memory 机制是怎么实现的？",
  "他对 AI 产品设计的核心判断是什么？",
];

const THINKING_MAP: Record<string, string> = {
  search_memory: "我在翻翻他的记忆……",
  reasoning: "让我想想……",
  compose: "我整理一下答案……",
};

const INITIAL_AGENT_TEXT =
  "你好，我是 Claw。你可以问我任何关于锦诚的问题，也可以和我讨论 AI、产品或技术。";

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: buildId("agent"), role: "agent", text: INITIAL_AGENT_TEXT },
  ]);
  const [input, setInput] = useState("");
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentStage, setAgentStage] = useState<AgentStage>("idle");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, thinkingText]);

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);

  async function sendMessage(raw: string) {
    const content = raw.trim();
    if (!content || isStreaming) return;

    const userMsg: ChatMessage = {
      id: buildId("user"),
      role: "user",
      text: content,
    };

    const agentMsgId = buildId("agent");
    setMessages((prev) => [...prev, userMsg, { id: agentMsgId, role: "agent", text: "" }]);
    setInput("");
    setThinkingText("让我想想……");
    setIsStreaming(true);
    setAgentStage("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok || !response.body) {
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        let message = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;

        if (contentType.includes("application/json")) {
          try {
            const data = (await response.json()) as { error?: string; message?: string };
            message = data.error || data.message || message;
          } catch {
            // keep fallback message
          }
        } else {
          const text = await response.text();
          if (contentType.includes("text/html")) {
            message = `${message}（服务端返回了 HTML 错误页）`;
          } else if (text.trim()) {
            message = text.trim().slice(0, 220);
          }
        }

        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendAgentText = (delta: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMsgId
              ? {
                  ...msg,
                  text: `${msg.text}${delta}`,
                }
              : msg,
          ),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          let eventName = "message";
          let payload = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              payload += line.slice(5).trim();
            }
          }

          if (!payload) continue;

          const parsed = JSON.parse(payload) as {
            stage?: string;
            text?: string;
            error?: string;
          };

          if (eventName === "status") {
            setThinkingText(THINKING_MAP[parsed.stage ?? ""] ?? "让我想想……");
            setAgentStage("thinking");
          }

          if (eventName === "delta") {
            if (parsed.text) {
              setThinkingText(null);
              setAgentStage("speaking");
              appendAgentText(parsed.text);
            }
          }

          if (eventName === "error") {
            appendAgentText(parsed.error ? `\n\n${parsed.error}` : "\n\n请求失败，请稍后重试。");
          }

          if (eventName === "done") {
            setThinkingText(null);
            setAgentStage("idle");
          }
        }
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown network error";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                text: `请求失败：${text}`,
              }
            : msg,
        ),
      );
    } finally {
      setThinkingText(null);
      setIsStreaming(false);
      setAgentStage("idle");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="page-shell">
      <section className="claw-wrap">
        <header className="hero">
          <h1>Claw</h1>
          <p className="subtitle">锦诚的个人 AI Agent</p>
          <p className="description">
            这是一个基于 Agent Memory 构建的 AI。
            <br />
            你可以问它任何关于锦诚的问题，也可以和它讨论 AI、产品或技术。
          </p>
          <p className="hint">Claw 使用 workspace memory 与 context injection 构建。</p>
        </header>

        <section className="avatar-zone" aria-label="agent avatar">
          <div className={`avatar avatar--${agentStage}`}>
            <span className="avatar-core">C</span>
            <span className="avatar-ring" />
          </div>
        </section>

        <section className="chat-card">
          <div ref={scrollerRef} className="chat-log" aria-live="polite">
            {messages.map((message) => {
              const isAgent = message.role === "agent";
              return (
                <article
                  key={message.id}
                  className={`chat-row ${isAgent ? "chat-row--agent" : "chat-row--user"}`}
                >
                  <div className="bubble-wrap">
                    {isAgent ? <div className="agent-name">Claw</div> : null}
                    <div className={`bubble ${isAgent ? "bubble--agent" : "bubble--user"}`}>
                      {message.text || <span className="ghost-text">...</span>}
                    </div>
                  </div>
                </article>
              );
            })}

            {thinkingText ? (
              <article className="chat-row chat-row--agent thinking-row">
                <div className="bubble-wrap">
                  <div className="agent-name">Claw</div>
                  <div className="bubble bubble--agent bubble--thinking">{thinkingText}</div>
                </div>
              </article>
            ) : null}
          </div>

          <div className="suggestions">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="chip"
                disabled={isStreaming}
                onClick={() => void sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <form className="composer" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问我任何关于锦诚的问题…"
              disabled={isStreaming}
            />
            <button type="submit" disabled={!canSend} aria-label="发送">
              ↗
            </button>
          </form>
        </section>

        <footer className="footer">
          <span>了解更多关于锦诚</span>
          <a href="https://github.com/JacksonHe04" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://inon.space" target="_blank" rel="noreferrer">
            个人网站
          </a>
          <a href="https://github.com/JacksonHe04" target="_blank" rel="noreferrer">
            简历
          </a>
        </footer>
      </section>
    </main>
  );
}
