import type { AgentConfig } from "../config/agent.config";

async function callOpenAI(prompt: string, config: AgentConfig): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const baseUrl = config.openaiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
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
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropicApiKey,
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

async function callOpenRouter(prompt: string, config: AgentConfig): Promise<string> {
  if (!config.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const url = `${config.openrouterBaseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openrouterApiKey}`,
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
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function callLLM(prompt: string, config: AgentConfig): Promise<string> {
  switch (config.provider) {
    case "openai":
      return callOpenAI(prompt, config);
    case "anthropic":
      return callAnthropic(prompt, config);
    case "openrouter":
      return callOpenRouter(prompt, config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
