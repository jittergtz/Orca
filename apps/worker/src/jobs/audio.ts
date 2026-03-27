import type { GenerateAudioJobData } from "../queue";

export async function generateAudioJob(data: GenerateAudioJobData) {
  return {
    status: "queued-for-edge-function",
    articleId: data.articleId,
  };
}
