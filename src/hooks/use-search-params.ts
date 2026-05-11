import { useCallback, useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", cb);
  // Also listen for pushState/replaceState dispatches when our own setter fires.
  window.addEventListener("dockdploy:searchparams", cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener("dockdploy:searchparams", cb);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

function getServerSnapshot(): string {
  return "";
}

export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const searchParams = new URLSearchParams(search);

  const setSearchParams = useCallback(
    (newParams: Record<string, string> | URLSearchParams) => {
      const nextParams =
        newParams instanceof URLSearchParams
          ? new URLSearchParams(newParams)
          : new URLSearchParams(newParams);
      const newUrl = `${window.location.pathname}?${nextParams.toString()}`;
      window.history.pushState({}, "", newUrl);
      // Notify subscribers — pushState doesn't fire popstate.
      window.dispatchEvent(new Event("dockdploy:searchparams"));
    },
    [],
  );

  return [searchParams, setSearchParams] as const;
}
