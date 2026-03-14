"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

type Segment = { text: string; className?: string };

const paragraphsData = [
  {
    id: 1,
    segments: [
      { text: "Informed Today about what happen today " },
      { text: "Kimi K2.5", className: "font-semibold not-italic" },
      { text: " released a new paper where discussion of new Agent" },
    ],
  },
  {
    id: 2,
    segments: [
      { text: "Swarm learning methods are Mentioned its complex Math trying to distinguish between what role or task which agent" },
    ],
  },
  {
    id: 3,
    segments: [
      { text: "get in the llm neural to be closer to topics which are llms expert in this will bring more " },
      { text: "efficiency", className: "italic" },
      { text: " then before resulting in " },
      { text: "20%", className: "font-bold not-italic" },
      { text: " faster response time and " },
      { text: "13% higher", className: "font-bold not-italic" },
      { text: " accuracy which is interesting" },
    ],
  },
];

const allParagraphs = [
  ...paragraphsData,
  ...paragraphsData.map(p => ({ ...p, id: p.id + 3 }))
];

const wordVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.05 } },
};

function StreamingParagraph({ segments, delayOffset, inView }: { segments: Segment[], delayOffset: number, inView: boolean }) {
  const words: { word: string; className?: string }[] = [];
  
  segments.forEach((seg) => {
    const split = seg.text.split(" ");
    split.forEach((s, i) => {
      if (i < split.length - 1) {
        words.push({ word: s + " ", className: seg.className });
      } else if (s.length > 0) {
        words.push({ word: s, className: seg.className });
      }
    });
  });

  return (
    <motion.p
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.04,
            delayChildren: delayOffset,
          },
        },
      }}
      className="text-sm sm:text-[13px] text-neutral-700 leading-relaxed mb-3"
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={wordVariants} className={w.className}>
          {w.word}
        </motion.span>
      ))}
    </motion.p>
  );
}

export default function OrcaPreview() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration > 0) {
      setProgress((current / duration) * 100);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newTime = (pct / 100) * audioRef.current.duration;
    if (isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setProgress(pct);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-8">
      <audio
        ref={audioRef}
        src="/prevaudio.mp3"
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      {/* Mac-style window */}
      <div
        className="relative w-full max-w-3xl rounded-[28px] overflow-hidden shadow-sm shadow-black/40"
        style={{
          background:
            "linear-gradient(135deg, #dde3ec 0%, #c8d4e0 30%, #d6cfc8 60%, #e8ddd4 100%)",
        }}
      >
        {/* Traffic light dots */}
        <div className="flex items-center gap-1 pt-4 px-5 pb-1">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-inner" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
          <span className="w-3 h-3 rounded-full bg-[#28C840] shadow-inner" />
        </div>

        {/* Content area */}
        <div className="px-6  sm:px-10 pt-3 pb-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            {/* AI badge */}
            <span
              className="text-xs font-semibold px-3 py-0.5 rounded-full"
              style={{
                background: "rgba(210,200,180,0.7)",
                color: "#5a4e3a",
                border: "1px solid rgba(180,165,140,0.5)",
                backdropFilter: "blur(6px)",
              }}
            >
              AI
            </span>
            {/* Date */}
            <span className="text-xs text-neutral-500 font-serif tracking-wide">
              11.03.2026
            </span>
          </div>

           <div className="flex flex-col items-center">
            <div className="flex flex-col items-start">
          {/* Title */}
          <h2 className="font-serif italic text-[24px] sm:text-[28px] text-neutral-800 leading-snug mb-4">
            Informed Today about what happen
          </h2>

          {/* Scrollable text body */}
          <div className="space-y-3 max-h-[220px] sm:max-h-[260px] sm:w-[450px] overflow-y-auto pr-1 scrollbar-hide text-left">
            {allParagraphs.map((p, index) => {
              // Calculate delay based on word count of previous paragraphs
              const delayOffset = allParagraphs.slice(0, index).reduce((acc, curr) => {
                const wordCount = curr.segments.reduce((c, seg) => c + seg.text.split(" ").length, 0);
                return acc + (wordCount * 0.04) + 0.3; // 0.3s pause between paragraphs
              }, 0);

              return (
                <StreamingParagraph
                  key={p.id}
                  segments={p.segments}
                  delayOffset={delayOffset}
                  inView={true}
                />
              );
            })}
            </div>
          </div></div>
        </div>

        {/* Playback bar */}
        <div className="flex items-center justify-center pb-5 px-6">
          <div
            className="flex items-center gap-3 rounded-full px-4 py-2.5"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              width: "min(170px, 90%)",
            }}
          >
            {/* Play / Pause button */}
            <button
              onClick={togglePlayPause}
              className="w-5 h-4 flex-shrink-0 flex items-center justify-center text-neutral-700 hover:text-black transition-colors"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                /* Pause icon */
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <rect x="4" y="3" width="4" height="14" rx="1" />
                  <rect x="12" y="3" width="4" height="14" rx="1" />
                </svg>
              ) : (
                /* Play icon */
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M5 3.5l12 6.5-12 6.5V3.5z" />
                </svg>
              )}
            </button>

            {/* Progress track */}
            <div
              className="flex-1 h-[3px] rounded-full cursor-pointer relative"
              style={{ background: "rgba(0,0,0,0.15)" }}
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: "rgba(0,0,0,0.55)",
                }}
              />
              {/* Thumb dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neutral-700 shadow"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}