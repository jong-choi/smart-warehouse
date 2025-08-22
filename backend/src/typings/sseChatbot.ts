import type { Request, Response } from "express";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { BaseMessage, AIMessage, AIMessageChunk, MessageContent } from "@langchain/core/messages";

// ============================================================================
// SSE Chatbot Controller 타입들
// ============================================================================

/** LangGraph State 타입 */
export interface GraphState {
  messages: BaseMessage[];
}

/** Agent 설정 타입 */
export interface AgentConfig extends RunnableConfig {
  configurable?: {
    systemContext?: string;
    isDBAllowed?: boolean;
    thread_id?: string;
  };
}

/** 메시지 컨텐츠 추출 헬퍼 타입 */
export interface MessageContentBlock {
  text: string;
}

// ============================================================================
// SSE 이벤트 타입들
// ============================================================================

/** 툴 시작 이벤트 */
export interface ToolStartEvent {
  event: "on_tool_start";
  name: string;
  data?: { input?: unknown };
}

/** 툴 종료 이벤트 */
export interface ToolEndEvent {
  event: "on_tool_end";
  name: string;
}

/** 채팅 스트림 이벤트 */
export interface ChatStreamEvent {
  event: "on_chat_model_stream";
  data?: { chunk?: AIMessageChunk };
}

/** 채팅 종료 이벤트 */
export interface ChatEndEvent {
  event: "on_chat_model_end";
  data?: { output?: AIMessage };
}

/** 모든 LangChain 이벤트 타입 */
export type LangChainEvent = ToolStartEvent | ToolEndEvent | ChatStreamEvent | ChatEndEvent;

// ============================================================================
// Reasoning 관련 타입들 (OpenAI o1 모델용)
// ============================================================================

/** Reasoning 요약 파트 */
export interface ReasoningSummaryPart {
  type?: string;
  text?: string;
}

/** Reasoning 메타데이터 */
export interface ReasoningMetadata {
  summary?: ReasoningSummaryPart[];
}

/** Additional kwargs에서 reasoning 추출용 */
export interface ReasoningAdditionalKwargs {
  reasoning?: ReasoningMetadata;
}

/** 응답 메타데이터에서 reasoning 추출용 */
export interface ResponseMetadataWithReasoning {
  reasoning_summary?: ReasoningSummaryPart[];
  reasoning?: ReasoningMetadata;
  usage?: { reasoning_tokens?: number };
}

/** Usage 메타데이터 */
export interface UsageMetadata {
  reasoning_tokens?: number;
}

// ============================================================================
// API 요청/응답 타입들
// ============================================================================

/** 세션 생성 응답 */
export interface CreateSessionResponse {
  sessionId: string;
}

/** 메시지 전송 요청 */
export interface SendMessageRequest {
  sessionId: string;
  message: string;
  systemContext?: string;
  isDBAllowed?: boolean;
}

/** 대화 초기화 요청 */
export interface ClearHistoryRequest {
  sessionId: string;
}

/** API 성공 응답 */
export interface ApiSuccessResponse {
  ok: boolean;
  aborted?: boolean;
}

/** API 에러 응답 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

// ============================================================================
// SSE 이벤트 데이터 타입들
// ============================================================================

/** SSE 시작 이벤트 데이터 */
export interface SSEStartData {
  // 시작 이벤트는 빈 객체
}

/** SSE 청크 이벤트 데이터 */
export interface SSEChunkData {
  type: "response";
  text: string;
}

/** SSE 툴 시작 이벤트 데이터 */
export interface SSEToolStartData {
  name: string;
  input?: unknown;
}

/** SSE 툴 종료 이벤트 데이터 */
export interface SSEToolEndData {
  name: string;
}

/** SSE Reasoning 이벤트 데이터 */
export interface SSEReasoningData {
  type: "reasoning";
  text: string;
  isThinking: boolean;
}

/** SSE Reasoning 완료 이벤트 데이터 */
export interface SSEReasoningCompleteData {
  type: "reasoning_complete";
  summary: string;
}

/** SSE Reasoning 요약 이벤트 데이터 */
export interface SSEReasoningSummaryData {
  type: "reasoning_summary";
  summary: string;
}

/** SSE 종료 이벤트 데이터 */
export interface SSEEndData {
  fullResponse: string;
  reasoningSummary?: string;
  reasoningTokens?: number;
  metadata?: {
    model: string;
    reasoningEffort: string;
  };
}

/** SSE 에러 이벤트 데이터 */
export interface SSEErrorData {
  message: string;
  error: string;
}

// ============================================================================
// 타입 가드 함수들
// ============================================================================

/** 객체 타입 가드 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 툴 시작 이벤트 타입 가드 */
export function isToolStartEvent(e: unknown): e is ToolStartEvent {
  return (
    isObject(e) &&
    (e as { event?: unknown }).event === "on_tool_start" &&
    typeof (e as { name?: unknown }).name === "string"
  );
}

/** 툴 종료 이벤트 타입 가드 */
export function isToolEndEvent(e: unknown): e is ToolEndEvent {
  return (
    isObject(e) &&
    (e as { event?: unknown }).event === "on_tool_end" &&
    typeof (e as { name?: unknown }).name === "string"
  );
}

/** 채팅 스트림 이벤트 타입 가드 */
export function isChatStreamEvent(e: unknown): e is ChatStreamEvent {
  return (
    isObject(e) && (e as { event?: unknown }).event === "on_chat_model_stream"
  );
}

/** 채팅 종료 이벤트 타입 가드 */
export function isChatEndEvent(e: unknown): e is ChatEndEvent {
  return (
    isObject(e) && (e as { event?: unknown }).event === "on_chat_model_end"
  );
}

// ============================================================================
// 유틸리티 타입들
// ============================================================================

/** 메시지 컨텐츠에서 텍스트 추출 함수의 반환 타입 */
export type ExtractedText = string;

/** SSE 이벤트 이름들 */
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

/** Express Request/Response 확장 타입 */
export interface ChatbotRequest extends Request {
  query: {
    sessionId?: string;
  };
  body: SendMessageRequest | ClearHistoryRequest;
}

export type ChatbotResponse = Response & {
  flushHeaders?: () => void;
};