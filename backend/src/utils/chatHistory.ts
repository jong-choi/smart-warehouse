// 랭그래프에서 사용할 수 있는 삭제 가능한 messages입니다.
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

export class ChatMessageHistoryWithDeletion extends BaseChatMessageHistory {
  private readonly internal: ChatMessageHistory;

  constructor(existing?: ChatMessageHistory) {
    super();
    this.internal = existing ?? new ChatMessageHistory();
  }

  lc_namespace = ["langchain", "stores", "message", "awesome"];

  async addUserMessage(text: string): Promise<void> {
    await this.internal.addMessage(new HumanMessage(text));
  }

  async addAIChatMessage(text: string): Promise<void> {
    await this.internal.addMessage(new AIMessage(text));
  }

  async getMessages(): Promise<BaseMessage[]> {
    return this.internal.getMessages();
  }

  async addMessage(message: BaseMessage): Promise<void> {
    return this.internal.addMessage(message);
  }

  async clear(): Promise<void> {
    return this.internal.clear();
  }

  // 사용자 정의 기능: 조건 기반 삭제
  async deleteMessages(
    predicate: (message: BaseMessage) => boolean
  ): Promise<void> {
    const allMessages = await this.internal.getMessages();
    const filtered = allMessages.filter((msg) => !predicate(msg));

    await this.internal.clear();
    for (const msg of filtered) {
      await this.internal.addMessage(msg);
    }
  }
}
