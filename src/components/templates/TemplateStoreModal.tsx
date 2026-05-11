import { useMemo, useState } from "react";
import { Search, RefreshCw, X, Package, AlertCircle } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { useSearchParams } from "../../hooks/use-search-params";

export interface Template {
  id: string;
  name: string;
  description?: string;
  version?: string;
  logo?: string;
  tags?: string[];
}

export interface TemplateStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  loading?: boolean;
  error?: string | null;
  cacheTimestamp?: number | null;
  onRefresh: () => void;
  onTemplateSelect: (template: Template) => void;
}

const MARKETPLACE_REPO_URL = "https://github.com/hhftechnology/Marketplace";

function formatCacheAge(ts: number | null | undefined): string {
  if (!ts) return "";
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function TemplateStoreModal({
  open,
  onOpenChange,
  templates,
  loading = false,
  error = null,
  cacheTimestamp,
  onRefresh,
  onTemplateSelect,
}: TemplateStoreModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const uniqueTags = useMemo(() => {
    if (!templates || templates.length === 0) return [];
    const all = Array.from(
      new Set(templates.flatMap((template) => template.tags || [])),
    ).sort();
    if (selectedTags.length === 0) return all;
    const selected = all.filter((t) => selectedTags.includes(t));
    const unselected = all.filter((t) => !selectedTags.includes(t));
    return [...selected, ...unselected];
  }, [templates, selectedTags]);

  const filteredTemplates = useMemo<Template[]>(() => {
    if (!templates) return [];
    const term = searchQuery.toLowerCase();
    return templates.filter((template) => {
      const matchesSearch =
        template.name?.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term);
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => template.tags?.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [templates, searchQuery, selectedTags]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      const next = new URLSearchParams(searchParams);
      next.delete("q");
      setSearchParams(next);
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  if (!open) return null;

  return (
    <div
      className="modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mkt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="modal-card">
        {/* Editorial header */}
        <header className="mkt-header">
          <div className="mkt-titlewrap">
            <span className="mkt-eyebrow">Marketplace</span>
            <h2 id="mkt-title" className="mkt-title">
              Templates
            </h2>
            <p className="mkt-sub">
              Pre-configured Docker Compose templates from{" "}
              <a
                href={MARKETPLACE_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="link-coral"
              >
                hhftechnology/Marketplace
              </a>
              {cacheTimestamp && (
                <>
                  {" · "}
                  <span className="mkt-cached">
                    cached {formatCacheAge(cacheTimestamp)}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={loading ? "spin" : undefined}
              />
              Refresh
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="mkt-toolbar">
          <label className="search mkt-search" aria-label="Search templates">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search templates…"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </label>

          <div className="mkt-chips">
            {uniqueTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                type="button"
                className={
                  "mkt-chip" + (selectedTags.includes(tag) ? " active" : "")
                }
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mkt-count">
            {filteredTemplates.length}{" "}
            <span>/ {templates.length}</span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <GridSkeleton />
        ) : error ? (
          <EmptyMessage
            icon={<AlertCircle size={28} />}
            title="Failed to load templates"
            description={error}
            actionLabel="Try again"
            onAction={onRefresh}
            variant="primary"
          />
        ) : filteredTemplates.length === 0 ? (
          <EmptyMessage
            icon={<Package size={28} />}
            title={searchQuery ? "No templates found" : "No templates available"}
            description={
              searchQuery
                ? `No templates match "${searchQuery}". Try a different search.`
                : "Templates will appear here once loaded."
            }
            actionLabel={searchQuery ? "Clear search" : "Refresh"}
            onAction={
              searchQuery ? () => setSearchQuery("") : onRefresh
            }
          />
        ) : (
          <div className="template-grid">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                {...template}
                logo={
                  template.logo
                    ? `https://raw.githubusercontent.com/hhftechnology/Marketplace/main/compose-files/${template.id}/${template.logo}`
                    : undefined
                }
                onClick={() => onTemplateSelect(template)}
                onQuickAdd={() => onTemplateSelect(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "primary" | "secondary";
}

function EmptyMessage({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "secondary",
}: EmptyProps) {
  return (
    <div className="empty-col mkt-empty">
      <div className="empty-card">
        <div className="empty-mark">{icon}</div>
        <h3 className="display-sm">{title}</h3>
        <p>{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="template-grid" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="tpl-card">
          <div className="tpl-head">
            <div className="tpl-logo skeleton-block" />
            <div className="tpl-headtext">
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          </div>
          <div className="skeleton-block skeleton-block--blurb" />
          <div className="tpl-foot">
            <div className="skeleton-line skeleton-line--tag" />
          </div>
        </div>
      ))}
    </div>
  );
}
