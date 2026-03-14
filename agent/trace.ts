import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type TraceEvent = {
  ts: string;
  name: string;
  data?: unknown;
};

type TraceEnvelope = {
  traceId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  summary?: unknown;
  events: TraceEvent[];
};

type CreateTraceInput = {
  traceId?: string;
  meta?: unknown;
};

export class TraceSession {
  readonly id: string;
  private readonly startedAt: Date;
  private readonly events: TraceEvent[] = [];

  constructor(input?: CreateTraceInput) {
    this.id = input?.traceId ?? randomUUID();
    this.startedAt = new Date();
    if (input?.meta !== undefined) {
      this.log("trace.started", input.meta);
    }
  }

  log(name: string, data?: unknown): void {
    this.events.push({
      ts: new Date().toISOString(),
      name,
      data,
    });
  }

  async persist(summary?: unknown): Promise<string> {
    const endedAt = new Date();
    const envelope: TraceEnvelope = {
      traceId: this.id,
      startedAt: this.startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - this.startedAt.getTime(),
      summary,
      events: this.events,
    };

    const traceDir = path.resolve(process.cwd(), "output", "traces");
    await fs.mkdir(traceDir, { recursive: true });
    const tracePath = path.join(traceDir, `${this.id}.json`);
    await fs.writeFile(tracePath, JSON.stringify(envelope, null, 2), "utf8");
    return tracePath;
  }
}

export function createTraceSession(input?: CreateTraceInput): TraceSession {
  return new TraceSession(input);
}
