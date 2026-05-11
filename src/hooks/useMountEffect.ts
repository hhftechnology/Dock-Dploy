/* eslint-disable no-restricted-imports */
import { useEffect, type EffectCallback } from "react";

/**
 * Executes a side effect exactly once when the component mounts.
 *
 * IMPORTANT: In this codebase direct use of `useEffect` is banned because it is
 * the root cause of most infinite loops, race conditions, and stale-state bugs.
 * Use this escape hatch ONLY when synchronizing with an external system.
 *
 * Good use cases:
 *   - DOM integration (focus, scroll, ResizeObserver wiring)
 *   - Third-party widget lifecycle (Maps, video players, codemirror init)
 *   - One-time browser-API subscriptions on mount
 *
 * Bad use cases — use these alternatives instead:
 *   - Data fetching         → React Query, SWR, or router loaders
 *   - Deriving state        → calculate inline or with useMemo
 *   - Event handling        → handle in onClick / onSubmit
 *   - Resetting on prop     → use the React `key` prop to remount
 *
 * @param effect Imperative function executed on mount. May return a cleanup.
 */
export function useMountEffect(effect: EffectCallback): void {
  // eslint-disable-next-line no-restricted-syntax, react-hooks/exhaustive-deps
  useEffect(effect, []);
}
