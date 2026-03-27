import { create } from "zustand";
import { getCurrentUserProfile, type User } from "@newsflow/db";
import { getDesktopSupabaseClient } from "../lib/supabase";

type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

interface SessionStore {
  status: SessionStatus;
  userId: string | null;
  email: string | null;
  profile: User | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>(set => ({
  status: "idle",
  userId: null,
  email: null,
  profile: null,
  error: null,
  bootstrap: async () => {
    set({ status: "loading", error: null });

    try {
      const client = getDesktopSupabaseClient();
      const {
        data: { session },
        error,
      } = await client.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session) {
        set({
          status: "unauthenticated",
          userId: null,
          email: null,
          profile: null,
        });
        return;
      }

      const profile = await getCurrentUserProfile(client, session.user.id);
      set({
        status: "authenticated",
        userId: session.user.id,
        email: session.user.email ?? null,
        profile,
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Could not bootstrap session",
      });
    }
  },
  clear: () =>
    set({
      status: "idle",
      userId: null,
      email: null,
      profile: null,
      error: null,
    }),
}));
