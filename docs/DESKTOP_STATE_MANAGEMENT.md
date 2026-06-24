# Desktop State Management

This document describes the renderer state foundation used by the Desktop app.
The goal is to keep Orca fast, predictable, and easy to extend as more features
share session, feed, navigation, and loading state.

## Store Boundaries

Desktop uses Zustand for shared state. Keep state in the smallest store that
matches its ownership.

| Store | File | Owns |
| --- | --- | --- |
| App shell | `apps/desktop/src/renderer/stores/appStore.ts` | boot route, main view, sidebar, onboarding modal, theme, session email, billing status, shared pending flags |
| Feed | `apps/desktop/src/renderer/stores/feedStore.ts` | topics, articles, active topic/article, read state, feed loading, realtime state, refresh metadata |

Short-lived form fields should stay local to the component unless another
surface needs them. For example, the auth email/password fields remain local in
`App.tsx`; the signed-in email is shared in `appStore`.

## Reading State

Components should subscribe to the exact fields they render. Use selectors and
`useShallow` when reading multiple fields:

```tsx
const { topics, status } = useFeedStore(
  useShallow((state) => ({
    topics: state.topics,
    status: state.status,
  }))
);
```

Avoid `useFeedStore()` without a selector in large components. That subscribes
the component to every feed change, including unrelated updates such as read
state or realtime status.

For one-off actions inside event handlers, use the imperative store API:

```ts
const feedStore = useFeedStore.getState();
await feedStore.setActiveTopic(topicId);
feedStore.setActiveArticleIndex(articleIndex);
```

This keeps event work simple without forcing the parent component to subscribe
to action-only fields.

## Async State

The feed store guards async work so stale requests cannot overwrite newer UI:

- `bootstrapRequestId` protects initial user bootstrap.
- `topicsRefreshRequestId` protects whole-feed refreshes.
- `topicRefreshRequestIds` protects per-topic article refreshes.
- Realtime topic/article events are debounced before refreshes run.
- `teardownRealtime()` clears timers, increments request guards, unsubscribes,
  and resets user-specific data.

When adding a new async action:

1. Set a visible pending/loading field before the first `await`.
2. Capture a request id if the action can overlap with another request.
3. Ignore the result if a newer request has started.
4. Preserve usable existing data during background refreshes.
5. Store user-facing errors in the owning store.
6. Reset pending state in `finally`.

## Optimistic Updates

Read state uses an optimistic update:

1. Mark the article as read locally.
2. Track the article id in `pendingReadArticleIds`.
3. Persist to Supabase.
4. Roll back the local read flag if persistence fails.

Use this pattern for low-risk interactions where immediate feedback matters.
For destructive actions, prefer confirmation and server success before removing
visible data.

## Loading Skeletons

Shared skeletons live in
`apps/desktop/src/renderer/components/ui/skeleton.tsx`.

Current primitives:

- `AppBootSkeleton`
- `SidebarSkeleton`
- `FeedGridSkeleton`
- `ArticleSkeleton`
- `Skeleton`

The shimmer styling is centralized in `apps/desktop/src/renderer/index.css`
under `.orca-skeleton`, including reduced-motion support. New skeletons should
reuse `Skeleton` and mirror the final layout closely enough that loading does
not cause major layout shifts.

Use skeletons for initial load or empty pending surfaces:

```tsx
if (status === "idle" || status === "loading") {
  return <FeedGridSkeleton mode={mode} />;
}
```

For background refreshes, keep the current content visible and show subtle copy
or inline pending affordances. Do not replace loaded content with skeletons
during a background refresh unless the underlying entity has disappeared.

## Adding A New Feature Store

Use a new store when the feature has shared state, background loading, realtime
updates, or multiple surfaces reading the same data.

Recommended shape:

```ts
type FeatureStatus = "idle" | "loading" | "ready" | "error";

interface FeatureStore {
  status: FeatureStatus;
  items: Item[];
  error: string | null;
  lastSyncedAt: number | null;
  bootstrap: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}
```

Keep derived data close to the component with `useMemo` unless many components
need the exact same derived value. If many surfaces need it, add a small selector
function rather than storing duplicated derived state.

## Practical Rules

- App-wide shell/session state belongs in `appStore`.
- Feature server data belongs in a feature store such as `feedStore`.
- Component-only UI state stays local.
- Use selector subscriptions for render performance.
- Prefer optimistic updates for reversible, low-risk actions.
- Keep current data visible during refreshes.
- Use skeletons for first load, not every network request.
- Always reset user-specific stores on sign-out.
