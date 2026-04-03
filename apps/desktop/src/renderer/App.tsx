import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings, ArrowUp, Cpu, PanelLeft, LogOut, ExternalLink } from "lucide-react";
import Sidebar from "./components/Sidebar";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import ArticleView from "./components/ArticleView";
import { getDesktopSupabaseClient, refreshSessionOnFocus } from "./lib/supabase";

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

function hasActivePlan(status: string | null) {
  return status === "active" || status === "trialing";
}

function getPricingUrl(baseUrl: string, email: string | null) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  if (!email) {
    return `${normalizedBase}/pricing`;
  }
  return `${normalizedBase}/pricing?email=${encodeURIComponent(email)}`;
}

export default function App() {
  const appBaseUrl = useMemo(
    () => import.meta.env.VITE_APP_URL || import.meta.env.NEXT_PUBLIC_APP_URL || "https://newsflow.app",
    []
  );
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
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

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

  const syncAuthState = useCallback(async () => {
    const supabase = getDesktopSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      setSessionEmail(null);
      setSubscriptionStatus(null);
      setView("auth");
      return;
    }

    setSessionEmail(session.user.email ?? null);
    const { data: sub, error: subError } = await supabase
      .from("billing_subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle();
      
    if (subError) {
      throw subError;
    }
    
    const nextSubscriptionStatus =
      (sub as { status?: string } | null)?.status ?? "canceled";
    setSubscriptionStatus(nextSubscriptionStatus);

    if (hasActivePlan(nextSubscriptionStatus)) {
      await enterApp();
      return;
    }

    setView("paywall");
  }, [enterApp]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeOAuthCallback: (() => void) | null = null;

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

        await syncAuthState();
        const supabase = getDesktopSupabaseClient();

        // Re-sync auth state only on meaningful auth events, not all changes.
        const authSubscription = supabase.auth.onAuthStateChange((event) => {
          if (
            event === "SIGNED_OUT" ||
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            void syncAuthState().catch((error: any) => {
              setView(`error: ${error.message || String(error)}`);
            });
          }
        });
        unsubscribeAuth = () => {
          authSubscription.data.subscription.unsubscribe();
        };

        // ── Session keep-alive ──────────────────────────────────────────────
        // When the Electron window is backgrounded or the machine sleeps, the
        // Supabase JS auto-refresh timer is throttled and never fires. We
        // proactively refresh the access_token every time the window gets
        // focus so the session stays alive indefinitely, exactly like
        // Linear / Cursor / VS Code extensions do.
        const handleWindowFocus = () => {
          void refreshSessionOnFocus();
        };
        window.addEventListener("focus", handleWindowFocus);
        const originalUnsubscribeAuth = unsubscribeAuth;
        unsubscribeAuth = () => {
          originalUnsubscribeAuth();
          window.removeEventListener("focus", handleWindowFocus);
        };
        // Refresh immediately in case the app was opened after a long idle.
        void refreshSessionOnFocus();
        console.log("[ORCA-RENDERER] Registering onOAuthCallback listener");
        unsubscribeOAuthCallback = window.orca.onOAuthCallback((url) => {
          console.log("[ORCA-RENDERER] ★ onOAuthCallback fired! URL:", url);
          void (async () => {
            try {
              const callbackUrl = new URL(url);
              const queryCode = callbackUrl.searchParams.get("code");
              const hashPayload = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
              const hashAccessToken = hashPayload.get("access_token");
              const hashRefreshToken = hashPayload.get("refresh_token");
              console.log("[ORCA-RENDERER] Callback parsed → code:", queryCode ? "YES" : "NO", "accessToken:", hashAccessToken ? "YES" : "NO");
              const supabase = getDesktopSupabaseClient();

              if (queryCode) {
                console.log("[ORCA-RENDERER] Calling exchangeCodeForSession...");
                const { error } = await supabase.auth.exchangeCodeForSession(queryCode);
                if (error) {
                  console.error("[ORCA-RENDERER] exchangeCodeForSession error:", error.message);
                  throw error;
                }
                console.log("[ORCA-RENDERER] exchangeCodeForSession SUCCESS");
              } else if (hashAccessToken && hashRefreshToken) {
                console.log("[ORCA-RENDERER] Calling setSession (implicit flow)...");
                const { error } = await supabase.auth.setSession({
                  access_token: hashAccessToken,
                  refresh_token: hashRefreshToken,
                });
                if (error) {
                  console.error("[ORCA-RENDERER] setSession error:", error.message);
                  throw error;
                }
                console.log("[ORCA-RENDERER] setSession SUCCESS");
              } else {
                throw new Error("Invalid OAuth callback payload — no code or tokens found.");
              }

              setAuthNotice("Google sign-in successful.");
              setAuthError(null);
              await syncAuthState();
            } catch (error: any) {
              console.error("[ORCA-RENDERER] OAuth callback handler error:", error);
              setAuthError(error?.message || "Could not complete Google sign-in.");
            } finally {
              setGoogleLoading(false);
            }
          })();
        });
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
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeOAuthCallback) {
        unsubscribeOAuthCallback();
      }
    };
  }, [syncAuthState]);

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

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword) {
      setAuthError("Please enter email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const supabase = getDesktopSupabaseClient();
      const result =
        authMode === "signin"
          ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
          : await supabase.auth.signUp({ email: authEmail, password: authPassword });

      if (result.error) {
        setAuthError(result.error.message);
        setAuthLoading(false);
        return;
      }

      if (authMode === "signup" && !result.data.session) {
        setAuthError("Account created. Please verify your email, then sign in.");
        setAuthLoading(false);
        return;
      }

      await syncAuthState();
    } catch (error: any) {
      setAuthError(error?.message || "Could not authenticate.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const supabase = getDesktopSupabaseClient();
      // In dev (Vite), redirect to the local HTTP server that forwards the
      // callback to the renderer via IPC — avoids custom-protocol issues.
      // In production (packaged), use the deep link (registered in Info.plist).
      const redirectTo = import.meta.env.DEV
        ? "http://localhost:54321/auth/callback"
        : "orcadesktop://auth/callback/";
      console.log("[ORCA-RENDERER] handleGoogleAuth → redirectTo:", redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      console.log("[ORCA-RENDERER] signInWithOAuth result → url:", data?.url, "error:", error?.message);
      if (error) {
        setAuthError(error.message);
        setGoogleLoading(false);
        return;
      }
      if (!data?.url) {
        setAuthError("Could not create Google auth link.");
        setGoogleLoading(false);
        return;
      }
      console.log("[ORCA-RENDERER] Opening external browser with OAuth URL");
      await window.orca.settings.openExternal(data.url);
      setAuthNotice("Browser opened. Complete Google sign-in there, then return to Orca.");
      setGoogleLoading(false);
    } catch (error: any) {
      console.error("[ORCA-RENDERER] handleGoogleAuth error:", error);
      setAuthError(error?.message || "Could not continue with Google.");
      setGoogleLoading(false);
    }
  };

  const handleOpenPricing = async () => {
    setPricingLoading(true);
    try {
      await window.orca.settings.openExternal(getPricingUrl(appBaseUrl, sessionEmail));
    } finally {
      setPricingLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      const supabase = getDesktopSupabaseClient();
      await supabase.auth.signOut();
      setSessionEmail(null);
      setSubscriptionStatus(null);
      setView("auth");
    } finally {
      setSignOutLoading(false);
    }
  };

  const appReady = view === "app";

  return (
    <div className="h-screen  w-screen text-neutral-900 dark:text-neutral-100">
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
                onClick={() => void handleSignOut()}
                disabled={signOutLoading}
                className="px-3 py-1 rounded-full border border-white/20 text-xs dark:text-neutral-300 text-neutral-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <LogOut size={12} />
                {signOutLoading ? "Signing out..." : "Sign Out"}
              </button>
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
                 onComplete={async (data) => {
                   console.log("Onboarding complete", data);
                   try {
                     const supabase = getDesktopSupabaseClient();
                     const { data: sessionData } = await supabase.auth.getSession();
                     const userId = sessionData?.session?.user?.id;
                     if (userId) {
                       const { error } = await (supabase as any).from('topics').insert({
                         user_id: userId,
                         name: data.prompt || "Custom Topic",
                         category: data.category || "other",
                         frequency: data.frequency,
                         config: data.chatHistory,
                       });
                       if (error) {
                         console.error("Failed to insert topic", error);
                       } else {
                         console.log("Topic successfully saved to Supabase!");
                       }
                     }
                   } catch (e) {
                     console.error("Error saving topic", e);
                   }
                   setOnboardingOpen(false);
                 }}
                 onCancel={() => setOnboardingOpen(false)}
               />
            </div>
          )}
          <main className="flex flex-1 min-h-0 w-full relative">
            <ArticleView />
          </main>
        </div>
      </div>
    ) : (
        <div className="auth-layer ">
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
          ) : view === "auth" ? (
            <div className="max-w-md  ">
              <div className="mb-5">
                <h1 className="font-instrument-serif italic text-5xl leading-[52px] bg-clip-text text-transparent bg-gradient-to-br from-stone-900 to-stone-500 dark:from-white dark:to-stone-300">
                  Orca
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
                  Sign in to continue your research flow.
                </p>
              </div>

              <button
                onClick={() => void handleGoogleAuth()}
                disabled={authLoading || googleLoading}
                className="w-full rounded-full border border-stone-300/70 dark:border-white/15 bg-white/85 dark:bg-black/20 px-4 py-2.5 text-sm font-medium text-stone-800 dark:text-stone-100 hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.23 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.846 1.154 7.961 3.039l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.846 1.154 7.961 3.039l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.681 0-14.417 4.337-17.694 10.691z" />
                  <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.137 35.091 26.715 36 24 36c-5.21 0-9.62-3.318-11.283-7.946l-6.522 5.025C9.436 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.056 12.056 0 0 1-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                {googleLoading ? "Connecting Google..." : "Continue with Google"}
              </button>

              <div className="my-4 flex items-center gap-3 mb-9">
                <div className="h-px bg-stone-300/80 dark:bg-white/15 flex-1" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">or</span>
                <div className="h-px bg-stone-300/80 dark:bg-white/15 flex-1" />
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 rounded-full px-3 py-2 text-xs transition-colors ${authMode === "signin" ? "bg-stone-900 text-white dark:bg-white dark:text-black" : "bg-stone-200/80 text-stone-700 dark:bg-white/10 dark:text-stone-200"}`}
                  onClick={() => setAuthMode("signin")}
                  disabled={authLoading || googleLoading}
                >
                  Sign in
                </button>
                <button
                  className={`flex-1 rounded-full px-3 py-2 text-xs transition-colors ${authMode === "signup" ? "bg-stone-900 text-white dark:bg-white dark:text-black" : "bg-stone-200/80 text-stone-700 dark:bg-white/10 dark:text-stone-200"}`}
                  onClick={() => setAuthMode("signup")}
                  disabled={authLoading || googleLoading}
                >
                  Create account
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="Email"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  disabled={authLoading || googleLoading}
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Password"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  disabled={authLoading || googleLoading}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleAuthSubmit();
                    }
                  }}
                />
                {authError ? <p className="text-xs text-red-500">{authError}</p> : null}
                {authNotice ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{authNotice}</p> : null}
                <button
                  onClick={() => void handleAuthSubmit()}
                  disabled={authLoading || googleLoading}
                  className="w-full rounded-full bg-stone-900 px-3 py-2.5 text-sm text-white dark:bg-white dark:text-black disabled:opacity-50"
                >
                  {authLoading ? "Please wait..." : authMode === "signin" ? "Sign in" : "Create account"}
                </button>
              </div>
            </div>
          ) : view === "paywall" ? (
            <div className="  max-w-sm">
              <h1 className="text-2xl font-serif italic mb-1">Plan inactive</h1>
              <p className="text-sm opacity-80 mb-4">
                Your account is signed in as {sessionEmail ?? "unknown user"}, but your plan is not active.
              </p>
              <p className="text-xs opacity-70 mb-5">Status: {subscriptionStatus ?? "unknown"}</p>
              <div className="flex flex-col gap-2"> <button
                  onClick={() => void handleOpenPricing()}
                  disabled={pricingLoading}
                  className="w-full rounded-full bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-black disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  {pricingLoading ? "Opening..." : "Open pricing"}
                </button>
                <button
                  onClick={() => void handleSignOut()}
                  disabled={signOutLoading}
                  className="w-full rounded-full border border-white/25 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {signOutLoading ? "Signing out..." : "Sign out"}
                </button>
              </div>
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
