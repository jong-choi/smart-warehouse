import { useEffect, useMemo } from "react";
import { createChannelInterface } from "@/utils";
import type { BroadcastMessage } from "@/types/broadcast";
import { useWorkersStore } from "@/stores/workersStore";
import type { WorkerStatus } from "@components/dashboard/home/workers/types";
import { useShallow } from "zustand/shallow";

export const useWorkersBroadcast = () => {
  const workers = useWorkersStore(useShallow((s) => s.workers));
  const updateWorker = useWorkersStore((s) => s.updateWorker);

  // 브로드캐스트 채널 연결
  const channel = useMemo(() => createChannelInterface("warehouse-events"), []);

  // 메시지 수신 처리
  useEffect(() => {
    const unsubscribe = channel.subscribe((message: BroadcastMessage) => {
      const now = new Date().toISOString();

      if (message.msg === "작업자 처리" || message.msg === "물건 파손") {
        const msgMap: Record<string, WorkerStatus> = {
          "작업자 처리": "WORKING",
          "물건 파손": "BROKEN",
        };
        // 작업자가 물건을 처리했을 때
        const workerId = message.workerId as string;
        const currentWorker = workers.find((w) => w.id === workerId);

        // 최초 작업 시작 시간 설정 (처음 처리할 때만)
        const workStartedAt = currentWorker?.workStartedAt || now;

        // 카운트 업데이트 로직
        const isAccident = message.msg === "물건 파손";
        const currentProcessedCount = currentWorker?.processedCount || 0;
        const currentAccidentCount = currentWorker?.accidentCount || 0;

        updateWorker(workerId, {
          status: msgMap[message.msg],
          processedCount: isAccident
            ? currentProcessedCount
            : currentProcessedCount + 1, // 사고가 아닐때만
          accidentCount: isAccident
            ? currentAccidentCount + 1
            : currentAccidentCount, // 사고일 때만 +1
          lastProcessedAt: now,
          workStartedAt,
        });
      } else if (message.msg === "작업 종료") {
        // 작업자의 쿨다운이 끝났을 때
        const workerId = message.workerId as string;
        const currentWorker = workers.find((w) => w.id === workerId);

        // 작업시간 계산 및 누적
        let additionalWorkTime = 0;
        if (currentWorker?.lastProcessedAt) {
          const lastProcessedTime = new Date(
            currentWorker.lastProcessedAt
          ).getTime();
          const nowTime = new Date(now).getTime();
          additionalWorkTime = nowTime - lastProcessedTime;
        }

        updateWorker(workerId, {
          status: "IDLE",
          totalWorkTime:
            (currentWorker?.totalWorkTime || 0) + additionalWorkTime,
        });
      }
    });

    return unsubscribe;
  }, [channel, updateWorker, workers]);
};
