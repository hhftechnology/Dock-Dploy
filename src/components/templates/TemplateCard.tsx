import { Settings, Plus } from "lucide-react";

export interface TemplateCardProps {
  id: string;
  name: string;
  description?: string;
  version?: string;
  logo?: string;
  tags?: string[];
  onClick: () => void;
  onQuickAdd?: () => void;
}

// Pick a deterministic logo background tint per template name (no random per render).
// All values are token references — no hex literals.
const LOGO_TINTS = [
  "var(--coral)",
  "var(--teal)",
  "var(--amber)",
  "var(--slate)",
  "var(--violet)",
];

function tintFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_TINTS[h % LOGO_TINTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+|[-_]/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase().slice(0, 2);
}

export function TemplateCard({
  name,
  description,
  version,
  logo,
  tags,
  onClick,
  onQuickAdd,
}: TemplateCardProps) {
  return (
    <article className="tpl-card" onClick={onClick}>
      <header className="tpl-head">
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="tpl-logo"
            // Logo image needs a background fallback colour computed per name.
            // The values come from CSS variables — no hex baked into JSX.
            // eslint-disable-next-line no-restricted-syntax
            style={{ background: tintFor(name) }} // check-no-magic-css-allow
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : (
          <div
            className="tpl-logo"
            // eslint-disable-next-line no-restricted-syntax
            style={{ background: tintFor(name) }} // check-no-magic-css-allow
            aria-hidden
          >
            {initials(name) || <Settings size={18} />}
          </div>
        )}

        <div className="tpl-headtext">
          <div className="tpl-name">{name}</div>
          {version && <div className="tpl-version">{version}</div>}
        </div>

        {onQuickAdd && (
          <button
            type="button"
            className="tpl-add"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            title="Quick add to compose"
            aria-label="Quick add to compose"
          >
            <Plus size={16} />
          </button>
        )}
      </header>

      {description && <p className="tpl-blurb">{description}</p>}

      <footer className="tpl-foot">
        <div className="tpl-tags">
          {tags && tags.length > 0
            ? tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tpl-tag">
                  {tag}
                </span>
              ))
            : null}
          {tags && tags.length > 3 && (
            <span className="tpl-tag muted">+{tags.length - 3}</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-text-link tpl-details"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Details
          <span className="arr" aria-hidden>
            →
          </span>
        </button>
      </footer>
    </article>
  );
}
