import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { MessageContent } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { AgentConfig, GraphState } from "@src/typings/sseChatbot";
import { allDbTools, googleSearchTool, mathTool } from "@src/utils/tools";
import {
  FALLBACK_MODEL_NAME,
  MODEL_NAME,
  SYSTEM_PROMPT,
} from "./constants";
import {
  createFallbackLLMModel,
  createPrimaryLLMModel,
  createSystemPrompt,
} from "./model";

export interface ChatAgent {
  modelName: string;
  streamEvents(input: {
    sessionId: string;
    message: string;
    systemContext?: string;
    isDBAllowed?: boolean;
    signal?: AbortSignal;
  }): AsyncIterable<unknown>;
}

export interface ChatRuntime {
  primary: ChatAgent;
  fallback: ChatAgent;
  clearSession(sessionId: string): Promise<void>;
}

const extractText = (content: string | MessageContent[]): string => {
  if (typeof content === "string") return content;

  return content
    .map((block) => {
      if (
        typeof block === "object" &&
        block !== null &&
        "text" in block &&
        typeof (block as { text: unknown }).text === "string"
      ) {
        return (block as { text: string }).text;
      }
      return "";
    })
    .join("");
};

export const createProductionChatRuntime = (): ChatRuntime => {
  const checkpointer = new MemorySaver();
  const tools = [googleSearchTool, mathTool, ...allDbTools];

  const createAgent = (
    llm: ReturnType<typeof createPrimaryLLMModel>,
    modelName: string
  ): ChatAgent => {
    const agent = createReactAgent({
      llm,
      tools,
      checkpointer,
      prompt: (state: GraphState, config: AgentConfig) => {
        const cfg = config?.configurable ?? {};
        const messages = state?.messages ?? [];
        const baseline = [
          new SystemMessage({ content: SYSTEM_PROMPT }),
          ...messages,
        ];

        let userText = "";
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          if (message.getType() === "human") {
            userText = extractText(
              message.content as string | MessageContent[]
            );
            break;
          }
        }

        if (cfg.systemContext || cfg.isDBAllowed) {
          return [
            new SystemMessage({
              content: createSystemPrompt(
                userText,
                cfg.systemContext || "",
                !!cfg.isDBAllowed
              ),
            }),
            ...baseline,
          ];
        }

        return baseline;
      },
    });

    return {
      modelName,
      streamEvents: ({
        sessionId,
        message,
        systemContext,
        isDBAllowed,
        signal,
      }) =>
        agent.streamEvents(
          {
            messages: [
              new HumanMessage(
                `${message}(DBTools : ${
                  isDBAllowed ? "Allowed" : "Prohibited"
                })`
              ),
            ],
          },
          {
            version: "v2",
            signal,
            configurable: { thread_id: sessionId, systemContext, isDBAllowed },
          }
        ) as AsyncIterable<unknown>,
    };
  };

  return {
    primary: createAgent(createPrimaryLLMModel(), MODEL_NAME),
    fallback: createAgent(createFallbackLLMModel(), FALLBACK_MODEL_NAME),
    clearSession: async (sessionId: string) => {
      await checkpointer.deleteThread(sessionId);
    },
  };
};
