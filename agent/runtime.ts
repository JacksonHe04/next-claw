import { loadWorkspaceMemory } from "./memory";
import { buildContext } from "./context";
import { BASE_SYSTEM_PROMPT } from "./prompt";
import { callLLM } from "./model";
import { loadAgentConfig, type AgentConfig } from "../config/agent.config";

export async function runAgent(question: string, configOverride?: Partial<AgentConfig>): Promise<string> {
  const config = { ...loadAgentConfig(), ...configOverride };

  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  const memory = await loadWorkspaceMemory(config.workspaceDir);
  const context = buildContext({
    question,
    systemPrompt: BASE_SYSTEM_PROMPT,
    memory,
  });

  const reply = await callLLM(context, config);
  return reply || "I could not generate a response. Please try again.";
}
