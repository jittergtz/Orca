"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface TabData {
  id: string;
  label: string;
  videoSrc: string; // Replace with actual video URLs or use images
  prompts: string[];
  description: string;
}

// Tab data based on the HTML structure
const tabsData: TabData[] = [
  {
    id: 'sales-teams',
    label: 'Connecting Dots',
    videoSrc: '/video/fps3.mp4',
    prompts: [
      "Create a proposal doc with Acme and share with Julie Hoefler",
      "Summarize the BANCT criteria for today's Acme call",
      "Put your answers to the Acme RFP into a table"
    ],
    description: 'Optimize every stage of the deal lifecycle with AI that helps you prep for calls, answers your RFPs, and updates your CRM.'
  },
  {
    id: 'customer-support',
    label: 'Customer support',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-27611-large.mp4',
    prompts: [
      "What are some similar products? Add a comparison table",
      "How do I explain today's authentication errors more simply",
      "Give me feedback on yesterday's support call with Acme"
    ],
    description: 'Increase customer satisfaction at scale with AI that assigns tickets, answers product questions, and analyzes all your support calls.'
  },
  {
    id: 'in-house-ops',
    label: 'In-house operations',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-hud-cyberpunk-interface-2827-large.mp4',
    prompts: [
      "Outline the Q3 board deck based on Q2 actuals",
      "Analyze the latest 20 interviews for unconscious bias",
      "Flag any missing terms in the draft contract for Acme"
    ],
    description: 'Drive efficiency with AI that answers company FAQs, drafts contracts, and automates manual reporting.'
  },
  {
    id: 'financial-services',
    label: 'Financial services',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-financial-chart-animation-32947-large.mp4',
    prompts: [
      "Complete the Acme DDQ based on the latest data in SAP",
      "Summarize Acme's consolidated statement of operations",
      "Generate the Q4 investor memo in line with our template"
    ],
    description: 'AI that augments everything from deal prospecting and due diligence to performance reports and investor comms.'
  },
  {
    id: 'industrial-companies',
    label: 'Industrial companies',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-circuit-board-3167-large.mp4',
    prompts: [
      "Give me all spare parts for product PF6000",
      "What battery should our latest power-resist device have",
      "How do we fix the problem on this customer's locking kit"
    ],
    description: 'Accelerate everything from RFP processes to support times with AI that understands your complex product data.'
  },
  {
    id: 'law-firms',
    label: 'Law firms',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-paper-documents-flying-in-loop-5203-large.mp4',
    prompts: [
      "Create a table based on the acme-term-sheet.pdf",
      "Flag any missing terms in the contract for Acme Inc.",
      "Find me all relevant docs for today's dispute meeting"
    ],
    description: 'AI that analyzes case outcomes, highlights liabilities, drafts contracts, and more to increase efficiency.'
  }
];

// Typewriter Component with Framer Motion
const TypewriterText: React.FC<{ texts: string[]; period?: number }> = ({ 
  texts, 
  period = 2000 
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [delta, setDelta] = useState(100);

  useEffect(() => {
    const tick = () => {
      const fullText = texts[currentTextIndex];
      
      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setDelta(50); // Faster when deleting
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setDelta(100); // Normal typing speed
      }

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), period);
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      }
    };

    const timer = setTimeout(tick, delta);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentTextIndex, texts, period, delta]);

  return (
    <span className="inline-flex items-center">
      <span>{currentText}</span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-[2px] h-5 bg-white ml-0.5"
      />
    </span>
  );
};

// Sparkle Icon Component
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" 
      fill="currentColor"
    />
  </svg>
);

// Arrow Icon
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={className}
  >
    <path d="M5 12H19M19 12L12 5M19 12L12 19" />
  </svg>
);

// Main Component
const SideBySideTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('sales-teams');
  const activeData = tabsData.find(tab => tab.id === activeTab) || tabsData[0];

  return (
    <div className="w-full min-h-screen flex items-center justify-center rounded-3xl bg-[#0a0a0a] text-white p-8 md:p-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column - Media with Prompt Overlay */}
        <div className="lg:col-span-7 relative">
          <div className="relative rounded-2xl overflow-hidden bg-[#1a1a1a] aspect-[181/145]">
            {/* Video/Image Background */}
            <video
              key={activeTab}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            >
              <source src={activeData.videoSrc} type="video/mp4" />
            </video>
            
            {/* Dark gradient overlay for better text readability */}
            <div className="absolute   inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Prompt Overlay - Glassmorphism Search Bar */}
            <div className="absolute bottom-7 md:bottom-20  backdrop-blur-md rounded-full left-1/2 -translate-x-1/2 w-[90%] max-w-[615px]">
              <div className="relative">
                {/* Glow effect */}
                {/* <div className="absolute  -inset-1 bg-gradient-to-t from-[#a9a9a9ae] to-[#151515] rounded-full blur opacity-10" /> */}
                
                {/* Main container */}
                <div className="relative  flex items-center gap-3 px-6 py-1 md:py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
                  {/* Sparkle Icon */}
                  <SparkleIcon className="w-5 h-5 text-white z-50 flex-shrink-0" />
                  
                  {/* Typewriter Text */}
                  <div className="flex-1 overflow-hidden">
                    <span className="text-white  text-sm md:text-base font-light truncate">
                      <TypewriterText 
                        texts={activeData.prompts} 
                        period={2000}
                      />
                    </span>
                  </div>

                  {/* Send Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10"
                  >
                    <ArrowIcon className="w-4 h-4 text-white rotate-[-45deg]" />
                  </motion.button>
                </div>

              
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Navigation & Content */}
        <div className="lg:col-span-5 flex flex-col justify-between py-4">
          <div>
            {/* Red accent text */}
            <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase mb-6">
              Every team gets smarter with Orca
            </p>

            {/* Tab Navigation */}
            <nav className="space-y-1">
              {tabsData.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left group  flex items-center gap-3 py-3 px-4 rounded-full transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white/5' 
                      : 'hover:bg-white/5'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                 
                  <span className={`text-xl md:text-2xl  transition-colors ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-white/50 group-hover:text-white/80'
                  }`}>
                    {tab.label}
                  </span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Bottom Content */}
          <div className="mt-8 lg:mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <p className="text-white/70 px-3  text-lg leading-relaxed font-light max-w-md">
                  {activeData.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <button
           
              className=" gap-2 px-12 py-3 bg-white text-black text-center rounded-full hover:bg-white/90 transition-colors"
            >
              Get Orca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBySideTabs;