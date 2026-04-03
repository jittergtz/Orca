// app/components/ScrollStep.tsx
'use client';

import { motion, useTransform } from 'framer-motion';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  theme: string;
}

interface ScrollStepProps {
  step: Step;
  index: number;
  progress: any;
  start: number;
  end: number;
}

export default function ScrollStep({ step, progress, start, end }: ScrollStepProps) {
  // Calculate opacity based on scroll progress
  const opacity = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [0, 1, 1, 0]
  );

  // Calculate Y position for slide-up effect
  const y = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [60, 0, 0, -60]
  );

  // Calculate scale
  const scale = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [0.95, 1, 1, 0.95]
  );

  const isLight = step.theme === 'light';

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center items-center text-center max-w-4xl mx-auto px-6"
      style={{ 
        opacity, 
        y, 
        scale,
        pointerEvents: 'none' // Prevent interaction when invisible
      }}
    >
      <motion.h2 
        className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 ${
          isLight ? 'text-gray-900' : 'text-white'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        {step.title}
      </motion.h2>
      
      <motion.p 
        className={`text-xl md:text-2xl max-w-2xl leading-relaxed ${
          isLight ? 'text-gray-700' : 'text-gray-300'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {step.subtitle}
      </motion.p>

      {/* Mock Feature Tags */}
      <motion.div 
        className="flex gap-3 mt-8 flex-wrap justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {step.id === 1 && (
          <>
            <Tag text="100+ Integrations" isLight={isLight} />
            <Tag text="Real-time Sync" isLight={isLight} />
          </>
        )}
        {step.id === 2 && (
          <>
            <Tag text="Universal Search" isLight={isLight} />
            <Tag text="AI-Powered" isLight={isLight} />
          </>
        )}
        {step.id === 3 && (
          <>
            <Tag text="Instant Summaries" isLight={isLight} />
            <Tag text="Key Insights" isLight={isLight} />
          </>
        )}
        {step.id === 4 && (
          <>
            <Tag text="Auto Recaps" isLight={isLight} />
            <Tag text="Action Items" isLight={isLight} />
          </>
        )}
        {step.id === 7 && (
          <>
            <Tag text="GPT-4o" isLight={isLight} />
            <Tag text="Claude 3.5" isLight={isLight} />
            <Tag text="DeepSeek" isLight={isLight} />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function Tag({ text, isLight }: { text: string; isLight: boolean }) {
  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
      isLight 
        ? 'bg-white/80 border-gray-200 text-gray-800' 
        : 'bg-white/10 border-white/20 text-white/90'
    } backdrop-blur-md`}>
      {text}
    </span>
  );
}