import type { WorkspaceMemory } from "./memory";

type BuildContextInput = {
  question: string;
  systemPrompt: string;
  memory: WorkspaceMemory;
};

function section(title: string, value: string): string {
  return `${title}\n${value.trim() || "[EMPTY]"}`;
}

export function buildContext(input: BuildContextInput): string {
  const { question, systemPrompt, memory } = input;

  const extraSections = memory.extras
    .map((item) => section(`EXTRA: ${item.name}`, item.content))
    .join("\n\n");

  return [
    "SYSTEM",
    systemPrompt,
    "",
    section("IDENTITY", memory.identity),
    "",
    section("WORLDVIEW", memory.worldview),
    "",
    section("PERSONALITY", memory.personality),
    "",
    section("RESUME", memory.resume),
    "",
    section("PROJECTS", memory.projects),
    "",
    section("FAQ", memory.faq),
    extraSections ? `\n${extraSections}` : "",
    "",
    section("USER QUESTION", question),
  ]
    .filter(Boolean)
    .join("\n");
}
