type Props = {
  index: number;
  onPrev: () => void;
  onNext: () => void;
};

export function QuestionWheel({ index, onPrev, onNext }: Props) {
  return (
    <div className="fixed bottom-[18px] left-[22px] z-10 max-[980px]:bottom-[314px] max-[980px]:left-[10px]">
      <div className="grid aspect-square w-[clamp(128px,16vw,186px)] place-items-center rounded-full border border-[var(--border)] bg-white/15 px-2.5 py-4 backdrop-blur-[2px]">
        <p className="m-0 text-[0.7rem] lowercase tracking-[0.05em] text-[var(--fg-soft)]">question</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="上一个问题"
            onClick={onPrev}
            className="h-6 w-6 cursor-pointer border-none bg-transparent text-[1.32rem] leading-none text-[var(--fg-soft)]"
          >
            ←
          </button>
          <strong className="text-[clamp(2rem,5vw,3.7rem)] leading-none font-medium">{String(index + 1).padStart(2, "0")}</strong>
          <button
            type="button"
            aria-label="下一个问题"
            onClick={onNext}
            className="h-6 w-6 cursor-pointer border-none bg-transparent text-[1.32rem] leading-none text-[var(--fg-soft)]"
          >
            →
          </button>
        </div>
        <p className="m-0 text-[0.7rem] lowercase tracking-[0.05em] text-[var(--fg-soft)]">number</p>
      </div>
    </div>
  );
}
