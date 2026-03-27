import { NextResponse } from "next/server";
import { runTopicDialogue } from "@newsflow/ai";

interface TopicRefineRequest {
  category: string;
  topicPrompt: string;
  priorMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

function isTopicRefineRequest(value: unknown): value is TopicRefineRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as TopicRefineRequest;
  return typeof payload.category === "string" && typeof payload.topicPrompt === "string";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isTopicRefineRequest(payload)) {
      return NextResponse.json({ error: "Invalid topic refinement payload" }, { status: 400 });
    }

    const topic = await runTopicDialogue(payload, process.env as Record<string, string | undefined>);
    return NextResponse.json({ topic });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Topic refinement failed",
      },
      { status: 500 }
    );
  }
}
