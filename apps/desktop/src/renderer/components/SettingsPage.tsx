import { useState } from "react";
import { KeyRound, LogOut, Monitor, UserRound } from "lucide-react";

type SettingsCategory = "profile" | "themes" | "api-key";

type SettingsPageProps = {
  theme: string;
  sessionEmail: string | null;
  subscriptionStatus: string | null;
  signOutLoading: boolean;
  onThemeChange: (value: string) => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
};

const sections: Array<{
  id: SettingsCategory;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    id: "profile",
    label: "Profile",
    description: "Account, plan, and session",
    icon: UserRound,
  },
  {
    id: "themes",
    label: "Appearance",
    description: "Theme and display mode",
    icon: Monitor,
  },
  {
    id: "api-key",
    label: "API Keys",
    description: "Provider configuration",
    icon: KeyRound,
  },
];

function formatStatus(status: string | null) {
  if (!status) {
    return "Unknown";
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export default function SettingsPage({
  theme,
  sessionEmail,
  subscriptionStatus,
  signOutLoading,
  onThemeChange,
  onSignOut,
}: SettingsPageProps) {
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("profile");

  return (
    <section className="flex h-full w-full overflow-hidden">
      <div className="w-[256px] flex-shrink-0 border-r border-black/[0.06] bg-white/25 px-6 pb-6 pt-8 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <h1 className="text-[28px] font-medium leading-none text-black dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
          Manage how Orca works for your account.
        </p>

        <nav className="mt-8 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === settingsCategory;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSettingsCategory(section.id)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-black/[0.06] text-black dark:bg-white/[0.10] dark:text-white"
                    : "text-neutral-600 hover:bg-black/[0.04] hover:text-black dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                <Icon size={16} strokeWidth={2.1} className="mt-0.5 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{section.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 opacity-65">
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto px-8 pb-12 pt-8">
        {settingsCategory === "profile" ? (
          <div className="max-w-3xl">
            <div className="border-b border-black/[0.08] pb-5 dark:border-white/10">
              <h2 className="text-[24px] font-medium text-black dark:text-white">
                Profile
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                Review your account and manage this desktop session.
              </p>
            </div>

            <div className="mt-7 space-y-5">
              <div className="grid gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                  Signed in as
                </span>
                <span className="text-[15px] text-neutral-900 dark:text-neutral-100">
                  {sessionEmail ?? "Unknown user"}
                </span>
              </div>

              <div className="grid gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                  Plan status
                </span>
                <span className="text-[15px] text-neutral-900 dark:text-neutral-100">
                  {formatStatus(subscriptionStatus)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void onSignOut()}
                disabled={signOutLoading}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-[13px] font-medium text-neutral-800 transition-colors hover:bg-black/[0.04] disabled:opacity-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/[0.08]"
              >
                <LogOut size={14} strokeWidth={2.2} />
                {signOutLoading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        ) : null}

        {settingsCategory === "themes" ? (
          <div className="max-w-3xl">
            <div className="border-b border-black/[0.08] pb-5 dark:border-white/10">
              <h2 className="text-[24px] font-medium text-black dark:text-white">
                Appearance
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                Choose the theme Orca uses throughout the app.
              </p>
            </div>

            <div className="mt-7 flex items-center justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/10">
              <div>
                <div className="text-[15px] font-medium text-neutral-950 dark:text-white">
                  Theme mode
                </div>
                <div className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                  Follow your system or pick a fixed light or dark theme.
                </div>
              </div>

              <select
                className="glass-input h-10 w-36 rounded-xl px-3 text-sm outline-none"
                value={theme}
                onChange={(event) => void onThemeChange(event.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        ) : null}

        {settingsCategory === "api-key" ? (
          <div className="max-w-3xl">
            <div className="border-b border-black/[0.08] pb-5 dark:border-white/10">
              <h2 className="text-[24px] font-medium text-black dark:text-white">
                API Keys
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                API configuration will live here when provider keys are editable.
              </p>
            </div>

            <div className="mt-7 rounded-lg border border-dashed border-black/15 px-4 py-5 text-[13px] text-neutral-500 dark:border-white/15 dark:text-neutral-400">
              No API key settings are available yet.
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
