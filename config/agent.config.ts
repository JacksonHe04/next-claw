import path from "node:path";

export type AgentConfig = {
  model: string;
  workspaceDir: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl: string;
};

const AGENT_SETTINGS = {
  model: "doubao-seed-1-8-251228",
  temperature: 0.4,
  maxTokens: 800,
  baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
} as const;

export function loadAgentConfig(): AgentConfig {
  const defaultWorkspaceDir = path.resolve(process.cwd(), "workspace");

  return {
    model: AGENT_SETTINGS.model,
    workspaceDir: defaultWorkspaceDir,
    temperature: AGENT_SETTINGS.temperature,
    maxTokens: AGENT_SETTINGS.maxTokens,
    apiKey: process.env.API_KEY,
    baseUrl: AGENT_SETTINGS.baseUrl,
  };
}
