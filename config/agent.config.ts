import path from "node:path";
import { existsSync } from "node:fs";

export type Provider = "openai" | "anthropic" | "openrouter";

export type AgentConfig = {
  provider: Provider;
  model: string;
  workspaceDir: string;
  temperature: number;
  maxTokens: number;
  openaiApiKey?: string;
  openaiBaseUrl: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  openrouterBaseUrl: string;
};

export function loadAgentConfig(): AgentConfig {
  const provider = (process.env.LOBSTER_PROVIDER ?? "openai") as Provider;
  const cwdWorkspace = path.resolve(process.cwd(), "workspace");
  const nestedWorkspace = path.resolve(process.cwd(), "lobster-agent", "workspace");

  const defaultWorkspaceDir = existsSync(cwdWorkspace)
    ? cwdWorkspace
    : nestedWorkspace;

  return {
    provider,
    model: process.env.LOBSTER_MODEL ?? "gpt-4.1",
    workspaceDir: process.env.LOBSTER_WORKSPACE_DIR ?? defaultWorkspaceDir,
    temperature: Number(process.env.LOBSTER_TEMPERATURE ?? 0.4),
    maxTokens: Number(process.env.LOBSTER_MAX_TOKENS ?? 800),
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  };
}
