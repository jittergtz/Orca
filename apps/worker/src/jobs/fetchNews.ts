import type { EnvSource } from "@newsflow/config";
import type { FetchNewsJobData } from "../queue";
import { executeFetchPipeline } from "../services/pipeline";

export async function fetchNewsJob(data: FetchNewsJobData, source?: EnvSource) {
  return executeFetchPipeline(data, source);
}
