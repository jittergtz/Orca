import { useFeedStore } from "../stores/feedStore";
import { ExternalLink } from "lucide-react";

export default function ArticleView() {
  const { activeTopicId, articlesByTopic, topics, status } = useFeedStore();

  // No active topic
  if (!activeTopicId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
        <div className="text-4xl mb-4 opacity-20">📰</div>
        <div className="text-neutral-400 dark:text-neutral-500 text-sm leading-relaxed max-w-xs">
          {topics.length === 0
            ? "Create your first topic to start receiving curated news."
            : "Select a topic from the sidebar to read articles."}
        </div>
      </div>
    );
  }

  const articles = articlesByTopic[activeTopicId] ?? [];
  const activeTopic = topics.find((t) => t.id === activeTopicId);

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
          Loading feed...
        </div>
      </div>
    );
  }

  // No articles yet for this topic
  if (articles.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
        <div className="text-4xl mb-4 opacity-20">⏳</div>
        <div className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-1">
          No articles yet for {activeTopic?.name ?? "this topic"}
        </div>
        <div className="text-neutral-400 dark:text-neutral-500 text-xs leading-relaxed max-w-xs">
          Articles will appear here once the pipeline processes your topic. This usually takes a moment.
        </div>
      </div>
    );
  }

  // Show the most recent article
  const article = articles[0];

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-smooth bg-transparent text-neutral-900 dark:text-neutral-100 flex justify-center">
      <style>{`
        .article-body p { margin-bottom: 1.5rem; }
        .article-body mark {
          background-color: transparent;
          border-bottom: 1px solid rgba(120, 120, 120, 0.4);
          color: inherit;
        }
      `}</style>

      <div className="max-w-2xl px-8 w-full flex flex-col pb-24">

        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#5db8ef] rounded-full border-2 border-white dark:border-[#08090f] shadow-[0_0_0_1px_rgba(93,184,239,0.3)]" />
            <span className="text-[11px] font-medium text-neutral-500 tracking-wide uppercase">
              {activeTopic?.name ?? "Topic"}
            </span>
          </div>
          <div className="text-[13px] font-medium text-neutral-500">
            {article.published_at
              ? new Intl.DateTimeFormat("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                }).format(new Date(article.published_at))
              : ""}
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-6">
          <h1 className="font-instrument-serif italic text-4xl sm:text-5xl leading-tight text-neutral-900 dark:text-neutral-50 tracking-tight">
            {article.title}
          </h1>
          {/* Source + read time */}
          <div className="flex items-center gap-3 mt-4 text-xs text-neutral-400">
            {article.source_name && (
              <span className="font-medium">{article.source_name}</span>
            )}
            {article.read_minutes && (
              <>
                <span>·</span>
                <span>{Math.ceil(article.read_minutes)} min read</span>
              </>
            )}
            {article.sentiment && (
              <>
                <span>·</span>
                <span className={`capitalize ${
                  article.sentiment === "positive" ? "text-emerald-500" :
                  article.sentiment === "negative" ? "text-red-400" :
                  "text-neutral-400"
                }`}>
                  {article.sentiment}
                </span>
              </>
            )}
          </div>
        </div>

        {/* TL;DR Bullets */}
        {article.tldr_bullets && article.tldr_bullets.length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#79e8b0] mb-3">
              TL;DR
            </div>
            <ul className="space-y-2.5">
              {article.tldr_bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex gap-2.5 items-start text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <span className="text-[#79e8b0] text-[9px] mt-[7px] flex-shrink-0">▸</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body content */}
        <div
          className="article-body font-sans text-[16px] sm:text-[17px] leading-[1.8] text-neutral-700 dark:text-neutral-300"
          dangerouslySetInnerHTML={{
            __html:
              "<p>" +
              article.body.replace(/\n\n/g, "</p><p>") +
              "</p>",
          }}
        />

        {/* Source link */}
        {article.source_url && (
          <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#5db8ef] transition-colors"
            >
              <ExternalLink size={12} />
              Read original source
            </a>
          </div>
        )}

        {/* Article list (other articles for this topic) */}
        {articles.length > 1 && (
          <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 mb-4">
              More from {activeTopic?.name}
            </div>
            <div className="space-y-2">
              {articles.slice(1).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/40 dark:border-white/5 cursor-default"
                >
                  <div className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200 mb-1 leading-snug">
                    {a.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    {a.source_name && <span>{a.source_name}</span>}
                    {a.published_at && (
                      <>
                        <span>·</span>
                        <span>
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(a.published_at))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Pill Player Placeholder */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center p-1.5 bg-white/70 dark:bg-[#161616] backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full w-64 h-12 z-50">
        <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-xs font-medium text-neutral-500 opacity-60">
          
        </div>
      </div>
    </div>
  );
}
