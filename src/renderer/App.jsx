import { Lock, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_UNLOCK_DIGITS = ["", "", "", ""];

function isValidPin(value) {
  return /^\d{4}$/.test(value);
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function formatUpdatedAt(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function App() {
  const [view, setView] = useState("loading");
  const [theme, setTheme] = useState("system");
  const [systemTheme, setSystemTheme] = useState("light");
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

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

  const unlockInputRefs = useRef([]);
  const setupPinRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const notesRef = useRef([]);
  const activeIdRef = useRef(null);
  const lastLoadedNoteIdRef = useRef(null);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const activeNote = useMemo(() => notes.find((note) => note.id === activeId) || null, [notes, activeId]);

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

  const focusUnlockIndex = useCallback((index) => {
    const el = unlockInputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const refreshNotes = useCallback(async (selectId = null) => {
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
    async (selectId = null) => {
      await refreshNotes(selectId);
      setAuthError("");
      setView("app");
    },
    [refreshNotes]
  );

  useEffect(() => {
    let unsubscribe = null;

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

        if (authStatus.unlocked) {
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

  const submitSetupPin = async (event) => {
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
    async (pinValue) => {
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

  const handleUnlockDigitChange = (index, rawValue) => {
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

  const handleUnlockDigitKeyDown = (index, event) => {
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

  const handleUnlockPaste = (event) => {
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

  const submitPinChange = async (event) => {
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

  const changeTheme = async (value) => {
    setTheme(value);
    await window.orca.settings.setTheme(value);
  };

  const appReady = view === "app";

  return (
    <div className="h-screen w-screen p-3 text-neutral-900 dark:text-neutral-100">
      {appReady ? (
        <div className="">
          <header className="flex justify-end p-2" style={{ WebkitAppRegion: "drag" }}>
          
            <div className="flex items-center gap-4" style={{ WebkitAppRegion: "no-drag" }}>
            
              <button className="text-neutral-400 hover:text-neutral-200" type="button" onClick={() => setSettingsOpen(true)}>
                <Settings size={14} />
              </button>
              <button className="text-neutral-400 hover:text-neutral-200" type="button" onClick={() => void lockApp()}>
              <Lock size={14}/>
              </button>
            </div>
          </header>

          <main className="grid min-h-0 grid-cols-1 md:grid-cols-[220px_1fr]">
            <aside className="sidebar">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Notes</h2>
                <button type="button" className="primary-button   text-sm" onClick={() => void createNote()}>
                  New
                </button>
              </div>

              <ul className="scroll-list  h-screen flex flex-col">
                {notes.map((note) => {
                  const isActive = note.id === activeId;
                  const visibleTitle = isActive ? draftTitle : note.title;
                  const visibleContent = isActive ? draftContent : note.content;
                  return (
                    <li key={note.id}>
                      <button
                        type="button"
                        className={`note-item ${isActive ? "note-item-active" : ""}`}
                        onClick={() => setActiveId(note.id)}
                      >
                        <h3 className="truncate text-sm font-semibold">{(visibleTitle || "Untitled").trim() || "Untitled"}</h3>
                        <p className=" truncate text-xs opacity-90">
                          {visibleContent?.replace(/\n/g, " ").trim() || "Empty note"}
                        </p>
                        <time className="mt-1 block text-[10px] opacity-60">
                          {formatUpdatedAt(note.updatedAt || note.createdAt)}
                        </time>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className="editor">
              <div className="editor-header">
                <input
                  className="bg-transparent outline-none placeholder:text-white/50 h-11 w-full text-xl px-1  "
                  value={draftTitle}
                  maxLength={120}
                  placeholder="Untitled"
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
                <button className="ghost-button text-red-500 dark:text-red-400" type="button" onClick={() => void deleteActiveNote()}>
                  Delete
                </button>
              </div>
              <div className="min-h-0">
                <textarea
                  className="editor-textarea"
                  value={draftContent}
                  placeholder="Write in markdown..."
                  onChange={(event) => setDraftContent(event.target.value)}
                />
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
        <div className="modal-overlay">
          <div className="glass-card max-w-md">
            <h2 className="text-xl font-semibold">Security Settings</h2>
            <p className="mt-2 text-sm opacity-80">Change your 4-digit app PIN.</p>
            <form className="mt-5 grid gap-3" onSubmit={submitPinChange}>
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
              <p className="min-h-5 text-sm text-red-500 dark:text-red-400">{pinChangeError}</p>
              <div className="flex justify-end gap-2">
                <button className="ghost-button" type="button" onClick={() => setSettingsOpen(false)}>
                  Close
                </button>
                <button className="primary-button" type="submit">
                  Update PIN
                </button>
              </div>
            </form>
            <label className="flex items-center gap-2 text-xs">
                Theme
                <select
                  className="glass-input h-8 w-28 rounded-lg px-2 text-sm"
                  value={theme}
                  onChange={(event) => {
                    void changeTheme(event.target.value);
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
