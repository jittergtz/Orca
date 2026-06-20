import { SCRAPE_TIMEOUT_MS, type EnvSource } from "@newsflow/config";
import { JSDOM } from "jsdom";
import { ArticleAssetSchema, type ArticleAsset } from "@newsflow/db";
import { readEnvValue } from "../lib/env";
import { logger } from "../lib/logger";

const UNSPLASH_SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

type UnsplashSearchResponse = {
  results?: Array<{
    alt_description?: string | null;
    urls?: {
      regular?: string;
    };
    user?: {
      name?: string;
      links?: {
        html?: string;
      };
    };
  }>;
};

function defaultEnvSource(): EnvSource {
  return (((globalThis as { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource);
}

function emptyAsset(): ArticleAsset {
  return {
    imageUrl: null,
    imageAttribution: null,
    source: "none",
  };
}

function isHttpUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, baseUrl).toString();
    return isHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}

export async function acquireArticleAsset(
  input: {
    imageSearchQuery?: string | null;
    sourceUrl: string;
  },
  source?: EnvSource
): Promise<ArticleAsset> {
  const unsplashAsset = input.imageSearchQuery
    ? await fetchUnsplashAsset(input.imageSearchQuery, source)
    : null;

  if (unsplashAsset) {
    return unsplashAsset;
  }

  const openGraphAsset = await fetchOpenGraphAsset(input.sourceUrl);

  return openGraphAsset ?? emptyAsset();
}

async function fetchUnsplashAsset(query: string, source?: EnvSource) {
  const accessKey = readEnvValue(source ?? defaultEnvSource(), "UNSPLASH_ACCESS_KEY");

  if (!accessKey) {
    return null;
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    const params = new URLSearchParams({
      query,
      orientation: "landscape",
      per_page: "1",
      content_filter: "high",
    });
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    const response = await fetch(`${UNSPLASH_SEARCH_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        Accept: "application/json",
      },
    });

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (!response.ok) {
      logger.warn("Unsplash image lookup failed", {
        query,
        status: response.status,
      });
      return null;
    }

    const data = (await response.json()) as UnsplashSearchResponse;
    const photo = data.results?.[0];
    const imageUrl = photo?.urls?.regular;

    if (!isHttpUrl(imageUrl)) {
      return null;
    }

    const photographer = photo?.user?.name;
    const photographerUrl = photo?.user?.links?.html;
    const attribution = photographer
      ? `Photo by ${photographer}${photographerUrl ? ` on Unsplash (${photographerUrl})` : " on Unsplash"}`
      : "Photo from Unsplash";

    return ArticleAssetSchema.parse({
      imageUrl,
      imageAttribution: attribution,
      source: "unsplash",
    });
  } catch (error) {
    logger.warn("Unsplash image lookup errored", {
      query,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function fetchOpenGraphAsset(sourceUrl: string) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (!response.ok) {
      logger.warn("Open Graph image lookup failed", {
        sourceUrl,
        status: response.status,
      });
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url: sourceUrl });
    const document = dom.window.document;
    const imageUrl = normalizeUrl(
      document
        .querySelector('meta[property="og:image"], meta[name="twitter:image"]')
        ?.getAttribute("content"),
      sourceUrl
    );

    if (!imageUrl) {
      return null;
    }

    const siteName =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ??
      new URL(sourceUrl).hostname;

    return ArticleAssetSchema.parse({
      imageUrl,
      imageAttribution: `Image from ${siteName}`,
      source: "open_graph",
    });
  } catch (error) {
    logger.warn("Open Graph image lookup errored", {
      sourceUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
