"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ─── Data ────────────────────────────────────────────────────────────────────

const tabs = ["Highlights", "Features", "Community"] as const;
type Tab = (typeof tabs)[number];

type Card = {
  id: string;
  // Tall / Wide / Image cards
  title?: string;
  image?: string;
  accent?: string;
  logo?: string;
  // Text cards
  eyebrow?: string;
  headline?: string;
  body?: string;
  size: "tall" | "wide" | "image" | "text";
};

const cardData: Record<Tab, Card[]> = {
  Highlights: [
    {
      id: "h1",
      title: "Orca powers enterprise AI research at scale",
      image: "/rote.png",
      size: "tall",
      accent: "from-orange-500/80 to-amber-700/60",
      logo: "NVIDIA",
    },
    {
      id: "h2",
      title: "Matthew's story: writing with AI for the first time",
      image: "/blocks/q2.jpg",
      size: "wide",
    },
    {
      id: "h3",
      size: "text",
      eyebrow: "NEW",
      headline: "Stay ahead of every headline",
      body: "Orca surfaces the stories that matter to you — before they trend.",
    },
    {
      id: "h4",
      size: "text",
      eyebrow: "IMPACT",
      headline: "Voices from 35+ countries",
      body: "The Orca Impact Program brings AI-powered journalism to underrepresented communities worldwide.",
    },
    {
      id: "h5",
      title: "Inside the newsroom of the future",
      image: "/carousel/oldpaper.jpg",
      size: "image",
    },
  ],
  Features: [
    {
      id: "f1",
      title: "Real-time synthesis in 32 languages",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
      size: "tall",
      accent: "from-blue-600/70 to-indigo-800/60",
      logo: "SPEECH",
    },
    {
      id: "f2",
      title: "Clone any voice in under 60 seconds",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
      size: "wide",
    },
    {
      id: "f3",
      size: "text",
      eyebrow: "SPEED",
      headline: "Instant, not eventual",
      body: "Generate studio-quality audio in milliseconds. No queues, no waiting.",
    },
    {
      id: "f4",
      size: "text",
      eyebrow: "ACCURACY",
      headline: "Contextual understanding",
      body: "Orca reads tone and intent, not just words — so your content always lands right.",
    },
    {
      id: "f5",
      title: "Sound design powered by AI",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
      size: "image",
    },
  ],
  Community: [
    {
      id: "c1",
      title: "Creators building the next generation of audio",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
      size: "tall",
      accent: "from-purple-600/70 to-violet-900/60",
      logo: "COMMUNITY",
    },
    {
      id: "c2",
      title: "Podcasters reaching global audiences with AI dubbing",
      image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=900&q=80",
      size: "wide",
    },
    {
      id: "c3",
      size: "text",
      eyebrow: "TOGETHER",
      headline: "Built with creators, for creators",
      body: "Every feature ships with feedback from our global community of 500 k+ independent journalists.",
    },
    {
      id: "c4",
      size: "text",
      eyebrow: "OPEN",
      headline: "An API for every workflow",
      body: "Plug Orca into your existing tools. REST, webhooks, SDKs — it all just works.",
    },
    {
      id: "c5",
      title: "Live from the community summit",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      size: "image",
    },
  ],
};

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 22, stiffness: 180 },
  },
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.2 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TallCard({ card }: { card: Card }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative shadow-lg shadow-black/80 rounded-3xl overflow-hidden min-h-[280px] md:min-h-[340px] lg:row-span-2  group cursor-pointer"
    >
      {card.image && (
        <Image
          src={card.image}
          alt={card.title ?? ""}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      )}
      {card.accent && (
        <div className={`absolute inset-0 bg-gradient-to-b ${card.accent}`} />
      )}
      {card.logo && (
        <div className="absolute top-4 left-4">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1 rounded-full border border-white/30">
            {card.logo}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-sm font-medium leading-snug">{card.title}</p>
      </div>
    </motion.div>
  );
}

function WideCard({ card }: { card: Card }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative rounded-3xl shadow-lg shadow-black/70 overflow-hidden min-h-[220px]  group cursor-pointer"
    >
      {card.image && (
        <Image
          src={card.image}
          alt={card.title ?? ""}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-sm font-medium leading-snug">{card.title}</p>
      </div>
    </motion.div>
  );
}

/** Plain image card — no overlay gradient, just a photo with a subtle caption */
function ImageCard({ card }: { card: Card }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative rounded-3xl overflow-hidden min-h-[200px] group cursor-pointer"
    >
      {card.image && (
        <Image
          src={card.image}
          alt={card.title ?? ""}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-medium leading-snug">{card.title}</p>
      </div>
    </motion.div>
  );
}

/** Text card — clean white/light surface, eyebrow + headline + body copy */
function TextCard({ card }: { card: Card }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-3xl bg-neutral-900 p-5 flex flex-col justify-between min-h-[160px] md:min-h-[180px] cursor-default"
    >
      <div className="flex flex-col gap-2">
        {card.eyebrow && (
          <span className="text-[10px] font-semibold tracking-widest text-neutral-100 uppercase">
            {card.eyebrow}
          </span>
        )}
        {card.headline && (
          <h3 className="text-sm font-semibold text-neutral-500 leading-snug">
            {card.headline}
          </h3>
        )}
      </div>
      {card.body && (
        <p className="text-xs text-neutral-400 leading-relaxed mt-2">
          {card.body}
        </p>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Blocks() {
  const [activeTab, setActiveTab] = useState<Tab>("Highlights");
  const cards = cardData[activeTab];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-20 md:py-40">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 leading-tight">
          Showcasing Realtime
          <br />
          impact of AI audio research
        </h2>
      </motion.div>

      {/* Tab switcher */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex justify-center mb-8"
      >
        <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-white/40 rounded-full shadow-sm shadow-black/70 border border-white"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Card grid
           mobile  : 1 col, all cards stack naturally
           tablet  : 2 cols, paired rows
           desktop : 3 cols × 2 rows bento with TallCard spanning both rows
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="
            grid gap-3
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3 lg:grid-rows-2 lg:auto-rows-[200px]
          "
        >
          {/* TallCard — full width on mobile/tablet, left col spanning 2 rows on desktop */}
          <div className="lg:row-span-2">
            <TallCard card={cards[0]} />
          </div>

          {/* Wide image — full width on mobile, right col row 1 on tablet, middle col on desktop */}
          <WideCard card={cards[1]} />

          {/* Text card 1 — pairs with wide on tablet (row 1 right), top-right on desktop */}
          <TextCard card={cards[2]} />

          {/* Text card 2 — pairs on tablet (row 2 left), bottom-middle on desktop */}
          <TextCard card={cards[3]} />

          {/* Image card — pairs on tablet (row 2 right), bottom-right on desktop */}
          <ImageCard card={cards[4]} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
