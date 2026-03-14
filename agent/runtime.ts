import { loadWorkspaceMemory } from "./memory";
import { BASE_SYSTEM_PROMPT } from "./prompt";
import { callLLM, callLLMStream } from "./model";
import { loadAgentConfig, type AgentConfig } from "../config/agent.config";
import type { TraceSession } from "./trace";
import type { ResponseInputItem } from "openai/resources/responses/responses";

type BuildMessagesInput = {
  question: string;
  systemPrompt: string;
  config: AgentConfig;
  trace?: TraceSession;
};

type BuildInputResult = {
  instructions: string;
  inputItems: ResponseInputItem[];
};

async function buildMessages(input: BuildMessagesInput): Promise<BuildInputResult> {
  const { question, systemPrompt, config, trace } = input;
  const memory = await loadWorkspaceMemory(config.workspaceDir);
  trace?.log("memory.loaded", {
    workspaceDir: config.workspaceDir,
    documentCount: memory.documents.length,
    documents: memory.documents.map((doc) => doc.name),
  });
  const inputItems: ResponseInputItem[] = [];
  for (let i = 0; i < memory.documents.length; i += 1) {
    const doc = memory.documents[i];
    const toolCallId = `read_mem_${i + 1}`;
    const toolCall: ResponseInputItem = {
      type: "function_call",
      call_id: toolCallId,
      name: "read_workspace_memory",
      arguments: JSON.stringify({
        file: doc.name,
        source: "workspace",
      }),
    };
    const toolResult: ResponseInputItem = {
      type: "function_call_output",
      call_id: toolCallId,
      output: `FILE: ${doc.name}\n${doc.content.trim() || "[EMPTY]"}`,
    };
    inputItems.push(toolCall, toolResult);
  }

  const instructions = `${systemPrompt}

You will receive memory as tool outputs from read_workspace_memory.
Use those tool results as your factual source of truth.`;
  inputItems.push({ role: "user", content: question });

  return { instructions, inputItems };
}

export async function runAgent(
  question: string,
  configOverride?: Partial<AgentConfig>,
  trace?: TraceSession,
): Promise<string> {
  const config = { ...loadAgentConfig(), ...configOverride };

  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  const { instructions, inputItems } = await buildMessages({
    question,
    systemPrompt: BASE_SYSTEM_PROMPT,
    config,
    trace,
  });
  trace?.log("runtime.input.built", { itemCount: inputItems.length });

  const reply = await callLLM(inputItems, instructions, config, trace);
  return reply || "I could not generate a response. Please try again.";
}

export async function* runAgentStream(
  question: string,
  configOverride?: Partial<AgentConfig>,
  trace?: TraceSession,
): AsyncGenerator<string> {
  const config = { ...loadAgentConfig(), ...configOverride };

  if (!question.trim()) {
    throw new Error("Question cannot be empty");
  }

  const { instructions, inputItems } = await buildMessages({
    question,
    systemPrompt: BASE_SYSTEM_PROMPT,
    config,
    trace,
  });
  trace?.log("runtime.input.built", { itemCount: inputItems.length });

  for await (const delta of callLLMStream(inputItems, instructions, config, trace)) {
    yield delta;
  }
}
