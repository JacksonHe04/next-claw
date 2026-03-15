import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import type { AgentConfig } from "../config/agent.config";
import type { TraceSession } from "./trace";
import { REACT_TOOLS, runTool } from "./tools";

type ReactTrace = {
  step: string;
  detail: string;
};

type ReactLoopOptions = {
  streamText: boolean;
  onTrace?: (event: ReactTrace) => void;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function createClient(config: AgentConfig): OpenAI {
  if (!config.apiKey) {
    throw new Error("API_KEY is missing");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: normalizeBaseUrl(config.baseUrl),
  });
}

export async function callLLM(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace?: TraceSession,
): Promise<string> {
  let final = "";
  for await (const delta of callLLMStream(input, instructions, config, trace)) {
    final += delta;
  }
  return final.trim();
}

export async function* callLLMStream(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace?: TraceSession,
): AsyncGenerator<string> {
  for await (const delta of runReactLoop(input, instructions, config, trace, { streamText: true })) {
    yield delta;
  }
}

export async function* callLLMReactStream(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace?: TraceSession,
  onTrace?: (event: ReactTrace) => void,
): AsyncGenerator<string> {
  for await (const delta of runReactLoop(input, instructions, config, trace, { streamText: true, onTrace })) {
    yield delta;
  }
}

async function* runReactLoop(
  input: ResponseInputItem[],
  instructions: string,
  config: AgentConfig,
  trace: TraceSession | undefined,
  options: ReactLoopOptions,
): AsyncGenerator<string> {
  const client = createClient(config);
  trace?.log("model.react.request", {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    instructions,
    input,
    tools: REACT_TOOLS.map((tool) => tool.name),
  });

  let previousResponseId: string | undefined;
  let turnInput: ResponseInputItem[] = input;
  let finalText = "";

  for (let iteration = 1; iteration <= 8; iteration += 1) {
    options.onTrace?.({ step: "think", detail: `第 ${iteration} 轮推理中` });
    const response = await client.responses.create({
      model: config.model,
      instructions,
      input: turnInput,
      previous_response_id: previousResponseId,
      temperature: config.temperature,
      max_output_tokens: config.maxTokens,
      reasoning: { effort: "minimal" },
      tools: REACT_TOOLS,
    });

    previousResponseId = response.id;
    const toolCalls = response.output.filter((item) => item.type === "function_call");
    const outputText = response.output_text?.trim() ?? "";

    trace?.log("model.react.turn", {
      iteration,
      responseId: response.id,
      toolCallCount: toolCalls.length,
      outputText,
      usage: response.usage,
    });

    if (!toolCalls.length) {
      finalText = outputText;
      break;
    }

    const toolOutputs: ResponseInputItem[] = [];
    for (const call of toolCalls) {
      const { summary, output } = await runTool(call.name, call.arguments, config.workspaceDir);
      options.onTrace?.({ step: "tool", detail: `${call.name}: ${summary}` });
      trace?.log("model.react.tool", {
        iteration,
        callId: call.call_id,
        name: call.name,
        arguments: call.arguments,
        summary,
      });
      toolOutputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output,
      });
    }
    turnInput = toolOutputs;
  }

  const fallback = "我暂时没有生成答案，请稍后再试。";
  const text = (finalText || fallback).trim();
  trace?.log("model.react.response", {
    responseText: text,
  });

  if (options.streamText) {
    for (const token of text.match(/.{1,12}/g) ?? [text]) {
      yield token;
    }
    return;
  }

  yield text;
}
