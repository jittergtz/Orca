import { useEffect, useState } from "react";
import { getDesktopSupabaseClient } from "../lib/supabase";

export default function ArticleView() {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLatestArticle() {
      const supabase = getDesktopSupabaseClient();
      const { data, error } = await supabase
        .from("articles")
        .select("*, topics(frequency)")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setArticle(data);
      }
      setLoading(false);
    }
    loadLatestArticle();
  }, []);

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-neutral-400">Loading Article...</div>;
  }

  if (!article) {
    return <div className="w-full h-full flex items-center justify-center text-neutral-400">No content available for your topics yet.</div>;
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scroll-smooth bg-transparent text-neutral-900 dark:text-neutral-100 flex justify-center pb-32 pt-8">
      <style>{`
        .article-body p { margin-bottom: 1.5rem; }
        .article-body mark {
          background-color: transparent;
          border-bottom: 1px solid rgba(120, 120, 120, 0.4);
          color: inherit;
        }
      `}</style>

      <div className="max-w-2xl px-8 w-full flex flex-col">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#5db8ef] rounded-full border-2 border-white dark:border-[#08090f] shadow-[0_0_0_1px_rgba(93,184,239,0.3)]" />
            <span className="text-[11px] font-medium text-neutral-500 tracking-wide uppercase">
              {article.topics?.frequency || "Realtime"}
            </span>
          </div>
          <div className="text-[13px] font-medium text-neutral-500">
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'long'
            }).format(new Date(article.published_at))}
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
          <h1 className="font-instrument-serif italic text-4xl sm:text-5xl leading-tight text-neutral-900 dark:text-neutral-50 tracking-tight">
            {article.title}
          </h1>
        </div>

        {/* Body content */}
        <div 
          className="article-body font-sans text-[16px] sm:text-[17px] leading-[1.8] text-neutral-700 dark:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: "<p>" + article.body.replace(/\n\n/g, "</p><p>") + "</p>" }}
        />

      </div>

      {/* Floating Pill Player Placeholder */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center p-1.5 bg-white/70 dark:bg-[#13151f]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full w-64 h-12 z-50">
        <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-xs font-medium text-neutral-500 opacity-60">
           ...
        </div>
      </div>

    </div>
  );
}
