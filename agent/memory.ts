import { promises as fs } from "node:fs";
import path from "node:path";

export type WorkspaceMemory = {
  identity: string;
  worldview: string;
  resume: string;
  projects: string;
  personality: string;
  faq: string;
  documents: Array<{ name: string; content: string }>;
  extras: Array<{ name: string; content: string }>;
};

const CORE_FILES = [
  "identity.md",
  "worldview.md",
  "resume.md",
  "projects.md",
  "personality.md",
  "faq.md",
] as const;

async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function loadWorkspaceMemory(workspaceDir: string): Promise<WorkspaceMemory> {
  let dirEntries;
  try {
    dirEntries = await fs.readdir(workspaceDir, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read workspace directory: ${workspaceDir}. ${message}`);
  }

  const markdownFiles = dirEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const contentsByName = new Map<string, string>();
  await Promise.all(
    markdownFiles.map(async (fileName) => {
      const filePath = path.join(workspaceDir, fileName);
      const content = await readMarkdownFile(filePath);
      contentsByName.set(fileName, content.trim());
    }),
  );

  const extras: Array<{ name: string; content: string }> = [];
  const documents: Array<{ name: string; content: string }> = [];
  for (const fileName of markdownFiles) {
    documents.push({ name: fileName, content: contentsByName.get(fileName) ?? "" });
    if (!CORE_FILES.includes(fileName as (typeof CORE_FILES)[number])) {
      extras.push({ name: fileName, content: contentsByName.get(fileName) ?? "" });
    }
  }

  return {
    identity: contentsByName.get("identity.md") ?? "",
    worldview: contentsByName.get("worldview.md") ?? "",
    resume: contentsByName.get("resume.md") ?? "",
    projects: contentsByName.get("projects.md") ?? "",
    personality: contentsByName.get("personality.md") ?? "",
    faq: contentsByName.get("faq.md") ?? "",
    documents,
    extras,
  };
}
