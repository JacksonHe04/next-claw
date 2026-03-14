import { ClockState, QuestionPage, ThemeSwatch } from "./types";

export const INITIAL_CLOCK: ClockState = {
  label: "Shanghai, --:--:-- CST",
  year: "----",
};

export const INITIAL_AGENT_TEXT =
  "你好，我是 Claw。你可以问我任何关于锦诚的问题，也可以和我讨论 AI、产品或技术。";

export const NOTION_URL = "https://jacksonhe.notion.site/inon";

export const QUESTION_PAGES: QuestionPage[] = [
  {
    title: "memory-driven agent",
    focus: "Focus. AI Agent",
    question: "他的 Memory 机制是怎么实现的？",
  },
  {
    title: "product intuition",
    focus: "Focus. Product",
    question: "他对 AI 产品设计的核心判断是什么？",
  },
  {
    title: "build in public",
    focus: "Focus. Engineering",
    question: "有哪些项目是他亲自做的？",
  },
  {
    title: "career narrative",
    focus: "Focus. Career",
    question: "他的职业路径里最关键的转折点是什么？",
  },
];

export const CHAT_SUGGESTED_QUESTIONS = [
  "他为什么长期关注 Agent 方向？",
  "他在美团时做过哪些关键项目？",
  "他如何平衡产品体验与研发效率？",
  "如果加入他的团队，最看重什么能力？",
];

export const THEMES: ThemeSwatch[] = [
  {
    bgA: "#d7ebd6",
    bgB: "#88c18f",
    bgC: "#bfdcc0",
    mist: "rgba(102, 190, 124, 0.34)",
    accentA: "#2f8d44",
    accentB: "#90cb6a",
    fg: "#182114",
    fgSoft: "#3f4f3d",
    border: "rgba(25, 43, 24, 0.22)",
    card: "rgba(236, 244, 231, 0.72)",
    bubbleAgent: "rgba(250, 253, 248, 0.88)",
    bubbleUser: "rgba(36, 60, 37, 0.94)",
    bubbleUserFg: "#f1f8ee",
    dot: "#2f8d44",
  },
  {
    bgA: "#e7d2c0",
    bgB: "#cf7e9d",
    bgC: "#d7c3d5",
    mist: "rgba(194, 93, 147, 0.3)",
    accentA: "#8f1d49",
    accentB: "#f66c00",
    fg: "#17191a",
    fgSoft: "#4f4f52",
    border: "rgba(19, 20, 22, 0.21)",
    card: "rgba(245, 239, 234, 0.74)",
    bubbleAgent: "rgba(255, 255, 255, 0.85)",
    bubbleUser: "rgba(35, 37, 39, 0.91)",
    bubbleUserFg: "#f0f3f5",
    dot: "#16181c",
  },
  {
    bgA: "#d5d9df",
    bgB: "#9aa2b4",
    bgC: "#b7becc",
    mist: "rgba(109, 131, 164, 0.29)",
    accentA: "#293447",
    accentB: "#6d7f97",
    fg: "#15181d",
    fgSoft: "#505761",
    border: "rgba(16, 19, 22, 0.23)",
    card: "rgba(233, 237, 242, 0.72)",
    bubbleAgent: "rgba(255, 255, 255, 0.82)",
    bubbleUser: "rgba(32, 37, 44, 0.93)",
    bubbleUserFg: "#eff3f6",
    dot: "#30435d",
  },
  {
    bgA: "#ead9cc",
    bgB: "#cda27a",
    bgC: "#e8d7cf",
    mist: "rgba(197, 131, 82, 0.28)",
    accentA: "#73422c",
    accentB: "#b66e42",
    fg: "#1f1713",
    fgSoft: "#5d4a40",
    border: "rgba(53, 33, 24, 0.23)",
    card: "rgba(248, 239, 232, 0.72)",
    bubbleAgent: "rgba(255, 252, 249, 0.86)",
    bubbleUser: "rgba(62, 40, 28, 0.92)",
    bubbleUserFg: "#f7efe9",
    dot: "#6d442d",
  },
];

export const THINKING_MAP: Record<string, string> = {
  search_memory: "我在翻翻他的记忆……",
  reasoning: "让我想想……",
  compose: "我整理一下答案……",
};
