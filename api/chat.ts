import { runAgentStream } from "../agent/runtime";
import { createTraceSession } from "../agent/trace";

type ChatRequest = {
  message?: string;
};

type StreamEvent =
  | { event: "status"; data: { stage: "search_memory" | "reasoning" | "compose" } }
  | { event: "delta"; data: { text: string } }
  | { event: "done"; data: { ok: true } }
  | { event: "error"; data: { error: string } };

const encoder = new TextEncoder();

function writeEvent(controller: ReadableStreamDefaultController<Uint8Array>, payload: StreamEvent) {
  const block = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
  controller.enqueue(encoder.encode(block));
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
        for await (const delta of runAgentStream(message, undefined, trace)) {
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
        const tracePath = await trace.persist({ status: failed ? "failed" : "completed" });
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
