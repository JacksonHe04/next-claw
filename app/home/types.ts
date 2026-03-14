export type Role = "user" | "agent";
export type AgentStage = "idle" | "thinking" | "speaking";

export type ChatMessage = {
  id: string;
  role: Role;
  text: string;
};

export type QuestionPage = {
  title: string;
  focus: string;
  question: string;
};

export type ThemeSwatch = {
  bgA: string;
  bgB: string;
  bgC: string;
  mist: string;
  accentA: string;
  accentB: string;
  fg: string;
  fgSoft: string;
  border: string;
  card: string;
  bubbleAgent: string;
  bubbleUser: string;
  bubbleUserFg: string;
  dot: string;
};

export type ClockState = {
  label: string;
  year: string;
};
