import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Search,
} from "lucide-react";
import type { Article, Topic } from "@newsflow/db";
import { useFeedStore } from "../stores/feedStore";

interface SidebarProps {
  isOpen: boolean;
  onNewTopic: () => void;
}

function matchesTopic(topic: Topic, query: string) {
  return (
    topic.name.toLowerCase().includes(query) ||
    topic.category.toLowerCase().includes(query)
  );
}

function matchesArticle(article: Article, query: string) {
  return (
    article.title.toLowerCase().includes(query) ||
    article.source_name.toLowerCase().includes(query)
  );
}

function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export default function Sidebar({ isOpen, onNewTopic }: SidebarProps) {
  const {
    topics,
    activeTopicId,
    activeArticleIndex,
    setActiveTopic,
    setActiveArticleIndex,
    articlesByTopic,
  } = useFeedStore();
  const [query, setQuery] = useState("");
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTopics = useMemo(() => {
    if (!normalizedQuery) {
      return topics;
    }

    return topics.filter(topic => {
      const articles = articlesByTopic[topic.id] ?? [];
      return (
        matchesTopic(topic, normalizedQuery) ||
        articles.some(article => matchesArticle(article, normalizedQuery))
      );
    });
  }, [articlesByTopic, normalizedQuery, topics]);

  useEffect(() => {
    if (!activeTopicId) {
      return;
    }

    setExpandedTopicIds(previousIds => {
      if (previousIds.has(activeTopicId)) {
        return previousIds;
      }

      const nextIds = new Set(previousIds);
      nextIds.add(activeTopicId);
      return nextIds;
    });
  }, [activeTopicId]);

  const toggleTopic = (topicId: string) => {
    setExpandedTopicIds(previousIds => {
      const nextIds = new Set(previousIds);

      if (nextIds.has(topicId)) {
        nextIds.delete(topicId);
      } else {
        nextIds.add(topicId);
      }

      return nextIds;
    });
  };

  const selectTopic = (topicId: string) => {
    setExpandedTopicIds(previousIds => {
      const nextIds = new Set(previousIds);
      nextIds.add(topicId);
      return nextIds;
    });
    void setActiveTopic(topicId);
  };

  const selectArticle = (topicId: string, articleIndex: number) => {
    setExpandedTopicIds(previousIds => {
      const nextIds = new Set(previousIds);
      nextIds.add(topicId);
      return nextIds;
    });
    void setActiveTopic(topicId);
    setActiveArticleIndex(articleIndex);
  };

  return (
    <aside
      style={{ WebkitAppRegion: "no-drag" }}
      className={`absolute z-10 top-1 bottom-1 bg-white/75 dark:bg-[#111111]/75 backdrop-blur-2xl left-1 border border-white/70 dark:border-white/10 rounded-[18px] py-2 px-2 transition-all duration-200 ease-in-out flex flex-col ${
        isOpen
          ? "w-[292px] opacity-100 translate-x-0"
          : "w-[240px] opacity-0 -translate-x-full overflow-hidden border-none p-0 [&>*]:hidden"
      }`}
    >
      <div className="px-1 pb-3 pt-1">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            Topics
          </span>
          <button
            type="button"
            onClick={onNewTopic}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/5 bg-black/[0.03] px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-black/[0.07] hover:text-neutral-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:bg-white/[0.10] dark:hover:text-white"
            title="New topic"
          >
            <Plus size={13} strokeWidth={2.2} />
            New Topic
          </button>
        </div>

        <label className="relative block">
          <Search
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search topics or articles"
            className="h-8 w-full rounded-lg border border-black/5 bg-white/[0.65] pl-8 pr-2 text-[12px] text-neutral-800 outline-none transition focus:border-[#79e8b0]/50 focus:bg-white focus:ring-2 focus:ring-[#79e8b0]/20 placeholder:text-neutral-400 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-100 dark:focus:bg-white/[0.08]"
          />
        </label>
      </div>

      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-600">
        Library
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1 pb-2">
        {topics.length === 0 && (
          <li className="px-3 py-8 text-center">
            <div className="text-xs leading-relaxed text-neutral-400 dark:text-neutral-600">
              No topics yet.
            </div>
            <button
              onClick={onNewTopic}
              className="mt-2 rounded-md px-2 py-1 text-xs font-medium text-[#43a977] transition-colors hover:bg-[#79e8b0]/10"
            >
              Create your first topic
            </button>
          </li>
        )}

        {topics.length > 0 && visibleTopics.length === 0 && (
          <li className="px-3 py-8 text-center text-xs leading-relaxed text-neutral-400 dark:text-neutral-600">
            No matching topics or articles.
          </li>
        )}

        {visibleTopics.map(topic => {
          const isActiveTopic = topic.id === activeTopicId;
          const articles = articlesByTopic[topic.id] ?? [];
          const topicMatches = normalizedQuery ? matchesTopic(topic, normalizedQuery) : false;
          const visibleArticles =
            normalizedQuery && !topicMatches
              ? articles.filter(article => matchesArticle(article, normalizedQuery))
              : articles;
          const isExpanded = Boolean(normalizedQuery) || expandedTopicIds.has(topic.id);
          const TopicIcon = isExpanded ? FolderOpen : Folder;

          return (
            <li key={topic.id}>
              <div
                className={`group flex items-center rounded-md ${
                  isActiveTopic
                    ? "bg-black/[0.06] text-neutral-950 dark:bg-white/[0.1] dark:text-white"
                    : "text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="flex h-8 w-7 flex-shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200"
                  aria-label={isExpanded ? "Collapse topic" : "Expand topic"}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} strokeWidth={2.2} />
                  ) : (
                    <ChevronRight size={14} strokeWidth={2.2} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left"
                >
                  <TopicIcon
                    size={15}
                    strokeWidth={2}
                    className={`flex-shrink-0 ${
                      isActiveTopic
                        ? "text-[#43a977]"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {topic.name}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActiveTopic
                        ? "bg-[#79e8b0]/[0.15] text-[#43a977] dark:text-[#79e8b0]"
                        : "bg-black/[0.05] text-neutral-400 dark:bg-white/[0.08] dark:text-neutral-500"
                    }`}
                  >
                    {articles.length}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <ul className="ml-[27px] mt-1 flex flex-col gap-0.5 border-l border-black/[0.06] pl-2 dark:border-white/[0.08]">
                  {visibleArticles.length === 0 ? (
                    <li className="px-2 py-1.5 text-[11px] text-neutral-400 dark:text-neutral-600">
                      No articles yet
                    </li>
                  ) : (
                    visibleArticles.map(article => {
                      const articleIndex = articles.findIndex(candidate => candidate.id === article.id);
                      const isActiveArticle = isActiveTopic && articleIndex === activeArticleIndex;

                      return (
                        <li key={article.id}>
                          <button
                            type="button"
                            onClick={() => selectArticle(topic.id, articleIndex)}
                            className={`group/article flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                              isActiveArticle
                                ? "bg-[#79e8b0]/[0.14] text-neutral-950 dark:bg-[#79e8b0]/[0.12] dark:text-white"
                                : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-neutral-100"
                            }`}
                          >
                            <FileText
                              size={13}
                              strokeWidth={2}
                              className={`mt-0.5 flex-shrink-0 ${
                                isActiveArticle
                                  ? "text-[#43a977] dark:text-[#79e8b0]"
                                  : "text-neutral-400 group-hover/article:text-neutral-600 dark:text-neutral-600 dark:group-hover/article:text-neutral-300"
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12px] font-medium leading-4">
                                {article.title}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-neutral-400 dark:text-neutral-600">
                                {article.source_name && <span className="truncate">{article.source_name}</span>}
                                {article.published_at && (
                                  <span className="flex-shrink-0">
                                    {formatArticleDate(article.published_at)}
                                  </span>
                                )}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {topics.length > 0 && (
        <div className="border-t border-black/[0.06] px-2 py-2 text-[10px] text-neutral-400 dark:border-white/[0.06] dark:text-neutral-600">
          {topics.length} topic{topics.length !== 1 ? "s" : ""} -{" "}
          {Object.values(articlesByTopic).reduce((count, articles) => count + articles.length, 0)} articles
        </div>
      )}
    </aside>
  );
}
