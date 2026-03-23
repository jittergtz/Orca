import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings, Lock, PanelLeft, Trash } from "lucide-react";
import MarkdownEditor from "./components/MarkdownEditor";
import Sidebar from "./components/Sidebar";

const EMPTY_UNLOCK_DIGITS = ["", "", "", ""];

function isValidPin(value: string) {
  return /^\d{4}$/.test(value);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [setupPin, setSetupPin] = useState("");
  const [setupPinConfirm, setSetupPinConfirm] = useState("");
  const [unlockDigits, setUnlockDigits] = useState(EMPTY_UNLOCK_DIGITS);
  const [authError, setAuthError] = useState("");
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [nextPinConfirm, setNextPinConfirm] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");

  const [settingsCategory, setSettingsCategory] = useState("profile");
  const [pinEnabled, setPinEnabled] = useState(true);
  const [pinChangeStep, setPinChangeStep] = useState(1);

  const unlockInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setupPinRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef<Note[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const lastLoadedNoteIdRef = useRef<string | null>(null);

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

  const clearUnlockDigits = useCallback(() => {
    setUnlockDigits(EMPTY_UNLOCK_DIGITS);
  }, []);

  const focusUnlockIndex = useCallback((index: number) => {
    const el = unlockInputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

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
      setAuthError("");
      setView("app");
    },
    [refreshNotes]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const [savedTheme, effectiveTheme, authStatus] = await Promise.all([
          window.orca.settings.getTheme(),
          window.orca.settings.getEffectiveTheme(),
          window.orca.auth.getStatus()
        ]);
        setTheme(savedTheme);
        setSystemTheme(effectiveTheme);

        unsubscribe = window.orca.onSystemThemeChanged((mode) => {
          setSystemTheme(mode);
        });

        if (!authStatus.hasPin) {
          setView("setup");
          return;
        }

        setPinEnabled(authStatus.pinEnabled);

        if (authStatus.unlocked || !authStatus.pinEnabled) {
          await enterApp();
          return;
        }

        setView("unlock");
      } catch (error) {
        console.error("Initialization failed", error);
        setAuthError("Could not initialize app state.");
        setView("unlock");
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
    if (view === "setup") {
      setupPinRef.current?.focus();
    }
    if (view === "unlock") {
      focusUnlockIndex(0);
    }
  }, [view, focusUnlockIndex]);

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

  const submitSetupPin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");

    if (!isValidPin(setupPin) || !isValidPin(setupPinConfirm)) {
      setAuthError("PIN must be exactly 4 digits.");
      return;
    }

    if (setupPin !== setupPinConfirm) {
      setAuthError("PIN confirmation does not match.");
      return;
    }

    try {
      await window.orca.auth.setupPin(setupPin);
      setSetupPin("");
      setSetupPinConfirm("");
      await enterApp();
    } catch {
      setAuthError("Could not set PIN. Please try again.");
    }
  };

  const submitUnlockPin = useCallback(
    async (pinValue: string) => {
      if (unlockSubmitting) {
        return;
      }
      if (!isValidPin(pinValue)) {
        setAuthError("PIN must be exactly 4 digits.");
        clearUnlockDigits();
        focusUnlockIndex(0);
        return;
      }

      setUnlockSubmitting(true);
      setAuthError("");
      try {
        const result = await window.orca.auth.unlock(pinValue);
        if (!result.ok) {
          setAuthError("Incorrect PIN.");
          clearUnlockDigits();
          focusUnlockIndex(0);
          return;
        }

        clearUnlockDigits();
        await enterApp();
      } finally {
        setUnlockSubmitting(false);
      }
    },
    [unlockSubmitting, clearUnlockDigits, focusUnlockIndex, enterApp]
  );

  useEffect(() => {
    if (view !== "unlock") {
      return;
    }
    const pinValue = unlockDigits.join("");
    if (pinValue.length === 4) {
      void submitUnlockPin(pinValue);
    }
  }, [unlockDigits, view, submitUnlockPin]);

  const handleUnlockDigitChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setUnlockDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < unlockInputRefs.current.length - 1) {
      focusUnlockIndex(index + 1);
    }
  };

  const handleUnlockDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !unlockDigits[index] && index > 0) {
      setUnlockDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      focusUnlockIndex(index - 1);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      focusUnlockIndex(index - 1);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowRight" && index < unlockInputRefs.current.length - 1) {
      focusUnlockIndex(index + 1);
      event.preventDefault();
      return;
    }

    if (event.key.length === 1 && /\D/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleUnlockPaste = (event: React.ClipboardEvent<HTMLFormElement>) => {
    const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 4);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const next = EMPTY_UNLOCK_DIGITS.map((_, idx) => pasted[idx] || "");
    setUnlockDigits(next);

    if (pasted.length < 4) {
      focusUnlockIndex(pasted.length);
    }
  };

  const createNote = async () => {
    const created = await window.orca.notes.create();
    await refreshNotes(created.id);
  };

  const deleteActiveNote = async () => {
    if (!activeNote) {
      return;
    }
    await window.orca.notes.remove(activeNote.id);
    await refreshNotes();
  };

  const lockApp = async () => {
    await window.orca.auth.lock();
    setSettingsOpen(false);
    setNotes([]);
    setActiveId(null);
    setDraftTitle("");
    setDraftContent("");
    clearUnlockDigits();
    setView("unlock");
  };

  const submitPinChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinChangeError("");

    if (!isValidPin(currentPin) || !isValidPin(nextPin) || !isValidPin(nextPinConfirm)) {
      setPinChangeError("Each PIN must be exactly 4 digits.");
      return;
    }
    if (nextPin !== nextPinConfirm) {
      setPinChangeError("New PIN confirmation does not match.");
      return;
    }

    try {
      await window.orca.settings.changePin(currentPin, nextPin);
      setCurrentPin("");
      setNextPin("");
      setNextPinConfirm("");
      setSettingsOpen(false);
    } catch {
      setPinChangeError("Could not change PIN. Check current PIN and try again.");
    }
  };

  const changeTheme = async (value: string) => {
    setTheme(value);
    await window.orca.settings.setTheme(value);
  };

  const togglePinEnabled = async () => {
    const nextState = !pinEnabled;
    try {
      await window.orca.settings.setPinEnabled(nextState);
      setPinEnabled(nextState);
    } catch {
      setPinChangeError("Could not update PIN settings.");
    }
  };

  const verifyCurrentPin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinChangeError("");
    if (!isValidPin(currentPin)) {
      setPinChangeError("PIN must be exactly 4 digits.");
      return;
    }
    try {
      const result = await window.orca.settings.verifyPin(currentPin);
      if (!result.ok) {
        setPinChangeError("Incorrect current PIN.");
        return;
      }
      setPinChangeStep(2);
    } catch {
      setPinChangeError("Error verifying PIN.");
    }
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
                className="p-1  rounded-full  dark:text-neutral-400 text-neutral-700 hover:text-black dark:hover:text-white/90 transition-colors flex items-center justify-center auto-cols-auto"
                onClick={() => setSidebarOpen(prev => !prev)}
                title="Toggle Sidebar (Cmd+B)"
              >
                <PanelLeft size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center pt-2 gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
              {activeNote && (
                <button 
                  className="p-2 border border-white/30 rounded-full    text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center auto-cols-auto"
                  onClick={() => void deleteActiveNote()}
                  title="Delete Note"
                >
                  <Trash size={15} strokeWidth={2} />
                </button>
              )}
              <button 
                className="p-2  border border-white/30 rounded-full  dark:text-neutral-400 text-neutral-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center auto-cols-auto"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
              >
                <Settings size={15} strokeWidth={2} />
              </button>
              <button 
                className="p-2  border border-white/30 rounded-full  dark:text-neutral-400 text-neutral-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center auto-cols-auto"
                onClick={() => void lockApp()}
                title="Lock"
              >
                <Lock size={15} strokeWidth={2} />
              </button>
            </div>
          </header>

          <main className="flex flex-1 min-h-0 w-full">
            <Sidebar 
              notes={notes}
              activeId={activeId}
              draftTitle={draftTitle}
              draftContent={draftContent}
              setActiveId={setActiveId}
              createNote={createNote}
              isOpen={sidebarOpen}
            />

            <section className="editor flex justify-center w-full">
              <div className=" max-w-xl w-full  ">
              <div className="editor-header ">
                <textarea
                  className="note-title-input text-black dark:text-white bg-transparent outline-none dark:placeholder:text-white/50 placeholder:text-black/80 w-full text-[28px] px-1 resize-none overflow-hidden block min-h-[44px]"
                  value={draftTitle}
                  maxLength={120}
                  rows={1}
                  placeholder="Untitled"
                  onChange={(event) => {
                    setDraftTitle(event.target.value.replace(/\n/g, " "));
                    event.target.style.height = "auto";
                    event.target.style.height = `${event.target.scrollHeight}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="min-h-0  h-full">
                <MarkdownEditor value={draftContent} placeholder="Write in markdown..." onChange={setDraftContent} />
              </div>
              </div>
            </section>
          </main>
        </div>
      ) : (
        <div className="auth-layer">
          {view === "loading" ? (
            <div className="glass-card max-w-sm">
              <h1 className="text-2xl font-semibold">Orca Notes</h1>
              <p className="mt-2 text-sm opacity-80">Loading...</p>
            </div>
          ) : null}

          {view === "setup" ? (
            <div className="glass-card max-w-md">
              <h1 className="text-2xl font-semibold">Create App PIN</h1>
              <p className="mt-2 text-sm opacity-80">Set a 4-digit PIN to open your notes every time the app starts.</p>
              <form className="mt-5 grid gap-3" onSubmit={submitSetupPin}>
                <label className="grid gap-1 text-sm">
                  New PIN
                  <input
                    ref={setupPinRef}
                    className="glass-input h-11 rounded-xl px-3"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={setupPin}
                    onChange={(event) => setSetupPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Confirm PIN
                  <input
                    className="glass-input h-11 rounded-xl px-3"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={setupPinConfirm}
                    onChange={(event) => setSetupPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </label>
                <button className="primary-button mt-1 h-11" type="submit">
                  Create PIN
                </button>
                <p className="min-h-5 text-sm text-red-500 dark:text-red-400">{authError}</p>
              </form>
            </div>
          ) : null}

          {view === "unlock" ? (
            <div className=" max-w-md">

              <form className="mt-5 grid gap-3" onPaste={handleUnlockPaste} onSubmit={(event) => event.preventDefault()}>
                <label className="text-sm">PIN</label>
                <div className="grid  grid-cols-4 gap-1">
                  {unlockDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        unlockInputRefs.current[index] = el;
                      }}
                      className="otp-input "
                      type="password"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleUnlockDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleUnlockDigitKeyDown(index, event)}
                    />
                  ))}
                </div>
                <p className="min-h-5 text-sm text-red-500 dark:text-red-400">{authError}</p>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {settingsOpen ? (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-3xl flex overflow-hidden p-0 h-[500px]">
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-white/10 p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold mb-2 px-2 text-neutral-500 dark:text-white/50 uppercase tracking-wider">Settings</h2>
              {["profile", "pin", "themes", "api-key"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSettingsCategory(cat);
                    setPinChangeError("");
                    setPinChangeStep(1);
                    setCurrentPin("");
                    setNextPin("");
                    setNextPinConfirm("");
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

            {/* Content Area */}
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

              {settingsCategory === "pin" && (
                <div>
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                  <p className="mt-2 text-sm opacity-80 mb-6">Manage your application lock and PIN.</p>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-100 dark:bg-white/5 mb-8">
                    <div>
                      <h3 className="font-medium">Require PIN on Startup</h3>
                      <p className="text-xs text-neutral-500 dark:text-white/60 mt-1">If enabled, you must enter your PIN to open your notes.</p>
                    </div>
                    <button 
                      onClick={() => void togglePinEnabled()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pinEnabled ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-white/20'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pinEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 dark:border-white/10 pl-1 pr-1">
                    <h3 className="font-medium mb-4">Change PIN</h3>
                    
                    {pinChangeStep === 1 ? (
                      <form className="max-w-xs grid gap-3" onSubmit={verifyCurrentPin}>
                        <label className="grid gap-1 text-sm">
                          Current PIN
                          <input
                            className="glass-input h-11 rounded-xl px-3"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={currentPin}
                            onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                          />
                        </label>
                        <button className="primary-button h-11 mt-2" type="submit">
                          Continue
                        </button>
                        <p className="min-h-5 text-sm text-red-500 dark:text-red-400 mt-1">{pinChangeError}</p>
                      </form>
                    ) : (
                      <form className="max-w-xs grid gap-3" onSubmit={submitPinChange}>
                        <label className="grid gap-1 text-sm">
                          New PIN
                          <input
                            className="glass-input h-11 rounded-xl px-3"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={nextPin}
                            onChange={(event) => setNextPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          Confirm New PIN
                          <input
                            className="glass-input h-11 rounded-xl px-3"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={nextPinConfirm}
                            onChange={(event) => setNextPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))}
                          />
                        </label>
                        <button className="primary-button h-11 mt-2" type="submit">
                          Update PIN
                        </button>
                        <p className="min-h-5 text-sm text-red-500 dark:text-red-400 mt-1">{pinChangeError}</p>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
