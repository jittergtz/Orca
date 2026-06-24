import { create } from "zustand";

export type BootView = "loading" | "auth" | "paywall" | "app" | "error";
export type MainView = "home" | "overview" | "article" | "settings";
export type PendingAction = "pricing" | "signOut";

type PendingState = Record<PendingAction, boolean>;

interface AppStore {
  bootView: BootView;
  bootError: string | null;
  mainView: MainView;
  sidebarOpen: boolean;
  onboardingOpen: boolean;
  theme: string;
  systemTheme: string;
  sessionEmail: string | null;
  subscriptionStatus: string | null;
  pending: PendingState;
  setBootView: (view: BootView) => void;
  setBootError: (error: string) => void;
  setMainView: (view: MainView) => void;
  setSidebarOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  setOnboardingOpen: (open: boolean) => void;
  setTheme: (theme: string) => void;
  setSystemTheme: (theme: string) => void;
  setSession: (payload: { email: string | null; subscriptionStatus?: string | null }) => void;
  clearSession: () => void;
  setPending: (action: PendingAction, loading: boolean) => void;
}

const defaultPending: PendingState = {
  pricing: false,
  signOut: false,
};

export const useAppStore = create<AppStore>((set) => ({
  bootView: "loading",
  bootError: null,
  mainView: "home",
  sidebarOpen: true,
  onboardingOpen: false,
  theme: "system",
  systemTheme: "light",
  sessionEmail: null,
  subscriptionStatus: null,
  pending: defaultPending,
  setBootView: (view) => set({ bootView: view, bootError: null }),
  setBootError: (error) => set({ bootView: "error", bootError: error }),
  setMainView: (view) => set({ mainView: view }),
  setSidebarOpen: (open) =>
    set((state) => ({
      sidebarOpen: typeof open === "function" ? open(state.sidebarOpen) : open,
    })),
  setOnboardingOpen: (open) => set({ onboardingOpen: open }),
  setTheme: (theme) => set({ theme }),
  setSystemTheme: (theme) => set({ systemTheme: theme }),
  setSession: ({ email, subscriptionStatus }) =>
    set((state) => ({
      sessionEmail: email,
      subscriptionStatus:
        subscriptionStatus === undefined ? state.subscriptionStatus : subscriptionStatus,
    })),
  clearSession: () =>
    set({
      sessionEmail: null,
      subscriptionStatus: null,
      mainView: "home",
      onboardingOpen: false,
      pending: { ...defaultPending },
    }),
  setPending: (action, loading) =>
    set((state) => ({
      pending: {
        ...state.pending,
        [action]: loading,
      },
    })),
}));
