

export default function ArticleView() {
  return (
    <div className="w-full h-full overflow-y-auto scroll-smooth relative bg-transparent text-neutral-900 dark:text-neutral-100 flex justify-center pb-32 pt-16">
      
      <div className="max-w-2xl px-8 w-full flex flex-col">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#5db8ef] rounded-full border-2 border-white dark:border-[#08090f] shadow-[0_0_0_1px_rgba(93,184,239,0.3)]" />
            <span className="text-[11px] font-medium text-neutral-500 tracking-wide uppercase">Realtime</span>
          </div>
          <div className="text-[13px] font-medium text-neutral-500">
            Fr 27 March
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
          <h1 className="font-instrument-serif italic text-4xl sm:text-5xl leading-tight text-neutral-900 dark:text-neutral-50 tracking-tight">
            Suzuka Grand Prix the Thrid race of 2026, has started
          </h1>
        </div>

        {/* Body content */}
        <div className="font-sans text-[16px] sm:text-[17px] leading-[1.8] text-neutral-700 dark:text-neutral-300 space-y-6">
          <p>
            Hinter Piastri platzierten sich die beiden{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Mercedes</span>-Fahrer{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Andrea Kimi Antonelli</span> und{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">George Russell</span>, die vor allem auf den Longruns
            mit Medium überzeugten und ihre Favoritenstellung für den Grand Prix untermauerten.
          </p>

          <p>
            Ferrari landete mit <span className="border-b border-neutral-400 dark:border-neutral-500">Charles Leclerc</span> und{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Lewis Hamilton</span> noch hinter 
            Weltmeister <span className="border-b border-neutral-400 dark:border-neutral-500">Lando Norris</span> auf den Plätzen fünf und sechs und wirkte
            damit wie die dritte Kraft in Suzuka.
          </p>

          <p>
            Beide Ferrari-Fahrer kämpften mit ihren Autos: Hamilton beklagte am Funk fehlendes Vertrauen ins Auto, Leclerc rutschte gleich mehrfach weg.
          </p>

          <p>
            Hinter Piastri platzierten sich die beiden{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Mercedes</span>-Fahrer{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Andrea Kimi Antonelli</span> und{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">George Russell</span>, die vor allem auf den Longruns
            mit Medium überzeugten und ihre Favoritenstellung für den Grand Prix untermauerten. Ferrari landete mit{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Charles Leclerc</span> und{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Lewis Hamilton</span> noch hinter Weltmeister{" "}
            <span className="border-b border-neutral-400 dark:border-neutral-500">Lando Norris</span> auf den Plätzen fünf
            und sechs und wirkte damit wie die dritte Kraft in Suzuka.
          </p>

          <p>
            Beide Ferrari-Fahrer kämpften mit ihren Autos: Hamilton beklagte am Funk fehlendes Vertrauen ins Auto, Leclerc rutschte gleich mehrfach weg.
          </p>
        </div>

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
