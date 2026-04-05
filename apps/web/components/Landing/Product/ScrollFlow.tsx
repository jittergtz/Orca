// app/components/ScrollFlow.tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import ScrollStep from './ScrollStep';

const steps = [
  {
    id: 1,
    title: "Connect all your work apps",
    subtitle: "Google Drive, Slack, Notion, and 100+ integrations",
    image: "/product/background.jpg",
    theme: "light"
  },
  {
    id: 2,
    title: "Search for anything, from anywhere",
    subtitle: "Unified search across all your connected tools and documents",
    image: "/heroBackgroundNoNoise.png",
    theme: "dark"
  },
  {
    id: 3,
    title: "Summarize and synthesize on the go",
    subtitle: "Get instant AI summaries of long documents and threads",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop",
    theme: "dark"
  },
  {
    id: 4,
    title: "Catch up on all your meetings",
    subtitle: "Missed a meeting? No problem. The recap is just a tap away.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
    theme: "dark"
  },
  {
    id: 5,
    title: "Get cited sources for every answer",
    subtitle: "Every response includes traceable sources from your data",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop",
    theme: "light"
  },
  {
    id: 6,
    title: "Chat hands-free with Voice Mode",
    subtitle: "Speak naturally and get instant responses",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    theme: "dark"
  },
  {
    id: 7,
    title: "Switch between the latest models",
    subtitle: "GPT-4o, Claude 3.5, DeepSeek, and more. Built on any LLM you want.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
    theme: "dark"
  }
];

export default function ScrollFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="relative h-[700vh]">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        
        {/* Background Images with Crossfade */}
        {steps.map((step, index) => {
          const start = index / steps.length;
          const end = (index + 1) / steps.length;
          
          return (
            <BackgroundImage
              key={step.id}
              src={step.image}
              progress={smoothProgress}
              start={start}
              end={end}
            />
          );
        })}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-center items-center px-6">
          {steps.map((step, index) => {
            const start = index / steps.length;
            const end = (index + 1) / steps.length;
            
            return (
              <ScrollStep
                key={step.id}
                step={step}
                index={index}
                progress={smoothProgress}
                start={start}
                end={end}
              />
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {steps.map((_, index) => {
            const start = index / steps.length;
            const end = (index + 1) / steps.length;
            
            return (
              <ProgressDot
                key={index}
                index={index}
                progress={smoothProgress}
                start={start}
                end={end}
              />
            );
          })}
        </div>

        {/* Step Counter */}
        <motion.div 
          className="absolute bottom-8 left-8 z-30 font-mono text-sm tracking-widest text-white/60"
          style={{
            opacity: useTransform(smoothProgress, [0, 0.05], [0, 1])
          }}
        >
          <motion.span>
            {useTransform(smoothProgress, (v) => {
              const current = Math.min(Math.floor(v * steps.length) + 1, steps.length);
              return `0${current}`;
            })}
          </motion.span>
          <span className="mx-2">/</span>
          <span className="text-white/30">0{steps.length}</span>
        </motion.div>
      </div>
    </div>
  );
}

// Background Image Component with Crossfade
function BackgroundImage({ 
  src, 
  progress, 
  start, 
  end 
}: { 
  src: string; 
  progress: any; 
  start: number; 
  end: number; 
}) {
  const opacity = useTransform(
    progress,
    [start - 0.05, start, end - 0.05, end],
    [0, 1, 1, 0]
  );
  
  const scale = useTransform(
    progress,
    [start, end],
    [1.1, 1]
  );

  return (
    <motion.div
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      <motion.div 
        className="w-full h-full bg-cover bg-center"
        style={{ 
          scale,
          backgroundImage: `url(${src})`
        }}
      />
    </motion.div>
  );
}

// Progress Dot Component
function ProgressDot({ 
  index, 
  progress, 
  start, 
  end 
}: { 
  index: number; 
  progress: any; 
  start: number; 
  end: number; 
}) {
  const opacity = useTransform(
    progress,
    [start - 0.02, start, end - 0.02, end],
    [0.3, 1, 1, 0.3]
  );
  
  const scale = useTransform(
    progress,
    [start - 0.02, start, end - 0.02, end],
    [1, 1.5, 1.5, 1]
  );

  return (
    <motion.div
      className="w-1 h-5 rounded-full bg-white/90"
      style={{ opacity, scale }}
    />
  );
}