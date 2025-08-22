import { ChatOpenAI } from "@langchain/openai";
import { MODEL_NAME } from "./constants";

export const createLLMModel = () => {
  return new ChatOpenAI({
    model: MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
    useResponsesApi: true,
    reasoning: { summary: "auto" },
    streamUsage: true,
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
