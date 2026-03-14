import type { AgentConfig } from "../config/agent.config";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function isAnthropicBaseUrl(baseUrl: string): boolean {
  return /anthropic\.com/i.test(baseUrl);
}

async function callOpenAICompatible(prompt: string, config: AgentConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error("API_KEY is missing");
  }

  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAnthropic(prompt: string, config: AgentConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error("API_KEY is missing");
  }

  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return data.content?.find((item) => item.type === "text")?.text?.trim() ?? "";
}

export async function callLLM(prompt: string, config: AgentConfig): Promise<string> {
  if (isAnthropicBaseUrl(config.baseUrl)) {
    return callAnthropic(prompt, config);
  }

  return callOpenAICompatible(prompt, config);
}
