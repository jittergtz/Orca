import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFeedStore } from "../stores/feedStore";
import { SidebarSkeleton } from "./ui/skeleton";

interface SidebarProps {
  isOpen: boolean;
  onHome: () => void;
  onOverview: () => void;
  onNewTopic: () => void;
  onSettings: () => void;
  onSelectArticle: () => void;
}

export default function Sidebar({ isOpen, onHome, onOverview, onNewTopic, onSettings, onSelectArticle }: SidebarProps) {
  const {
    status,
    topics,
    activeTopicId,
    activeArticleIndex,
    setActiveTopic,
    setActiveArticleIndex,
    articlesByTopic,
  } = useFeedStore(
    useShallow((state) => ({
      status: state.status,
      topics: state.topics,
      activeTopicId: state.activeTopicId,
      activeArticleIndex: state.activeArticleIndex,
      setActiveTopic: state.setActiveTopic,
      setActiveArticleIndex: state.setActiveArticleIndex,
      articlesByTopic: state.articlesByTopic,
    }))
  );
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());
  const isInitialLoading = (status === "idle" || status === "loading") && topics.length === 0;

  useEffect(() => {
    setExpandedTopicIds(previousIds => {
      const nextIds = new Set(previousIds);
      topics.forEach(topic => nextIds.add(topic.id));

      if (activeTopicId) {
        nextIds.add(activeTopicId);
      }

      return nextIds;
    });
  }, [activeTopicId, topics]);

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
    setActiveArticleIndex(0);
    onSelectArticle();
  };

  const selectArticle = (topicId: string, articleIndex: number) => {
    setExpandedTopicIds(previousIds => {
      const nextIds = new Set(previousIds);
      nextIds.add(topicId);
      return nextIds;
    });
    void setActiveTopic(topicId);
    setActiveArticleIndex(articleIndex);
    onSelectArticle();
  };

  return (
    <aside
      style={{ WebkitAppRegion: "no-drag" }}
      className={`absolute inset-y-0 left-0 z-20 flex w-[226px] flex-col border-r border-black/[0.06] bg-[#d7d9d8]/82 px-7 pb-4 pt-[64px] text-black backdrop-blur-2xl transition-all duration-200 ease-in-out dark:border-white/10 dark:bg-[#171717]/82 dark:text-white ${
        isOpen
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-full overflow-hidden border-none [&>*]:hidden"
      }`}
    >
      <nav className="space-y-1">
        <div className="mb-2 text-[11px] font-semibold text-black dark:text-neutral-200">
          General
        </div>
        <button
          type="button"
          onClick={onHome}
          className="block w-full rounded-md px-4 py-1.5 text-left text-[13px] text-neutral-600 transition hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onOverview}
          className="block w-full rounded-md px-4 py-1.5 text-left text-[13px] text-neutral-600 transition hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Overview
        </button>
        <button
          type="button"
          onClick={onNewTopic}
          className="block w-full rounded-md px-4 py-1.5 text-left text-[13px] text-neutral-600 transition hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          New topic
        </button>
        <button
          type="button"
          onClick={onHome}
          className="block w-full rounded-md px-4 py-1.5 text-left text-[13px] text-neutral-600 transition hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Deep Research
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="block w-full rounded-md px-4 py-1.5 text-left text-[13px] text-neutral-600 transition hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Settings
        </button>
      </nav>

      <div className="mb-2 mt-5 text-[11px] font-semibold text-black dark:text-neutral-200">
        Topics
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2">
        {isInitialLoading ? (
          <li>
            <SidebarSkeleton />
          </li>
        ) : null}

        {!isInitialLoading && topics.length === 0 && (
          <li className="py-8 text-left">
            <div className="text-xs leading-relaxed text-neutral-400 dark:text-neutral-600">
              No topics yet.
            </div>
            <button
              onClick={onNewTopic}
              className="mt-2 rounded-md py-1 text-xs font-medium text-[#43a977] transition-colors hover:text-[#2f805a]"
            >
              Create your first topic
            </button>
          </li>
        )}

        {!isInitialLoading && topics.map(topic => {
          const isActiveTopic = topic.id === activeTopicId;
          const articles = articlesByTopic[topic.id] ?? [];
          const visibleArticles = articles.slice(0, 4);
          const isExpanded = expandedTopicIds.has(topic.id);

          return (
            <li key={topic.id}>
              <div
                className={`group flex items-center rounded-md ${
                  isActiveTopic
                    ? "text-black dark:text-white"
                    : "text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="flex h-7 w-5 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200"
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
                  className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md text-left"
                >
                  <Folder
                    size={16}
                    strokeWidth={2}
                    className="flex-shrink-0 fill-neutral-400 text-neutral-400 dark:fill-neutral-500 dark:text-neutral-500"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {topic.name}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <ul className="ml-[29px] mt-1 flex flex-col gap-0.5">
                  {visibleArticles.length === 0 ? (
                    <li className="px-0 py-1 text-[12px] text-neutral-500 dark:text-neutral-600">
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
                            className={`block w-full rounded-md py-1 text-left text-[13px] transition-colors ${
                              isActiveArticle
                                ? "text-black dark:text-white"
                                : "text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-neutral-100"
                            }`}
                          >
                            <span className="block truncate">
                              {article.title}
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

      <div className="font-instrument-serif text-[14px] italic text-neutral-800 dark:text-neutral-300">
        Orca Pro
      </div>
    </aside>
  );
}
