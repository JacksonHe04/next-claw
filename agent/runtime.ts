import { loadWorkspaceMemory } from "./memory";
import { buildUserContext } from "./context";
import { BASE_SYSTEM_PROMPT } from "./prompt";
import { callLLM, callLLMStream } from "./model";
import { loadAgentConfig, type AgentConfig } from "../config/agent.config";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type BuildMessagesInput = {
  question: string;
  systemPrompt: string;
  config: AgentConfig;
};

async function buildMessages(input: BuildMessagesInput): Promise<ChatCompletionMessageParam[]> {
  const { question, systemPrompt, config } = input;
  const memory = await loadWorkspaceMemory(config.workspaceDir);
  const userContext = buildUserContext({ question, memory });

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContext },
  ];
}

export async function runAgent(question: string, configOverride?: Partial<AgentConfig>): Promise<string> {
  const config = { ...loadAgentConfig(), ...configOverride };

  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  const messages = await buildMessages({
    question,
    systemPrompt: BASE_SYSTEM_PROMPT,
    config,
  });

  const reply = await callLLM(messages, config);
  return reply || "I could not generate a response. Please try again.";
}

export async function* runAgentStream(
  question: string,
  configOverride?: Partial<AgentConfig>,
): AsyncGenerator<string> {
  const config = { ...loadAgentConfig(), ...configOverride };

  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  const messages = await buildMessages({
    question,
    systemPrompt: BASE_SYSTEM_PROMPT,
    config,
  });

  for await (const delta of callLLMStream(messages, config)) {
    yield delta;
  }
}
