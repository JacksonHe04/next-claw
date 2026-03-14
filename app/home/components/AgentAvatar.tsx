import { AgentStage } from "../types";

type Props = {
  stage: AgentStage;
  // Keep props that might be passed from page.tsx even if not used
  [key: string]: any;
};

const STAGE_CLASS: Record<AgentStage, string> = {
  idle: "animate-bob",
  thinking: "animate-pulse-soft",
  speaking: "animate-wiggle",
};

export function AgentAvatar({ stage }: Props) {
  return (
    <div className="fixed bottom-[32px] right-[22px] z-10 max-[980px]:right-[10px] max-[980px]:bottom-[320px]">
      <div
        className={`relative aspect-square w-[clamp(128px,16vw,186px)] overflow-hidden rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${STAGE_CLASS[stage]}`}
      >
        <img
          src="/gugugaga.gif"
          alt="Agent"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
