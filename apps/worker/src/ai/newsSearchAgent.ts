import type { EnvSource } from "@newsflow/config";
import { MAX_SCRAPE_URLS } from "@newsflow/config";
import type { ArticleCandidate, TopicConfig } from "@newsflow/db";
import { logger } from "../lib/logger";
import { searchSerperNews } from "../services/serperSearch";
import { scrapeUrls } from "../services/scraper";
import { buildSerperQuery } from "./prompts";

/**
 * Decoupled news search pipeline:
 *   1. Build an optimized Google search query from the topic config
 *   2. Hit Serper.dev's Google News API for real-time URLs
 *   3. Scrape the top N URLs with Readability to get clean article text
 *   4. Return ArticleCandidate[] for downstream summarization
 *
 * No AI model is used in this step — it's pure search + scrape.
 */
export async function runWorkerNewsSearch(
  input: {
    topicName: string;
    topicConfig: TopicConfig;
    maxArticles?: number;
  },
  source?: EnvSource
): Promise<ArticleCandidate[]> {
  const query = buildSerperQuery({
    topicName: input.topicName,
    topicConfig: input.topicConfig,
  });

  logger.info("News search starting", {
    topicName: input.topicName,
    query,
  });

  // Step 1: Search Serper for real-time news URLs
  const serperResults = await searchSerperNews(
    query,
    { maxResults: input.maxArticles ?? 10 },
    source
  );

  if (serperResults.length === 0) {
    logger.warn("Serper returned no results", {
      topicName: input.topicName,
      query,
    });
    return [];
  }

  // Step 2: Scrape the top N URLs
  const urlsToScrape = serperResults
    .slice(0, MAX_SCRAPE_URLS)
    .map((r) => r.link);

  const scrapedArticles = await scrapeUrls(urlsToScrape);

  // Step 3: Map scraped content to ArticleCandidate format
  const candidates: ArticleCandidate[] = scrapedArticles.map(
    (scraped, index) => {
      // Find the matching Serper result for metadata
      const serperMatch = serperResults.find(
        (r) => r.link === urlsToScrape[index]
      ) ?? serperResults[index];

      return {
        sourceUrl: serperMatch?.link ?? urlsToScrape[index],
        sourceName: scraped.siteName ?? serperMatch?.source ?? "Unknown",
        title: scraped.title || serperMatch?.title || "Untitled",
        publishedAt: serperMatch?.date ?? new Date().toISOString(),
        content: scraped.content,
      };
    }
  );

  logger.info("News search completed", {
    topicName: input.topicName,
    serperResults: serperResults.length,
    scraped: scrapedArticles.length,
    candidates: candidates.length,
  });

  return candidates;
}
