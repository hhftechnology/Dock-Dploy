import { createContext, useCallback, useContext, useState } from "react";
import { useMountEffect } from "../hooks/useMountEffect";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(storageKey) as Theme) || fallback;
  } catch {
    return fallback;
  }
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolveTheme(theme));
  // Also keep body in sync for editorial `body.dark` selectors in styles.css
  document.body.classList.remove("light", "dark");
  document.body.classList.add(resolveTheme(theme));
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    readStoredTheme(storageKey, defaultTheme),
  );

  // Apply theme on mount once — covers initial paint synchronization.
  useMountEffect(() => {
    applyThemeClass(theme);
  });

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // localStorage may be disabled (private mode). Best-effort write.
      }
      applyThemeClass(next);
      setThemeState(next);
    },
    [storageKey],
  );

  const value = { theme, setTheme };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
