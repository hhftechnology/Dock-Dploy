// Editorial icon-rail sidebar.
// Defaults to 64px. Hovers expand to 240px (CSS-only). Click brand mark to pin.

import { useState, type ReactNode } from "react";
import { BrandMark } from "./BrandMark";

export type BuilderView = "compose" | "config" | "scheduler";

interface RailItem {
  id: BuilderView;
  group: string;
  label: string;
  icon: ReactNode;
}

const RAIL_ITEMS: RailItem[] = [
  {
    id: "compose",
    group: "Docker",
    label: "Compose Builder",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "config",
    group: "Builders",
    label: "Config Builder",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 21V5a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    id: "scheduler",
    group: "Builders",
    label: "Scheduler Builder",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
];

interface SetupSidebarProps {
  view: BuilderView;
  onNav: (view: BuilderView) => void;
}

export function SetupSidebar({ view, onNav }: SetupSidebarProps) {
  const [pinned, setPinned] = useState(false);
  return (
    <aside className={"setup-sidebar" + (pinned ? " pinned" : "")}>
      <button
        type="button"
        className="rail-brand"
        onClick={() => setPinned((p) => !p)}
        title={pinned ? "Unpin sidebar" : "Pin sidebar"}
      >
        <BrandMark size={20} />
        <span className="rail-brand-label">Setup Tools</span>
      </button>
      <div className="rail-items">
        {RAIL_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={"rail-item" + (view === item.id ? " active" : "")}
            onClick={() => onNav(item.id)}
            title={item.label}
          >
            <span className="rail-icon">{item.icon}</span>
            <span className="rail-label">
              <span className="rail-label-group">{item.group}</span>
              <span className="rail-label-text">{item.label}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rail-spacer" />
      <button
        type="button"
        className="rail-pin"
        onClick={() => setPinned((p) => !p)}
        title={pinned ? "Unpin" : "Pin"}
      >
        <span className="rail-pin-icon" aria-hidden>
          {pinned ? "◉" : "○"}
        </span>
        <span className="rail-label-text">{pinned ? "Unpin" : "Pin"}</span>
      </button>
    </aside>
  );
}
