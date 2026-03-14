import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import type { AgentConfig } from "../config/agent.config";
import type { TraceSession } from "./trace";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function createClient(config: AgentConfig): OpenAI {
  if (!config.apiKey) {
    throw new Error("API_KEY is missing");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: normalizeBaseUrl(config.baseUrl),
  });
}

export async function callLLM(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace?: TraceSession,
): Promise<string> {
  const client = createClient(config);
  trace?.log("model.request", {
    mode: "non_stream",
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    instructions,
    input,
  });
  const response = await client.responses.create({
    model: config.model,
    instructions,
    input,
    temperature: config.temperature,
    max_output_tokens: config.maxTokens,
    reasoning: { effort: "minimal" },
  });

  const text = response.output_text?.trim() ?? "";
  trace?.log("model.response", {
    mode: "non_stream",
    responseId: response.id,
    usage: response.usage,
    text,
  });
  return text;
}

export async function* callLLMStream(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace?: TraceSession,
): AsyncGenerator<string> {
  const client = createClient(config);
  trace?.log("model.request", {
    mode: "stream",
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    instructions,
    input,
  });
  const stream = await client.responses.create({
    model: config.model,
    instructions,
    input,
    temperature: config.temperature,
    max_output_tokens: config.maxTokens,
    stream: true,
    reasoning: { effort: "minimal" },
  });

  let fullText = "";
  let eventCount = 0;
  for await (const chunk of stream) {
    eventCount += 1;
    if (chunk.type === "response.output_text.delta" && chunk.delta) {
      fullText += chunk.delta;
      yield chunk.delta;
    }
  }
  trace?.log("model.response", {
    mode: "stream",
    eventCount,
    text: fullText,
  });
}
