import { useMemo, useState } from "react";
import { Check, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import type {
  NetworkConfig,
  ServiceConfig,
  VolumeConfig,
} from "../../types/compose";
import type { VPNConfig } from "../../types/vpn-configs";
import { copyToClipboard } from "../../utils/clipboard";
import {
  createValidatedComposeOutput,
  type ComposeOutputFormat,
} from "../../utils/validation/outputs";
import { formatValidationIssues } from "../../utils/validation/issues";

type FormatId = Exclude<ComposeOutputFormat, "redact">;

interface FormatTab {
  id: FormatId;
  label: string;
  filename: string;
}

const FORMATS: FormatTab[] = [
  { id: "compose", label: "compose.yml", filename: "compose.yml" },
  { id: "docker-run", label: "docker run", filename: "run.sh" },
  { id: "systemd", label: "systemd", filename: "container.service" },
  { id: "env", label: ".env", filename: ".env" },
  { id: "komodo", label: "komodo.toml", filename: "komodo.toml" },
];

export interface CodePanelProps {
  yaml: string;
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpn: VPNConfig;
  validationError: string | null;
  validationSuccess: boolean;
  onValidate: () => void;
}

export function CodePanel({
  yaml,
  services,
  networks,
  volumes,
  vpn,
  validationError,
  validationSuccess: _validationSuccess,
  onValidate,
}: CodePanelProps) {
  const [format, setFormat] = useState<FormatId>("compose");
  const [copied, setCopied] = useState(false);

  const validatedOutput = useMemo(
    () =>
      createValidatedComposeOutput(format, {
        services,
        networks,
        volumes,
        vpn,
        yaml,
      }),
    [format, services, networks, volumes, vpn, yaml],
  );

  const output = validatedOutput.ok
    ? validatedOutput.output
    : invalidPanelOutput(validatedOutput.issues);

  const filename =
    FORMATS.find((f) => f.id === format)?.filename || "compose.yml";

  const lineCount = useMemo(
    () => (output ? output.split("\n").length : 0),
    [output],
  );

  const activeValidationError =
    validationError ||
    (!validatedOutput.ok ? formatValidationIssues(validatedOutput.issues) : null);
  const canCopy = validatedOutput.ok && !activeValidationError;
  const statusKind: "ok" | "err" = activeValidationError ? "err" : "ok";

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await copyToClipboard(validatedOutput.output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore - browser may have denied clipboard access
    }
  };

  return (
    <section className="code-col">
      <div className="code-head">
        <h2 className="code-title">
          <span className="col-bar" aria-hidden />
          Output
        </h2>
        <button
          type="button"
          className="btn btn-secondary code-validate"
          onClick={onValidate}
          title="Validate & reformat"
        >
          {activeValidationError ? (
            <>
              <AlertCircle size={14} />
              Re-validate
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              Validate
            </>
          )}
        </button>
      </div>

      <div className="code-tabs" role="tablist">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={format === f.id}
            className={"code-tab" + (format === f.id ? " active" : "")}
            onClick={() => setFormat(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="code-window">
        <button
          type="button"
          className="code-copy"
          onClick={handleCopy}
          disabled={!canCopy}
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <CodeView text={output} />
        <div className="code-statusbar">
          <span
            className={"status-tag" + (activeValidationError ? " err" : "")}
            aria-live="polite"
          >
            <span className={"status-dot " + statusKind} aria-hidden />
            {activeValidationError ? activeValidationError : "Valid"}
          </span>
          <span className="status-mono">
            {lineCount} {lineCount === 1 ? "line" : "lines"} · UTF-8 · LF
          </span>
          <span className="status-mono right">{filename}</span>
        </div>
      </div>
    </section>
  );
}

function invalidPanelOutput(issues: { path: string; message: string }[]): string {
  return [
    "# Output blocked by validation",
    ...issues.map((issue) => {
      const label = issue.path ? `${issue.path}: ` : "";
      return `# ${label}${issue.message}`;
    }),
  ].join("\n");
}

/**
 * Lightweight syntax-aware preview. Uses simple regex to highlight YAML keys
 * and values without pulling in CodeMirror (which is reserved for the
 * editable surfaces - TemplateDetailModal and the convert dialog).
 */
function CodeView({ text }: { text: string }) {
  const lines = useMemo(() => text.split("\n"), [text]);
  return (
    <pre className="code-pre">
      {lines.map((line, idx) => {
        const tokens = tokenize(line);
        return (
          <div className="code-line" key={idx}>
            <span className="ln-no">{idx + 1}</span>
            <span>
              {tokens.map((tok, j) => (
                <span key={j} className={tok.cls}>
                  {tok.text}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </pre>
  );
}

interface Token {
  text: string;
  cls: string;
}

function tokenize(line: string): Token[] {
  if (!line) return [{ text: " ", cls: "tk-val" }];
  // Comment line
  const commentMatch = line.match(/^(\s*)(#.*)$/);
  if (commentMatch) {
    return [
      { text: commentMatch[1], cls: "tk-val" },
      { text: commentMatch[2], cls: "tk-cmt" },
    ];
  }
  // Key: value
  const kv = line.match(/^(\s*)([a-zA-Z0-9_.-]+)(:)(.*)$/);
  if (kv) {
    return [
      { text: kv[1], cls: "tk-val" },
      { text: kv[2], cls: "tk-key" },
      { text: kv[3], cls: "tk-punct" },
      { text: kv[4], cls: classifyValue(kv[4]) },
    ];
  }
  // List item
  const list = line.match(/^(\s*)(-)(\s+)(.*)$/);
  if (list) {
    return [
      { text: list[1], cls: "tk-val" },
      { text: list[2], cls: "tk-punct" },
      { text: list[3], cls: "tk-val" },
      { text: list[4], cls: classifyValue(list[4]) },
    ];
  }
  return [{ text: line, cls: "tk-val" }];
}

function classifyValue(s: string): string {
  const t = s.trim();
  if (!t) return "tk-val";
  if (/^[0-9]+$/.test(t)) return "tk-num";
  if (/^".*"$/.test(t) || /^'.*'$/.test(t)) return "tk-str";
  return "tk-val";
}
