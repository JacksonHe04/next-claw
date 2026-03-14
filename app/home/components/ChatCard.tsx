import { FormEvent, RefObject } from "react";

import { ChatMessage } from "../types";

type Props = {
  messages: ChatMessage[];
  thinkingText: string | null;
  input: string;
  isStreaming: boolean;
  canSend: boolean;
  suggestions: string[];
  scrollerRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSuggestionClick: (question: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatCard({
  messages,
  thinkingText,
  input,
  isStreaming,
  canSend,
  suggestions,
  scrollerRef,
  onInputChange,
  onSuggestionClick,
  onSubmit,
}: Props) {
  return (
    <section className="fixed bottom-[18px] left-1/2 z-10 grid h-[min(42vh,420px)] w-[min(980px,calc(100vw-280px))] -translate-x-1/2 grid-rows-[1fr_auto_auto] gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 backdrop-blur-[8px] max-[980px]:bottom-[10px] max-[980px]:left-3 max-[980px]:h-[290px] max-[980px]:w-[calc(100vw-24px)] max-[980px]:translate-x-0">
      <div ref={scrollerRef} aria-live="polite" className="overflow-y-auto pr-1">
        {messages.map((message) => {
          const isAgent = message.role === "agent";

          return (
            <article key={message.id} className={`mb-3 flex ${isAgent ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[82%]">
                {isAgent ? <div className="mb-1.5 ml-1.5 text-[0.76rem] text-[var(--fg-soft)]">Claw</div> : null}
                <div
                  className={`rounded-[14px] border border-[var(--border)] px-3 py-2.5 leading-[1.5] break-words ${
                    isAgent
                      ? "bg-[var(--bubble-agent)]"
                      : "bg-[var(--bubble-user)] text-[var(--bubble-user-fg)]"
                  }`}
                >
                  {message.text || <span className="opacity-45">...</span>}
                </div>
              </div>
            </article>
          );
        })}

        {thinkingText ? (
          <article className="mb-3 flex justify-start">
            <div className="max-w-[82%]">
              <div className="mb-1.5 ml-1.5 text-[0.76rem] text-[var(--fg-soft)]">Claw</div>
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bubble-agent)] px-3 py-2.5 leading-[1.5] break-words text-[var(--fg-soft)] italic">
                {thinkingText}
              </div>
            </div>
          </article>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 max-[980px]:flex-nowrap max-[980px]:overflow-x-auto max-[980px]:pr-1 max-[980px]:[scrollbar-width:none]">
        {suggestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isStreaming}
            onClick={() => onSuggestionClick(question)}
            className="shrink-0 cursor-pointer rounded-full border border-[var(--border)] bg-white/50 px-3 py-2 text-[0.86rem] text-[#292d33] transition duration-150 hover:-translate-y-px hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-[1fr_auto] gap-2.5 rounded-full border border-[var(--border)] bg-white/45 p-2">
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="问我任何关于你的问题…"
          disabled={isStreaming}
          className="border-none bg-transparent px-2 text-[#1e232a] outline-none placeholder:text-[#5b6575]"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="发送"
          className="h-10 w-10 cursor-pointer rounded-full border border-[var(--border)] bg-[#16191d] text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          ↗
        </button>
      </form>
    </section>
  );
}
