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
