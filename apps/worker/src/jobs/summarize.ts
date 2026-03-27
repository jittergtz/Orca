import type { EnvSource } from "@newsflow/config";
import type { SummarizeArticleJobData } from "../queue";
import { executeSummarizePipeline } from "../services/pipeline";

export async function summarizeJob(data: SummarizeArticleJobData, source?: EnvSource) {
  return executeSummarizePipeline(data, source);
}
