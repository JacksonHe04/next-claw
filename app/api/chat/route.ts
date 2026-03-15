import { runAgentStream } from "../../../agent/runtime";
import { createTraceSession } from "../../../agent/trace";

type ChatRequest = {
  message?: string;
};

type StreamEvent =
  | { event: "status"; data: { stage: "search_memory" | "reasoning" | "compose" } }
  | { event: "trace"; data: { step: string; detail: string } }
  | { event: "delta"; data: { text: string } }
  | { event: "done"; data: { ok: true } }
  | { event: "error"; data: { error: string } };

const encoder = new TextEncoder();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateBucket = new Map<string, number[]>();

function writeEvent(controller: ReadableStreamDefaultController<Uint8Array>, payload: StreamEvent) {
  const block = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
  controller.enqueue(encoder.encode(block));
}

function getClientId(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return xff || realIp || "unknown";
}

function checkRateLimit(clientId: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const start = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateBucket.get(clientId) ?? []).filter((ts) => ts > start);

  if (hits.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    rateBucket.set(clientId, hits);
    return { ok: false, retryAfter };
  }

  hits.push(now);
  rateBucket.set(clientId, hits);
  return { ok: true };
}

export async function POST(req: Request): Promise<Response> {
  const trace = createTraceSession({
    meta: {
      route: "POST /api/chat",
    },
  });
  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    trace.log("api.request.invalid_json");
    await trace.persist({ status: "bad_request", reason: "invalid_json" });
    return Response.json(
      { error: "Invalid JSON body", traceId: trace.id },
      { status: 400, headers: { "X-Trace-Id": trace.id } },
    );
  }

  const clientId = getClientId(req);
  const rate = checkRateLimit(clientId);
  if (!rate.ok) {
    trace.log("api.request.rate_limited", { clientId, retryAfter: rate.retryAfter });
    await trace.persist({ status: "rate_limited", retryAfter: rate.retryAfter });
    return Response.json(
      {
        error: `请求过于频繁，请在 ${rate.retryAfter} 秒后重试。`,
        retryAfter: rate.retryAfter,
        traceId: trace.id,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfter),
          "X-Trace-Id": trace.id,
        },
      },
    );
  }

  const message = body.message?.trim();
  if (!message) {
    trace.log("api.request.invalid_message", { body });
    await trace.persist({ status: "bad_request", reason: "message_required" });
    return Response.json(
      { error: "message is required", traceId: trace.id },
      { status: 400, headers: { "X-Trace-Id": trace.id } },
    );
  }
  trace.log("api.request.accepted", { message });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finalText = "";
      let failed = false;
      try {
        writeEvent(controller, { event: "status", data: { stage: "search_memory" } });
        trace.log("api.status", { stage: "search_memory" });
        writeEvent(controller, { event: "status", data: { stage: "reasoning" } });
        trace.log("api.status", { stage: "reasoning" });
        writeEvent(controller, { event: "status", data: { stage: "compose" } });
        trace.log("api.status", { stage: "compose" });

        let hasDelta = false;
        for await (const delta of runAgentStream(message, undefined, trace, (event) => {
          writeEvent(controller, { event: "trace", data: event });
        })) {
          hasDelta = true;
          finalText += delta;
          writeEvent(controller, { event: "delta", data: { text: delta } });
        }

        if (!hasDelta) {
          finalText = "我暂时没有生成答案，请再问我一次。";
          writeEvent(controller, {
            event: "delta",
            data: { text: "我暂时没有生成答案，请再问我一次。" },
          });
        }

        writeEvent(controller, { event: "done", data: { ok: true } });
        trace.log("api.response.done", { hasDelta, text: finalText });
      } catch (error) {
        failed = true;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        writeEvent(controller, { event: "error", data: { error: errorMessage } });
        trace.log("api.response.error", { error: errorMessage });
      } finally {
        controller.close();
        let tracePath = "not_persisted";
        try {
          tracePath = await trace.persist({ status: failed ? "failed" : "completed" });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // Keep request flow healthy even when filesystem is readonly in production.
          // eslint-disable-next-line no-console
          console.error(`[trace] ${trace.id} persist failed: ${message}`);
        }
        // Keep a minimal terminal-visible marker for operations troubleshooting.
        // eslint-disable-next-line no-console
        console.info(`[trace] ${trace.id} -> ${tracePath}`);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Trace-Id": trace.id,
    },
  });
}
