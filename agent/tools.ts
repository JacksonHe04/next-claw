import path from "node:path";

import { loadWorkspaceMemory } from "./memory";

export type AgentToolName = "search_workspace" | "read_workspace_doc" | "get_current_time";

export const REACT_TOOLS = [
  {
    type: "function" as const,
    name: "search_workspace",
    description: "Search markdown memory files by keyword and return matched snippets.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        keyword: {
          type: "string",
          description: "Search keyword in Chinese or English.",
        },
      },
      required: ["keyword"],
    },
  },
  {
    type: "function" as const,
    name: "read_workspace_doc",
    description: "Read one markdown memory file from workspace by file name.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        file: {
          type: "string",
          description: "Markdown file name in workspace, such as projects.md",
        },
      },
      required: ["file"],
    },
  },
  {
    type: "function" as const,
    name: "get_current_time",
    description: "Get current date time in Shanghai timezone.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },
];

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    return {};
  }
}

function normalizeWorkspaceName(file: string): string {
  return path.basename(file.trim());
}

export async function runTool(
  name: string,
  rawArguments: string,
  workspaceDir: string,
): Promise<{ summary: string; output: string }> {
  const args = safeParseArgs(rawArguments);

  if (name === "get_current_time") {
    const now = new Date();
    const shanghai = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    return {
      summary: `读取上海时间: ${shanghai}`,
      output: JSON.stringify({ timezone: "Asia/Shanghai", value: shanghai }),
    };
  }

  const memory = await loadWorkspaceMemory(workspaceDir);

  if (name === "read_workspace_doc") {
    const file = normalizeWorkspaceName(String(args.file ?? ""));
    const target = memory.documents.find((doc) => doc.name === file);
    if (!target) {
      return {
        summary: `未找到文档: ${file}`,
        output: JSON.stringify({ file, found: false, content: "" }),
      };
    }
    return {
      summary: `读取文档: ${file}`,
      output: JSON.stringify({ file, found: true, content: target.content }),
    };
  }

  if (name === "search_workspace") {
    const keyword = String(args.keyword ?? "").trim().toLowerCase();
    if (!keyword) {
      return {
        summary: "搜索关键词为空",
        output: JSON.stringify({ keyword: "", matches: [] }),
      };
    }
    const matches = memory.documents
      .map((doc) => {
        const lines = doc.content.split(/\r?\n/);
        const hit = lines.find((line) => line.toLowerCase().includes(keyword));
        return hit ? { file: doc.name, snippet: hit.trim().slice(0, 160) } : null;
      })
      .filter((item): item is { file: string; snippet: string } => Boolean(item))
      .slice(0, 5);

    return {
      summary: `搜索关键词: ${keyword}，命中 ${matches.length} 条`,
      output: JSON.stringify({ keyword, matches }),
    };
  }

  return {
    summary: `未知工具: ${name}`,
    output: JSON.stringify({ error: `Unsupported tool: ${name}` }),
  };
}
