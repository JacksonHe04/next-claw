import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AgentConfig } from "../config/agent.config";

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

export async function callLLM(messages: ChatCompletionMessageParam[], config: AgentConfig): Promise<string> {
  const client = createClient(config);
  const completion = await client.chat.completions.create({
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages,
    reasoning_effort: "minimal",
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function* callLLMStream(
  messages: ChatCompletionMessageParam[],
  config: AgentConfig,
): AsyncGenerator<string> {
  const client = createClient(config);
  const stream = await client.chat.completions.create({
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages,
    stream: true,
    reasoning_effort: "minimal",
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
