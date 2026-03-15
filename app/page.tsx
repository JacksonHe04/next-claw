"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { AgentAvatar } from "./home/components/AgentAvatar";
import { ChatCard } from "./home/components/ChatCard";
import { QuestionWheel } from "./home/components/QuestionWheel";
import { TopChrome } from "./home/components/TopChrome";
import {
  CHAT_SUGGESTED_QUESTIONS,
  INITIAL_AGENT_TEXT,
  INITIAL_CLOCK,
  NOTION_URL,
  QUESTION_PAGES,
  THEMES,
  THINKING_MAP,
} from "./home/data";
import { AgentStage, ChatMessage } from "./home/types";
import { buildId, createShellStyle, getShanghaiClockState } from "./home/utils";

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: buildId("agent"), role: "agent", text: INITIAL_AGENT_TEXT },
  ]);
  const [input, setInput] = useState("");
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [traceSteps, setTraceSteps] = useState<string[]>([]);
  const [agentStage, setAgentStage] = useState<AgentStage>("idle");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [clock, setClock] = useState(INITIAL_CLOCK);
  const [lookTarget, setLookTarget] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeQuestion = QUESTION_PAGES[questionIndex];
  const activeTheme = THEMES[themeIndex];

  const shellStyle = useMemo(() => createShellStyle(activeTheme, cursorPos), [activeTheme, cursorPos]);
  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, thinkingText]);

  useEffect(() => {
    setClock(getShanghaiClockState());
    const timer = window.setInterval(() => {
      setClock(getShanghaiClockState());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const handleMouseMove = (event: MouseEvent) => {
      setCursorPos({ x: event.clientX, y: event.clientY });
      const x = Number((((event.clientX / window.innerWidth) * 2 - 1) * 0.95).toFixed(3));
      const y = Number((((event.clientY / window.innerHeight) * 2 - 1) * 0.95).toFixed(3));
      setLookTarget({ x, y });
    };

    const handleMouseLeave = () => {
      setLookTarget({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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
    setNotice(null);
    setTraceSteps([]);
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
            const data = (await response.json()) as { error?: string; message?: string; retryAfter?: number };
            message = data.error || data.message || message;
            if (response.status === 429) {
              setNotice(message);
            }
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
          if (payload === "[DONE]") {
            setThinkingText(null);
            setAgentStage("idle");
            continue;
          }

          let parsed: { stage?: string; text?: string; error?: string; step?: string; detail?: string };
          try {
            parsed = JSON.parse(payload) as {
              stage?: string;
              text?: string;
              error?: string;
            };
          } catch {
            continue;
          }

          if (eventName === "status") {
            setThinkingText(THINKING_MAP[parsed.stage ?? ""] ?? "让我想想……");
            setAgentStage("thinking");
          }

          if (eventName === "trace" && parsed.detail) {
            const detail = parsed.detail.trim();
            if (detail) {
              setTraceSteps((prev) => [...prev, detail]);
            }
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

  function nextQuestion() {
    setQuestionIndex((current) => (current + 1) % QUESTION_PAGES.length);
  }

  function prevQuestion() {
    setQuestionIndex((current) => (current - 1 + QUESTION_PAGES.length) % QUESTION_PAGES.length);
  }

  function randomizeTheme() {
    setThemeIndex((current) => {
      if (THEMES.length < 2) return current;
      let next = current;
      while (next === current) {
        next = Math.floor(Math.random() * THEMES.length);
      }
      return next;
    });
  }

  return (
    <main className="relative h-screen w-full overflow-hidden text-[var(--fg)]" style={shellStyle}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 animate-bg-shift"
        style={{
          background:
            "radial-gradient(circle at 20% 2%, var(--bg-b), transparent 45%), radial-gradient(circle at 86% 72%, color-mix(in srgb, var(--accent-a), black 4%), transparent 32%), linear-gradient(110deg, var(--bg-a), var(--bg-c))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] animate-cloud-float opacity-70"
        style={{
          background:
            "radial-gradient(32vw 24vh at 15% 20%, color-mix(in srgb, var(--mist), white 15%), transparent 65%), radial-gradient(35vw 22vh at 68% 28%, color-mix(in srgb, var(--mist), white 25%), transparent 70%), radial-gradient(30vw 20vh at 36% 70%, var(--mist), transparent 68%), radial-gradient(22vw 16vh at 82% 78%, color-mix(in srgb, var(--mist), white 20%), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2] blur-[14px]"
        style={{
          background:
            "radial-gradient(170px 140px at var(--cursor-x) var(--cursor-y), color-mix(in srgb, var(--mist), white 12%), transparent 72%), radial-gradient(260px 210px at var(--cursor-x) var(--cursor-y), color-mix(in srgb, var(--mist), white 42%), transparent 80%)",
        }}
      />

      <TopChrome
        activeQuestion={activeQuestion}
        clock={clock}
        notionUrl={NOTION_URL}
        onRandomizeTheme={randomizeTheme}
        onAsk={() => void sendMessage(activeQuestion.question)}
      />

      <QuestionWheel index={questionIndex} onPrev={prevQuestion} onNext={nextQuestion} />
      <AgentAvatar stage={agentStage} lookTarget={lookTarget} />

      <ChatCard
        messages={messages}
        thinkingText={thinkingText}
        input={input}
        isStreaming={isStreaming}
        canSend={canSend}
        notice={notice}
        traceSteps={traceSteps}
        suggestions={CHAT_SUGGESTED_QUESTIONS}
        scrollerRef={scrollerRef}
        onInputChange={setInput}
        onSuggestionClick={(question) => void sendMessage(question)}
        onSubmit={onSubmit}
      />
    </main>
  );
}
