import React, { useState } from "react";
import { ArrowLeft, Check, Cpu, Globe, Activity, Atom, Lightbulb, Briefcase, Plus, Send, Clock, CalendarDays, Zap } from "lucide-react";

export interface OnboardingData {
  category: string;
  prompt: string;
  chatHistory: { role: "agent" | "user"; text: string }[];
  frequency: "daily" | "weekly" | "realtime";
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { id: "ai", label: "AI & Tech", icon: Cpu, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { id: "finance", label: "Finance", icon: Briefcase, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  { id: "sport", label: "Sport", icon: Activity, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { id: "science", label: "Science", icon: Atom, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { id: "geopolitics", label: "Geopolitics", icon: Globe, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  { id: "health", label: "Health", icon: Plus, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
  { id: "other", label: "Other Ideas", icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
];

export default function OnboardingFlow({ onComplete, onCancel }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    category: "",
    prompt: "",
    chatHistory: [],
    frequency: "daily",
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleFinish = () => {
    onComplete(data);
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-50 dark:bg-[#08090f] text-neutral-900 rounded-lg dark:text-neutral-200 p-6 sm:p-10 z-50">
      
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
        <button 
          onClick={step === 1 ? onCancel : prevStep}
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-white/5 transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${
                s === step ? "bg-[#79e8b0]" : s < step ? "bg-[#79e8b0]/40" : "bg-neutral-300 dark:bg-neutral-800"
              }`} 
            />
          ))}
        </div>
        
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-[400px]">
        
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-syne font-bold mb-2 text-center text-neutral-900 dark:text-[#eef2ff]">What do you want to track?</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8">Select a broad category to begin personalizing your feed.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const isSelected = data.category === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      updateData({ category: cat.id });
                      nextStep();
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 ${
                      isSelected 
                        ? \`\${cat.bg} \${cat.border} ring-2 ring-\${cat.color.replace('text-', '')}\`
                        : "bg-white dark:bg-[#13151f] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/20"
                    } hover:shadow-md`}
                  >
                    <Icon size={28} className={\`mb-3 \${isSelected ? cat.color : "text-neutral-400"}\`} strokeWidth={1.5} />
                    <span className={\`font-medium \${isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}\`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Prompt */}
        {step === 2 && (
          <div className="w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-syne font-bold mb-2 text-neutral-900 dark:text-[#eef2ff]">Get specific</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">What exactly in {CATEGORIES.find(c => c.id === data.category)?.label || "this category"} are you interested in?</p>
            
            <div className="relative max-w-xl mx-auto">
              <input 
                type="text" 
                value={data.prompt}
                onChange={(e) => updateData({ prompt: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && data.prompt.trim()) nextStep();
                }}
                autoFocus
                placeholder='e.g., "TSMC company finances and stock moves"'
                className="w-full bg-white dark:bg-[#0e1018] border border-neutral-300 dark:border-white/10 rounded-2xl px-6 py-4 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-[#79e8b0]/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all shadow-sm"
              />
              <button 
                disabled={!data.prompt.trim()}
                onClick={nextStep}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {['"NVIDIA hardware roadmap"', '"F1 race analysis"', '"Federal reserve rate hikes"'].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => updateData({ prompt: suggestion.replace(/"/g, '') })}
                  className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 dark:bg-[#13151f] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: LLM Dialogue */}
        {step === 3 && (
          <Step3Dialogue data={data} updateData={updateData} onNext={nextStep} />
        )}

        {/* Step 4: Frequency */}
        {step === 4 && (
          <div className="w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-syne font-bold mb-2 text-neutral-900 dark:text-[#eef2ff]">How often?</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">Choose when you want to receive updates for this topic.</p>
            
            <div className="grid gap-4 max-w-md mx-auto text-left">
              {[
                { id: "daily", title: "Daily Briefing", desc: "Sent every morning at 8:00 AM", icon: Clock, color: "text-[#79e8b0]" },
                { id: "weekly", title: "Weekly Digest", desc: "Sent every Monday morning", icon: CalendarDays, color: "text-[#5db8ef]" },
                { id: "realtime", title: "As Published", desc: "Real-time updates as news breaks", icon: Zap, color: "text-[#f0a070]" },
              ].map((freq) => {
                const isSelected = data.frequency === freq.id;
                const Icon = freq.icon;
                return (
                  <button
                    key={freq.id}
                    onClick={() => updateData({ frequency: freq.id as "daily"|"weekly"|"realtime" })}
                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 ${
                      isSelected 
                        ? "bg-white dark:bg-[#13151f] border-[#79e8b0]/50 ring-1 ring-[#79e8b0]/50 shadow-sm"
                        : "bg-white dark:bg-[#0e1018] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg 
                      \${isSelected ? 'bg-neutral-100 dark:bg-white/5' : 'bg-neutral-50 dark:bg-[#13151f]'}
                    `}>
                      <Icon size={20} className={isSelected ? freq.color : "text-neutral-400"} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-lg mb-1 \${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {freq.title}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 leading-snug">
                        {freq.desc}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${isSelected ? 'border-[#79e8b0] bg-[#79e8b0]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {isSelected && <Check size={14} className="text-[#08090f] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10">
              <button 
                onClick={nextStep}
                className="bg-neutral-900 dark:bg-white text-white dark:text-black font-medium py-3 px-10 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 dark:shadow-white/10"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#13151f] border border-neutral-200 dark:border-white/10 rounded-2xl p-8 max-w-lg mx-auto relative overflow-hidden shadow-xl shadow-black/5">
              {/* Decor strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#79e8b0] via-[#5db8ef] to-[#f0a070]" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#79e8b0]/20 text-[#79e8b0] rounded-xl">
                  {React.createElement(CATEGORIES.find(c => c.id === data.category)?.icon || Cpu, { size: 24 })}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">New Topic</h3>
                  <div className="text-xl font-syne font-bold text-neutral-900 dark:text-white capitalize">
                    {data.prompt || "Custom Topic"}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-4 items-start p-3 rounded-lg bg-neutral-50 dark:bg-[#0e1018]">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold w-24 flex-shrink-0 pt-0.5">Category</div>
                  <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {CATEGORIES.find(c => c.id === data.category)?.label}
                  </div>
                </div>
                
                <div className="flex gap-4 items-start p-3 rounded-lg bg-neutral-50 dark:bg-[#0e1018]">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold w-24 flex-shrink-0 pt-0.5">Parameters</div>
                  <div className="text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
                    {data.chatHistory.filter(m => m.role === 'user').map(m => m.text).join(" • ") || "Default parameters"}
                  </div>
                </div>
                
                <div className="flex gap-4 items-start p-3 rounded-lg bg-neutral-50 dark:bg-[#0e1018]">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold w-24 flex-shrink-0 pt-0.5">Frequency</div>
                  <div className="text-neutral-800 dark:text-neutral-200 font-medium capitalize flex items-center gap-2">
                    {data.frequency === 'daily' && <Clock size={16} className="text-[#79e8b0]" />}
                    {data.frequency === 'weekly' && <CalendarDays size={16} className="text-[#5db8ef]" />}
                    {data.frequency === 'realtime' && <Zap size={16} className="text-[#f0a070]" />}
                    {data.frequency === 'daily' ? 'Daily Briefing' : data.frequency === 'weekly' ? 'Weekly Digest' : 'As Published'}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleFinish}
                className="w-full bg-[#79e8b0] text-[#08090f] font-bold py-3.5 px-6 rounded-xl hover:bg-[#68d09d] transition-colors shadow-lg shadow-[#79e8b0]/20 flex items-center justify-center gap-2 text-lg"
              >
                <Check size={20} className="stroke-[3]" />
                Confirm & Create Feed
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Sub-component for Step 3 to isolate its state and effect
function Step3Dialogue({ data, updateData, onNext }: { data: OnboardingData, updateData: (d: Partial<OnboardingData>) => void, onNext: () => void }) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{role: 'agent'|'user', text: string, isTyping?: boolean}[]>([
    { role: "agent", text: "Got it — a few quick questions to sharpen your feed:\n① Track earnings calls & quarterly financial results?\n② Include deal announcements (fab expansions, partnerships)?\n③ Stock price movements & analyst ratings?" }
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: "user" as const, text: inputValue }];
    setMessages(newMessages);
    updateData({ chatHistory: newMessages.filter(m => !m.isTyping) });
    setInputValue("");
    
    // Simulate agent response then advance
    setTimeout(() => {
      setMessages([...newMessages, { role: "agent" as const, text: "Perfect. I'll configure the news agent with those exact parameters.", isTyping: true }]);
      setTimeout(() => {
        updateData({ chatHistory: [...newMessages, { role: 'agent' as const, text: "Perfect. I'll configure the news agent with those exact parameters." }]});
        onNext();
      }, 1500);
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[500px] border border-neutral-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#0e1018] overflow-hidden shadow-lg shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-50 dark:bg-[#13151f] p-4 text-center border-b border-neutral-200 dark:border-white/10 font-syne font-bold text-neutral-800 dark:text-[#eef2ff]">
        NewsFlow AI Assistant
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 \${
              msg.role === 'user' 
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black rounded-tr-sm' 
                : 'bg-neutral-100 dark:bg-[#1a1c25] text-neutral-800 dark:text-neutral-200 rounded-tl-sm border border-neutral-200 dark:border-white/5'
            }`}>
              {msg.isTyping ? (
                <div className="flex gap-1 items-center h-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white dark:bg-[#0e1018] border-t border-neutral-200 dark:border-white/10">
        <div className="relative">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell the AI what to track..."
            className="w-full bg-neutral-100 dark:bg-[#13151f] border-none rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#5db8ef]/50 text-neutral-900 dark:text-white placeholder:text-neutral-500"
            disabled={messages[messages.length-1]?.role === 'user'}
          />
          <button 
            disabled={!inputValue.trim()}
            onClick={handleSend}
            className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-transparent text-[#5db8ef] hover:bg-[#5db8ef]/10 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
