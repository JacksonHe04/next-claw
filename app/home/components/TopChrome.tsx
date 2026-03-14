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
        <div className="inline-flex items-center gap-[9px] text-[0.7rem] uppercase tracking-[0.06em]">
          <span className="font-semibold">C</span>
          <span className="font-semibold">/</span>
          <span className="font-semibold">L</span>
          <span className="ml-[18px] opacity-80 max-[980px]:ml-[10px]">{clock.label}</span>
        </div>
      </div>

      <div className="fixed right-6 top-[18px] z-10 inline-flex items-center gap-2.5 text-[0.7rem] uppercase tracking-[0.06em] max-[980px]:right-[10px] max-[980px]:top-[10px] max-[980px]:justify-end">
        <a href={notionUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
          NOTION
        </a>
        <a href="https://inon.space" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
          ABOUT
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

      <section className="fixed left-1/2 top-[86px] z-10 w-[min(860px,calc(100vw-280px))] -translate-x-1/2 max-[980px]:left-3 max-[980px]:top-[182px] max-[980px]:w-[calc(100vw-24px)] max-[980px]:translate-x-0">
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
        <p className="mt-4 max-w-[620px] text-[1.08rem] leading-[1.25] max-[980px]:text-[1rem]">{activeQuestion.question}</p>
      </section>

      <button
        type="button"
        onClick={onAsk}
        className="fixed right-[168px] top-[41.5vh] z-10 h-[42px] min-w-[108px] cursor-pointer rounded-full border border-[var(--border)] bg-white/25 px-[18px] text-[var(--fg)] uppercase tracking-[0.04em] transition duration-200 hover:-translate-y-px hover:bg-white/40 max-[980px]:right-3 max-[980px]:top-[330px]"
      >
        ASK <span className="ml-3">↗</span>
      </button>
    </>
  );
}
