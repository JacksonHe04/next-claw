import { CSSProperties } from "react";

import { ClockState, ThemeSwatch } from "./types";

export function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getShanghaiClockState(): ClockState {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const year = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(now);

  return {
    label: `Shanghai, ${time} CST`,
    year,
  };
}

export function createShellStyle(theme: ThemeSwatch, cursorPos: { x: number; y: number }): CSSProperties {
  return {
    "--bg-a": theme.bgA,
    "--bg-b": theme.bgB,
    "--bg-c": theme.bgC,
    "--mist": theme.mist,
    "--accent-a": theme.accentA,
    "--accent-b": theme.accentB,
    "--fg": theme.fg,
    "--fg-soft": theme.fgSoft,
    "--border": theme.border,
    "--card": theme.card,
    "--bubble-agent": theme.bubbleAgent,
    "--bubble-user": theme.bubbleUser,
    "--bubble-user-fg": theme.bubbleUserFg,
    "--theme-dot": theme.dot,
    "--cursor-x": `${cursorPos.x}px`,
    "--cursor-y": `${cursorPos.y}px`,
  } as CSSProperties;
}
