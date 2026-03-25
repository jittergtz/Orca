import * as fs from "fs";
import { parseArgs, readBooleanFlag, readOptionalStringFlag, readRequiredStringFlag } from "./lib/args";
import { logger } from "./lib/logger";
import { runHealthcheck } from "./services/healthcheck";
import { executeFetchPipeline, executeSummarizePipeline } from "./services/pipeline";
import { previewTopicRefinement } from "./services/topicRefinement";

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "healthcheck": {
      const result = await runHealthcheck(process.env as Record<string, string | undefined>);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "topic-refine": {
      const result = await previewTopicRefinement(
        {
          category: readRequiredStringFlag(flags, "category"),
          topicPrompt: readRequiredStringFlag(flags, "prompt"),
        },
        process.env as Record<string, string | undefined>
      );

      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "fetch-topic": {
      const result = await executeFetchPipeline(
        {
          topicId: readRequiredStringFlag(flags, "topic-id"),
          initiatedBy: readBooleanFlag(flags, "schedule") ? "schedule" : "manual",
        },
        process.env as Record<string, string | undefined>,
        { dryRun: readBooleanFlag(flags, "dry-run") }
      );

      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "summarize-file": {
      const file = readRequiredStringFlag(flags, "file");
      const rawText = fs.readFileSync(file, "utf8");

      const result = await executeSummarizePipeline(
        {
          topicId: readRequiredStringFlag(flags, "topic-id"),
          topicName: readOptionalStringFlag(flags, "topic-name") ?? "Manual Topic",
          sourceUrl: readRequiredStringFlag(flags, "source-url"),
          sourceName: readRequiredStringFlag(flags, "source-name"),
          title: readRequiredStringFlag(flags, "title"),
          publishedAt: readRequiredStringFlag(flags, "published-at"),
          rawText,
        },
        process.env as Record<string, string | undefined>
      );

      console.log(JSON.stringify(result, null, 2));
      return;
    }
    default: {
      console.log(
        [
          "Usage:",
          "  npm run cli -w apps/worker -- healthcheck",
          '  npm run cli -w apps/worker -- topic-refine --category Finance --prompt "TSMC company finances"',
          "  npm run cli -w apps/worker -- fetch-topic --topic-id <uuid> [--dry-run]",
          "  npm run cli -w apps/worker -- summarize-file --topic-id <uuid> --source-url <url> --source-name Reuters --title <title> --published-at <iso> --file <path>",
        ].join("\n")
      );
    }
  }
}

void main().catch(error => {
  logger.error("Worker CLI failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
