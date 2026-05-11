import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { BrandMark } from "./BrandMark";
import { GithubIcon, DiscordIcon } from "./icons/BrandIcons";

interface HeaderProps {
  onOpenMarket?: () => void;
}

const NAV_ITEMS = [
  { label: "Compose", id: "compose", to: "/docker/compose-builder" },
  { label: "Config", id: "config", to: "/config-builder" },
  { label: "Scheduler", id: "scheduler", to: "/scheduler-builder" },
  { label: "Blueprint", id: "blueprint", to: "/blueprint-builder" },
  // "templates" handled inline — opens the marketplace modal
] as const;

export function Header({ onOpenMarket }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const path = routerState.location.pathname;

  const isActive = (to: string) => path.startsWith(to);
  const onTemplatesView = path === "/templates";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="brand" onClick={() => navigate({ to: "/" })} aria-label="Home">
          <BrandMark size={28} />
          <span className="brand-text">
            <span className="brand-name">
              Dock<span className="brand-dot">·</span>Dploy
            </span>
            <span className="brand-sub">by HHF Technology</span>
          </span>
        </button>

        <nav className="top-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={"nav-link" + (isActive(item.to) ? " active" : "")}
              onClick={() => navigate({ to: item.to })}
            >
              {item.label}
            </button>
          ))}
          <button
            className={"nav-link" + (onTemplatesView ? " active" : "")}
            onClick={() => {
              if (onOpenMarket) {
                onOpenMarket();
                return;
              }
              const dispatch = () =>
                window.dispatchEvent(new Event("dockdploy:open-templates"));
              if (path.startsWith("/docker/compose-builder")) {
                dispatch();
              } else {
                navigate({
                  to: "/docker/compose-builder",
                  state: { openTemplates: true },
                } as any);
              }
            }}
          >
            Templates
          </button>
        </nav>

        <div className="header-actions">
          <a
            className="icon-btn"
            href="https://discord.gg/HDCt9MjyMJ"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            title="Discord"
          >
            <DiscordIcon width={18} height={18} />
          </a>
          <a
            className="icon-btn"
            href="https://github.com/hhftechnologies/Dock-Dploy"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <GithubIcon width={18} height={18} />
          </a>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="btn btn-primary header-cta"
            onClick={() => navigate({ to: "/docker/compose-builder" })}
          >
            Launch Builder
          </button>
        </div>
      </div>
    </header>
  );
}
