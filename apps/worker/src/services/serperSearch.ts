import {
  type EnvSource,
  resolveSerperEnv,
  SERPER_NEWS_ENDPOINT,
  MAX_ARTICLES_PER_FETCH,
} from "@newsflow/config";
import { logger } from "../lib/logger";

export interface SerperNewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
}

interface SerperNewsResponse {
  news?: SerperNewsResult[];
  searchParameters?: Record<string, unknown>;
}

/**
 * Query Serper.dev's Google News endpoint and return raw search results.
 *
 * This is a pure HTTP call — no AI model involved. Serper returns real-time
 * Google News results as structured JSON (title, link, snippet, date, source).
 */
export async function searchSerperNews(
  query: string,
  options?: { maxResults?: number },
  source?: EnvSource
): Promise<SerperNewsResult[]> {
  const { serperApiKey } = resolveSerperEnv(source);
  const maxResults = options?.maxResults ?? MAX_ARTICLES_PER_FETCH;

  logger.info("Serper news search", { query, maxResults });

  const response = await fetch(SERPER_NEWS_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": serperApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: maxResults,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(
      `Serper API error ${response.status}: ${body.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as SerperNewsResponse;
  const results = data.news ?? [];

  logger.info("Serper search returned", {
    query,
    resultCount: results.length,
  });

  return results;
}
