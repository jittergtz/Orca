import { FormEvent, useMemo, useState } from "react";
import { ArrowUp, Clock } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { Article, Topic } from "@newsflow/db";
import { useFeedStore } from "../stores/feedStore";
import { FeedGridSkeleton } from "./ui/skeleton";

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

function ChatInput({
  compact = false,
  placeholder = "Ask Orca about your briefing",
}: {
  compact?: boolean;
  placeholder?: string;
}) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrompt("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto flex min-h-[50px] w-full items-center gap-2 rounded-[24px] border border-black/[0.07] bg-white/75 py-2 pl-5 pr-2 shadow-[0_16px_38px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition focus-within:border-black/15 focus-within:bg-white/90 focus-within:shadow-[0_20px_44px_rgba(15,23,42,0.16)] dark:border-white/[0.12] dark:bg-white/[0.08] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] dark:focus-within:border-white/20 dark:focus-within:bg-white/[0.12] ${
        compact ? "max-w-[520px]" : "max-w-[560px]"
      }`}
    >
      <input
        value={prompt}
        onChange={event => setPrompt(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:bg-neutral-700 disabled:cursor-default disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:disabled:bg-white/20 dark:disabled:text-white/40"
        aria-label="Send"
      >
        <ArrowUp size={16} strokeWidth={2.4} />
      </button>
    </form>
  );
}

export default function DashboardHome({ userEmail, onOpenArticle, mode = "home" }: DashboardHomeProps) {
  const {
    topics,
    articlesByTopic,
    readArticleIds,
    status,
    error,
    isRefreshing,
    bootstrappedUserId,
    bootstrap,
  } = useFeedStore(
    useShallow((state) => ({
      topics: state.topics,
      articlesByTopic: state.articlesByTopic,
      readArticleIds: state.readArticleIds,
      status: state.status,
      error: state.error,
      isRefreshing: state.isRefreshing,
      bootstrappedUserId: state.bootstrappedUserId,
      bootstrap: state.bootstrap,
    }))
  );
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

  if (status === "idle" || status === "loading") {
    return <FeedGridSkeleton mode={mode} />;
  }

  if (status === "error") {
    return (
      <section className="flex h-full w-full items-center justify-center px-8">
        <div className="max-w-sm text-center">
          <div className="font-instrument-serif text-[30px] italic leading-none text-neutral-950 dark:text-neutral-50">
            Briefing paused
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {error ?? "Could not load your feed. Check your connection and try again."}
          </p>
          {bootstrappedUserId ? (
            <button
              type="button"
              onClick={() => void bootstrap(bootstrappedUserId)}
              className="mt-5 rounded-full bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Try again
            </button>
          ) : null}
        </div>
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
    <section className={`relative flex h-full w-full flex-col px-7 pt-7 ${isOverview ? "overflow-y-auto pb-0" : "overflow-hidden pb-24"}`}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="font-instrument-serif text-[30px] italic leading-none text-neutral-950 dark:text-neutral-50">
          {isOverview ? "Overview" : `Welcome ${firstName}`}
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <span className="font-medium text-neutral-950 dark:text-white">
            {isOverview ? "Latest" : "This Week"}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">
            {isRefreshing ? "Updating" : isOverview ? "All Topics" : "Today"}
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

      {isOverview ? (
        <div className="pointer-events-none sticky bottom-0 z-20 -mx-7 mt-auto flex justify-center bg-gradient-to-t from-white/55 via-white/30 to-transparent px-7 pb-5 pt-9 dark:from-black/35 dark:via-black/20">
          <div className="pointer-events-auto w-full">
            <ChatInput compact placeholder="Ask Orca about the overview" />
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-6">
          <div className="pointer-events-auto w-full">
            <ChatInput compact />
          </div>
        </div>
      )}
    </section>
  );
}
