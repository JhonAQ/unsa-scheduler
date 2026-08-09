import { generateSchedules } from "../lib/scheduler";
import type { Course } from "../lib/types";

export type SchedulerWorkerInput = {
  activeCourses: Course[];
  maxCombinations: number;
};

export type SchedulerWorkerOutput = {
  combinations: ReturnType<typeof generateSchedules>["combinations"];
  truncated: boolean;
};

self.onmessage = (event: MessageEvent<SchedulerWorkerInput>) => {
  const { activeCourses, maxCombinations } = event.data;
  const { combinations, truncated } = generateSchedules(
    activeCourses,
    maxCombinations,
  );
  self.postMessage({ combinations, truncated } satisfies SchedulerWorkerOutput);
};
