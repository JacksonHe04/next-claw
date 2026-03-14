import { runAgent } from "../agent/runtime";

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

function splitToChunks(text: string): string[] {
  const chunks: string[] = [];
  const words = text.split(/(\s+)/).filter(Boolean);
  let current = "";

  for (const token of words) {
    if ((current + token).length > 22 && current) {
      chunks.push(current);
      current = token;
    } else {
      current += token;
    }
  }

  if (current) chunks.push(current);
  return chunks;
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
        const reply = await runAgent(message);

        writeEvent(controller, { event: "status", data: { stage: "reasoning" } });
        writeEvent(controller, { event: "status", data: { stage: "compose" } });

        const chunks = splitToChunks(reply || "我暂时没有生成答案，请再问我一次。");
        for (const chunk of chunks) {
          writeEvent(controller, { event: "delta", data: { text: chunk } });
          await new Promise((resolve) => setTimeout(resolve, 24));
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
