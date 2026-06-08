import { ChatOpenAI } from "@langchain/openai";
import { FALLBACK_MODEL_NAME, MODEL_NAME } from "./constants";

const readRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
};

export const createPrimaryLLMModel = () => {
  return new ChatOpenAI({
    model: MODEL_NAME,
    apiKey: readRequiredEnv("OLLAMA_API_KEY"),
    streaming: true,
    streamUsage: true,
    configuration: {
      baseURL: readRequiredEnv("OLLAMA_BASE_URL"),
    },
  });
};

export const createFallbackLLMModel = () => {
  return new ChatOpenAI({
    model: FALLBACK_MODEL_NAME,
    apiKey: readRequiredEnv("OPENROUTER_API_KEY"),
    streaming: true,
    streamUsage: true,
    configuration: {
      baseURL: readRequiredEnv("OPENROUTER_BASE_URL"),
    },
  });
};

export const createSystemPrompt = (
  message: string,
  systemContext: string,
  isDBAllowed: boolean
) => {
  const prompt = `당신은 창고 전문 챗봇입니다.
항상 한국어로 답변합니다.
user message: ${message},
${
  isDBAllowed
    ? "도구 호출이 가능합니다. \nDB Tools : Allowed\n"
    : "DB Tools : NOT Allowed\n"
}
${
  systemContext
    ? `화면 기반으로 응답합니다.\nscreen context: ${systemContext},\n`
    : ""
}
`;
  return prompt;
};
