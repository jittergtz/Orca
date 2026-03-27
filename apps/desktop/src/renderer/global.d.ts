import 'react';

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_APP_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    readonly NEXT_PUBLIC_APP_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  }

  interface OrcaAPI {
    auth: {
      getStatus: () => Promise<{ hasPin: boolean; pinEnabled: boolean; unlocked: boolean }>;
      setupPin: (pin: string) => Promise<{ ok: boolean }>;
      unlock: (pin: string) => Promise<{ ok: boolean; error?: string }>;
      lock: () => Promise<{ ok: boolean }>;
    };
    notes: {
      list: () => Promise<Note[]>;
      create: () => Promise<Note>;
      update: (payload: { id: string; title?: string; content?: string }) => Promise<Note>;
      remove: (id: string) => Promise<{ ok: boolean }>;
    };
    settings: {
      getTheme: () => Promise<string>;
      setTheme: (mode: string) => Promise<{ ok: boolean }>;
      getEffectiveTheme: () => Promise<string>;
      changePin: (currentPin: string, nextPin: string) => Promise<{ ok: boolean }>;
      setPinEnabled: (enabled: boolean) => Promise<{ ok: boolean }>;
      verifyPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
    };
    onSystemThemeChanged: (callback: (theme: string) => void) => () => void;
  }

  interface Window {
    orca: OrcaAPI;
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

export {};
