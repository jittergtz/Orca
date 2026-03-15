"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────── */
export interface CarouselCard {
  label: string;
  bgColor: string;
  badge?: string;
  darkText?: boolean;
  imageSrc?: string;
  imageAlt?: string;
}

export interface CarouselSectionProps {
  title?: string;
  subtitle?: string;
  cards?: CarouselCard[];
  /** Duration each slide is shown in ms (default 5000) */
  slideDuration?: number;
}

/* ─── Defaults ────────────────────────────────────────────── */
const defaultCards: CarouselCard[] = [
  {
    label: "Singapore",
    bgColor: "#2d5a45",
    badge: "Daily News",
    imageSrc: "/mock-singapore.png",
    imageAlt: "Indoor garden waterfall",
  },
  { label: "Finance",    bgColor: "#9b93b3" },
  { label: "Politics",   bgColor: "#d6d6d6", darkText: true },
  { label: "Technology", bgColor: "#b3c4d8", darkText: true },
  { label: "Culture",    bgColor: "#d4b8a0", darkText: true },
];

const SecondaryCards: CarouselCard[] = [
  {
    label: "Sport",
    bgColor: "#5C2D30",
    badge: "2026 Start",
    imageSrc: "/mock-singapore.png",
    imageAlt: "Indoor garden waterfall",
  },
  { label: "Finance",    bgColor: "#9b93b3" },
  { label: "Politics",   bgColor: "#d6d6d6", darkText: true },
  { label: "Technology", bgColor: "#b3c4d8", darkText: true },
  { label: "Culture",    bgColor: "#d4b8a0", darkText: true },
];

/* ─── Main component ──────────────────────────────────────── */
export default function CarouselSection({
  title = "Meet Orca",
  subtitle = "Orca brings the best of an LMS, LXP, authoring tool, AI-native learning platform.",
  cards = defaultCards,
  slideDuration = 5000,
}: CarouselSectionProps) {
  const [active, setActive]   = useState(0);
  const [paused, setPaused]   = useState(false);
  const [progress, setProgress] = useState(0);

  const trackRef      = useRef<HTMLDivElement>(null);
  const animFrameRef  = useRef<number | null>(null);
  const startTimeRef  = useRef<number>(performance.now());
  const pausedAtRef   = useRef<number>(0);   // how far through when paused

  /* ── Scroll track to active card ── */
  const scrollToCard = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  /* ── Advance to next ── */
  const goTo = useCallback((index: number) => {
    const next = (index + cards.length) % cards.length;
    setActive(next);
    scrollToCard(next);
    startTimeRef.current = performance.now();
    setProgress(0);
  }, [cards.length, scrollToCard]);

  /* ── rAF-based progress ticker ── */
  useEffect(() => {
    if (paused) {
      pausedAtRef.current = progress;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Adjust start time to account for already-elapsed progress
    startTimeRef.current = performance.now() - pausedAtRef.current * slideDuration;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(elapsed / slideDuration, 1);
      setProgress(pct);
      if (pct < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setActive((prev) => {
          const next = (prev + 1) % cards.length;
          scrollToCard(next);
          return next;
        });
        startTimeRef.current = performance.now();
        pausedAtRef.current  = 0;
        setProgress(0);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, active, cards.length, slideDuration]);

  /* ── Manual nav: click dot ── */
  const handleDotClick = (i: number) => {
    pausedAtRef.current = 0;
    goTo(i);
    if (paused) setPaused(false);
  };

  return (
    <section className="w-full max-w-7xl  py-20  select-none">
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif font-bold italic text-black leading-tight mb-4"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
          {title}
        </h2>
        <p className="text-base md:text-lg text-neutral-900 max-w-xl mx-auto  whitespace-pre-line">
          {subtitle}
        </p>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex   no-shrink gap-5 flex-shrink-0 justify-start  overflow-x-auto scroll-smooth p-5  scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {cards.map((card, i) => (
          <CarouselCardItem
            key={i}
            card={card}
            isActive={i === active}
          />
        ))}
      </div>

      {/* ── Apple-style nav bar ─────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {/* Pill backdrop */}
        <div className="flex items-center  gap-[6px] bg-neutral-100 rounded-full px-5 py-3 shadow-inner">
          {cards.map((_, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={[
                  "relative overflow-hidden rounded-full transition-all duration-500 ease-in-out",
                  isActive
                    ? "h-[7px] w-[72px] bg-neutral-300"
                    : "h-[6px] w-[6px] bg-neutral-300 hover:bg-neutral-400",
                ].join(" ")}
              >
                {/* Progress fill */}
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-neutral-700 transition-none"
                    style={{ width: `${progress * 100}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Pause / Play button */}
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play" : "Pause"}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 shadow-inner text-neutral-600 hover:bg-neutral-200 transition-colors"
        >
          {paused ? (
            /* Play icon */
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          ) : (
            /* Pause icon */
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}

/* ─── Card ─────────────────────────────────────────────────── */
function CarouselCardItem({ card, isActive }: { card: CarouselCard; isActive: boolean }) {
  const textColor = card.darkText ? "text-neutral-800" : "text-white";
  const badgeBg   = card.darkText
    ? "bg-white/60 text-neutral-800"
    : "bg-white/20 text-white backdrop-blur-sm";

  return (
    <div
      className={[
        "relative flex-shrink-0  rounded-[30px] overflow-hidden flex flex-col",
        "transition-all duration-500 ease-in-out",
        isActive ? " border-2 border-neutral-300 scale-[1.03]" : "scale-100 ",
      ].join(" ")}
      style={{
        backgroundColor: card.bgColor,
        width: "clamp(300px, 30vw, 340px)",
        minHeight: "420px",
        scrollSnapAlign: "center",
      }}
    >
      {/* Top row */}
      <div className="flex items-start  justify-between p-5 gap-2">
        <span
          className={`text-3xl md:text-4xl leading-tight font-serif italic ${textColor}`}
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          {card.label}
        </span>
        {card.badge && (
          <span className={`mt-1.5 flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full border border-white/30 ${badgeBg}`}>
            {card.badge}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Optional image */}
      {card.imageSrc && (
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ height: 200 }}>
          <Image
            src={card.imageSrc}
            alt={card.imageAlt ?? card.label}
            width={600}
            height={400}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
