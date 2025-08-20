import { describe, it, expect } from "vitest";
import { createChannelInterface } from "@/utils/broadcastChannel";

describe("broadcastChannel 유틸", () => {
  it("메시지 송수신 및 구독 해지를 처리한다", () => {
    const ch = createChannelInterface("test-ch");
    const received: string[] = [];
    const unsub = ch.subscribe((msg) => {
      received.push(String(msg.msg));
    });

    ch.send({
      ts: Date.now(),
      msg: "ping",
      category: "STATUS",
      severity: "INFO",
      asset: "SYSTEM",
    });
    expect(received).toContain("ping");

    unsub();
    ch.send({
      ts: Date.now(),
      msg: "pong",
      category: "STATUS",
      severity: "INFO",
      asset: "SYSTEM",
    });
    expect(received).not.toContain("pong");

    ch.disconnect();
  });
});
