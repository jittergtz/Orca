import { FormEvent, useMemo, useState } from "react";
import { ArrowUp, Clock } from "lucide-react";
import type { Article, Topic } from "@newsflow/db";
import { useFeedStore } from "../stores/feedStore";

type DashboardHomeProps = {
  userEmail: string | null;
  onOpenArticle: (topicId: string, articleIndex: number) => void;
  mode?: "home" | "overview";
};

type ArticleCard = {
  article: Article;
  topic: Topic;
  articleIndex: number;
};

function getFirstName(email: string | null) {
  if (!email) {
    return "there";
  }

  const localPart = email.split("@")[0] ?? "";
  const firstChunk = localPart.split(/[._-]/)[0] ?? "";
  const normalized = firstChunk.toLowerCase().startsWith("sandro") ? "sandro" : firstChunk;

  if (!normalized) {
    return "there";
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function formatCardDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function getCategoryTone(index: number) {
  const tones = [
    "bg-[#79e8b0] text-[#164227]",
    "bg-[#5db8ef] text-[#0d3554]",
    "bg-[#8aa4ff] text-[#182456]",
    "bg-[#f0a070] text-[#573017]",
  ];

  return tones[index % tones.length];
}

function ArticleImage({ article, index }: { article: Article; index: number }) {
  if (article.image_url) {
    return (
      <img
        src={article.image_url}
        alt={article.title}
        className="h-full w-full object-cover"
      />
    );
  }

  const fallbackStyles = [
    "bg-[#16120f] text-white",
    "bg-gradient-to-br from-[#2c4c66] via-[#54758f] to-[#c6d0d8] text-white",
    "bg-white text-neutral-950",
    "bg-gradient-to-br from-black via-neutral-900 to-neutral-400 text-white",
  ];
  const sourceName = article.source_name || "Orca";

  return (
    <div className={`flex h-full w-full items-center justify-center ${fallbackStyles[index % fallbackStyles.length]}`}>
      <div className="text-center">
        <div className="text-[20px] font-semibold tracking-tight">{sourceName}</div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-55">Briefing</div>
      </div>
    </div>
  );
}

function ChatInput({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrompt("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto flex h-[44px] w-full max-w-[492px] items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-1.5 shadow-[0_1px_10px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.08] ${
        compact ? "max-w-[492px]" : ""
      }`}
    >
      <input
        value={prompt}
        onChange={event => setPrompt(event.target.value)}
        placeholder="Tldr of the last Nvidia report"
        className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:opacity-80 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        aria-label="Send"
      >
        <ArrowUp size={16} strokeWidth={2.4} />
      </button>
    </form>
  );
}

export default function DashboardHome({ userEmail, onOpenArticle, mode = "home" }: DashboardHomeProps) {
  const { topics, articlesByTopic, readArticleIds, status } = useFeedStore();
  const firstName = getFirstName(userEmail);
  const articleCards = useMemo<ArticleCard[]>(() => {
    return topics
      .flatMap(topic => {
        const articles = articlesByTopic[topic.id] ?? [];
        return articles.map((article, articleIndex) => ({
          article,
          topic,
          articleIndex,
        }));
      })
      .sort(
        (a, b) =>
          new Date(b.article.published_at).getTime() -
          new Date(a.article.published_at).getTime()
      );
  }, [articlesByTopic, topics]);
  const unreadCards = useMemo(
    () => articleCards.filter(card => !readArticleIds[card.article.id]),
    [articleCards, readArticleIds]
  );
  const isOverview = mode === "overview";
  const cards = isOverview ? articleCards : unreadCards;
  const visibleCards = isOverview ? cards : cards.slice(0, 6);
  const newArticleCount = unreadCards.length;
  const articleCount = cards.length;

  if (status === "loading") {
    return (
      <section className="flex h-full w-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Loading your briefing...
      </section>
    );
  }

  if (!isOverview && newArticleCount === 0) {
    return (
      <section className="flex h-full w-full items-center justify-center px-8">
        <div className="w-full -translate-y-6 text-center">
          <div className="font-instrument-serif text-[32px] italic leading-none text-neutral-950 dark:text-neutral-50">
            Welcome {firstName}
          </div>
          <h1 className="mt-1 text-[32px] font-medium leading-none tracking-normal text-black dark:text-white">
            you're up to date
          </h1>
          <div className="mt-6">
            <ChatInput />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative flex h-full w-full flex-col px-7 pt-7 ${isOverview ? "overflow-y-auto pb-12" : "overflow-hidden pb-24"}`}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="font-instrument-serif text-[30px] italic leading-none text-neutral-950 dark:text-neutral-50">
          {isOverview ? "Overview" : `Welcome ${firstName}`}
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <span className="font-medium text-neutral-950 dark:text-white">
            {isOverview ? "Latest" : "This Week"}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">
            {isOverview ? "All Topics" : "Today"}
          </span>
        </div>
        <div className="justify-self-end text-[20px] text-black dark:text-white">
          {isOverview
            ? `${articleCount} Article${articleCount === 1 ? "" : "s"}`
            : `${newArticleCount} new Article${newArticleCount === 1 ? "" : "s"}`}
        </div>
      </header>

      {isOverview && articleCount === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
          No articles yet. New cards will appear here once your topics start receiving articles.
        </div>
      ) : null}

      <div
        className={`${isOverview ? "mt-12" : "mt-20"} grid max-w-[850px] justify-start gap-x-7 gap-y-5`}
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 260px))" }}
      >
        {visibleCards.map((card, index) => (
          <button
            key={card.article.id}
            type="button"
            onClick={() => onOpenArticle(card.topic.id, card.articleIndex)}
            className="group overflow-hidden rounded-[26px] border border-black/10 bg-white/45 p-2.5 text-left shadow-[0_14px_34px_rgba(0,0,0,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
          >
            <div className="h-[128px] overflow-hidden rounded-[20px] bg-white dark:bg-black">
              <ArticleImage article={card.article} index={index} />
            </div>
            <div className="px-0.5 pt-2">
              <div className="line-clamp-1 text-[15px] font-medium leading-5 text-black dark:text-white">
                {card.article.title}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                {card.article.tldr_bullets[0] ?? card.article.body.slice(0, 82)}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getCategoryTone(index)}`}>
                  {card.topic.category || card.topic.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
                  <Clock size={11} />
                  {card.article.read_minutes ? `${Math.ceil(card.article.read_minutes)} min` : formatCardDate(card.article.published_at)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {!isOverview ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-6">
          <div className="pointer-events-auto w-full">
            <ChatInput compact />
          </div>
        </div>
      ) : null}
    </section>
  );
}
