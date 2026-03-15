import { ClockState, QuestionPage } from "../types";

type Props = {
  activeQuestion: QuestionPage;
  clock: ClockState;
  onRandomizeTheme: () => void;
  onAsk: () => void;
  notionUrl: string;
};

const sideClass = "fixed z-10 text-[0.73rem] tracking-[0.02em] text-[var(--fg-soft)] opacity-90";

export function TopChrome({ activeQuestion, clock, onRandomizeTheme, onAsk, notionUrl }: Props) {
  return (
    <>
      <div className="fixed left-6 top-[18px] z-10 max-[980px]:left-[10px] max-[980px]:top-[10px]">
        <div className="inline-flex h-6 items-center gap-[9px] text-[0.7rem] uppercase tracking-[0.06em]">
          <span className="font-semibold">C</span>
          <span className="font-semibold">/</span>
          <span className="font-semibold">L</span>
          <span className="ml-[18px] opacity-80 max-[980px]:ml-[10px]">{clock.label}</span>
        </div>
      </div>

      <div className="fixed right-6 top-[18px] z-10 inline-flex h-6 items-center gap-2.5 text-[0.7rem] uppercase tracking-[0.06em] max-[980px]:right-[10px] max-[980px]:top-[10px] max-[980px]:justify-end">
        <a href={notionUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
          NOTION
        </a>
        <a href="https://inon.space" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
          ABOUT
        </a>
        <a
          href="https://github.com/JacksonHe04/next-claw"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg-soft)] opacity-80 transition-transform duration-200 hover:scale-105 hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[13px] w-[13px] fill-current">
            <path d="M12 2C6.477 2 2 6.6 2 12.253c0 4.52 2.865 8.35 6.839 9.707.5.095.683-.22.683-.49 0-.243-.009-.887-.014-1.741-2.782.626-3.369-1.372-3.369-1.372-.454-1.179-1.11-1.493-1.11-1.493-.907-.643.069-.63.069-.63 1.003.073 1.53 1.054 1.53 1.054.892 1.559 2.341 1.109 2.91.848.09-.665.349-1.109.635-1.363-2.221-.261-4.555-1.138-4.555-5.064 0-1.119.39-2.034 1.03-2.752-.103-.261-.446-1.31.098-2.731 0 0 .84-.274 2.75 1.051A9.326 9.326 0 0 1 12 6.844c.85.004 1.706.118 2.507.345 1.909-1.325 2.748-1.051 2.748-1.051.545 1.421.202 2.47.1 2.731.64.718 1.028 1.633 1.028 2.752 0 3.936-2.338 4.799-4.566 5.055.359.316.678.941.678 1.897 0 1.37-.012 2.476-.012 2.813 0 .272.18.59.688.489C19.138 20.599 22 16.77 22 12.253 22 6.6 17.523 2 12 2z" />
          </svg>
        </a>
        <button
          type="button"
          aria-label="随机切换主题"
          onClick={onRandomizeTheme}
          className="h-5 w-5 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--theme-dot)] transition-transform duration-200 hover:scale-105"
        />
      </div>

      <p className={`${sideClass} left-[18px] top-1/2 -translate-y-1/2 max-[980px]:left-[10px] max-[980px]:top-[68px] max-[980px]:translate-y-0`}>
        HE JINCHENG {clock.year}
      </p>
      <p className={`${sideClass} right-[18px] top-1/2 -translate-y-1/2 max-[980px]:right-[10px] max-[980px]:top-[68px] max-[980px]:translate-y-0`}>
        Claw
      </p>

      <section className="fixed left-1/2 top-[86px] z-10 w-[min(860px,calc(100vw-280px))] -translate-x-1/2 max-[980px]:left-3 max-[980px]:top-[132px] max-[980px]:w-[calc(100vw-24px)] max-[980px]:translate-x-0">
        <p className="mb-[14px] max-w-[360px] text-[0.84rem] leading-[1.25] uppercase text-[var(--fg-soft)]">
          Ciao, I&apos;m Claw. A memory-native
          <br />
          personal AI agent for Jincheng.
        </p>
        <h1 className="m-0 max-w-[640px] font-[var(--font-hero)] text-[clamp(2.8rem,8.2vw,6.8rem)] leading-[0.94] font-medium -tracking-[0.05em] lowercase italic max-[980px]:text-[clamp(2.3rem,10vw,4rem)]">
          {activeQuestion.title}
        </h1>
        <p className="mt-[14px] inline-flex items-center gap-3 text-[0.88rem] uppercase text-[var(--fg-soft)]">
          <span>{activeQuestion.focus}</span>
          <span>/</span>
          <span>Year. {clock.year}</span>
        </p>
        <div className="mt-4 flex items-start gap-3 max-[980px]:items-center max-[980px]:gap-2">
          <p className="m-0 flex-1 text-[1.08rem] leading-[1.25] max-[980px]:text-[1rem]">{activeQuestion.question}</p>
          <button
            type="button"
            onClick={onAsk}
            className="h-[42px] min-w-[108px] shrink-0 cursor-pointer rounded-full border border-[var(--border)] bg-white/25 px-[18px] text-[var(--fg)] uppercase tracking-[0.04em] transition duration-200 hover:-translate-y-px hover:bg-white/40"
          >
            ASK <span className="ml-3">↗</span>
          </button>
        </div>
      </section>
    </>
  );
}
