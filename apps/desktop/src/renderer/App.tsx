import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings, ArrowUp, Cpu, PanelLeft } from "lucide-react";
import Sidebar from "./components/Sidebar";
import SearchResultContainer from "./components/SearchResultContainer";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export default function App() {
  const [view, setView] = useState("loading");
  const [theme, setTheme] = useState("system");
  const [systemTheme, setSystemTheme] = useState("light");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState("profile");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("Auto");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef<Note[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const lastLoadedNoteIdRef = useRef<string | null>(null);

  const [isTestUI] = useState(true);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const activeNote = useMemo(() => notes.find((note) => note.id === activeId) || null, [notes, activeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    if (activeNote && activeNote.id !== lastLoadedNoteIdRef.current) {
      lastLoadedNoteIdRef.current = activeNote.id;
      setDraftTitle(activeNote.title || "");
      setDraftContent(activeNote.content || "");
    }
  }, [activeNote]);

  const refreshNotes = useCallback(async (selectId: string | null = null) => {
    let nextNotes = await window.orca.notes.list();
    if (nextNotes.length === 0) {
      const created = await window.orca.notes.create();
      nextNotes = [created];
    }

    const sorted = sortNotes(nextNotes);
    const preferredId = selectId || activeIdRef.current;
    const nextActive =
      preferredId && sorted.some((note) => note.id === preferredId) ? preferredId : sorted[0]?.id || null;

    setNotes(sorted);
    setActiveId(nextActive);
  }, []);

  const enterApp = useCallback(
    async (selectId: string | null = null) => {
      await refreshNotes(selectId);
      setView("app");
    },
    [refreshNotes]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const [savedTheme, effectiveTheme] = await Promise.all([
          window.orca.settings.getTheme(),
          window.orca.settings.getEffectiveTheme()
        ]);
        setTheme(savedTheme);
        setSystemTheme(effectiveTheme);

        unsubscribe = window.orca.onSystemThemeChanged((mode) => {
          setSystemTheme(mode);
        });

        await enterApp();
      } catch (error: any) {
        console.error("Initialization failed", error);
        setView(`error: ${error.message || String(error)}`);
      }
    };

    void init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enterApp]);

  useEffect(() => {
    if (view !== "app" || !activeNote) {
      return undefined;
    }

    const normalizedTitle = draftTitle.trim() || "Untitled";
    if (normalizedTitle === activeNote.title && draftContent === activeNote.content) {
      return undefined;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const noteId = activeIdRef.current;
      if (!noteId) {
        return;
      }

      window.orca.notes
        .update({
          id: noteId,
          title: normalizedTitle,
          content: draftContent
        })
        .then((updated) => {
          setNotes((prev) => sortNotes(prev.map((note) => (note.id === updated.id ? updated : note))));
          setActiveId(updated.id);
        })
        .catch((error) => {
          console.error("Save failed", error);
        });
    }, 220);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [view, activeNote, draftTitle, draftContent]);

  useEffect(() => {
    if (!modeDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeDropdownOpen]);

  const createNote = async () => {
    const created = await window.orca.notes.create();
    await refreshNotes(created.id);
  };



  const changeTheme = async (value: string) => {
    setTheme(value);
    await window.orca.settings.setTheme(value);
  };

  const appReady = view === "app";

  return (
    <div className="h-screen w-screen text-neutral-900 dark:text-neutral-100">
      {appReady ? (
        <div className="h-full flex flex-col relative">
          <header 
            className="h-[40px] flex-shrink-0 flex items-center justify-between px-3 pl-[72px]  border-white/20 dark:border-white/10"
            style={{ WebkitAppRegion: 'drag' }}
          >
            <div className="flex items-center " style={{ WebkitAppRegion: 'no-drag' }}>
              <button 
                className="p-1 z-50 rounded-full  dark:text-neutral-400 text-neutral-700 hover:text-black dark:hover:text-white/90 transition-colors flex items-center justify-center auto-cols-auto" 
                onClick={() => setSidebarOpen(prev => !prev)}
                title="Toggle Sidebar (Cmd+B)"
              >
                <PanelLeft size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center pt-2 gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
            
              <button 
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)" }}
                className="p-2  border border-white/10 rounded-full  dark:text-neutral-400 text-neutral-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center auto-cols-auto"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
              >
                <Settings size={15} strokeWidth={2} />
              </button>
            </div>
          </header>
            <Sidebar 
              createNote={createNote}
              isOpen={sidebarOpen}
            />

          <div className="flex flex-1  w-full relative">
          {onboardingOpen && (
            <div className="absolute inset-0 z-50 bg-white dark:bg-[#08090f] overflow-y-auto w-full h-full flex pt-10">
               <OnboardingFlow 
                 onComplete={(data) => {
                   console.log("Onboarding complete", data);
                   setOnboardingOpen(false);
                 }}
                 onCancel={() => setOnboardingOpen(false)}
               />
            </div>
          )}
          
          {isTestUI ? (
             <main className="flex flex-1 min-h-0 w-full items-center justify-center relative  ">
              <div className="flex flex-col items-center w-full max-w-2xl px-6 -mt-32">
              <h1 className="font-instrument-serif italic text-[3.5rem] text-transparent bg-clip-text bg-gradient-to-tl from-black to-[#727272] dark:from-white dark:to-[#bcbcbc]  leading-[70px]    ">
                Orca Finance
              </h1>
              <p className="text-lg text-neutral-600 dark:text-white/80 font-light tracking-tight mb-10">Seeing the big picture, Research off the future.</p>
              
              <div className="w-full relative  rounded-full bg-white/60 dark:bg-neutral-900/50   border-white/60 dark:border-black/20 flex  items-center p-2 pl-6 pr-2  group hover:shadow-md transition-shadow" style={{ boxShadow: "0 3px 4px rgba(10, 10,10, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                <input 
                  type="text" 
                  placeholder="What do you want to be informed of?" 
                  className="flex-1 placeholder:font-light bg-transparent border-none outline-none s text-neutral-900 dark:text-white placeholder:text-neutral-400/80 font-medium text-[14px]"
                />
                <div className="relative" ref={modeDropdownRef}>
                  <button 
                    onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                    className="flex items-center gap-1.5 font-light text-xs text-neutral-800 dark:text-neutral-200 hover:text-neutral-800 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                  >
                    {searchMode}
                    <Cpu size={15} strokeWidth={1.8} className="text-neutral-600 dark:text-neutral-500" />
                  </button>
                  
                  <div 
                    className={`absolute right-0 top-full mt-2 w-40 bg-white/95 dark:bg-[#1a1b23]/95 backdrop-blur-md rounded-xl shadow-lg border border-black/10 dark:border-white/10 overflow-hidden z-50 py-1 flex flex-col transition-all duration-[100ms] ease-out origin-top-right ${
                      modeDropdownOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                    }`}
                  >
                    {["Auto", "Full Report", "Fast response", "Realtime"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSearchMode(mode);
                          setModeDropdownOpen(false);
                        }}
                        className={`text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${searchMode === mode ? 'font-medium text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setOnboardingOpen(true)}
                  className="ml-1.5 w-9 h-9 flex-shrink-0 rounded-full bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </main>
          ):(
            <SearchResultContainer/>
          )}
           
          </div>
        </div>
      ) : (
        <div className="auth-layer">
          {view === "loading" ? (
            <div className="glass-card backdrop-blur-md max-w-sm">
              <h1 className="text-2xl font-semibold">Orca</h1>
              <p className="mt-2 text-sm opacity-80">Loading...</p>
            </div>
          ) : view.startsWith("error:") ? (
            <div className="glass-card backdrop-blur-md max-w-sm border border-red-500/50">
              <h1 className="text-2xl font-semibold text-red-500">Error Hook</h1>
              <p className="mt-2 text-sm opacity-80 font-mono text-red-400">{view.replace("error: ", "")}</p>
            </div>
          ) : null}
        </div>
      )}

      {settingsOpen ? (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="glass-card backdrop-blur-md w-full max-w-3xl flex overflow-hidden p-0 h-[500px]">
            <div className="w-48 border-r border-neutral-200 dark:border-white/10 p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold mb-2 px-2 text-neutral-500 dark:text-white/50 uppercase tracking-wider">Settings</h2>
              {["profile", "themes", "api-key"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSettingsCategory(cat);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    settingsCategory === cat
                      ? "bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white"
                      : "text-neutral-500 dark:text-white/60 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {cat === "api-key" ? "API Key" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 flex flex-col relative overflow-y-auto">
              <button 
                className="absolute top-4 right-4 text-neutral-400 dark:text-white/40 hover:text-neutral-900 dark:hover:text-white transition-colors"
                onClick={() => setSettingsOpen(false)}
              >
                Close
              </button>

              {settingsCategory === "profile" && (
                <div>
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                  <p className="mt-2 text-sm opacity-80">Profile management coming soon.</p>
                </div>
              )}

              {settingsCategory === "themes" && (
                <div>
                  <h2 className="text-xl font-semibold">Appearance</h2>
                  <p className="mt-2 text-sm opacity-80 mb-6">Customize how Orca Notes looks.</p>
                  
                  <label className="flex items-center gap-3 text-sm flex-row">
                    <span>Theme mode:</span>
                    <select
                      className="glass-input h-9 w-32 rounded-lg px-2 text-sm outline-none"
                      value={theme}
                      onChange={(event) => void changeTheme(event.target.value)}
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>
                </div>
              )}

              {settingsCategory === "api-key" && (
                <div>
                  <h2 className="text-xl font-semibold">API Keys</h2>
                  <p className="mt-2 text-sm opacity-80">API configuration coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
