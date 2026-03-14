import path from "node:path";
import { existsSync } from "node:fs";

export type AgentConfig = {
  model: string;
  workspaceDir: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl: string;
};

export function loadAgentConfig(): AgentConfig {
  const cwdWorkspace = path.resolve(process.cwd(), "workspace");
  const nestedWorkspace = path.resolve(process.cwd(), "lobster-agent", "workspace");

  const defaultWorkspaceDir = existsSync(cwdWorkspace)
    ? cwdWorkspace
    : nestedWorkspace;

  return {
    model: process.env.MODEL ?? "gpt-4.1",
    workspaceDir: defaultWorkspaceDir,
    temperature: Number(process.env.TEMPERATURE ?? 0.4),
    maxTokens: Number(process.env.MAX_TOKENS ?? 800),
    apiKey: process.env.API_KEY,
    baseUrl: process.env.BASE_URL ?? "https://api.openai.com/v1",
  };
}
