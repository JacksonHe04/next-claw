import { CSSProperties, RefObject } from "react";

import { AgentStage } from "../types";

type Props = {
  stage: AgentStage;
  pupilStyle: CSSProperties;
  faceRef: RefObject<HTMLDivElement | null>;
};

const STAGE_CLASS: Record<AgentStage, string> = {
  idle: "animate-bob",
  thinking: "animate-pulse-soft",
  speaking: "animate-wiggle",
};

export function AgentAvatar({ stage, pupilStyle, faceRef }: Props) {
  return (
    <div className="fixed bottom-[18px] right-[22px] z-10 max-[980px]:right-[10px] max-[980px]:bottom-auto max-[980px]:top-[402px]">
      <div
        className={`relative aspect-square w-[clamp(128px,16vw,186px)] overflow-hidden rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${STAGE_CLASS[stage]}`}
        style={{
          background:
            "linear-gradient(130deg, var(--accent-a) 18%, color-mix(in srgb, var(--accent-a), black 18%) 64%, var(--accent-b) 65%), linear-gradient(35deg, var(--accent-a), var(--accent-b))",
        }}
      >
        <div className="absolute inset-[34%_21%_14%] rounded-[34px] bg-[linear-gradient(160deg,#fff_0%,#f1f1f1_100%)]" />
        <div
          ref={faceRef}
          className="absolute left-1/2 top-[35%] flex h-[32%] w-[46%] -translate-x-1/2 items-center justify-center gap-2 rounded-[40px] bg-[#fffdfb]"
        >
          {[0, 1].map((eye) => (
            <div
              key={eye}
              className="grid h-[18px] w-[18px] place-items-center rounded-full border border-black/20 bg-[#eceef1]"
            >
              <span className="h-2 w-2 rounded-full bg-[#121318] transition-transform duration-75" style={pupilStyle} />
            </div>
          ))}
          <div className="absolute bottom-[6px] left-1/2 h-2 w-5 -translate-x-1/2 rounded-b-[12px] border-2 border-t-0 border-[#17191d] opacity-80" />
        </div>
      </div>
    </div>
  );
}
