import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { SCRAPE_TIMEOUT_MS } from "@newsflow/config";
import { logger } from "../lib/logger";

export interface ScrapedArticle {
  title: string;
  content: string;
  textLength: number;
  siteName: string | null;
}

/**
 * Fetch a URL and extract clean article text using Mozilla's Readability
 * (the exact engine Firefox uses for its "Reader View").
 *
 * Returns null if the fetch fails, the page is behind a paywall/bot-wall,
 * or Readability cannot extract meaningful content.
 */
export async function scrapeUrl(url: string): Promise<ScrapedArticle | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Mimic a standard browser to avoid bot blocks on news sites
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn("Scrape HTTP error", {
        url,
        status: response.status,
      });
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.length < 100) {
      logger.warn("Readability could not extract content", { url });
      return null;
    }

    return {
      title: article.title,
      content: article.textContent,
      textLength: article.textContent.length,
      siteName: article.siteName ?? null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    // AbortError means timeout — expected for slow sites
    if (message.includes("abort")) {
      logger.warn("Scrape timed out", { url });
    } else {
      logger.warn("Scrape failed", { url, error: message });
    }
    return null;
  }
}

/**
 * Scrape multiple URLs in parallel, returning only the ones that succeeded.
 * Failures are logged but never throw — the pipeline continues with whatever
 * articles we managed to extract.
 */
export async function scrapeUrls(urls: string[]): Promise<ScrapedArticle[]> {
  const results = await Promise.allSettled(urls.map(scrapeUrl));

  const scraped: ScrapedArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== null) {
      scraped.push(result.value);
    }
  }

  logger.info("Scrape batch complete", {
    attempted: urls.length,
    succeeded: scraped.length,
  });

  return scraped;
}
