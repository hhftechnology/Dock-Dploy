import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const STATS = [
  { num: "12+", label: "Output formats" },
  { num: "6", label: "VPN providers" },
  { num: "100+", label: "Curated templates" },
];

const FEATURES = [
  {
    kicker: "01",
    title: "Compose, visually",
    body: "Build services, networks, volumes, and VPN sidecars through a layout that surfaces what matters — port mappings, environment, healthchecks — without burying you in YAML.",
    bullets: ["Real-time YAML validation", "Tabbed service form", "Live preview pane"],
    cta: { label: "Open Compose Builder", to: "/docker/compose-builder" },
  },
  {
    kicker: "02",
    title: "Configs that respect taste",
    body: "Generate Homepage dashboard configs, service catalogs, and friends — visually edited, exported clean. No more hand-tuning YAML in a text editor.",
    bullets: ["Visual config editor", "Schema-validated", "One-click export"],
    cta: { label: "Open Config Builder", to: "/config-builder" },
  },
  {
    kicker: "03",
    title: "Schedules without ceremony",
    body: "Cron, GitHub Actions, systemd timers — described once, exported everywhere. A friendlier cron expression builder makes intervals readable.",
    bullets: ["Cron expression builder", "Multi-format export", "Plain-English preview"],
    cta: { label: "Open Scheduler", to: "/scheduler-builder" },
  },
] as const;

type MiniLine = {
  kind: "key" | "ind1key" | "ind2key" | "ind2arr" | "ind3key";
  text: string;
  val?: string;
};

const MINI_CODE_LINES: MiniLine[] = [
  { kind: "key", text: "services:" },
  { kind: "ind1key", text: "web:" },
  { kind: "ind2key", text: "image:", val: "nginx:1.27-alpine" },
  { kind: "ind2key", text: "restart:", val: "unless-stopped" },
  { kind: "ind2key", text: "ports:" },
  { kind: "ind2arr", text: '"80:80/tcp"' },
  { kind: "ind2key", text: "healthcheck:" },
  { kind: "ind3key", text: "test:", val: '["CMD", "curl", "-f", "/"]' },
  { kind: "ind3key", text: "interval:", val: "30s" },
];

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">
              <span className="spike">◆</span>
              Editorial Docker Compose tooling
            </span>
            <h1 className="display-xl">
              Build, validate,
              <br />
              and <span className="serif-em">ship</span> Docker stacks.
            </h1>
            <p className="lede">
              Dock-Dploy is a calm, visual surface for Docker Compose, configs, and
              schedulers. Friendly enough for first-timers, fast enough for
              homelab operators, honest enough for production.
            </p>
            <div className="hero-cta-row">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate({ to: "/docker/compose-builder" })}
              >
                Launch Builder
                <span className="arr" aria-hidden>→</span>
              </button>
              <a
                className="btn btn-text-link"
                href="https://github.com/hhftechnologies/Dock-Dploy"
                target="_blank"
                rel="noreferrer"
              >
                Star on GitHub
                <span className="arr" aria-hidden>↗</span>
              </a>
            </div>
            <div className="hero-stats">
              {STATS.map((s, i) => (
                <div key={s.label}>
                  {i > 0 && <span className="vrule" aria-hidden />}
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <span className="badge-coral hero-badge">Live preview</span>
            <div className="mini-code-card">
              <div className="mini-code-head">
                <span className="dot r" aria-hidden />
                <span className="dot y" aria-hidden />
                <span className="dot g" aria-hidden />
                <span className="mini-code-name">compose.yml</span>
              </div>
              <pre className="mini-code-pre">
                <code>{MINI_CODE_LINES.map(formatLine).join("\n")}</code>
              </pre>
              <div className="mini-code-foot">
                <span>YAML · valid</span>
                <span>9 lines</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature band */}
      <section className="band band-cream-soft">
        <div className="band-inner">
          <div className="band-head">
            <div className="band-eyebrow">A complete toolbox</div>
            <h2 className="display-lg">Three builders. One canvas.</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.kicker} className="feature-card">
                <span className="feat-kicker">/ {f.kicker}</span>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-body">{f.body}</p>
                <ul className="feat-bullets">
                  {f.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <button
                  className="btn btn-text-link feat-cta"
                  onClick={() => navigate({ to: f.cta.to })}
                >
                  {f.cta.label}
                  <span className="arr" aria-hidden>→</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Coral callout */}
      <section className="band-callout">
        <div className="callout-card">
          <div>
            <h2 className="display-md">
              Open source, AGPL-3.0,
              <br />
              hand-built with care.
            </h2>
            <p>
              Run it locally, host it yourself, or fork it for your team. No
              telemetry, no sign-in, no surprises.
            </p>
          </div>
          <button
            className="btn btn-on-coral btn-lg"
            onClick={() => navigate({ to: "/docker/compose-builder" })}
          >
            Start building
            <span className="arr" aria-hidden>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function formatLine(l: MiniLine): string {
  // simple text formatting for the mini preview — no syntax highlighting here
  switch (l.kind) {
    case "key":
      return l.text;
    case "ind1key":
      return `  ${l.text}`;
    case "ind2key":
      return l.val ? `    ${l.text} ${l.val}` : `    ${l.text}`;
    case "ind2arr":
      return `      - ${l.text}`;
    case "ind3key":
      return l.val ? `      ${l.text} ${l.val}` : `      ${l.text}`;
    default:
      return "";
  }
}
