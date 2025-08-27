import type { Request, Response } from "express";
import type { RunnableConfig } from "@langchain/core/runnables";
import type {
  BaseMessage,
  AIMessage,
  AIMessageChunk,
} from "@langchain/core/messages";

export interface GraphState {
  messages: BaseMessage[];
}

export interface AgentConfig extends RunnableConfig {
  configurable?: {
    systemContext?: string;
    isDBAllowed?: boolean;
    thread_id?: string;
  };
}

export interface MessageContentBlock {
  text: string;
}

export interface ToolStartEvent {
  event: "on_tool_start";
  name: string;
  data?: { input?: unknown };
}

export interface ToolEndEvent {
  event: "on_tool_end";
  name: string;
}

export interface ChatStreamEvent {
  event: "on_chat_model_stream";
  data?: { chunk?: AIMessageChunk };
}

export interface ChatEndEvent {
  event: "on_chat_model_end";
  data?: { output?: AIMessage };
}

export type LangChainEvent =
  | ToolStartEvent
  | ToolEndEvent
  | ChatStreamEvent
  | ChatEndEvent;

export interface ReasoningSummaryPart {
  type?: string;
  text?: string;
}

export interface ReasoningMetadata {
  summary?: ReasoningSummaryPart[];
}

export interface ReasoningAdditionalKwargs {
  reasoning?: ReasoningMetadata;
}

export interface ResponseMetadataWithReasoning {
  reasoning_summary?: ReasoningSummaryPart[];
  reasoning?: ReasoningMetadata;
  usage?: { reasoning_tokens?: number };
}

export interface UsageMetadata {
  reasoning_tokens?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  systemContext?: string;
  isDBAllowed?: boolean;
}

export interface ClearHistoryRequest {
  sessionId: string;
}

export interface ApiSuccessResponse {
  ok: boolean;
  aborted?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export interface SSEStartData {}

export interface SSEChunkData {
  type: "response";
  text: string;
}

export interface SSEToolStartData {
  name: string;
  input?: unknown;
}

export interface SSEToolEndData {
  name: string;
}

export interface SSEReasoningData {
  type: "reasoning";
  text: string;
  isThinking: boolean;
}

export interface SSEReasoningCompleteData {
  type: "reasoning_complete";
  summary: string;
}

export interface SSEReasoningSummaryData {
  type: "reasoning_summary";
  summary: string;
}

export interface SSEEndData {
  fullResponse: string;
  reasoningSummary?: string;
  reasoningTokens?: number;
  metadata?: {
    model: string;
    reasoningEffort: string;
  };
}

export interface SSEErrorData {
  message: string;
  error: string;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isToolStartEvent(e: unknown): e is ToolStartEvent {
  return (
    isObject(e) &&
    (e as { event?: unknown }).event === "on_tool_start" &&
    typeof (e as { name?: unknown }).name === "string"
  );
}

export function isToolEndEvent(e: unknown): e is ToolEndEvent {
  return (
    isObject(e) &&
    (e as { event?: unknown }).event === "on_tool_end" &&
    typeof (e as { name?: unknown }).name === "string"
  );
}

export function isChatStreamEvent(e: unknown): e is ChatStreamEvent {
  return (
    isObject(e) && (e as { event?: unknown }).event === "on_chat_model_stream"
  );
}

export function isChatEndEvent(e: unknown): e is ChatEndEvent {
  return (
    isObject(e) && (e as { event?: unknown }).event === "on_chat_model_end"
  );
}

export type ExtractedText = string;

export type SSEEventName =
  | "ping"
  | "start"
  | "chunk"
  | "tool_start"
  | "tool_end"
  | "reasoning"
  | "reasoning_complete"
  | "reasoning_summary"
  | "end"
  | "error";

export interface ChatbotRequest extends Request {
  query: {
    sessionId?: string;
  };
  body: SendMessageRequest | ClearHistoryRequest;
}

export type ChatbotResponse = Response & {
  flushHeaders?: () => void;
};
