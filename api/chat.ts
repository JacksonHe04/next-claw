import { runAgentStream } from "../agent/runtime";

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
  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        writeEvent(controller, { event: "status", data: { stage: "search_memory" } });
        writeEvent(controller, { event: "status", data: { stage: "reasoning" } });
        writeEvent(controller, { event: "status", data: { stage: "compose" } });

        let hasDelta = false;
        for await (const delta of runAgentStream(message)) {
          hasDelta = true;
          writeEvent(controller, { event: "delta", data: { text: delta } });
        }

        if (!hasDelta) {
          writeEvent(controller, {
            event: "delta",
            data: { text: "我暂时没有生成答案，请再问我一次。" },
          });
        }

        writeEvent(controller, { event: "done", data: { ok: true } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        writeEvent(controller, { event: "error", data: { error: errorMessage } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
