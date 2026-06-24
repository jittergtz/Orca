import { cn } from "../../lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("orca-skeleton", className)} />;
}

export function AppBootSkeleton() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <Skeleton className="h-12 w-28 rounded-xl" />
        <Skeleton className="mt-3 h-3 w-52 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-11 rounded-full" />
        <Skeleton className="h-11 rounded-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: 4 }).map((_, topicIndex) => (
        <div key={topicIndex}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 flex-1 rounded-full" />
          </div>
          <div className="ml-7 mt-2 space-y-1.5">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedGridSkeleton({ mode = "home" }: { mode?: "home" | "overview" }) {
  const cardCount = mode === "overview" ? 9 : 6;

  return (
    <section className="relative flex h-full w-full flex-col px-7 pt-7 pb-24">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-6 w-28 justify-self-end rounded-full" />
      </header>

      <div
        className={`${mode === "overview" ? "mt-12" : "mt-20"} grid max-w-[850px] justify-start gap-x-7 gap-y-5`}
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 260px))" }}
      >
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[26px] border border-black/10 bg-white/35 p-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
          >
            <Skeleton className="h-[128px] rounded-[20px]" />
            <div className="px-0.5 pt-2">
              <Skeleton className="h-4 rounded-full" />
              <Skeleton className="mt-2 h-3 w-5/6 rounded-full" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3 w-12 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="absolute inset-0 flex justify-center overflow-y-auto bg-transparent text-neutral-900 dark:text-neutral-100">
      <div className="flex w-full max-w-[720px] flex-col px-8 pt-10 pb-16 sm:px-10 sm:pt-12 sm:pb-16 lg:px-12 lg:pb-20">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>

        <div className="mb-8 border-b border-black/10 pb-7 dark:border-white/10">
          <Skeleton className="h-12 w-11/12 rounded-xl" />
          <Skeleton className="mt-3 h-12 w-4/5 rounded-xl" />
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        </div>

        <Skeleton className="mb-8 h-64 rounded-lg" />

        <div className="mb-9 rounded-[22px] border border-white/55 bg-white/45 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <Skeleton className="h-3 w-16 rounded-full" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 rounded-full" />
            <Skeleton className="h-4 w-11/12 rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 rounded-full" />
          <Skeleton className="h-4 rounded-full" />
          <Skeleton className="h-4 w-10/12 rounded-full" />
          <Skeleton className="mt-5 h-4 rounded-full" />
          <Skeleton className="h-4 w-11/12 rounded-full" />
          <Skeleton className="h-4 w-8/12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
