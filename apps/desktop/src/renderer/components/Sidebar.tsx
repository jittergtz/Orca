import { Plus, Newspaper } from "lucide-react";
import { useFeedStore } from "../stores/feedStore";

interface SidebarProps {
  isOpen: boolean;
  onNewTopic: () => void;
}

export default function Sidebar({ isOpen, onNewTopic }: SidebarProps) {
  const { topics, activeTopicId, setActiveTopic, articlesByTopic } = useFeedStore();

  return (
    <aside
      className={`absolute z-10 top-1 bottom-1 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl left-1 border border-white/60 dark:border-white/10 rounded-[20px] py-2 px-1 transition-all duration-200 ease-in-out flex flex-col pt-3 ${
        isOpen
          ? "w-[240px] opacity-100 translate-x-0"
          : "w-[200px] opacity-0 -translate-x-full overflow-hidden border-none p-0 [&>*]:hidden"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
          Topics
        </span>
        <button
          type="button"
          onClick={onNewTopic}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Add new topic"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Topic list */}
      <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5 px-1">
        {topics.length === 0 && (
          <li className="px-3 py-6 text-center">
            <div className="text-neutral-400 dark:text-neutral-600 text-xs leading-relaxed">
              No topics yet.
              <br />
              <button
                onClick={onNewTopic}
                className="text-[#79e8b0] hover:underline mt-1 inline-block font-medium"
              >
                Create your first feed
              </button>
            </div>
          </li>
        )}

        {topics.map((topic) => {
          const isActive = topic.id === activeTopicId;
          const articles = articlesByTopic[topic.id] ?? [];
          const articleCount = articles.length;

          return (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => void setActiveTopic(topic.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-150 group ${
                  isActive
                    ? "bg-black/5 dark:bg-white/8 text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#79e8b0]"
                      : "bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500"
                  }`}
                />
                <span className="flex-1 truncate text-[13px] font-medium">
                  {topic.name}
                </span>
                {articleCount > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? "bg-[#79e8b0]/15 text-[#79e8b0]"
                        : "bg-neutral-200 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {articleCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      {topics.length > 0 && (
        <div className="px-3 pt-2 mt-1 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-600">
            <Newspaper size={10} />
            <span>{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
