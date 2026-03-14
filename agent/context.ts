import type { WorkspaceMemory } from "./memory";

type BuildUserContextInput = {
  question: string;
  memory: WorkspaceMemory;
};

function section(title: string, value: string): string {
  return `${title}\n${value.trim() || "[EMPTY]"}`;
}

export function buildUserContext(input: BuildUserContextInput): string {
  const { question, memory } = input;

  const extraSections = memory.extras
    .map((item) => section(`EXTRA: ${item.name}`, item.content))
    .join("\n\n");

  return [
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
